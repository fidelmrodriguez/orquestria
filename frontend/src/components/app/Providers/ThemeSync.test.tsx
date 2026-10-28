import { render } from "@testing-library/react";
import { ThemeSync } from "./Providers";

let currentTheme: "light" | "dark" = "light";
jest.mock("@/store/board-store", () => ({
  useBoardStore: (select: (state: { theme: "light" | "dark" }) => unknown) => select({ theme: currentTheme })
}));

beforeEach(() => {
  currentTheme = "light";
  document.documentElement.classList.remove("dark");
});

afterEach(() => document.documentElement.classList.remove("dark"));

describe("sincronização global do tema", () => {
  it("aplica o tema escuro sem depender do AppShell", () => {
    currentTheme = "dark";
    render(<ThemeSync />);
    expect(document.documentElement).toHaveClass("dark");
  });

  it("acompanha as alterações e restaura o tema claro", () => {
    currentTheme = "dark";
    const { rerender } = render(<ThemeSync />);
    expect(document.documentElement).toHaveClass("dark");
    currentTheme = "light";
    rerender(<ThemeSync />);
    expect(document.documentElement).not.toHaveClass("dark");
  });
});
