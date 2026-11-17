"use client";

import { type ReactNode } from "react";
import ApiReadinessGate from "@/components/system/ApiReadinessGate";

/**
 * Gate global para login, cadastro, Kanban e /gerenciar.
 * Mantém a verificação de disponibilidade antes das telas da aplicação.
 */
export default function RootTemplate({ children }: { children: ReactNode }) {
  return (
    <ApiReadinessGate>
      {children}
    </ApiReadinessGate>
  );
}
