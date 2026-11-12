-- =====================================================================
-- Duo — Supabase schema (tables, RLS, triggers, RPC functions)
-- Run the WHOLE file once in: Supabase Dashboard → SQL Editor → New query.
-- Safe to re-run on an empty project; it is NOT an upgrade script.
-- =====================================================================

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null default '' check (char_length(display_name) <= 80),
  avatar_url    text check (avatar_url is null or char_length(avatar_url) <= 500),
  language      text not null default 'he' check (language in ('he','en','ar')),
  theme         text not null default 'auto' check (theme in ('auto','light','dark')),
  notify_shares boolean not null default true,
  notify_due    boolean not null default true,
  created_at    timestamptz not null default now()
);

-- Admins live in their own table with NO client policies: nobody can grant
-- themselves admin from the API. Add yourself manually (see bottom of file).
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table public.notes (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references public.profiles(id) on delete cascade,
  title      text not null default '' check (char_length(title) <= 200),
  color      text not null default 'yellow'
             check (color in ('yellow','pink','blue','green','purple','orange')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null
);

create table public.note_members (
  note_id      uuid not null references public.notes(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  role         text not null default 'member' check (role in ('owner','member')),
  -- per-user ordering of the home grid (smaller = earlier)
  position     double precision not null default (-extract(epoch from now())),
  last_seen_at timestamptz not null default now(),
  joined_at    timestamptz not null default now(),
  primary key (note_id, user_id)
);
create index note_members_user_idx on public.note_members(user_id);

create table public.tasks (
  id         uuid primary key default gen_random_uuid(),
  note_id    uuid not null references public.notes(id) on delete cascade,
  text       text not null check (char_length(text) between 1 and 1000),
  done       boolean not null default false,
  due_date   date,
  position   double precision not null default extract(epoch from now()),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  done_at    timestamptz
);
create index tasks_note_idx on public.tasks(note_id);
create index tasks_due_idx on public.tasks(due_date) where due_date is not null and done = false;

-- Only the hash of an invite token is stored. The plain token exists once,
-- in the response of create_invite(), and inside the link that gets shared.
create table public.invites (
  id            uuid primary key default gen_random_uuid(),
  note_id       uuid not null references public.notes(id) on delete cascade,
  token_hash    text not null unique,
  created_by    uuid not null references public.profiles(id) on delete cascade,
  invited_email text check (invited_email is null or char_length(invited_email) <= 254),
  max_uses      int  not null default 5 check (max_uses between 1 and 20),
  uses          int  not null default 0,
  expires_at    timestamptz not null default (now() + interval '7 days'),
  revoked       boolean not null default false,
  created_at    timestamptz not null default now()
);
create index invites_note_idx on public.invites(note_id);

-- Written ONLY by the Stripe webhook (service role). Clients can read their own row.
create table public.subscriptions (
  user_id              uuid primary key references public.profiles(id) on delete cascade,
  stripe_customer_id   text unique,
  stripe_subscription_id text unique,
  status               text not null default 'none',
  current_period_end   timestamptz,
  cancel_at            timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER, empty search_path)
-- ---------------------------------------------------------------------

create or replace function public.is_note_member(p_note_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.note_members
    where note_id = p_note_id and user_id = (select auth.uid())
  );
$$;

create or replace function public.shares_note_with(p_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.note_members a
    join public.note_members b on a.note_id = b.note_id
    where a.user_id = (select auth.uid()) and b.user_id = p_user_id
  );
$$;

-- Admin = listed in admin_users AND signed in with a second factor (TOTP, aal2).
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admin_users where user_id = (select auth.uid()))
     and coalesce((select auth.jwt()) ->> 'aal', '') = 'aal2';
$$;

-- Free trial length is defined here (days). Change the number to change the trial.
create or replace function public.has_access(p_user_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
           select 1 from public.subscriptions s
           where s.user_id = p_user_id and s.status in ('active','trialing')
         )
      or exists (
           select 1 from public.profiles p
           where p.id = p_user_id and p.created_at > now() - interval '14 days'
         );
$$;

-- ---------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------

-- New auth user → profile
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(coalesce(new.email, ''), '@', 1)
    ), 80)
  );
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Note creator becomes the owner-member
create or replace function public.handle_new_note()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.note_members (note_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;
create trigger on_note_created
  after insert on public.notes
  for each row execute function public.handle_new_note();

create or replace function public.notes_before_update()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := now();
  new.updated_by := (select auth.uid());
  return new;
end;
$$;
create trigger notes_before_update
  before update on public.notes
  for each row execute function public.notes_before_update();

create or replace function public.tasks_before_write()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    new.updated_at := now();
    if new.done is distinct from old.done then
      new.done_at := case when new.done then now() else null end;
    end if;
  elsif new.done then
    new.done_at := now();
  end if;
  return new;
end;
$$;
create trigger tasks_before_write
  before insert or update on public.tasks
  for each row execute function public.tasks_before_write();

-- Any task change marks the note as "updated by me" (drives the blue dot)
create or replace function public.touch_note_from_task()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.notes
     set updated_at = now(), updated_by = (select auth.uid())
   where id = coalesce(new.note_id, old.note_id);
  return null;
end;
$$;
create trigger tasks_touch_note
  after insert or update or delete on public.tasks
  for each row execute function public.touch_note_from_task();

-- Abuse limits
create or replace function public.enforce_limits()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'notes' then
    if (select count(*) from public.notes where owner_id = new.owner_id) >= 200 then
      raise exception 'note limit reached' using errcode = 'P0001';
    end if;
  elsif tg_table_name = 'tasks' then
    if (select count(*) from public.tasks where note_id = new.note_id) >= 500 then
      raise exception 'task limit reached' using errcode = 'P0001';
    end if;
  elsif tg_table_name = 'note_members' then
    if (select count(*) from public.note_members where note_id = new.note_id) >= 20 then
      raise exception 'member limit reached' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;
create trigger notes_limit   before insert on public.notes        for each row execute function public.enforce_limits();
create trigger tasks_limit   before insert on public.tasks        for each row execute function public.enforce_limits();
create trigger members_limit before insert on public.note_members for each row execute function public.enforce_limits();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------

alter table public.profiles      enable row level security;
alter table public.admin_users   enable row level security;
alter table public.notes         enable row level security;
alter table public.note_members  enable row level security;
alter table public.tasks         enable row level security;
alter table public.invites       enable row level security;
alter table public.subscriptions enable row level security;
alter table public.profiles      force row level security;
alter table public.notes         force row level security;
alter table public.note_members  force row level security;
alter table public.tasks         force row level security;

-- profiles: own row + people I share a note with
create policy profiles_select on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.shares_note_with(id));
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- notes
create policy notes_select on public.notes for select to authenticated
  using (owner_id = (select auth.uid()) or public.is_note_member(id));
create policy notes_insert on public.notes for insert to authenticated
  with check (owner_id = (select auth.uid()) and public.has_access((select auth.uid())));
create policy notes_update on public.notes for update to authenticated
  using (public.is_note_member(id)) with check (public.is_note_member(id));
create policy notes_delete on public.notes for delete to authenticated
  using (owner_id = (select auth.uid()));          -- only the original owner

-- note_members
create policy members_select on public.note_members for select to authenticated
  using (public.is_note_member(note_id));
create policy members_update_own on public.note_members for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy members_delete on public.note_members for delete to authenticated
  using (
    role <> 'owner' and (
      user_id = (select auth.uid())                                  -- leave by myself
      or exists (select 1 from public.notes n                        -- owner removes anyone
                 where n.id = note_id and n.owner_id = (select auth.uid()))
    )
  );

-- tasks: every member has equal rights
create policy tasks_select on public.tasks for select to authenticated
  using (public.is_note_member(note_id));
create policy tasks_insert on public.tasks for insert to authenticated
  with check (public.is_note_member(note_id) and created_by = (select auth.uid()));
create policy tasks_update on public.tasks for update to authenticated
  using (public.is_note_member(note_id)) with check (public.is_note_member(note_id));
create policy tasks_delete on public.tasks for delete to authenticated
  using (public.is_note_member(note_id));

-- subscriptions: read own row only. No insert/update/delete policies at all.
create policy subscriptions_select on public.subscriptions for select to authenticated
  using (user_id = (select auth.uid()));

-- invites & admin_users: RLS on, zero policies → reachable only through the RPCs below.

-- ---------------------------------------------------------------------
-- Table privileges (least privilege, column level)
-- ---------------------------------------------------------------------

revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on public.profiles, public.notes, public.note_members, public.tasks, public.subscriptions to authenticated;
grant update (display_name, avatar_url, language, theme, notify_shares, notify_due) on public.profiles to authenticated;
grant insert (id, owner_id, title, color) on public.notes to authenticated;
grant update (title, color) on public.notes to authenticated;
grant delete on public.notes to authenticated;
grant update (position, last_seen_at) on public.note_members to authenticated;
grant delete on public.note_members to authenticated;
grant insert (id, note_id, text, done, due_date, position, created_by) on public.tasks to authenticated;
grant update (text, done, due_date, position) on public.tasks to authenticated;
grant delete on public.tasks to authenticated;

-- ---------------------------------------------------------------------
-- Sharing RPCs
-- ---------------------------------------------------------------------

-- Returns the plain token ONCE. Caller must be a member of the note.
create or replace function public.create_invite(
  p_note_id uuid, p_max_uses int default 5, p_email text default null
) returns text language plpgsql security definer set search_path = '' as $$
declare
  v_token text;
begin
  if (select auth.uid()) is null or not public.is_note_member(p_note_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if (select count(*) from public.invites
       where note_id = p_note_id and not revoked and expires_at > now() and uses < max_uses) >= 20 then
    raise exception 'too many active invites' using errcode = 'P0001';
  end if;

  v_token := encode(extensions.gen_random_bytes(24), 'hex');
  insert into public.invites (note_id, token_hash, created_by, invited_email, max_uses)
  values (
    p_note_id,
    encode(extensions.digest(v_token, 'sha256'), 'hex'),
    (select auth.uid()),
    nullif(lower(trim(p_email)), ''),
    greatest(1, least(coalesce(p_max_uses, 5), 20))
  );
  return v_token;
end;
$$;

-- Public (anon) preview for the join screen. Reveals only what the invite is for.
create or replace function public.get_invite_preview(p_token text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare
  v_inv public.invites;
  v_note public.notes;
  v_inviter text;
begin
  if p_token is null or char_length(p_token) <> 48 then return null; end if;
  select * into v_inv from public.invites
   where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
     and not revoked and expires_at > now() and uses < max_uses;
  if not found then return null; end if;

  select * into v_note from public.notes where id = v_inv.note_id;
  select display_name into v_inviter from public.profiles where id = v_inv.created_by;

  return jsonb_build_object(
    'note_title', v_note.title,
    'color', v_note.color,
    'inviter_name', coalesce(v_inviter, ''),
    'tasks', coalesce((
      select jsonb_agg(jsonb_build_object('text', t.text, 'done', t.done))
      from (select text, done from public.tasks
             where note_id = v_note.id order by done, position limit 4) t
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.accept_invite(p_token text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_inv public.invites;
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_token is null or char_length(p_token) <> 48 then
    raise exception 'invalid invite' using errcode = 'P0001';
  end if;

  select * into v_inv from public.invites
   where token_hash = encode(extensions.digest(p_token, 'sha256'), 'hex')
     and not revoked and expires_at > now() and uses < max_uses
   for update;
  if not found then raise exception 'invalid invite' using errcode = 'P0001'; end if;

  if exists (select 1 from public.note_members where note_id = v_inv.note_id and user_id = v_uid) then
    return v_inv.note_id;                            -- already a member, don't burn a use
  end if;

  insert into public.note_members (note_id, user_id, role) values (v_inv.note_id, v_uid, 'member');
  update public.invites set uses = uses + 1 where id = v_inv.id;
  return v_inv.note_id;
end;
$$;

create or replace function public.list_note_invites(p_note_id uuid)
returns table (id uuid, invited_email text, uses int, max_uses int, expires_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_note_member(p_note_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select i.id, i.invited_email, i.uses, i.max_uses, i.expires_at
      from public.invites i
     where i.note_id = p_note_id and not i.revoked and i.expires_at > now() and i.uses < i.max_uses
     order by i.created_at desc;
end;
$$;

create or replace function public.revoke_invite(p_invite_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.invites i set revoked = true
   where i.id = p_invite_id and public.is_note_member(i.note_id);
end;
$$;

-- Server-clock "I've seen this note" (drives the blue dot, immune to device clock skew)
create or replace function public.mark_note_seen(p_note_id uuid)
returns timestamptz language plpgsql security definer set search_path = '' as $$
declare v timestamptz := clock_timestamp();
begin
  update public.note_members set last_seen_at = v
   where note_id = p_note_id and user_id = (select auth.uid());
  return v;
end;
$$;

-- ---------------------------------------------------------------------
-- Access state for the current user (trial / subscription)
-- ---------------------------------------------------------------------

create or replace function public.my_access()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'has_access',         public.has_access((select auth.uid())),
    'trial_ends_at',      (select p.created_at + interval '14 days' from public.profiles p where p.id = (select auth.uid())),
    'status',             coalesce((select s.status from public.subscriptions s where s.user_id = (select auth.uid())), 'none'),
    'current_period_end', (select s.current_period_end from public.subscriptions s where s.user_id = (select auth.uid())),
    'cancel_at',          (select s.cancel_at from public.subscriptions s where s.user_id = (select auth.uid())),
    'cancel_at_period_end', coalesce((select s.cancel_at_period_end from public.subscriptions s where s.user_id = (select auth.uid())), false)
  );
$$;

-- ---------------------------------------------------------------------
-- Account deletion helper (called only by the delete-account Edge Function)
-- Shared notes are handed to the longest-standing other member; solo notes are deleted.
-- ---------------------------------------------------------------------

create or replace function public.prepare_account_deletion(p_user_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  n record;
  v_heir uuid;
begin
  for n in select id from public.notes where owner_id = p_user_id loop
    select user_id into v_heir from public.note_members
     where note_id = n.id and user_id <> p_user_id
     order by joined_at asc limit 1;
    if v_heir is null then
      delete from public.notes where id = n.id;
    else
      update public.notes set owner_id = v_heir where id = n.id;
      update public.note_members set role = 'owner' where note_id = n.id and user_id = v_heir;
    end if;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- Admin dashboard RPCs (is_admin() requires listing + TOTP MFA)
-- ---------------------------------------------------------------------

create or replace function public.admin_overview()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare r jsonb;
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select jsonb_build_object(
    'total_users',    (select count(*) from public.profiles),
    'new_today',      (select count(*) from public.profiles where created_at >= date_trunc('day', now())),
    'new_7d',         (select count(*) from public.profiles where created_at >= now() - interval '7 days'),
    'new_30d',        (select count(*) from public.profiles where created_at >= now() - interval '30 days'),
    'active_7d',      (select count(distinct u) from (
                         select created_by u from public.tasks where created_at >= now() - interval '7 days' and created_by is not null
                         union
                         select updated_by u from public.notes where updated_at >= now() - interval '7 days' and updated_by is not null
                       ) a),
    'paying_users',   (select count(*) from public.subscriptions where status = 'active'),
    'past_due_users', (select count(*) from public.subscriptions where status = 'past_due'),
    'canceled_users', (select count(*) from public.subscriptions where status = 'canceled'),
    'trial_users',    (select count(*) from public.profiles p
                        where p.created_at > now() - interval '14 days'
                          and not exists (select 1 from public.subscriptions s where s.user_id = p.id and s.status = 'active')),
    'mrr_usd',        (select count(*) from public.subscriptions where status = 'active'),   -- $1 / month each
    'total_notes',    (select count(*) from public.notes),
    'shared_notes',   (select count(*) from (select note_id from public.note_members group by note_id having count(*) > 1) s),
    'total_tasks',    (select count(*) from public.tasks),
    'done_tasks',     (select count(*) from public.tasks where done)
  ) into r;
  return r;
end;
$$;

create or replace function public.admin_daily(p_days int default 30)
returns table (day date, signups bigint, new_paying bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
    select d::date,
           (select count(*) from public.profiles p where p.created_at::date = d::date),
           (select count(*) from public.subscriptions s where s.created_at::date = d::date and s.status in ('active','past_due','canceled'))
      from generate_series(current_date - (least(greatest(p_days,1),365) - 1), current_date, interval '1 day') d
     order by 1;
end;
$$;

create or replace function public.admin_users_list(p_limit int default 50, p_offset int default 0, p_search text default null)
returns table (
  id uuid, email text, display_name text, created_at timestamptz,
  last_sign_in_at timestamptz, status text, notes_count bigint
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
    select p.id, u.email::text, p.display_name, p.created_at, u.last_sign_in_at,
           coalesce(s.status, 'none'),
           (select count(*) from public.note_members m where m.user_id = p.id)
      from public.profiles p
      join auth.users u on u.id = p.id
      left join public.subscriptions s on s.user_id = p.id
     where p_search is null or p_search = ''
        or u.email ilike '%' || replace(replace(p_search, '%', ''), '_', '') || '%'
        or p.display_name ilike '%' || replace(replace(p_search, '%', ''), '_', '') || '%'
     order by p.created_at desc
     limit least(greatest(p_limit,1),200) offset greatest(p_offset,0);
end;
$$;

-- ---------------------------------------------------------------------
-- Function execute privileges: default is PUBLIC → lock everything down first
-- ---------------------------------------------------------------------

revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.is_note_member(uuid)            to authenticated;
grant execute on function public.shares_note_with(uuid)          to authenticated;
grant execute on function public.is_admin()                      to authenticated;
grant execute on function public.has_access(uuid)                to authenticated;
grant execute on function public.create_invite(uuid, int, text)  to authenticated;
grant execute on function public.accept_invite(text)             to authenticated;
grant execute on function public.list_note_invites(uuid)         to authenticated;
grant execute on function public.revoke_invite(uuid)             to authenticated;
grant execute on function public.my_access()                     to authenticated;
grant execute on function public.mark_note_seen(uuid)            to authenticated;
grant execute on function public.admin_overview()                to authenticated;
grant execute on function public.admin_daily(int)                to authenticated;
grant execute on function public.admin_users_list(int, int, text) to authenticated;
grant execute on function public.get_invite_preview(text)        to anon, authenticated;
grant execute on function public.prepare_account_deletion(uuid)  to service_role;

-- ---------------------------------------------------------------------
-- Realtime (RLS is enforced on the realtime stream too)
-- ---------------------------------------------------------------------

alter publication supabase_realtime add table public.notes, public.tasks, public.note_members;

-- ---------------------------------------------------------------------
-- AFTER you have signed in once with your own account, make yourself admin.
-- Replace the e-mail and run this single statement separately:
--
--   insert into public.admin_users (user_id)
--   select id from auth.users where email = 'YOUR_EMAIL@example.com';
-- ---------------------------------------------------------------------
