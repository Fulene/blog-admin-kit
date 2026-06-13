export type Site = {
  id: string;
  name: string;
  currentUserRole: {
    code: string;
    id: string;
    label: string;
  } | null;
  slug: string | null;
};
