"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "info" | "error";

type Toast = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  notify: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string, type: ToastType = "info") => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3600);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[90] flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-3 sm:bottom-4 sm:top-auto">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role={toast.type === "error" ? "alert" : "status"}
            className={cn(
              "flex items-start gap-3 rounded-2xl border bg-white/95 p-4 text-sm shadow-soft backdrop-blur dark:bg-slate-950/95",
              toast.type === "success" && "border-emerald-200 text-emerald-900 dark:border-emerald-900 dark:text-emerald-100",
              toast.type === "info" && "border-slate-200 text-slate-800 dark:border-slate-800 dark:text-slate-100",
              toast.type === "error" && "border-red-200 text-red-900 dark:border-red-900 dark:text-red-100"
            )}
          >
            {toast.type === "success" ? <CheckCircle2 className="mt-0.5 size-5" /> : <Info className="mt-0.5 size-5" />}
            <p className="flex-1 leading-5">{toast.message}</p>
            <button
              type="button"
              onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
              className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              aria-label="Fechar notificação"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast deve ser usado dentro de ToastProvider.");
  }

  return context;
}
