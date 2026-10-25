"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import BoardDeletionActions from "@/components/board/BoardDeletionActions";

/**
 * Template aditivo: disponibiliza os controles da Etapa 6 sobre o Kanban
 * principal sem substituir o AppShell ou o store do quadro.
 * O painel só aparece na rota / e depois da validação da sessão.
 */
export default function RootTemplate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <>
      {children}
      {pathname === "/" && <BoardDeletionActions />}
    </>
  );
}
