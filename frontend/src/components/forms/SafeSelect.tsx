"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

type SafeSelectOption = { value: string; label: string };

type SafeSelectProps = {
  label: string;
  value: string;
  options: SafeSelectOption[];
  onChange: (value: string) => void;
  className?: string;
};

/**
 * Seleção sem <select> nativo: menus nativos são desenhados na camada do
 * navegador e podem atravessar diálogos de progresso, independentemente do z-index.
 */
export function SafeSelect({ label, value, options, onChange, className = "" }: SafeSelectProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const current = options.find(option => option.value === value);

  useEffect(() => {
    if (!open) return;
    optionsRef.current[Math.max(0, options.findIndex(option => option.value === value))]?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeIfOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !wrapperRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener("pointerdown", closeIfOutside);
    document.addEventListener("keydown", closeOnEscape, true);
    return () => {
      document.removeEventListener("pointerdown", closeIfOutside);
      document.removeEventListener("keydown", closeOnEscape, true);
    };
  }, [open]);

  const openAndFocus = () => { setOpen(true); };

  return <div ref={wrapperRef} className="relative min-w-0">
    <button ref={triggerRef} type="button" role="combobox"
      aria-label={label} aria-haspopup="listbox" aria-expanded={open} aria-controls={`${id}-list`}
      className={`field flex min-w-0 items-center justify-between gap-2 text-left ${className}`}
      onClick={() => open ? setOpen(false) : openAndFocus()}
      onKeyDown={event => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          openAndFocus();
        }
      }}>
      <span className="min-w-0 truncate">{current?.label || "Selecione..."}</span>
      <ChevronDown className="mr-1 size-4 shrink-0 text-slate-400" aria-hidden="true" />
    </button>
    {open && <div id={`${id}-list`} role="listbox" aria-label={label}
      className="absolute inset-x-0 top-full z-[95] mt-1 max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
      {options.map((option, index) => <button key={option.value} ref={node => { optionsRef.current[index] = node; }}
        type="button" role="option" aria-selected={option.value === value} tabIndex={-1}
        className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 outline-none hover:bg-blue-50 focus:bg-blue-50 focus:ring-2 focus:ring-blue-500 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:bg-slate-800"
        onClick={() => {
          setOpen(false);
          triggerRef.current?.focus();
          if (option.value !== value) onChange(option.value);
        }}
        onKeyDown={event => {
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            optionsRef.current[(index + (event.key === "ArrowDown" ? 1 : options.length - 1)) % options.length]?.focus();
          } else if (event.key === "Home") {
            event.preventDefault(); optionsRef.current[0]?.focus();
          } else if (event.key === "End") {
            event.preventDefault(); optionsRef.current[options.length - 1]?.focus();
          } else if (event.key === "Tab") {
            setOpen(false);
          }
        }}>
        <span className="truncate">{option.label}</span>
        {option.value === value && <Check className="size-4 shrink-0 text-blue-600" aria-hidden="true" />}
      </button>)}
    </div>}
  </div>;
}
