"use client";

import { useEffect, useRef } from "react";
import { Cloud, LoaderCircle } from "lucide-react";

type RemoteOperationOverlayProps = {
  open: boolean;
  label: string;
};

/** Bloqueia interações enquanto a API confirma uma gravação ou atualização. */
export function RemoteOperationOverlay({ open, label }: RemoteOperationOverlayProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    modalRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-[3px] dark:bg-slate-950/75">
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="remote-operation-title"
        aria-describedby="remote-operation-description"
        aria-busy="true"
        tabIndex={-1}
        onKeyDown={(event) => {
          // Não permitir navegação por teclado para controles por trás do overlay.
          if (event.key === "Tab") event.preventDefault();
        }}
        className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white px-7 py-9 text-center shadow-2xl outline-none dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
          <LoaderCircle className="h-8 w-8 motion-safe:animate-spin" aria-hidden="true" />
        </div>
        <h2 id="remote-operation-title" className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
          {label}
        </h2>
        <p id="remote-operation-description" className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">
          Aguarde enquanto confirmamos a operação no servidor. Não é necessário clicar novamente.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Cloud className="h-4 w-4" aria-hidden="true" />
          Java + PostgreSQL
        </div>
      </div>
    </div>
  );
}
