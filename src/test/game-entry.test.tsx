import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { config } from "@/model/config";
import { GameEntry } from "@/GameEntry";

vi.mock("@/Game", () => ({ Game: () => <div>Full game</div> }));
vi.mock("@/Placeholder", () => ({ Placeholder: () => <div>Placeholder</div> }));

const originalParent = Object.getOwnPropertyDescriptor(window, "parent");

afterEach(() => {
  cleanup();
  config.placeholderInIframe = true;
  if (originalParent) Object.defineProperty(window, "parent", originalParent);
});

describe("Game entry", () => {
  it("starts the game when opened directly", async () => {
    render(<GameEntry />);
    expect(await screen.findByText("Full game")).toBeInTheDocument();
  });

  it("shows the placeholder in an iframe by default", async () => {
    Object.defineProperty(window, "parent", { configurable: true, value: {} });
    render(<GameEntry />);
    expect(await screen.findByText("Placeholder")).toBeInTheDocument();
  });

  it("starts the game in an iframe when the flag is off", async () => {
    Object.defineProperty(window, "parent", { configurable: true, value: {} });
    config.placeholderInIframe = false;
    render(<GameEntry />);
    await waitFor(() => expect(screen.getByText("Full game")).toBeInTheDocument());
  });
});
