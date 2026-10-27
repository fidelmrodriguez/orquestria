"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";
import type { Comment, Member } from "@/types/board";

type TaskCommentsListProps = {
  comments: Comment[];
  members: Member[];
  fallbackMember?: Member;
  onDeleteComment: (id: string) => Promise<boolean>;
};

export function TaskCommentsList({ comments, members, fallbackMember, onDeleteComment }: TaskCommentsListProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  if (!comments.length) return (
    <div className="rounded-3xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400 dark:border-slate-700">
      Nenhum comentário registrado ainda.
    </div>
  );
  return <div className="space-y-3">
    {comments.map((comment) => {
      const author = members.find((item) => item.id === comment.authorId) || fallbackMember;
      return <div key={comment.id} className="rounded-3xl border border-slate-200 p-4 dark:border-slate-800">
        <div className="mb-3 flex items-center gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-950 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">{getInitials(author?.name || "User")}</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{author?.name || "User"}</p>
            <p className="text-xs text-slate-400">{formatDate(comment.createdAt)}</p>
          </div>
          <button type="button" onClick={() => setConfirmId(comment.id)} disabled={busyId !== null}
            aria-label="Excluir comentário" title="Excluir comentário"
            className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-300 dark:hover:bg-red-950/30"><Trash2 className="size-4" /></button>
        </div>
        <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-600 dark:text-slate-300">{comment.message}</p>
        {confirmId === comment.id && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm dark:border-red-900 dark:bg-red-950/30">
          <p className="font-semibold text-red-800 dark:text-red-200">Excluir este comentário definitivamente?</p>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={() => setConfirmId(null)} disabled={busyId !== null} className="rounded-lg border border-slate-300 px-3 py-1.5">Cancelar</button>
            <button type="button" disabled={busyId !== null} onClick={async () => {
              setBusyId(comment.id);
              try { if (await onDeleteComment(comment.id)) setConfirmId(null); }
              finally { setBusyId(null); }
            }} className="rounded-lg bg-red-700 px-3 py-1.5 font-semibold text-white disabled:opacity-50">{busyId ? "Excluindo..." : "Excluir"}</button>
          </div>
        </div>}
      </div>;
    })}
  </div>;
}
