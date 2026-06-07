import { z } from "zod";
import type { Site } from "@/features/sites/types/site";

export const siteSchema: z.ZodType<Site> = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().nullable(),
});

export const siteListSchema = z.array(siteSchema);
