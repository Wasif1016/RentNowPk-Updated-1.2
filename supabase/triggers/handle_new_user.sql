-- Run in Supabase SQL Editor after public.users and public.vendor_profiles exist.
-- Syncs auth.users → public.users (+ vendor_profiles when role = VENDOR).
-- Metadata keys must match signUp options.data: role, business_name, whatsapp_phone, phone, full_name, display_name, name

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  r text := coalesce(meta->>'role', 'CUSTOMER');
  business text := nullif(trim(meta->>'business_name'), '');
  phone text := coalesce(
    nullif(trim(meta->>'phone'), ''),
    nullif(trim(meta->>'whatsapp_phone'), '')
  );
  display_name text;
  role_val public.user_role;
begin
  if r in ('CUSTOMER', 'VENDOR', 'ADMIN') then
    role_val := r::public.user_role;
  else
    role_val := 'CUSTOMER'::public.user_role;
  end if;

  display_name := coalesce(
    business,
    nullif(trim(meta->>'full_name'), ''),
    split_part(coalesce(new.email, 'user@local'), '@', 1)
  );

  insert into public.users (id, email, full_name, role, phone)
  values (
    new.id,
    coalesce(new.email, ''),
    display_name,
    role_val,
    phone
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    role = excluded.role,
    phone = coalesce(excluded.phone, public.users.phone);

  if role_val = 'VENDOR'::public.user_role then
    if business is null or phone is null then
      raise exception 'VENDOR signup requires business_name and whatsapp_phone in user metadata';
    end if;

    insert into public.vendor_profiles (user_id, business_name, whatsapp_phone, verification_status)
    values (
      new.id,
      business,
      phone,
      'PENDING_VERIFICATION'::public.vendor_verification_status
    )
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();
