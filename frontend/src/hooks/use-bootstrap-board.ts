"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getInitialBoardData } from "@/lib/data-source";
import { useBoardStore } from "@/store/board-store";

export function useBootstrapBoard(enabled: boolean) {
  const hydrateFromSource = useBoardStore((state) => state.hydrateFromSource);
  const bootstrapped = useBoardStore((state) => state.bootstrapped);

  const query = useQuery({
    queryKey: ["data-source", "board"],
    queryFn: getInitialBoardData,
    enabled: enabled && !bootstrapped,
    staleTime: 1000 * 60 * 5,
    retry: 1
  });

  useEffect(() => {
    if (query.data) {
      hydrateFromSource(query.data.todos, query.data.users);
    }
  }, [hydrateFromSource, query.data]);

  return query;
}
