"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { ToastProvider } from "@/components/feedback/ToastProvider/ToastProvider";
import { useBoardStore } from "@/store/board-store";

/** Mantém o tema sincronizado em TODAS as rotas, não só no dashboard. */
export function ThemeSync() {
  const theme = useBoardStore((state) => state.theme);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);
  return null;
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false
          }
        }
      })
  );

  return (
    <QueryClientProvider client={client}>
      <ToastProvider><ThemeSync />{children}</ToastProvider>
    </QueryClientProvider>
  );
}
