-- =====================================================
-- BLOG ADMIN KIT
-- Manual script: RLS for site invitations and invited member join
-- =====================================================

-- =====================================================
-- Helpers
-- =====================================================

create or replace function public.is_site_owner(target_site_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.site_members sm
    join public.roles r on r.id = sm.role_id
    where sm.site_id = target_site_id
      and sm.user_id = auth.uid()
      and r.code = 'OWNER'
  );
$$;

revoke all on function public.is_site_owner(uuid) from public;
grant execute on function public.is_site_owner(uuid) to authenticated;


create or replace function public.has_pending_site_invitation(
  p_site_id uuid,
  p_role_id uuid,
  p_email text
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.site_invitations si
    where si.site_id = p_site_id
      and si.role_id = p_role_id
      and si.email = lower(trim(p_email))
      and si.status = 'pending'
      and si.expires_at > now()
  );
$$;

revoke all on function public.has_pending_site_invitation(uuid, uuid, text) from public;
grant execute on function public.has_pending_site_invitation(uuid, uuid, text) to authenticated;


-- =====================================================
-- RLS: site_invitations
-- =====================================================

alter table public.site_invitations enable row level security;

drop policy if exists "Owners can read site invitations"
on public.site_invitations;

drop policy if exists "Invited users can read their pending invitations"
on public.site_invitations;

drop policy if exists "Owners can create site invitations"
on public.site_invitations;

drop policy if exists "Owners can update site invitations"
on public.site_invitations;

drop policy if exists "Invited users can accept their own invitations"
on public.site_invitations;

drop policy if exists "Owners can delete site invitations"
on public.site_invitations;


create policy "Owners can read site invitations"
on public.site_invitations
for select
to authenticated
using (
  public.is_site_owner(site_id)
);

create policy "Invited users can read their pending invitations"
on public.site_invitations
for select
to authenticated
using (
  status = 'pending'
  and expires_at > now()
  and email = lower(coalesce(auth.jwt() ->> 'email', ''))
);

create policy "Owners can create site invitations"
on public.site_invitations
for insert
to authenticated
with check (
  public.is_site_owner(site_id)
  and invited_by = auth.uid()
  and email = lower(trim(email))
  and status = 'pending'
);

create policy "Owners can update site invitations"
on public.site_invitations
for update
to authenticated
using (
  public.is_site_owner(site_id)
)
with check (
  public.is_site_owner(site_id)
  and email = lower(trim(email))
);

create policy "Invited users can accept their own invitations"
on public.site_invitations
for update
to authenticated
using (
  status = 'pending'
  and expires_at > now()
  and email = lower(coalesce(auth.jwt() ->> 'email', ''))
)
with check (
  status = 'accepted'
  and accepted_by = auth.uid()
  and accepted_at is not null
  and email = lower(coalesce(auth.jwt() ->> 'email', ''))
);

create policy "Owners can delete site invitations"
on public.site_invitations
for delete
to authenticated
using (
  public.is_site_owner(site_id)
);


-- =====================================================
-- RLS: site_members
-- Add the missing policy for invite acceptance
-- =====================================================

alter table public.site_members enable row level security;

drop policy if exists "Invited users can join site"
on public.site_members;

create policy "Invited users can join site"
on public.site_members
for insert
to authenticated
with check (
  user_id = auth.uid()
  and public.has_pending_site_invitation(
    site_id,
    role_id,
    coalesce(auth.jwt() ->> 'email', '')
  )
);


-- =====================================================
-- Verification query
-- =====================================================

select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('site_invitations', 'site_members')
order by tablename, policyname;
