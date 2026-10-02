import { fireEvent, render, screen } from "@testing-library/react";
import { createSeedSubjects } from "../lib/cohort";
import { MeasuresScreen } from "../screens/MeasuresScreen";

function renderMeasures() {
  render(
    <MeasuresScreen
      subjects={createSeedSubjects()}
      onChange={() => {}}
      onImport={() => {}}
      onContinue={() => {}}
    />,
  );
}

describe("MeasuresScreen filters", () => {
  it("highlights only the selected filter and leaves the others unfilled", () => {
    renderMeasures();

    const all = screen.getByRole("button", { name: "All subjects (48)" });
    const active = screen.getByRole("button", { name: "Arm: Active" });

    expect(all).toHaveAttribute("aria-pressed", "true");
    expect(all.className).toContain("bg-brand");
    expect(all.className).toContain("text-white");
    expect(active).toHaveAttribute("aria-pressed", "false");
    expect(active.className).toContain("bg-transparent");
    expect(active.className).not.toContain("bg-brand");
    expect(active.className).not.toContain("bg-card");

    fireEvent.click(active);

    expect(active).toHaveAttribute("aria-pressed", "true");
    expect(active.className).toContain("bg-brand");
    expect(active.className).toContain("text-white");
    expect(all).toHaveAttribute("aria-pressed", "false");
    expect(all.className).toContain("bg-transparent");
    expect(screen.queryByRole("rowheader", { name: "CAD7-022" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("rowheader", { name: "CAD7-001" }).length).toBeGreaterThan(0);
  });

  it("tells the reader the subject table continues below the fold", () => {
    renderMeasures();

    expect(screen.getByText("Scroll to see more subjects")).toBeInTheDocument();
    expect(screen.getByLabelText("Subject measures")).toHaveClass("overflow-y-scroll");
  });
});
