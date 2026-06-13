import type {
  Role,
  SiteInvitation,
  SiteMember,
} from "@/features/members/types/member";

const MEMBER_SELECT =
  "site_id,user_id,role_id,created_at,profiles(id,first_name,last_name,avatar_url),roles(id,code,label)";
const SITE_INVITATION_SELECT =
  "id,site_id,role_id,email,status,invited_by,accepted_by,expires_at,accepted_at,created_at,roles(id,code,label),sites(id,name,slug)";
const ROLE_SELECT = "id,code,label";

export async function getRoles(): Promise<Role[]> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();

  const { data, error } = await supabase
    .from("roles")
    .select(ROLE_SELECT)
    .order("label", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Role[];
}

export async function getSiteMembers(siteId: string): Promise<SiteMember[]> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();

  const { data, error } = await supabase
    .from("site_members")
    .select(MEMBER_SELECT)
    .eq("site_id", siteId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as RawSiteMember[]).map((member) => {
    const profile = Array.isArray(member.profiles)
      ? (member.profiles[0] ?? null)
      : member.profiles;

    return {
      ...member,
      email: null,
      profiles: profile
        ? {
            ...profile,
            avatarDisplayUrl: null,
          }
        : null,
      roles: Array.isArray(member.roles) ? (member.roles[0] ?? null) : member.roles,
    };
  });
}

type RawSiteMember = Omit<SiteMember, "profiles" | "roles"> & {
  profiles: SiteMember["profiles"] | SiteMember["profiles"][];
  roles: SiteMember["roles"] | SiteMember["roles"][];
};
type RawSiteInvitation = Omit<SiteInvitation, "roles" | "sites"> & {
  roles: SiteInvitation["roles"] | SiteInvitation["roles"][];
  sites: SiteInvitation["sites"] | SiteInvitation["sites"][];
};

export async function getSiteInvitations(
  siteId: string,
): Promise<SiteInvitation[]> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();

  const { data, error } = await supabase
    .from("site_invitations")
    .select(SITE_INVITATION_SELECT)
    .eq("site_id", siteId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as RawSiteInvitation[]).map(parseSiteInvitation);
}

export async function addSiteMember({
  roleId,
  siteId,
  userId,
}: {
  roleId: string;
  siteId: string;
  userId: string;
}): Promise<void> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();

  const { error } = await supabase.from("site_members").insert({
    site_id: siteId,
    user_id: userId,
    role_id: roleId,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function updateSiteMemberRole({
  roleId,
  siteId,
  userId,
}: {
  roleId: string;
  siteId: string;
  userId: string;
}): Promise<void> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();

  const { error } = await supabase
    .from("site_members")
    .update({ role_id: roleId })
    .eq("site_id", siteId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function removeSiteMember({
  siteId,
  userId,
}: {
  siteId: string;
  userId: string;
}): Promise<void> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();

  const { error } = await supabase
    .from("site_members")
    .delete()
    .eq("site_id", siteId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

function parseSiteInvitation(
  invitation: RawSiteInvitation,
): SiteInvitation {
  return {
    ...invitation,
    roles: Array.isArray(invitation.roles)
      ? (invitation.roles[0] ?? null)
      : invitation.roles,
    sites: Array.isArray(invitation.sites)
      ? (invitation.sites[0] ?? null)
      : invitation.sites,
  };
}
