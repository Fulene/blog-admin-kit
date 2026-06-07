export const ARTICLE_STATUS_VALUES = ["draft", "published"] as const;

export type ArticleStatus = (typeof ARTICLE_STATUS_VALUES)[number];

export type ArticleStatusFilter = "all" | ArticleStatus;

export type Article = {
  id: string;
  site_id: string;
  author_id: string;
  category_id: string | null;
  title: string;
  slug: string;
  summary: string;
  content: string;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  meta_title: string | null;
  meta_description: string | null;
  status: ArticleStatus;
  published_at: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};
