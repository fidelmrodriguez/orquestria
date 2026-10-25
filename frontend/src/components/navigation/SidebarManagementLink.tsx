"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Entrada de navegação não destrutiva: não modifica o AppShell nem os seus estados.
 * Localiza a sidebar renderizada e monta ali um link real para /gerenciar.
 * Quando o usuário está na tela de login, a sidebar inexiste e o link não aparece.
 * O slot é removido integralmente ao desmontar o componente.
 */
function findSidebar(): HTMLElement | null {
  const candidates = Array.from(document.querySelectorAll<HTMLElement>("aside, nav, [class*='sidebar'], [class*='Sidebar']"));
  const matches = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    const text = el.textContent?.toLocaleUpperCase("pt-BR") ?? "";
    return r.width >= 190 && r.width <= 420 && r.height >= 320 && r.left < 80 &&
      text.includes("WORKSPACES") && text.includes("PROJETOS");
  };
  for (const candidate of candidates) if (matches(candidate)) return candidate;

  // Fallback restrito para aplicações cujo AppShell usa div em vez de aside.
  const headings = Array.from(document.querySelectorAll<HTMLElement>("h1,h2,h3,h4,p,span,div"));
  const heading = headings.find(el => el.childElementCount === 0 && el.textContent?.trim().toLocaleUpperCase("pt-BR") === "WORKSPACES");
  let parent = heading?.parentElement ?? null;
  for (let i = 0; i < 9 && parent; i++, parent = parent.parentElement) {
    if (matches(parent)) return parent;
  }
  return null;
}

export default function SidebarManagementLink() {
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    let active = true;
    let target: HTMLElement | null = null;
    let frame = 0;
    const mount = () => {
      frame = 0;
      if (!active) return;
      if (target?.isConnected) return;
      target = null;
      const sidebar = findSidebar();
      if (!sidebar) return;
      const host = document.createElement("div");
      host.dataset.orquestriaManagementSlot = "true";
      host.className = "shrink-0 px-5 py-3";

      // Insere acima do último bloco (geralmente o card Equipe), mantendo
      // a opção integrada ao fluxo de navegação e não no overlay do quadro.
      const children = Array.from(sidebar.children);
      const teamBlock = children.find(el => (el.textContent ?? "").trim().startsWith("Equipe"));
      if (teamBlock) sidebar.insertBefore(host, teamBlock);
      else sidebar.appendChild(host);
      target = host;
      setSlot(host);
    };
    const scheduleMount = () => {
      if (!frame && !target?.isConnected) frame = window.requestAnimationFrame(mount);
    };
    mount();
    const observer = new MutationObserver(scheduleMount);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      active = false;
      observer.disconnect();
      if (frame) window.cancelAnimationFrame(frame);
      target?.remove();
    };
  }, []);

  if (!slot) return null;
  return createPortal(
    <nav aria-label="Gerenciamento do Kanban" className="border-t border-slate-200 pt-3 dark:border-slate-700">
      <p className="mb-2 text-xs font-semibold uppercase tracking-[.18em] text-slate-400">Gerenciamento</p>
      <a href="/gerenciar" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 dark:text-slate-200 dark:hover:bg-slate-800">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 7h16M10 11v7M14 11v7M7 7l1 13h8l1-13M9 7V4h6v3" />
        </svg>
        Gerenciar itens
      </a>
    </nav>,
    slot
  );
}
