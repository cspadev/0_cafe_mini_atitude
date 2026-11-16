import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Placeholder } from "@/Placeholder";

const protocol = vi.hoisted(() => ({
  startMinihra: vi.fn(),
  finish: vi.fn(),
  fail: vi.fn(),
}));
vi.mock("@/minihra-protokol", () => protocol);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Iframe placeholder", () => {
  it("accepts a new INIT after sending a test FINISH", async () => {
    render(<Placeholder />);
    fireEvent.click(screen.getByText("Pro vývojáře"));
    await waitFor(() => expect(protocol.startMinihra).toHaveBeenCalledOnce());
    const onInit = protocol.startMinihra.mock.calls[0]![0] as (
      level: number,
      payload: object,
    ) => void;
    onInit(2, { round: 1 });
    expect(await screen.findByText(/"round": 1/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Odeslat FINISH"));
    expect(protocol.finish).toHaveBeenCalledWith(0.8, {
      placeholder: true,
      id: "0_cafe_mini_atitude",
    });
    expect(screen.getByText("Odeslat FINISH")).toBeDisabled();

    onInit(3, { round: 2 });
    await waitFor(() => expect(screen.getByText("Odeslat FINISH")).toBeEnabled());
    expect(screen.getByText(/"round": 2/)).toBeInTheDocument();
  });

  it("reports an invalid test result as an error", async () => {
    render(<Placeholder />);
    fireEvent.click(screen.getByText("Pro vývojáře"));
    await waitFor(() => expect(screen.getByText("Odeslat FINISH")).toBeEnabled());
    fireEvent.change(screen.getByLabelText("successRate"), { target: { value: "invalid" } });
    fireEvent.click(screen.getByText("Odeslat FINISH"));
    expect(protocol.fail).toHaveBeenCalledWith("INVALID_RESULT", "Invalid successRate: invalid");
    expect(protocol.finish).not.toHaveBeenCalled();
  });
});
