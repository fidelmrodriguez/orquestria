/** Impede requisições de movimentação sem alteração efetiva de coluna. */
export function shouldMoveTask(sourceColumnId: string, destinationColumnId: string | null | undefined): boolean {
  return Boolean(destinationColumnId && sourceColumnId !== destinationColumnId);
}
