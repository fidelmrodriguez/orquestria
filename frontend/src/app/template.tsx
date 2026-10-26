"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import SidebarManagementLink from "@/components/navigation/SidebarManagementLink";
import ApiReadinessGate from "@/components/system/ApiReadinessGate";

/**
 * Gate global para login, cadastro, Kanban e /gerenciar.
 * Conserva o menu Gerenciar itens já integrado à sidebar da Etapa 6.
 */
export default function RootTemplate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <ApiReadinessGate>
      {children}
      {pathname === "/" && <SidebarManagementLink />}
    </ApiReadinessGate>
  );
}
