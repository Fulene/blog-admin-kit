"use client";

import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { AlertTriangle, X } from "lucide-react";

export function ConfirmDialog({
  cancelLabel = "Annuler",
  children,
  confirmLabel = "Confirmer",
  isOpen,
  isDanger = false,
  title,
  onCancel,
  onConfirm,
}: {
  cancelLabel?: string;
  children?: ReactNode;
  confirmLabel?: string;
  isOpen: boolean;
  isDanger?: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center px-5 py-8">
      <button
        type="button"
        onClick={onCancel}
        className="absolute inset-0 cursor-pointer bg-black/45"
        aria-label="Fermer"
      />
      <section className="relative z-[1] w-full max-w-md rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl dark:border-[#2d2e30] dark:bg-[#141517]">
        <div className="flex items-start gap-4">
          <div
            className={[
              "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
              isDanger
                ? "bg-red-50 text-[#f44336] dark:bg-red-500/10 dark:text-red-300"
                : "bg-stone-100 text-stone-700 dark:bg-[#24262a] dark:text-stone-200",
            ].join(" ")}
          >
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-stone-950 dark:text-white">
              {title}
            </h2>
            {children ? (
              <div className="mt-2 text-sm text-stone-500 dark:text-stone-300">
                {children}
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-[#111213] dark:text-stone-300 dark:hover:bg-[#18191b]"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-10 cursor-pointer rounded-md px-4 text-sm font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-950 dark:text-stone-300 dark:hover:bg-[#18191b] dark:hover:text-white"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={[
              "h-10 cursor-pointer rounded-md px-4 text-sm font-semibold text-white",
              isDanger
                ? "bg-[#f44336] hover:bg-[#d7382d]"
                : "bg-emerald-600 hover:bg-emerald-700",
            ].join(" ")}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}
