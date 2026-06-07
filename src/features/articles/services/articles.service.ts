import { ZodError } from "zod";
import {
  articleListSchema,
  articleSchema,
} from "@/features/articles/schemas/article.schema";
import type { Article } from "@/features/articles/types/article";

const ARTICLES_SELECT = [
  "id",
  "site_id",
  "author_id",
  "category_id",
  "title",
  "slug",
  "summary",
  "content",
  "cover_image_url",
  "cover_image_alt",
  "meta_title",
  "meta_description",
  "status",
  "published_at",
  "updated_by",
  "created_at",
  "updated_at",
].join(",");

export async function getArticles(activeSiteId: string): Promise<Article[]> {
  if (!activeSiteId) {
    throw new Error("Aucun site actif selectionne.");
  }

  try {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const { data, error } = await supabase
      .from("articles")
      .select(ARTICLES_SELECT)
      .eq("site_id", activeSiteId)
      .order("updated_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return articleListSchema.parse(data ?? []);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error("Les articles retournés par Supabase sont invalides.");
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Impossible de charger les articles.");
  }
}

type CreateArticleWithTagsInput = {
  siteId: string;
  status: "draft" | "published";
  categoryId: string | null;
  title: string;
  slug: string;
  summary: string;
  content: string;
  coverImageFile: File | null;
  coverImageAlt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  tagIds: string[];
};

const ARTICLE_IMAGES_BUCKET_NAME = "article-images";

export async function createArticleWithTags({
  siteId,
  status,
  categoryId,
  title,
  slug,
  summary,
  content,
  coverImageFile,
  coverImageAlt,
  metaTitle,
  metaDescription,
  tagIds,
}: CreateArticleWithTagsInput): Promise<Article> {
  if (!siteId) {
    throw new Error("Aucun site actif selectionne.");
  }

  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  let uploadedImagePath: string | null = null;

  try {
    if (coverImageFile) {
      if (!coverImageFile.type.startsWith("image/")) {
        throw new Error("Le fichier selectionne doit etre une image.");
      }

      const assetId = crypto.randomUUID();
      const extension = getFileExtension(coverImageFile.name);
      const imagePath = `sites/${siteId}/articles/${assetId}/cover.${extension}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(ARTICLE_IMAGES_BUCKET_NAME)
        .upload(imagePath, coverImageFile, {
          contentType: coverImageFile.type || undefined,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      uploadedImagePath = uploadData.path;
    }

    const { data, error } = await supabase.rpc("create_article_with_tags", {
      p_site_id: siteId,
      p_category_id: categoryId,
      p_title: title,
      p_slug: slug,
      p_summary: summary,
      p_content: content,
      p_cover_image_url: uploadedImagePath,
      p_cover_image_alt: coverImageAlt,
      p_meta_title: metaTitle,
      p_meta_description: metaDescription,
      p_tag_ids: tagIds,
      p_status: status,
    });

    if (error) {
      throw new Error(error.message);
    }

    return articleSchema.parse(data);
  } catch (error) {
    if (uploadedImagePath) {
      await supabase.storage
        .from(ARTICLE_IMAGES_BUCKET_NAME)
        .remove([uploadedImagePath]);
    }

    if (error instanceof ZodError) {
      throw new Error("L'article retourne par Supabase est invalide.");
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Impossible de creer l'article.");
  }
}

function getFileExtension(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase();

  if (!extension || !/^[a-z0-9]+$/.test(extension)) {
    return "jpg";
  }

  return extension;
}
