-- =====================================================
-- BLOG ADMIN KIT
-- Manual script: public invitation lookup by token hash
-- =====================================================

create or replace function public.get_site_invitation_by_token_hash(p_token_hash text)
returns table (
  id uuid,
  site_id uuid,
  role_id uuid,
  email text,
  status text,
  invited_by uuid,
  accepted_by uuid,
  expires_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz,
  role_code text,
  role_label text
)
language sql
security definer
set search_path = public
as $$
  select
    si.id,
    si.site_id,
    si.role_id,
    si.email,
    si.status,
    si.invited_by,
    si.accepted_by,
    si.expires_at,
    si.accepted_at,
    si.created_at,
    r.code as role_code,
    r.label as role_label
  from public.site_invitations si
  left join public.roles r on r.id = si.role_id
  where si.token_hash = p_token_hash
  limit 1;
$$;

revoke all on function public.get_site_invitation_by_token_hash(text) from public;
grant execute on function public.get_site_invitation_by_token_hash(text) to anon, authenticated;
