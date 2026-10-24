"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getInitialBoardData } from "@/lib/data-source";
import { isApiMode, loadRemoteBoard } from "@/lib/remote-board";
import { useBoardStore } from "@/store/board-store";

export function useBootstrapBoard(enabled: boolean) {
  const hydrateFromSource = useBoardStore((state) => state.hydrateFromSource);
  const setRemoteBoard = useBoardStore((state) => state.setRemoteBoard);
  const setRemoteError = useBoardStore((state) => state.setRemoteError);
  const currentUser = useBoardStore((state) => state.currentUser);
  const bootstrapped = useBoardStore((state) => state.bootstrapped);
  const remoteReady = useBoardStore((state) => state.remoteReady);

  const query = useQuery({
    queryKey: isApiMode ? ["api-java", currentUser?.id] : ["data-source", "board"],
    queryFn: async () => {
      if (isApiMode) {
        if (!currentUser) throw new Error("Usuário demonstrativo não encontrado.");
        return { kind: "remote" as const, workspaces: await loadRemoteBoard(currentUser) };
      }
      const data = await getInitialBoardData();
      return { kind: "demo" as const, ...data };
    },
    enabled: enabled && (isApiMode ? !remoteReady : !bootstrapped),
    staleTime: 1000 * 60 * 5,
    retry: 1
  });

  useEffect(() => {
    if (!query.data) return;
    if (query.data.kind === "remote") setRemoteBoard(query.data.workspaces);
    else hydrateFromSource(query.data.todos, query.data.users);
  }, [hydrateFromSource, query.data, setRemoteBoard]);

  useEffect(() => {
    if (isApiMode && query.isError) {
      setRemoteError(query.error instanceof Error ? query.error.message : "Falha de conexão com a API Java.");
    }
  }, [query.isError, query.error, setRemoteError]);

  return query;
}
