import "server-only";

import { ZodError } from "zod";
import { parseSiteMemberRows } from "@/features/sites/services/sites.service";
import type { Site } from "@/features/sites/types/site";
import { createClient } from "@/lib/supabase/server";

const SITE_MEMBER_SELECT = "site_id, sites(id,name,slug)";

type SiteMemberRow = {
  site_id: string;
  sites: Site | Site[] | null;
};

export async function getAccessibleSitesForCurrentUser(): Promise<Site[]> {
  try {
    const supabase = await createClient();

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
