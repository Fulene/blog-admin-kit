"use client";

import { useEffect, useMemo, useState } from "react";
import { ImagePlus, Loader2, Plus, Send, X } from "lucide-react";
import { ZodError } from "zod";
import { ConfirmDialog } from "@/components/dialogs/confirm-dialog";
import {
  ToastMessage,
  type ToastMessageState,
} from "@/components/feedback/toast-message";
import { CreatableDropdown } from "@/components/forms/creatable-dropdown";
import { CreatableChipCombobox } from "@/components/forms/creatable-chip-combobox";
import {
  articleCreateSchema,
  type ArticleCreateValues,
} from "@/features/articles/schemas/article-create.schema";
import { createArticleWithTags } from "@/features/articles/services/articles.service";
import {
  createCategory,
  getCategories,
} from "@/features/categories/services/categories.service";
import type { Category } from "@/features/categories/types/category";
import { useActiveSite } from "@/features/sites/components/active-site-provider";
import { createTag, getTags } from "@/features/tags/services/tags.service";
import type { Tag } from "@/features/tags/types/tag";

type DrawerState = "idle" | "loading" | "success" | "error";

const EMPTY_VALUES: ArticleCreateValues = {
  title: "",
  slug: "",
  summary: "",
  content: "",
  categoryId: null,
  tagIds: [],
  coverImageAlt: null,
  metaTitle: null,
  metaDescription: null,
};

export function ArticleCreateDrawer({
  isOpen,
  onArticleCreated,
  onClose,
}: {
  isOpen: boolean;
  onArticleCreated: (message: ToastMessageState) => void;
  onClose: () => void;
}) {
  const { activeSiteId } = useActiveSite();
  const [values, setValues] = useState<ArticleCreateValues>(EMPTY_VALUES);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreviewUrl, setCoverImagePreviewUrl] = useState<
    string | null
  >(null);
  const [hasSlugBeenEdited, setHasSlugBeenEdited] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [drawerState, setDrawerState] = useState<DrawerState>("idle");
  const [metadataState, setMetadataState] = useState<DrawerState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDiscardDialogOpen, setIsDiscardDialogOpen] = useState(false);

  const isDirty = useMemo(
    () =>
      values.title.trim().length > 0 ||
      values.slug.trim().length > 0 ||
      values.summary.trim().length > 0 ||
      values.content.trim().length > 0 ||
      values.categoryId !== null ||
      values.tagIds.length > 0 ||
      values.coverImageAlt !== null ||
      values.metaTitle !== null ||
      values.metaDescription !== null ||
      coverImageFile !== null,
    [coverImageFile, values],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isMounted = true;

    async function loadMetadata() {
      setMetadataState("loading");
      setErrorMessage(null);

      try {
        const [categoryData, tagData] = await Promise.all([
          getCategories(activeSiteId),
          getTags(activeSiteId),
        ]);

        if (!isMounted) {
          return;
        }

        setCategories(categoryData);
        setTags(tagData);
        setMetadataState("success");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setMetadataState("error");
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Impossible de charger les donnees du formulaire.",
        );
      }
    }

    void loadMetadata();

    return () => {
      isMounted = false;
    };
  }, [activeSiteId, isOpen]);

  useEffect(() => {
    if (!coverImageFile) {
      setCoverImagePreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(coverImageFile);
    setCoverImagePreviewUrl(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [coverImageFile]);

  if (!isOpen) {
    return null;
  }

  function resetForm() {
    setValues(EMPTY_VALUES);
    setCoverImageFile(null);
    setCoverImagePreviewUrl(null);
    setHasSlugBeenEdited(false);
    setErrorMessage(null);
    setDrawerState("idle");
  }

  function requestClose() {
    if (drawerState === "loading") {
      return;
    }

    if (isDirty) {
      setIsDiscardDialogOpen(true);
      return;
    }

    resetForm();
    onClose();
  }

  function confirmClose() {
    setIsDiscardDialogOpen(false);
    resetForm();
    onClose();
  }

  function updateTitle(title: string) {
    setValues((currentValues) => ({
      ...currentValues,
      title,
      slug: hasSlugBeenEdited ? currentValues.slug : slugify(title),
    }));
  }

  async function handleCreateCategory(categoryName: string) {
    const categorySlug = slugify(categoryName);

    if (!categorySlug) {
      throw new Error("Le nom de categorie est invalide.");
    }

    const createdCategory = await createCategory({
      siteId: activeSiteId,
      name: categoryName,
      slug: categorySlug,
    });

    setCategories((currentCategories) =>
      [...currentCategories, createdCategory].toSorted((first, second) =>
        first.name.localeCompare(second.name),
      ),
    );

    return {
      id: createdCategory.id,
      label: createdCategory.name,
      description: createdCategory.slug,
    };
  }

  async function handleCreateTag(tagName: string) {
    const tagSlug = slugify(tagName);

    if (!tagSlug) {
      throw new Error("Le nom de tag est invalide.");
    }

    const createdTag = await createTag({
      siteId: activeSiteId,
      name: tagName,
      slug: tagSlug,
    });

    setTags((currentTags) =>
      [...currentTags, createdTag].toSorted((first, second) =>
        first.name.localeCompare(second.name),
      ),
    );

    return {
      id: createdTag.id,
      label: createdTag.name,
    };
  }

  async function handleSubmit(status: "draft" | "published") {
    setDrawerState("loading");
    setErrorMessage(null);

    try {
      const parsedValues = articleCreateSchema.parse(values);

      await createArticleWithTags({
        siteId: activeSiteId,
        status,
        categoryId: parsedValues.categoryId,
        title: parsedValues.title,
        slug: parsedValues.slug,
        summary: parsedValues.summary,
        content: parsedValues.content,
        coverImageFile,
        coverImageAlt: normalizeOptionalText(parsedValues.coverImageAlt),
        metaTitle: normalizeOptionalText(parsedValues.metaTitle),
        metaDescription: normalizeOptionalText(parsedValues.metaDescription),
        tagIds: parsedValues.tagIds,
      });

      setDrawerState("success");
      resetForm();
      onArticleCreated({
        status: "success",
        text:
          status === "published"
            ? "Article publie avec succes."
            : "Brouillon cree avec succes.",
      });
      onClose();
    } catch (error) {
      setDrawerState("error");

      if (error instanceof ZodError) {
        setErrorMessage(error.issues[0]?.message ?? "Formulaire invalide.");
        return;
      }

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Impossible de creer l'article.",
      );
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex justify-end">
      <ToastMessage
        message={
          errorMessage
            ? {
                status: "error",
                text: errorMessage,
              }
            : null
        }
        onClose={() => setErrorMessage(null)}
      />

      <button
        type="button"
        onClick={requestClose}
        className="absolute inset-0 cursor-pointer bg-black/35"
        aria-label="Fermer le panneau"
      />

      <aside className="relative z-[1] flex h-full w-full flex-col border-l border-stone-200 bg-white shadow-2xl dark:border-[#2d2e30] dark:bg-[#141517] sm:max-w-[680px]">
        <header className="flex shrink-0 items-center justify-between border-b border-stone-200 px-5 py-4 dark:border-[#2d2e30]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#f44336] dark:text-[#ff8a3d]">
              Article
            </p>
            <h2 className="mt-1 text-xl font-bold text-stone-950 dark:text-white">
              Nouvel article
            </h2>
          </div>
          <button
            type="button"
            onClick={requestClose}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-[#111213] dark:text-stone-300 dark:hover:bg-[#18191b]"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <form className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            <div className="grid gap-5">
              <TextField
                label="Titre"
                value={values.title}
                required
                onChange={updateTitle}
              />

              <TextField
                label="Slug"
                value={values.slug}
                required
                onChange={(slug) => {
                  setHasSlugBeenEdited(true);
                  setValues((currentValues) => ({
                    ...currentValues,
                    slug: slugify(slug),
                  }));
                }}
              />

              <TextAreaField
                label="Resume"
                value={values.summary}
                rows={3}
                onChange={(summary) =>
                  setValues((currentValues) => ({
                    ...currentValues,
                    summary,
                  }))
                }
              />

              <TextAreaField
                label="Contenu"
                value={values.content}
                required
                rows={9}
                onChange={(content) =>
                  setValues((currentValues) => ({
                    ...currentValues,
                    content,
                  }))
                }
              />

              <CreatableDropdown
                createLabel="Creer la categorie"
                disabled={metadataState === "loading"}
                emptyLabel="Aucune categorie disponible."
                label="Categorie"
                options={categories.map((category) => ({
                  id: category.id,
                  label: category.name,
                }))}
                placeholder="Taper pour rechercher ou creer"
                value={values.categoryId}
                onChange={(categoryId) =>
                  setValues((currentValues) => ({
                    ...currentValues,
                    categoryId,
                  }))
                }
                onCreate={handleCreateCategory}
                onCreateError={setErrorMessage}
              />

              <CreatableChipCombobox
                createLabel="Creer le tag"
                disabled={metadataState === "loading"}
                emptyLabel="Aucun tag disponible."
                label="Tags"
                options={tags.map((tag) => ({
                  id: tag.id,
                  label: tag.name,
                }))}
                value={values.tagIds}
                onChange={(tagIds) =>
                  setValues((currentValues) => ({
                    ...currentValues,
                    tagIds,
                  }))
                }
                onCreate={handleCreateTag}
                onCreateError={setErrorMessage}
              />

              <TextField
                label="Meta title"
                value={values.metaTitle ?? ""}
                onChange={(metaTitle) =>
                  setValues((currentValues) => ({
                    ...currentValues,
                    metaTitle,
                  }))
                }
              />

              <TextAreaField
                label="Meta description"
                value={values.metaDescription ?? ""}
                rows={3}
                onChange={(metaDescription) =>
                  setValues((currentValues) => ({
                    ...currentValues,
                    metaDescription,
                  }))
                }
              />

              <div className="grid gap-3 rounded-lg border border-dashed border-stone-300 p-4 dark:border-[#2d2e30]">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-[#f44336] dark:bg-[#24262a] dark:text-[#ff8a3d]">
                    <ImagePlus className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                      Image de couverture
                    </p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Upload au moment de la creation.
                    </p>
                  </div>
                </div>

                {coverImagePreviewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverImagePreviewUrl}
                    alt=""
                    className="h-40 w-full rounded-md object-cover"
                  />
                ) : null}

                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setCoverImageFile(event.target.files?.[0] ?? null)
                  }
                  className="text-sm text-stone-600 file:mr-3 file:h-9 file:cursor-pointer file:rounded-md file:border-0 file:bg-stone-100 file:px-3 file:text-sm file:font-medium file:text-stone-700 hover:file:bg-stone-200 dark:text-stone-300 dark:file:bg-[#111213] dark:file:text-stone-200 dark:hover:file:bg-[#18191b]"
                />

                <TextField
                  label="Texte alternatif image (attribut alt)"
                  value={values.coverImageAlt ?? ""}
                  onChange={(coverImageAlt) =>
                    setValues((currentValues) => ({
                      ...currentValues,
                      coverImageAlt,
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <footer className="flex shrink-0 items-center justify-end gap-3 border-t border-stone-200 px-5 py-4 dark:border-[#2d2e30]">
            <button
              type="button"
              onClick={requestClose}
              disabled={drawerState === "loading"}
              className="h-10 cursor-pointer rounded-md px-4 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-950 disabled:cursor-default disabled:opacity-60 dark:text-stone-300 dark:hover:bg-[#18191b] dark:hover:text-white"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={drawerState === "loading" || metadataState !== "success"}
              onClick={() => {
                void handleSubmit("draft");
              }}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-[#f44336] px-4 text-sm font-semibold text-white hover:bg-[#d7382d] disabled:cursor-default disabled:opacity-60 dark:bg-[#ff8a3d] dark:text-stone-950 dark:hover:bg-[#ff7920]"
            >
              {drawerState === "loading" ? (
                <Loader2
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Plus className="h-4 w-4" aria-hidden="true" />
              )}
              Creer le brouillon
            </button>
            <button
              type="button"
              disabled={drawerState === "loading" || metadataState !== "success"}
              onClick={() => {
                void handleSubmit("published");
              }}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-default disabled:opacity-60"
            >
              {drawerState === "loading" ? (
                <Loader2
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Send className="h-4 w-4" aria-hidden="true" />
              )}
              Publier l'article
            </button>
          </footer>
        </form>
      </aside>

      <ConfirmDialog
        cancelLabel="Continuer l'edition"
        confirmLabel="Fermer sans creer"
        isDanger
        isOpen={isDiscardDialogOpen}
        title="Abandonner la creation ?"
        onCancel={() => setIsDiscardDialogOpen(false)}
        onConfirm={confirmClose}
      >
        Les informations saisies dans ce formulaire seront perdues.
      </ConfirmDialog>
    </div>
  );
}

function TextField({
  label,
  onChange,
  required = false,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">
        {label}
        {required ? <span className="text-[#f44336]"> *</span> : null}
      </span>
      <input
        type="text"
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 rounded-md border border-stone-200 bg-white px-3 text-sm text-stone-950 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400 dark:border-[#2d2e30] dark:bg-[#111213] dark:text-white dark:placeholder:text-stone-500 dark:focus:border-[#ff8a3d]"
      />
    </label>
  );
}

function TextAreaField({
  label,
  onChange,
  required = false,
  rows,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  rows: number;
  value: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">
        {label}
        {required ? <span className="text-[#f44336]"> *</span> : null}
      </span>
      <textarea
        value={value}
        required={required}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="resize-y rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-950 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400 dark:border-[#2d2e30] dark:bg-[#111213] dark:text-white dark:placeholder:text-stone-500 dark:focus:border-[#ff8a3d]"
      />
    </label>
  );
}

function normalizeOptionalText(value: string | null) {
  const normalizedValue = value?.trim();

  return normalizedValue ? normalizedValue : null;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
