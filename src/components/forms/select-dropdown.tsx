"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export type SelectDropdownOption = {
  id: string;
  label: string;
};

export function SelectDropdown({
  ariaLabel,
  buttonClassName,
  className,
  disabled = false,
  options,
  placeholder = "Selectionner",
  value,
  onChange,
}: {
  ariaLabel: string;
  buttonClassName?: string;
  className?: string;
  disabled?: boolean;
  options: SelectDropdownOption[];
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const activeOption = options.find((option) => option.id === value);

  return (
    <div
      className={["relative", className ?? ""].join(" ")}
      onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((value) => !value)}
        className={[
          "flex w-full items-center justify-between gap-2 rounded-lg border px-3 text-left text-sm font-medium shadow-sm outline-none transition-colors",
          buttonClassName ?? "h-10",
          disabled ? "cursor-default opacity-60" : "cursor-pointer",
          isOpen
            ? "border-[#f44336] bg-red-50 text-stone-950 dark:border-[#ff8a3d] dark:bg-[#24262a] dark:text-white"
            : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50 dark:border-[#2d2e30] dark:bg-[#111213] dark:text-stone-200 dark:hover:bg-[#18191b]",
        ].join(" ")}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel}
      >
        <span className="min-w-0 flex-1 truncate">
          {activeOption?.label ?? placeholder}
        </span>
        <ChevronDown
          className={[
            "h-4 w-4 shrink-0 text-stone-500 transition-transform duration-200 dark:text-stone-400",
            isOpen ? "rotate-180" : "",
          ].join(" ")}
          aria-hidden="true"
        />
      </button>

      {isOpen && !disabled ? (
        <div
          className="absolute right-0 top-12 z-50 max-h-64 w-full overflow-y-auto rounded-lg border border-stone-200 bg-white p-1 shadow-xl dark:border-[#2d2e30] dark:bg-[#141517]"
          role="listbox"
        >
          {options.map((option) => {
            const isActive = option.id === value;

            return (
              <button
                key={option.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
                className={[
                  "flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm transition-colors",
                  isActive
                    ? "bg-red-50 font-semibold text-stone-950 dark:bg-[#24262a] dark:text-white"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-950 dark:text-stone-300 dark:hover:bg-[#18191b] dark:hover:text-white",
                ].join(" ")}
                role="option"
                aria-selected={isActive}
              >
                <span className="truncate">{option.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
