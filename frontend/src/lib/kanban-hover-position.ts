/**
 * Área de inserção durante o arrasto, medida em relação aos cartões originais.
 * Assim, o espaço animado não altera o alvo enquanto os cartões se deslocam.
 */
export type HoverCard = { top: number; bottom: number };

/**
 * Dentro da própria coluna, a região central de um cartão tem prioridade:
 * - arrasto de cima para baixo: posiciona DEPOIS do cartão;
 * - arrasto de baixo para cima: posiciona ANTES do cartão.
 * Somente uma faixa estreita junto à borda permite a alternativa oposta.
 * Entre colunas, o meio do cartão divide antes/depois.
 */
export function insertionFromCardHover(
  cards: HoverCard[],
  pointerY: number,
  originalVisibleIndex: number | null
): number {
  for (let index = 0; index < cards.length; index++) {
    const card = cards[index];
    const height = Math.max(1, card.bottom - card.top);
    const edge = Math.min(20, height * 0.15);
    if (pointerY < card.top) return index;
    if (pointerY <= card.bottom) {
      if (originalVisibleIndex !== null) {
        // Card vindo de cima: basta sobrepor um pouco o seguinte para inseri-lo abaixo.
        if (index >= originalVisibleIndex) return pointerY >= card.top + edge ? index + 1 : index;
        // Card vindo de baixo: basta sobrepor o anterior para inseri-lo acima.
        return pointerY <= card.bottom - edge ? index : index + 1;
      }
      return pointerY >= card.top + height / 2 ? index + 1 : index;
    }
  }
  return cards.length;
}
