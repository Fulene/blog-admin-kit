import { z } from "zod";
import type { Tag } from "@/features/tags/types/tag";

export const tagSchema: z.ZodType<Tag> = z.object({
  id: z.string().uuid(),
  site_id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
});

export const tagListSchema = z.array(tagSchema);
