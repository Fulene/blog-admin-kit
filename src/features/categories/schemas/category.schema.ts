import { z } from "zod";
import type { Category } from "@/features/categories/types/category";

export const categorySchema: z.ZodType<Category> = z.object({
  id: z.string().uuid(),
  site_id: z.string().uuid(),
  name: z.string().min(1),
  slug: z.string().min(1),
});

export const categoryListSchema = z.array(categorySchema);
