"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  ToastMessage,
  type ToastMessageState,
} from "@/components/feedback/toast-message";
import { SelectDropdown } from "@/components/forms/select-dropdown";
import { ArticleCreateDrawer } from "@/features/articles/components/article-create-drawer";
import { getArticles } from "@/features/articles/services/articles.service";
import type {
  Article,
  ArticleStatus,
  ArticleStatusFilter,
} from "@/features/articles/types/article";
import { getCategories } from "@/features/categories/services/categories.service";
import type { Category } from "@/features/categories/types/category";
import { useActiveSite } from "@/features/sites/components/active-site-provider";

type LoadState = "idle" | "loading" | "success" | "error";
type SortColumn =
  | "title"
  | "category"
  | "status"
  | "published_at"
  | "updated_at"
  | "updated_by";
type SortDirection = "asc" | "desc";
type ActiveSortState = {
  column: SortColumn;
  direction: SortDirection;
};
type SortState = ActiveSortState | null;

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50] as const;

const statusFilters: Array<{
  label: string;
  value: ArticleStatusFilter;
}> = [
  { label: "Tous", value: "all" },
  { label: "Brouillons", value: "draft" },
  { label: "Publiés", value: "published" },
];

const statusLabels: Record<ArticleStatus, string> = {
  draft: "Brouillon",
  published: "Publié",
};

export function ArticlesAdminList() {
  const { activeSiteId } = useActiveSite();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ArticleStatusFilter>("all");
  const [sortState, setSortState] = useState<SortState>({
    column: "updated_at",
    direction: "desc",
  });
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<ToastMessageState | null>(
    null,
  );
  const [reloadKey, setReloadKey] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  useEffect(() => {
    let isMounted = true;

    async function loadArticles() {
      setLoadState("loading");

      try {
        const [articleData, categoryData] = await Promise.all([
          getArticles(activeSiteId),
          getCategories(activeSiteId),
        ]);

        if (!isMounted) {
          return;
        }

        setArticles(articleData);
        setCategories(categoryData);
        setLoadState("success");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setToastMessage({
          status: "error",
          text:
            error instanceof Error
              ? error.message
              : "Impossible de charger les articles.",
        });
        setLoadState("error");
      }
    }

    void loadArticles();

    return () => {
      isMounted = false;
    };
  }, [activeSiteId, reloadKey]);

  const categoryNameById = useMemo(
    () =>
      new Map(
        categories.map((category) => [category.id, category.name] as const),
      ),
    [categories],
  );

  const filteredArticles = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return articles
      .filter((article) => {
        const matchesStatus =
          statusFilter === "all" || article.status === statusFilter;

        const searchableText = [
          article.title,
          article.slug,
          article.summary,
          article.category_id ? categoryNameById.get(article.category_id) : null,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          normalizedQuery.length === 0 ||
          searchableText.includes(normalizedQuery);

        return matchesStatus && matchesSearch;
      })
      .toSorted((firstArticle, secondArticle) =>
        sortState
          ? compareArticles(
              firstArticle,
              secondArticle,
              sortState,
              categoryNameById,
            )
          : 0,
      );
  }, [articles, categoryNameById, searchQuery, sortState, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredArticles.length / itemsPerPage),
  );
  const shouldShowPaginationControls = filteredArticles.length >= 6;

  const paginatedArticles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;

    return filteredArticles.slice(startIndex, startIndex + itemsPerPage);
  }, [currentPage, filteredArticles, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSiteId, itemsPerPage, searchQuery, sortState, statusFilter]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  function handleSort(column: SortColumn) {
    setSortState((currentSort) => {
      if (!currentSort || currentSort.column !== column) {
        return {
          column,
          direction: "asc",
        };
      }

      if (currentSort.direction === "asc") {
        return {
          column,
          direction: "desc",
        };
      }

      return null;
    });
  }

  return (
    <section className="flex min-h-full flex-col gap-5">
      <ToastMessage
        message={toastMessage}
        onClose={() => setToastMessage(null)}
      />

      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-sm">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Rechercher un article"
              className="h-11 w-full rounded-md border border-stone-200 bg-white pl-10 pr-3 text-sm text-stone-950 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400 dark:border-[#2d2e30] dark:bg-[#141517] dark:text-white dark:placeholder:text-stone-500 dark:focus:border-[#ff8a3d]"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 lg:justify-center">
          {shouldShowPaginationControls ? (
            <>
              <PaginationControls
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filteredArticles.length}
                totalPages={totalPages}
                onItemsPerPageChange={setItemsPerPage}
                onPageChange={setCurrentPage}
              />
              <ItemsPerPageControl
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </>
          ) : null}
          <span className="text-xs font-medium text-stone-500 dark:text-stone-500">
            {filteredArticles.length} article
            {filteredArticles.length > 1 ? "s" : ""} au total
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 xl:w-[430px] xl:justify-end">
          {statusFilters.map((filter) => {
            const isActive = statusFilter === filter.value;

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setStatusFilter(filter.value)}
                className={[
                  "h-10 cursor-pointer rounded-md border px-4 text-sm font-medium transition-colors",
                  isActive
                    ? "border-[#f44336] bg-red-50 text-stone-950 dark:border-[#ff8a3d] dark:bg-[#24262a] dark:text-white"
                    : "border-stone-200 bg-white text-stone-600 hover:bg-stone-100 hover:text-stone-950 dark:border-[#2d2e30] dark:bg-[#141517] dark:text-stone-300 dark:hover:bg-[#18191b] dark:hover:text-white",
                ].join(" ")}
              >
                {filter.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setIsCreateDrawerOpen(true)}
            className="group inline-flex h-11 w-11 shrink-0 cursor-pointer items-center overflow-hidden rounded-full bg-[#f44336] text-sm font-semibold text-white transition-[width,background-color] duration-200 ease-out hover:w-39 hover:bg-[#d7382d] focus-visible:w-39 focus-visible:bg-[#d7382d] dark:bg-[#ff8a3d] dark:text-stone-950 dark:hover:bg-[#ff7920] dark:focus-visible:bg-[#ff7920]"
            aria-label="Nouvel article"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center">
              <Plus className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="-ml-1 w-0 overflow-hidden whitespace-nowrap opacity-0 transition-[width,opacity] duration-200 ease-out group-hover:w-25 group-hover:opacity-100 group-focus-visible:w-25 group-focus-visible:opacity-100">
              Nouvel article
            </span>
          </button>
        </div>
      </div>

      <div className="flex rounded-lg border border-stone-200 bg-white dark:border-[#2d2e30] dark:bg-[#141517]">
        {loadState === "loading" || loadState === "idle" ? (
          <ArticlesLoadingState />
        ) : null}

        {loadState === "error" ? (
          <ArticlesErrorState />
        ) : null}

        {loadState === "success" && articles.length === 0 ? (
          <ArticlesEmptyState title="Aucun article" />
        ) : null}

        {loadState === "success" &&
        articles.length > 0 &&
        filteredArticles.length === 0 ? (
          <ArticlesEmptyState title="Aucun resultat" />
        ) : null}

        {loadState === "success" && filteredArticles.length > 0 ? (
          <ArticlesTable
            articles={paginatedArticles}
            categoryNameById={categoryNameById}
            sortState={sortState}
            onSort={handleSort}
          />
        ) : null}
      </div>

      {loadState === "success" &&
      filteredArticles.length > 0 &&
      shouldShowPaginationControls ? (
        <>
          <PaginationControls
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredArticles.length}
            totalPages={totalPages}
            className="mb-4 justify-center"
            onItemsPerPageChange={setItemsPerPage}
            onPageChange={setCurrentPage}
          />
        </>
      ) : null}

      <ArticleCreateDrawer
        isOpen={isCreateDrawerOpen}
        onArticleCreated={(message) => {
          setReloadKey((key) => key + 1);
          setToastMessage(message);
        }}
        onClose={() => setIsCreateDrawerOpen(false)}
      />
    </section>
  );
}

function PaginationControls({
  currentPage,
  totalPages,
  className,
  onPageChange,
}: {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
  className?: string;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  onPageChange: (page: number) => void;
}) {
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div
      className={[
        "flex flex-wrap items-center gap-3 py-1 text-sm text-stone-600 dark:text-stone-300",
        className ?? "",
      ].join(" ")}
    >
      <div className="flex h-11 items-center gap-3 rounded-full bg-stone-100 px-0.5 dark:bg-[#111213]">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-sm hover:bg-stone-100 disabled:cursor-default disabled:bg-stone-100 disabled:text-stone-300 dark:border-[#2d2e30] dark:bg-[#141517] dark:text-stone-300 dark:hover:bg-[#1c1d20] dark:disabled:bg-[#24262a] dark:disabled:text-stone-600"
          aria-label="Page precedente"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="w-16 text-center text-sm font-semibold tabular-nums text-stone-700 dark:text-stone-200">
          {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-sm hover:bg-stone-100 disabled:cursor-default disabled:bg-stone-100 disabled:text-stone-300 dark:border-[#2d2e30] dark:bg-[#141517] dark:text-stone-300 dark:hover:bg-[#1c1d20] dark:disabled:bg-[#24262a] dark:disabled:text-stone-600"
          aria-label="Page suivante"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

    </div>
  );
}

function ItemsPerPageControl({
  itemsPerPage,
  onItemsPerPageChange,
}: {
  itemsPerPage: number;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}) {
  return (
    <SelectDropdown
      ariaLabel="Nombre d'articles par page"
      className="w-[132px]"
      options={ITEMS_PER_PAGE_OPTIONS.map((option) => ({
        id: String(option),
        label: `${option} / page`,
      }))}
      value={String(itemsPerPage)}
      onChange={(value) => onItemsPerPageChange(Number(value))}
    />
  );
}

function ArticlesTable({
  articles,
  categoryNameById,
  sortState,
  onSort,
}: {
  articles: Article[];
  categoryNameById: Map<string, string>;
  sortState: SortState;
  onSort: (column: SortColumn) => void;
}) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[1120px] table-fixed border-collapse text-left text-sm">
        <thead className="border-b border-stone-200 bg-stone-50 text-xs font-semibold uppercase text-stone-500 dark:border-[#2d2e30] dark:bg-[#111213] dark:text-stone-400">
          <tr>
            <SortableTableHeader
              column="title"
              label="Titre"
              className="w-[32%]"
              sortState={sortState}
              onSort={onSort}
            />
            <SortableTableHeader
              column="category"
              label="Categorie"
              className="w-[13%]"
              sortState={sortState}
              onSort={onSort}
            />
            <SortableTableHeader
              column="status"
              label="Statut"
              className="w-[10%]"
              sortState={sortState}
              onSort={onSort}
            />
            <SortableTableHeader
              column="published_at"
              label="Publication"
              className="w-[13%]"
              sortState={sortState}
              onSort={onSort}
            />
            <SortableTableHeader
              column="updated_at"
              label="Modification"
              className="w-[13%]"
              sortState={sortState}
              onSort={onSort}
            />
            <SortableTableHeader
              column="updated_by"
              label="Modifie par"
              className="w-[10%]"
              sortState={sortState}
              onSort={onSort}
            />
            <th className="w-[9%] px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200 dark:divide-[#2d2e30]">
          {articles.map((article) => (
            <tr
              key={article.id}
              className="text-stone-700 dark:text-stone-300"
            >
              <td className="px-4 py-4">
                <div className="font-semibold text-stone-950 dark:text-white">
                  {article.title}
                </div>
                <div className="mt-1 truncate text-xs text-stone-500 dark:text-stone-500">
                  /{article.slug}
                </div>
              </td>
              <td className="px-4 py-4">
                <EmptyValueFallback
                  value={
                    article.category_id
                      ? categoryNameById.get(article.category_id) ?? null
                      : null
                  }
                />
              </td>
              <td className="px-4 py-4">
                <ArticleStatusBadge status={article.status} />
              </td>
              <td className="px-4 py-4">
                {formatDate(article.published_at)}
              </td>
              <td className="px-4 py-4">{formatDate(article.updated_at)}</td>
              <td className="px-4 py-4">
                <EmptyValueFallback value={formatUserId(article.updated_by)} />
              </td>
              <td className="px-4 py-4">
                <div className="flex justify-end gap-2">
                  <DisabledActionButton label="Voir" icon={Eye} />
                  <DisabledActionButton label="Modifier" icon={Pencil} />
                  <DisabledActionButton label="Supprimer" icon={Trash2} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SortableTableHeader({
  column,
  label,
  className,
  sortState,
  onSort,
}: {
  column: SortColumn;
  label: string;
  className?: string;
  sortState: SortState;
  onSort: (column: SortColumn) => void;
}) {
  const isActive = sortState?.column === column;
  const SortIcon = isActive
    ? sortState?.direction === "asc"
      ? ChevronUp
      : ChevronDown
    : ArrowUpDown;

  return (
    <th className={["px-4 py-3", className ?? ""].join(" ")}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={[
          "inline-flex cursor-pointer items-center gap-1.5 rounded-sm text-xs font-semibold uppercase transition-colors",
          isActive
            ? "text-stone-950 dark:text-white"
            : "text-stone-500 hover:text-stone-950 dark:text-stone-400 dark:hover:text-white",
        ].join(" ")}
        aria-label={`Trier par ${label}`}
      >
        <span>{label}</span>
        <SortIcon
          className={[
            "h-3.5 w-3.5",
            isActive ? "text-[#f44336] dark:text-[#ff8a3d]" : "",
          ].join(" ")}
          aria-hidden="true"
        />
      </button>
    </th>
  );
}

function ArticleStatusBadge({ status }: { status: ArticleStatus }) {
  const isPublished = status === "published";

  return (
    <span
      className={[
        "inline-flex rounded-full px-2 py-1 text-xs font-semibold",
        isPublished
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
          : "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300",
      ].join(" ")}
    >
      {statusLabels[status]}
    </span>
  );
}

function EmptyValueFallback({ value }: { value: string | null }) {
  if (!value) {
    return <span className="text-stone-400 dark:text-stone-600">-</span>;
  }

  return value;
}

function DisabledActionButton({
  label,
  icon: Icon,
}: {
  label: string;
  icon: typeof Eye;
}) {
  return (
    <button
      type="button"
      disabled
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-stone-200 bg-stone-50 text-stone-400 dark:border-[#2d2e30] dark:bg-[#111213] dark:text-stone-600"
      title={`${label} - indisponible`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </button>
  );
}

function ArticlesLoadingState() {
  return (
    <div className="flex w-full flex-col gap-3 p-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="h-14 animate-pulse rounded-md bg-stone-100 dark:bg-[#111213]"
        />
      ))}
    </div>
  );
}

function ArticlesErrorState() {
  return (
    <div className="flex w-full items-center justify-center p-8 text-center">
      <div>
        <p className="text-base font-semibold text-stone-950 dark:text-white">
          Impossible de charger les articles
        </p>
        <p className="mt-2 max-w-md text-sm text-stone-500 dark:text-stone-400">
          Le detail de l'erreur est affiche dans le toast.
        </p>
      </div>
    </div>
  );
}

function ArticlesEmptyState({ title }: { title: string }) {
  return (
    <div className="flex w-full items-center justify-center p-8 text-center">
      <div>
        <p className="text-base font-semibold text-stone-950 dark:text-white">
          {title}
        </p>
        <p className="mt-2 max-w-md text-sm text-stone-500 dark:text-stone-400">
          Les articles apparaitront ici lorsque Supabase retournera des donnees.
        </p>
      </div>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) {
    return "Non publié";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date invalide";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(date);
}

function formatUserId(value: string | null) {
  return value ? value.slice(0, 8) : "";
}

function compareArticles(
  firstArticle: Article,
  secondArticle: Article,
  sortState: ActiveSortState,
  categoryNameById: Map<string, string>,
) {
  const directionMultiplier = sortState.direction === "asc" ? 1 : -1;
  const firstValue = getSortableValue(
    firstArticle,
    sortState.column,
    categoryNameById,
  );
  const secondValue = getSortableValue(
    secondArticle,
    sortState.column,
    categoryNameById,
  );

  if (firstValue < secondValue) {
    return -1 * directionMultiplier;
  }

  if (firstValue > secondValue) {
    return 1 * directionMultiplier;
  }

  return 0;
}

function getSortableValue(
  article: Article,
  column: SortColumn,
  categoryNameById: Map<string, string>,
) {
  if (column === "published_at" || column === "updated_at") {
    const value = article[column];

    return value ? new Date(value).getTime() : 0;
  }

  if (column === "updated_by") {
    return formatUserId(article.updated_by).toLowerCase();
  }

  if (column === "category") {
    return article.category_id
      ? (categoryNameById.get(article.category_id) ?? "").toLowerCase()
      : "";
  }

  return String(article[column] ?? "").toLowerCase();
}
