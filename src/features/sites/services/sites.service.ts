import { ZodError } from "zod";
import { siteListSchema } from "@/features/sites/schemas/site.schema";
import type { Site } from "@/features/sites/types/site";

const SITE_MEMBER_SELECT = "site_id, sites(id,name,slug)";

type SiteMemberRow = {
  site_id: string;
  sites: Site | Site[] | null;
};

export async function getAccessibleSites(): Promise<Site[]> {
  try {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const { data, error } = await supabase
      .from("site_members")
      .select(SITE_MEMBER_SELECT);

    if (error) {
      throw new Error(error.message);
    }

    return parseSiteMemberRows((data ?? []) as SiteMemberRow[]);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error("Les sites retournes par Supabase sont invalides.");
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Impossible de charger les sites.");
  }
}

export function parseSiteMemberRows(rows: SiteMemberRow[]): Site[] {
  const sites = rows.flatMap((row) => {
    if (Array.isArray(row.sites)) {
      return row.sites;
    }

    return row.sites ? [row.sites] : [];
  });

  const uniqueSites = Array.from(
    new Map(sites.map((site) => [site.id, site])).values(),
  );

  return siteListSchema.parse(uniqueSites);
}
