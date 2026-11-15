-- Share a note by e-mail address.
--  * address belongs to an existing user  -> they become a member immediately
--  * address not registered yet           -> a pending invite is stored; it is claimed
--                                            automatically on their first (verified) sign-in
-- Safe to run more than once.

create or replace function public.share_note_by_email(p_note_id uuid, p_email text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_email  text := lower(trim(p_email));
  v_target uuid;
begin
  if (select auth.uid()) is null or not public.is_note_member(p_note_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_email is null or v_email !~ '^\S+@\S+\.\S+$' or char_length(v_email) > 254 then
    raise exception 'invalid email' using errcode = 'P0001';
  end if;

  select u.id into v_target from auth.users u where lower(u.email) = v_email limit 1;

  if v_target is not null then
    insert into public.note_members (note_id, user_id, role)
    values (p_note_id, v_target, 'member')
    on conflict do nothing;
    return 'added';
  end if;

  -- not registered yet: keep one pending invite per (note, email)
  if not exists (select 1 from public.invites
                  where note_id = p_note_id and invited_email = v_email
                    and not revoked and expires_at > now() and uses < max_uses) then
    if (select count(*) from public.invites
         where note_id = p_note_id and not revoked and expires_at > now() and uses < max_uses) >= 20 then
      raise exception 'too many active invites' using errcode = 'P0001';
    end if;
    insert into public.invites (note_id, token_hash, created_by, invited_email, max_uses, expires_at)
    values (
      p_note_id,
      encode(extensions.digest(extensions.gen_random_bytes(24), 'sha256'), 'hex'),  -- token is never revealed
      (select auth.uid()), v_email, 1, now() + interval '30 days'
    );
  end if;
  return 'pending';
end;
$$;

-- Called by the app right after sign-in. Uses the e-mail from the caller's own (verified) JWT.
create or replace function public.claim_email_invites()
returns int language plpgsql security definer set search_path = '' as $$
declare
  v_uid   uuid := (select auth.uid());
  v_email text := lower(coalesce((select auth.jwt()) ->> 'email', ''));
  i record;
  v_n int := 0;
begin
  if v_uid is null or v_email = '' then return 0; end if;
  for i in
    select id, note_id from public.invites
     where invited_email = v_email and not revoked and expires_at > now() and uses < max_uses
     for update
  loop
    insert into public.note_members (note_id, user_id, role)
    values (i.note_id, v_uid, 'member')
    on conflict do nothing;
    update public.invites set uses = uses + 1 where id = i.id;
    v_n := v_n + 1;
  end loop;
  return v_n;
end;
$$;

revoke execute on function public.share_note_by_email(uuid, text) from public, anon;
revoke execute on function public.claim_email_invites()           from public, anon;
grant  execute on function public.share_note_by_email(uuid, text) to authenticated;
grant  execute on function public.claim_email_invites()           to authenticated;
