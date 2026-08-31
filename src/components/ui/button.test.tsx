// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./button";

describe("Button", () => {
  it("renders children and responds to clicks", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Salvar</Button>);

    const button = screen.getByRole("button", { name: "Salvar" });
    await userEvent.click(button);

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("não dispara clique quando desabilitado", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Salvar
      </Button>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it("renderiza como o elemento filho quando asChild", () => {
    render(
      <Button asChild>
        <a href="/tickets">Ver tickets</a>
      </Button>,
    );

    const link = screen.getByRole("link", { name: "Ver tickets" });
    expect(link).toHaveAttribute("href", "/tickets");
  });
});
