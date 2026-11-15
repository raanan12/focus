-- Personal share code per user, so notes can be shared without knowing an e-mail address
-- (Sign in with Apple "Hide My Email" gives the app a private-relay address nobody knows).
-- Safe to run more than once.

-- 8 chars from a 32-symbol alphabet without look-alikes (no I, O, 0, 1). 256 % 32 = 0 → no modulo bias.
create or replace function public.gen_share_code()
returns text language plpgsql volatile set search_path = '' as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v text; i int;
begin
  loop
    v := '';
    for i in 1..8 loop
      v := v || substr(alphabet, 1 + (get_byte(extensions.gen_random_bytes(1), 0) % 32), 1);
    end loop;
    exit when not exists (select 1 from public.profiles where share_code = v);
  end loop;
  return v;
end;
$$;

alter table public.profiles add column if not exists share_code text unique;
update public.profiles set share_code = public.gen_share_code() where share_code is null;
alter table public.profiles alter column share_code set default public.gen_share_code();
alter table public.profiles alter column share_code set not null;

create or replace function public.share_note_by_code(p_note_id uuid, p_code text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_code   text := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  v_target uuid;
begin
  if (select auth.uid()) is null or not public.is_note_member(p_note_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if char_length(v_code) <> 8 then raise exception 'user_not_found' using errcode = 'P0001'; end if;

  select id into v_target from public.profiles where share_code = v_code;
  if v_target is null then raise exception 'user_not_found' using errcode = 'P0001'; end if;

  insert into public.note_members (note_id, user_id, role)
  values (p_note_id, v_target, 'member')
  on conflict do nothing;
  return 'added';
end;
$$;

revoke execute on function public.share_note_by_code(uuid, text) from public, anon;
grant  execute on function public.share_note_by_code(uuid, text) to authenticated;
