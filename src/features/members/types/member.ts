export type Role = {
  id: string;
  code: string;
  label: string;
};

export type SiteMember = {
  site_id: string;
  user_id: string;
  role_id: string;
  created_at: string;
  email: string | null;
  profiles: {
    avatar_url: string | null;
    avatarDisplayUrl: string | null;
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
  roles: Role | null;
};

export type SiteInvitationStatus =
  | "pending"
  | "accepted"
  | "cancelled"
  | "expired";

export type SiteInvitation = {
  id: string;
  site_id: string;
  role_id: string;
  email: string;
  status: SiteInvitationStatus;
  invited_by: string | null;
  accepted_by: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  roles: Role | null;
  sites: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export type SiteInvitationCheck = {
  invitation: SiteInvitation | null;
  reason:
    | "expired"
    | "invalid"
    | "not_authenticated"
    | "status_mismatch"
    | "success"
    | "wrong_email";
};
