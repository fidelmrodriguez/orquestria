"use client";

import { useEffect, useState } from "react";
import { ActivityFeed } from "@/components/activity/ActivityFeed/ActivityFeed";
import { BoardView } from "@/components/board/BoardView/BoardView";
import { LoginScreen } from "@/components/auth/LoginScreen/LoginScreen";
import { NewTaskPanel } from "@/components/tasks/NewTaskPanel/NewTaskPanel";
import { SharePanel } from "@/components/share/SharePanel/SharePanel";
import { Sidebar } from "@/components/layout/Sidebar/Sidebar";
import { TaskDetailPanel } from "@/components/board/TaskDetailPanel/TaskDetailPanel";
import { Topbar } from "@/components/layout/Topbar/Topbar";
import { useBootstrapBoard } from "@/hooks/use-bootstrap-board";
import { useLiveSync } from "@/hooks/use-live-sync";
import { useBoardStore } from "@/store/board-store";

export function AppShell() {
  const currentUser = useBoardStore((state) => state.currentUser);
  const theme = useBoardStore((state) => state.theme);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const bootstrap = useBootstrapBoard(Boolean(currentUser));
  useLiveSync(Boolean(currentUser));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  if (!currentUser) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="fixed inset-y-0 left-0 z-50 hidden w-72 lg:block">
        <Sidebar />
      </div>

      <Topbar
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen((value) => !value)}
        onNewTask={() => setNewTaskOpen(true)}
        onShare={() => setShareOpen(true)}
      />

      <main className="min-h-screen pt-[144px] lg:ml-72 lg:pt-[92px]">
        <div className="flex gap-5 p-4 sm:p-6">
          <div className="min-w-0 flex-1">
            {bootstrap.isLoading && (
              <div className="mb-4 rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-card dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                Carregando tarefas iniciais do workspace...
              </div>
            )}
            {bootstrap.isError && (
              <div className="mb-4 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-card dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
                A fonte de dados não respondeu agora. O painel continua funcionando com os dados locais salvos.
              </div>
            )}
            <BoardView onNewTask={() => setNewTaskOpen(true)} />
          </div>
          <ActivityFeed />
        </div>
      </main>

      <TaskDetailPanel />
      <NewTaskPanel open={newTaskOpen} onClose={() => setNewTaskOpen(false)} />
      <SharePanel open={shareOpen} onClose={() => setShareOpen(false)} />
    </div>
  );
}
