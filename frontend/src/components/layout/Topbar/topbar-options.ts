import type { Priority } from "@/types/board";

export const priorityOptions: Array<{ value: Priority | "todas"; label: string }> = [
  { value: "todas", label: "Todas" },
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" }
];
