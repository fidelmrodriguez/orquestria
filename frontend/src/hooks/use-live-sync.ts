"use client";

import { useEffect, useRef } from "react";
import { useBoardStore, type BoardSnapshot } from "@/store/board-store";

const CHANNEL = "orquestria-live-sync";

function getSnapshot(): BoardSnapshot {
  const state = useBoardStore.getState();

  return {
    workspaces: state.workspaces,
    activeWorkspaceId: state.activeWorkspaceId,
    activeProjectId: state.activeProjectId,
    currentUser: state.currentUser,
    theme: state.theme
  };
}

export function useLiveSync(enabled: boolean) {
  const applyExternalSnapshot = useBoardStore((state) => state.applyExternalSnapshot);
  const applying = useRef(false);

  useEffect(() => {
    if (!enabled || typeof window === "undefined" || !("BroadcastChannel" in window)) return;

    const channel = new BroadcastChannel(CHANNEL);

    channel.onmessage = (event: MessageEvent<{ source: string; snapshot: BoardSnapshot }>) => {
      if (event.data?.source !== CHANNEL || !event.data.snapshot) return;
      applying.current = true;
      applyExternalSnapshot(event.data.snapshot);
      window.setTimeout(() => {
        applying.current = false;
      }, 50);
    };

    let last = JSON.stringify(getSnapshot());
    const unsubscribe = useBoardStore.subscribe(() => {
      if (applying.current) return;

      const snapshot = getSnapshot();
      const serialized = JSON.stringify(snapshot);
      if (serialized === last) return;

      last = serialized;
      channel.postMessage({ source: CHANNEL, snapshot });
    });

    return () => {
      unsubscribe();
      channel.close();
    };
  }, [applyExternalSnapshot, enabled]);
}
