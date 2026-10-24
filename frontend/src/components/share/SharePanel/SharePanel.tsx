"use client";

import { Copy, Link2, Shield, X } from "lucide-react";
import { useMemo } from "react";
import { useToast } from "@/components/feedback/ToastProvider/ToastProvider";
import { selectActiveProject, selectActiveWorkspace, useBoardStore } from "@/store/board-store";

type SharePanelProps = {
  open: boolean;
  onClose: () => void;
};

export function SharePanel({ open, onClose }: SharePanelProps) {
  const workspace = useBoardStore(selectActiveWorkspace);
  const project = useBoardStore(selectActiveProject);
  const { notify } = useToast();
  const link = useMemo(() => {
    if (typeof window === "undefined" || !project) return "";
    return `${window.location.origin}/?workspace=${workspace?.id || ""}&project=${project.id}`;
  }, [project, workspace]);

  if (!open || !workspace || !project) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      notify("Link copiado para a área de transferência.", "success");
    } catch {
      notify("Não foi possível copiar automaticamente. Selecione o link manualmente.", "error");
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md border-l border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-950">
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Compartilhamento</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950 dark:text-white">Acesso ao projeto</h2>
          </div>
          <button type="button" onClick={onClose} className="icon-button" aria-label="Fechar painel">
            <X className="size-5" />
          </button>
        </header>

        <div className="space-y-5 p-5">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <Link2 className="size-4" /> Link do projeto
            </div>
            <div className="flex gap-2">
              <input readOnly value={link} className="mini-field" aria-label="Link compartilhável" />
              <button type="button" onClick={copy} className="icon-button" aria-label="Copiar link">
                <Copy className="size-4" />
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
              <Shield className="size-4" /> Permissões
            </div>
            <div className="space-y-3">
              {workspace.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-900">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{member.name}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{member.email}</p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold capitalize text-slate-500 dark:bg-slate-950 dark:text-slate-300">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
