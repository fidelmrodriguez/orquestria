"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { LogOut, X } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar/Sidebar";
import { SidebarBrand } from "@/components/layout/Sidebar/SidebarBrand";
import { ThemeToggle } from "./ThemeToggle";
import type { Priority, Workspace } from "@/types/board";
import { TopbarFilters } from "./TopbarFilters";
import { getInitials } from "@/lib/utils";
import type { Member } from "@/types/board";

type MobileWorkspaceMenuProps = {
  open: boolean;
  currentUser: Member | null;
  workspace?: Workspace | null;
  projectId?: string | null;
  priorityFilter: Priority | "todas";
  assigneeFilter: string | "todos";
  onNavigate: () => void;
  onLogout: () => void;
  theme: "light" | "dark";
  onChangeTheme: (theme: "light" | "dark") => void;
  onPriorityChange: (value: Priority | "todas") => void;
  onAssigneeChange: (value: string | "todos") => void;
};

/** O portal impede que o backdrop-blur do topbar limite a área do menu fixo. */
export function MobileWorkspaceMenu({ open, currentUser, workspace, projectId, priorityFilter, assigneeFilter, onNavigate, onLogout, theme, onChangeTheme, onPriorityChange, onAssigneeChange }: MobileWorkspaceMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // No Chrome Android, 100vh pode incluir a área sob as barras do navegador.
  // Medimos a viewport *visível* para posicionar o menu também com teclado,
  // zoom, rotação e barras do navegador expandindo/recolhendo.
  const [visibleViewport, setVisibleViewport] = useState<{
    top: number; left: number; width: number; height: number;
  } | null>(null);

  useEffect(() => {
    if (!open) return;

    const visualViewport = window.visualViewport;
    if (!visualViewport) {
      setVisibleViewport(null); // Fallback CSS: 100dvh (ou 100vh).
      return;
    }

    const updateBounds = () => {
      const next = {
        top: visualViewport.offsetTop,
        left: visualViewport.offsetLeft,
        width: visualViewport.width,
        height: visualViewport.height
      };
      setVisibleViewport((previous) =>
        previous && previous.top === next.top && previous.left === next.left &&
        previous.width === next.width && previous.height === next.height ? previous : next
      );
    };

    updateBounds();
    visualViewport.addEventListener("resize", updateBounds);
    visualViewport.addEventListener("scroll", updateBounds);
    window.addEventListener("resize", updateBounds);
    window.addEventListener("orientationchange", updateBounds);
    return () => {
      visualViewport.removeEventListener("resize", updateBounds);
      visualViewport.removeEventListener("scroll", updateBounds);
      window.removeEventListener("resize", updateBounds);
      window.removeEventListener("orientationchange", updateBounds);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onNavigate();
        return;
      }
      if (event.key !== "Tab" || !menuRef.current) return;

      const focusable = Array.from(menuRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )).filter(element => !element.hasAttribute("hidden") && element.getAttribute("aria-hidden") !== "true");
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && (document.activeElement === first || !menuRef.current.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !menuRef.current.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    const desktop = window.matchMedia?.("(min-width: 1024px)");
    const onDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) onNavigate();
    };
    if (desktop?.matches) onNavigate();
    desktop?.addEventListener("change", onDesktop);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      desktop?.removeEventListener("change", onDesktop);
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [open, onNavigate]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={menuRef}
      id="orquestria-mobile-navigation"
      role="dialog"
      aria-modal="true"
      aria-label="Navegação mobile"
      className="mobile-navigation-dialog fixed inset-0 z-[100] grid min-w-0 overflow-hidden bg-white px-4 pt-4 dark:bg-slate-950 lg:hidden"
      style={visibleViewport ? {
        top: visibleViewport.top,
        left: visibleViewport.left,
        width: visibleViewport.width,
        height: visibleViewport.height
      } : undefined}
    >
      <div className="mb-4 flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Menu</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">Workspaces, projetos e preferências</p>
        </div>
        <button type="button" ref={closeRef} onClick={onNavigate} aria-label="Fechar menu" className="icon-button">
          <X className="size-4" />
        </button>
      </div>

      <div className="mobile-navigation-scroll min-h-0 min-w-0 w-full overflow-x-hidden overflow-y-auto overscroll-contain">
        <div className="mb-4"><SidebarBrand /></div>
        {currentUser && (
          <div className="mb-4 flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900" aria-label={`Conectado como ${currentUser.name}`}>
            <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-950 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">
              {getInitials(currentUser.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Conectado como</p>
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white" title={currentUser.name}>{currentUser.name}</p>
            </div>
          </div>
        )}
        <Sidebar onNavigate={onNavigate} dropdown showBrand={false} />
        <div className="mt-4 grid gap-2 border-t border-slate-200 pt-4 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-2">
            <TopbarFilters
              workspace={workspace}
              projectId={projectId}
              priorityFilter={priorityFilter}
              assigneeFilter={assigneeFilter}
              onPriorityChange={onPriorityChange}
              onAssigneeChange={onAssigneeChange}
              priorityClassName="min-w-0 w-full"
              assigneeClassName="min-w-0 w-full"
            />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-2 dark:border-slate-800">
            <span className="px-2 text-sm font-medium text-slate-600 dark:text-slate-300">Tema</span>
            <ThemeToggle theme={theme} onChangeTheme={onChangeTheme} className="icon-button" />
          </div>
        </div>
      </div>
      <footer className="min-w-0 border-t border-slate-200 bg-white pt-3 pb-[max(12px,env(safe-area-inset-bottom))] dark:border-slate-800 dark:bg-slate-950" data-testid="mobile-navigation-footer">
        <button type="button" onClick={onLogout} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-red-600 dark:border-slate-800">
          <LogOut className="size-4" /> Sair
        </button>
      </footer>
    </div>,
    document.body
  );
}
