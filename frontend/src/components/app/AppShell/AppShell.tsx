"use client";

import { useEffect, useState } from "react";
import { RemoteOperationOverlay } from "@/components/feedback/RemoteOperationOverlay/RemoteOperationOverlay";
import { BoardView } from "@/components/board/BoardView/BoardView";
import { LoginScreen } from "@/components/auth/LoginScreen/LoginScreen";
import { NewTaskPanel } from "@/components/tasks/NewTaskPanel/NewTaskPanel";
import { Sidebar } from "@/components/layout/Sidebar/Sidebar";
import { TaskDetailPanel } from "@/components/board/TaskDetailPanel/TaskDetailPanel";
import { Topbar } from "@/components/layout/Topbar/Topbar";
import { useBootstrapBoard } from "@/hooks/use-bootstrap-board";
import { useLiveSync } from "@/hooks/use-live-sync";
import { useBoardStore } from "@/store/board-store";
import { isApiMode } from "@/lib/remote-board";
import { getAuthToken } from "@/lib/auth-client";

export function AppShell() {
  const currentUser = useBoardStore((state) => state.currentUser);
  const theme = useBoardStore((state) => state.theme);
  const remoteReady = useBoardStore((state) => state.remoteReady);
  const remoteLoading = useBoardStore((state) => state.remoteLoading);
  const remoteActionLabel = useBoardStore((state) => state.remoteActionLabel);
  const remoteError = useBoardStore((state) => state.remoteError);
  const reloadRemote = useBoardStore((state) => state.reloadRemote);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [newTaskColumnId, setNewTaskColumnId] = useState<string | undefined>(undefined);
  const openNewTask = (columnId?: string) => { setNewTaskColumnId(columnId); setNewTaskOpen(true); };
  const bootstrap = useBootstrapBoard(Boolean(currentUser));
  useLiveSync(Boolean(currentUser));

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    if (!isApiMode) return;
    const validateSession = () => {
      if (!getAuthToken() && useBoardStore.getState().currentUser) useBoardStore.getState().logout();
    };
    validateSession();
    window.addEventListener("orquestria:auth-expired", validateSession);
    return () => window.removeEventListener("orquestria:auth-expired", validateSession);
  }, []);

  if (!currentUser) {
    return <LoginScreen />;
  }

  if (isApiMode && !remoteReady) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-slate-800 dark:bg-slate-950 dark:text-slate-100">
        <div className="max-w-lg space-y-4 rounded-3xl border border-slate-200 bg-white p-7 shadow-card dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-xl font-semibold">Conectando ao Orquestria</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {remoteError || "Consultando workspaces, projetos e tarefas na API Java..."}
          </p>
          {remoteError && <button type="button" className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-slate-950" onClick={() => {
            void bootstrap.refetch();
          }}>Tentar novamente</button>}
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950 dark:bg-slate-950 dark:text-white lg:flex lg:h-dvh lg:overflow-hidden">
      {/* A sidebar participa do layout: ao recolher, a área do quadro cresce. */}
      <div className={`${sidebarCollapsed ? "lg:w-[76px]" : "lg:w-72"} hidden shrink-0 transition-[width] duration-200 ease-out lg:block lg:h-dvh`}>
        <Sidebar collapsed={sidebarCollapsed} onToggleCollapsed={() => setSidebarCollapsed(value => !value)} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col pt-[84px] sm:pt-[92px] lg:pt-0 lg:h-dvh lg:min-h-0">
        <Topbar
          mobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={() => setMobileMenuOpen((value) => !value)}
          onNewTask={() => { setMobileMenuOpen(false); openNewTask(); }}
        />

        <main className="min-h-0 flex-1 lg:overflow-hidden">
          <div className="flex min-h-0 flex-col p-4 lg:h-full">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              {isApiMode && remoteError && (
                <div role="alert" className="mb-4 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
                  <strong>Não foi possível salvar ou atualizar no PostgreSQL.</strong> {remoteError}
                  <button type="button" className="ml-2 underline" onClick={() => void reloadRemote()}>Recarregar dados</button>
                </div>
              )}
              {!isApiMode && bootstrap.isLoading && (
                <div className="mb-4 rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-card dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
                  Carregando tarefas iniciais do workspace...
                </div>
              )}
              {!isApiMode && bootstrap.isError && (
                <div className="mb-4 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-card dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200">
                  A fonte de dados não respondeu agora. O painel continua funcionando com os dados locais salvos.
                </div>
              )}
              <BoardView onNewTask={openNewTask} />
            </div>
          </div>
        </main>
      </div>

      <TaskDetailPanel />
      <NewTaskPanel key={newTaskColumnId || "default"} initialColumnId={newTaskColumnId} open={newTaskOpen} onClose={() => setNewTaskOpen(false)} />
      {isApiMode && <RemoteOperationOverlay open={remoteLoading} label={remoteActionLabel} />}
    </div>
  );
}
