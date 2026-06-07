"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export type ToastMessageState = {
  status: "success" | "error";
  text: string;
};

const TOAST_DISPLAY_DURATION_IN_MS = 5000;
const TOAST_EXIT_DURATION_IN_MS = 220;

export function ToastMessage({
  message,
  onClose,
}: {
  message: ToastMessageState | null;
  onClose?: () => void;
}) {
  const [visibleMessage, setVisibleMessage] =
    useState<ToastMessageState | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (!message) {
      return;
    }

    setVisibleMessage(message);
    setIsLeaving(false);

    const exitTimer = window.setTimeout(() => {
      setIsLeaving(true);
    }, TOAST_DISPLAY_DURATION_IN_MS);
    const clearTimer = window.setTimeout(() => {
      setVisibleMessage(null);
      setIsLeaving(false);
      onClose?.();
    }, TOAST_DISPLAY_DURATION_IN_MS + TOAST_EXIT_DURATION_IN_MS);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(clearTimer);
    };
  }, [message?.status, message?.text]);

  if (!visibleMessage) {
    return null;
  }

  const isSuccess = visibleMessage.status === "success";
  const Icon = isSuccess ? CheckCircle2 : AlertCircle;

  return (
    <div
      className={[
        "fixed bottom-5 left-1/2 z-[10000] w-[calc(100dvw-2rem)] max-w-sm md:bottom-auto md:left-auto md:right-5 md:top-24 md:w-auto",
        isLeaving ? "profile-toast-out" : "profile-toast-in",
      ].join(" ")}
    >
      <div
        className={[
          "flex items-center gap-2 rounded-md border px-4 py-3 text-sm font-medium shadow-lg dark:shadow-white/5",
          isLeaving ? "" : "profile-toast-float",
          isSuccess
            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-500/10 dark:text-emerald-300"
            : "border-red-200 bg-red-50 text-[#b42318] dark:border-[#5f2a20] dark:bg-[#241412] dark:text-[#ffb199]",
        ].join(" ")}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{visibleMessage.text}</span>
      </div>
    </div>
  );
}
