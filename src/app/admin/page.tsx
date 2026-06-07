import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { getProfileByUserId } from "@/features/profile/services/profile.server.service";
import { getAccessibleSitesForCurrentUser } from "@/features/sites/services/sites.server.service";
import { createClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims?.sub) {
    redirect("/login");
  }

  const [initialProfile, initialSites] = await Promise.all([
    getProfileByUserId(data.claims.sub),
    getAccessibleSitesForCurrentUser(),
  ]);

  return (
    <AdminShell
      initialProfile={initialProfile}
      initialSites={initialSites}
      userEmail={data.claims.email ?? "admin"}
      userId={data.claims.sub}
    />
  );
}
