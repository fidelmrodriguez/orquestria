import { render, screen } from "@testing-library/react";
import { SafeSelect } from "./SafeSelect";

describe("SafeSelect em telas pequenas", () => {
  it("mantém espaço entre a seta e a borda, sem alterar a seleção", () => {
    const onChange = jest.fn();
    const { container } = render(<SafeSelect label="Filtrar por prioridade"
      value="todas"
      options={[{ value: "todas", label: "Todas" }, { value: "alta", label: "Alta" }]}
      onChange={onChange} className="!px-3" />);
    const trigger = screen.getByRole("combobox", { name: "Filtrar por prioridade" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(container.querySelector("svg" )).toHaveClass("mr-1");
    expect(onChange).not.toHaveBeenCalled();
  });
});
