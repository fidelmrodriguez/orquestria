import { insertionFromCardHover } from "./kanban-hover-position";

const cards = [
  { top: 200, bottom: 380 },
  { top: 392, bottom: 572 },
  { top: 584, bottom: 764 }
];

describe("inserção intuitiva ao passar o ponteiro sobre um cartão", () => {
  it("põe a primeira tarefa depois da segunda sem exigir o vão entre cartões", () => {
    // O cartão de origem foi retirado: o índice inicial na lista restante é zero.
    expect(insertionFromCardHover(cards, 230, 0)).toBe(1);
    expect(insertionFromCardHover(cards, 420, 0)).toBe(2);
    expect(insertionFromCardHover(cards, 610, 0)).toBe(3);
  });
  it("permite inserir antes usando a pequena faixa superior", () => {
    expect(insertionFromCardHover(cards, 205, 0)).toBe(0);
    expect(insertionFromCardHover(cards, 393, 0)).toBe(1);
  });
  it("ao arrastar de baixo para cima, abre espaço antes do cartão sob o ponteiro", () => {
    expect(insertionFromCardHover(cards, 320, 3)).toBe(0);
    expect(insertionFromCardHover(cards, 455, 3)).toBe(1);
    expect(insertionFromCardHover(cards, 757, 3)).toBe(3);
  });
  it("usa a metade do cartão quando a tarefa vem de outra coluna", () => {
    expect(insertionFromCardHover(cards, 280, null)).toBe(0);
    expect(insertionFromCardHover(cards, 310, null)).toBe(1);
    expect(insertionFromCardHover(cards, 490, null)).toBe(2);
  });
  it("aceita o começo, os espaços vazios e o final da coluna", () => {
    expect(insertionFromCardHover(cards, 80, 0)).toBe(0);
    expect(insertionFromCardHover(cards, 385, 0)).toBe(1);
    expect(insertionFromCardHover(cards, 999, 0)).toBe(3);
    expect(insertionFromCardHover([], 300, null)).toBe(0);
  });
  it("não oscila por causa de deslocamentos visuais: usa as âncoras originais", () => {
    const anchored = cards.map(card => ({ ...card }));
    expect(insertionFromCardHover(anchored, 440, 0)).toBe(2);
    // O espaço reservado move os cartões visualmente; os retângulos de referência
    // permanecem estáveis e a posição calculada não muda.
    expect(insertionFromCardHover(anchored, 440, 0)).toBe(2);
  });
});
