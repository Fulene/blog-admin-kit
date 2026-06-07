import { z } from "zod";
import {
  ARTICLE_STATUS_VALUES,
  type Article,
} from "@/features/articles/types/article";

export const articleStatusSchema = z.enum(ARTICLE_STATUS_VALUES);

const timestampSchema = z.string().datetime({ offset: true });

export const articleSchema: z.ZodType<Article> = z.object({
  id: z.string().uuid(),
  site_id: z.string().uuid(),
  author_id: z.string().uuid(),
  category_id: z.string().uuid().nullable(),
  title: z.string().min(1),
  slug: z.string().min(1),
  summary: z.string(),
  content: z.string(),
  cover_image_url: z.string().nullable(),
  cover_image_alt: z.string().nullable(),
  meta_title: z.string().nullable(),
  meta_description: z.string().nullable(),
  status: articleStatusSchema,
  published_at: timestampSchema.nullable(),
  updated_by: z.string().uuid().nullable(),
  created_at: timestampSchema,
  updated_at: timestampSchema,
});

export const articleListSchema = z.array(articleSchema);
