"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import SidebarManagementLink from "@/components/navigation/SidebarManagementLink";

/** Adiciona um item de navegação à sidebar do Kanban, sem botão flutuante. */
export default function RootTemplate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <>
      {children}
      {pathname === "/" && <SidebarManagementLink />}
    </>
  );
}
