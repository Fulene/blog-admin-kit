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
  profiles: {
    id: string;
    first_name: string | null;
    last_name: string | null;
  } | null;
  roles: Role | null;
};
