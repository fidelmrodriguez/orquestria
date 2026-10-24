import { LogOut } from "lucide-react";
import { getInitials } from "@/lib/utils";
import type { Member } from "@/types/board";

type UserMenuProps = {
  currentUser: Member | null;
  onLogout: () => void;
};

export function UserMenu({ currentUser, onLogout }: UserMenuProps) {
  return (
    <div className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-1.5 dark:border-slate-800 dark:bg-slate-900 md:flex">
      <div className="grid size-8 place-items-center rounded-full bg-slate-950 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">
        {getInitials(currentUser?.name || "User")}
      </div>
      <span className="max-w-24 truncate text-sm font-medium text-slate-700 dark:text-slate-200">{currentUser?.name || "User"}</span>
      <button type="button" onClick={onLogout} className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-100" aria-label="Sair">
        <LogOut className="size-4" />
      </button>
    </div>
  );
}
