import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { config } from "@/model/config";
import { mulberry32 } from "@/model/rng";
import { RoundsVariant } from "@/variants/RoundsVariant";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it("keeps a wheel at its landing angle between rounds and spins forward again", async () => {
  vi.useFakeTimers();
  render(
    <RoundsVariant
      variant={3}
      rounds={3}
      startPoints={0}
      scenario="A"
      rng={mulberry32(42)}
      order={["jistota", "prilezitost", "vrchol"]}
      onRecord={vi.fn()}
      onDone={vi.fn()}
    />,
  );

  const wheel = screen.getByRole("img", { name: "Kotouč: Jistota" });
  const angle = () => Number((wheel.firstElementChild as HTMLElement).style.transform.match(/rotate\((.*)deg\)/)?.[1]);

  fireEvent.click(screen.getByRole("button", { name: "Jistota" }));
  const first = angle();
  expect(first).toBeGreaterThan(0);

  await act(async () => {
    await vi.advanceTimersByTimeAsync(config.variant3.spinMs + 300 + 1200 + 350);
  });
  expect(screen.getByText("Kolo 2 / 3")).toBeInTheDocument();
  expect(angle()).toBe(first);

  fireEvent.click(screen.getByRole("button", { name: "Jistota" }));
  expect(angle()).toBeGreaterThan(first + 360);
});
