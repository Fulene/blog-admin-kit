import { ZodError } from "zod";
import {
  categoryListSchema,
  categorySchema,
} from "@/features/categories/schemas/category.schema";
import type { Category } from "@/features/categories/types/category";

const CATEGORIES_SELECT = ["id", "site_id", "name", "slug"].join(",");

export async function getCategories(activeSiteId: string): Promise<Category[]> {
  if (!activeSiteId) {
    throw new Error("Aucun site actif selectionne.");
  }

  try {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const { data, error } = await supabase
      .from("categories")
      .select(CATEGORIES_SELECT)
      .eq("site_id", activeSiteId)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return categoryListSchema.parse(data ?? []);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error("Les categories retournees par Supabase sont invalides.");
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Impossible de charger les categories.");
  }
}

export async function createCategory({
  name,
  siteId,
  slug,
}: {
  name: string;
  siteId: string;
  slug: string;
}): Promise<Category> {
  if (!siteId) {
    throw new Error("Aucun site actif selectionne.");
  }

  try {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const { data, error } = await supabase
      .from("categories")
      .insert({
        site_id: siteId,
        name,
        slug,
      })
      .select(CATEGORIES_SELECT)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return categorySchema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error("La categorie retournee par Supabase est invalide.");
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Impossible de creer la categorie.");
  }
}

export async function updateCategory({
  id,
  name,
  siteId,
  slug,
}: {
  id: string;
  name: string;
  siteId: string;
  slug: string;
}): Promise<Category> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();

  const { data, error } = await supabase
    .from("categories")
    .update({ name, slug })
    .eq("site_id", siteId)
    .eq("id", id)
    .select(CATEGORIES_SELECT)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return categorySchema.parse(data);
}

export async function getArticlesUsingCategory({
  categoryId,
  siteId,
}: {
  categoryId: string;
  siteId: string;
}): Promise<Array<{ id: string; title: string }>> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();

  const { data, error } = await supabase
    .from("articles")
    .select("id,title")
    .eq("site_id", siteId)
    .eq("category_id", categoryId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Array<{ id: string; title: string }>;
}

export async function deleteCategoryForSite({
  id,
  siteId,
}: {
  id: string;
  siteId: string;
}): Promise<void> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();

  const { error } = await supabase.rpc("delete_category_for_site", {
    p_site_id: siteId,
    p_category_id: id,
  });

  if (error) {
    throw new Error(error.message);
  }
}
