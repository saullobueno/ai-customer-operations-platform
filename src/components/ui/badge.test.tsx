// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge";

describe("Badge", () => {
  it("renderiza o texto e aplica a variante solicitada", () => {
    render(<Badge variant="destructive">SLA vencido</Badge>);

    const badge = screen.getByText("SLA vencido");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("bg-destructive");
  });
});
