"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Trash2 } from "lucide-react";
import { getAuthToken, restoreAuthSession } from "@/lib/auth-client";
import { apiRequest, deleteActionPath, deleteOperation, type DeleteTarget } from "@/lib/kanban-deletion";
import { useBoardStore } from "@/store/board-store";
import { useToast } from "@/components/feedback/ToastProvider/ToastProvider";
import { useAccessiblePanel } from "@/hooks/use-accessible-panel";

type Props = {
  target: DeleteTarget;
  name: string;
  impact: string;
  label?: string;
  disabledReason?: string;
  iconOnly?: boolean;
  className?: string;
};

const API_BASE = (process.env.NEXT_PUBLIC_ORQUESTRIA_API_URL || "").trim().replace(/\/+$/, "");

/** Exclusão contextual por ID real, com a mesma API da página /gerenciar. */
export default function QuickDeleteAction({ target, name, impact, label = "Excluir", disabledReason, iconOnly = false, className }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [typed, setTyped] = useState("");
  const [error, setError] = useState("");
  const [guest, setGuest] = useState(false);
  const [validating, setValidating] = useState(false);
  const reloadRemote = useBoardStore(state => state.reloadRemote);
  const setSelectedTask = useBoardStore(state => state.setSelectedTask);
  const { notify } = useToast();
  const mustType = guest || target.kind === "project" || target.kind === "workspace";
  const { panelRef, onKeyDown } = useAccessiblePanel<HTMLElement>(open, () => { if (!busy) setOpen(false); }, mustType ? 'input[autocomplete="off"]' : undefined);

  async function openConfirmation() {
    if (disabledReason || validating || busy) return;
    setValidating(true); setError("");
    try {
      const user = await restoreAuthSession();
      if (!user || !getAuthToken()) throw new Error("Sua sessão expirou. Entre novamente.");
      setGuest(user.accountType === "GUEST");
      setTyped(""); setOpen(true);
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : "Não foi possível confirmar sua sessão.", "error");
    } finally { setValidating(false); }
  }

  async function confirm() {
    if (busy || !open || (mustType && typed !== "EXCLUIR")) return;
    setBusy(true); setError("");
    try {
      const token = getAuthToken();
      if (!token) throw new Error("Sua sessão expirou.");
      await apiRequest(API_BASE, deleteActionPath(target), token, "POST", deleteOperation(target));
      setOpen(false);
      if (target.kind === "task") setSelectedTask(null);
      await reloadRemote();
      notify(`${name} excluído(a) com sucesso.`, "success");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "A API recusou a exclusão.");
    } finally { setBusy(false); }
  }

  return <>
    <button type="button" title={disabledReason || label} aria-label={label} disabled={Boolean(disabledReason) || validating || busy}
      onClick={() => void openConfirmation()}
      className={className || "inline-flex items-center justify-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-35 dark:text-red-300 dark:hover:bg-red-950/40"}>
      <Trash2 className="size-4 shrink-0" />{!iconOnly && <span>{validating ? "Verificando..." : label}</span>}
    </button>
    {open && typeof document !== "undefined" && createPortal(
      <div className="fixed inset-0 z-[200] grid place-items-center bg-slate-950/75 p-4" onMouseDown={e => { if (e.target === e.currentTarget && !busy) setOpen(false); }}>
        <section ref={panelRef} onKeyDown={event => { event.stopPropagation(); onKeyDown(event); }} tabIndex={-1} role="alertdialog" aria-modal="true" aria-labelledby="orq-delete-heading" aria-describedby="orq-delete-impact" className="w-full max-w-md rounded-2xl bg-white p-6 text-slate-950 shadow-2xl outline-none dark:bg-slate-900 dark:text-white">
          <h2 id="orq-delete-heading" className="text-xl font-bold">Confirmar exclusão</h2>
          <p className="mt-3 text-sm">Você está prestes a excluir <strong>{name}</strong>.</p>
          <p id="orq-delete-impact" className="mt-2 text-sm text-red-700 dark:text-red-300">{impact}</p>
          {mustType && <label className="mt-4 block text-sm">Digite <strong>EXCLUIR</strong> para confirmar
            <input autoFocus autoComplete="off" value={typed} disabled={busy} onChange={e => setTyped(e.target.value)}
              className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" />
          </label>}
          {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" disabled={busy} onClick={() => { setOpen(false); setError(""); }} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button>
            <button type="button" disabled={busy || (mustType && typed !== "EXCLUIR")} onClick={() => void confirm()}
              className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{busy ? "Excluindo..." : "Excluir definitivamente"}</button>
          </div>
        </section>
      </div>, document.body)}
  </>;
}
