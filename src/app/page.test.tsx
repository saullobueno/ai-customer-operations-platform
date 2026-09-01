// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { getCurrentSession } = vi.hoisted(() => ({ getCurrentSession: vi.fn() }));
vi.mock("@/server/auth/session", () => ({ getCurrentSession }));

const { redirect } = vi.hoisted(() => ({ redirect: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect }));

const { default: Home } = await import("./page");

describe("Home", () => {
  it("mostra a landing com CTAs de entrar/criar conta para visitante anônimo", async () => {
    getCurrentSession.mockResolvedValueOnce(null);

    render(await Home());

    expect(
      screen.getByRole("heading", { name: /ai customer operations platform/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /criar conta/i })).toHaveAttribute("href", "/sign-up");
    expect(screen.getByRole("link", { name: /entrar/i })).toHaveAttribute("href", "/sign-in");
    expect(redirect).not.toHaveBeenCalled();
  });

  it("redireciona para /inbox quando já há sessão com organização ativa", async () => {
    getCurrentSession.mockResolvedValueOnce({
      session: { activeOrganizationId: "org_1" },
      user: {},
    });

    await Home();

    expect(redirect).toHaveBeenCalledWith("/inbox");
  });
});
