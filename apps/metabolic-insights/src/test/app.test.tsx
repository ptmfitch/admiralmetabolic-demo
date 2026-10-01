import { act, fireEvent, render, screen } from "@testing-library/react";
import { App } from "../App";

describe("Metabolic Insights walkthrough", () => {
  it("keeps the disclosure, study label, and schema wording off the word Validated", async () => {
    vi.useFakeTimers();
    render(<App />);

    expect(screen.getByRole("note")).toHaveTextContent("Demo · synthetic data · not for clinical use");
    expect(screen.getByText("Demo study")).toBeInTheDocument();
    expect(screen.getByText(/not audited \/ Part 11 controlled/)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Validated/);

    fireEvent.click(screen.getByRole("button", { name: "Continue to analysis setup" }));
    expect(screen.getByRole("heading", { name: "Analysis configuration" })).toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent("Demo · synthetic data · not for clinical use");

    fireEvent.click(screen.getByRole("button", { name: "Run weight outcomes analysis" }));
    expect(screen.getByRole("heading", { name: "Running analysis" })).toBeInTheDocument();
    expect(screen.getByText("Loaded / schema-checked subject measures (ADVS / ADLB)")).toBeInTheDocument();

    for (let step = 0; step < 8; step += 1) {
      await act(async () => {
        vi.advanceTimersByTime(800);
      });
    }

    expect(screen.getByRole("heading", { name: "Weight outcomes · Week 24" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export figures (demo)" })).toBeInTheDocument();
    expect(screen.getByText(/Illustrative \/ fictional cohort/)).toBeInTheDocument();
    expect(screen.getByText("Time to ≥15% weight reduction")).toBeInTheDocument();
    expect(screen.queryByText(/MACE/)).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/Validated/);
    vi.useRealTimers();
  });
});
