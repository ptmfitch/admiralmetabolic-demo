import { fireEvent, render, screen } from "@testing-library/react";
import { createSeedSubjects } from "../lib/cohort";
import type { Subject } from "../lib/metrics";
import { MeasuresScreen } from "../screens/MeasuresScreen";

function withOutOfRange(subjects: Subject[]): Subject[] {
  return subjects.map((subject) => {
    if (subject.usubjid !== "CAD7-001") return subject;
    return {
      ...subject,
      baseline: { ...subject.baseline, weightKg: 9, waistCm: 10 },
    };
  });
}

function renderScreen(subjects: Subject[]) {
  const onContinue = vi.fn();
  const view = render(
    <MeasuresScreen subjects={subjects} onChange={() => {}} onImport={() => {}} onContinue={onContinue} />,
  );
  return { onContinue, ...view };
}

describe("MeasuresScreen schema errors", () => {
  it("ties each invalid input and the blocked Continue button to the counted alert", () => {
    const { onContinue } = renderScreen(withOutOfRange(createSeedSubjects()));

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("2 fields are outside the expected unit range");

    for (const name of ["CAD7-001 Baseline Weight (kg)", "CAD7-001 Baseline Waist (cm)"]) {
      const input = screen.getByRole("textbox", { name });
      expect(input).toHaveAttribute("aria-invalid", "true");
      const described = describedText(input);
      expect(described).toMatch(/Out of range/);
      expect(described).toMatch(/2 fields are outside the expected unit range/);
      expect(input.getAttribute("aria-describedby")).toContain(alert.id);
    }

    expect(screen.getByRole("textbox", { name: "CAD7-001 Baseline Height (cm)" })).toHaveAttribute(
      "aria-invalid",
      "false",
    );
    expect(screen.getAllByText("Out of range")).toHaveLength(2);
    expect(screen.getAllByText("!")).toHaveLength(2);

    const continueButton = screen.getByRole("button", { name: "Continue to analysis setup" });
    expect(continueButton).toHaveAttribute("aria-disabled", "true");
    expect(continueButton).toHaveAttribute("aria-describedby", alert.id);
    expect(screen.getByText("Fix 2 invalid fields to continue.")).toBeVisible();

    fireEvent.click(continueButton);
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("clears the alert and enables Continue when the invalid fields are corrected", () => {
    const invalid = withOutOfRange(createSeedSubjects());
    const { rerender, onContinue } = renderScreen(invalid);

    rerender(
      <MeasuresScreen
        subjects={createSeedSubjects()}
        onChange={() => {}}
        onImport={() => {}}
        onContinue={onContinue}
      />,
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText(/Fix \d+ invalid/)).not.toBeInTheDocument();
    expect(screen.queryByText("Out of range")).not.toBeInTheDocument();

    const continueButton = screen.getByRole("button", { name: "Continue to analysis setup" });
    expect(continueButton).not.toHaveAttribute("aria-disabled");
    expect(continueButton).not.toHaveAttribute("aria-describedby");
    const weight = screen.getByRole("textbox", { name: "CAD7-001 Baseline Weight (kg)" });
    expect(weight).toHaveAttribute("aria-invalid", "false");
    expect(weight).not.toHaveAttribute("aria-describedby");

    fireEvent.click(continueButton);
    expect(onContinue).toHaveBeenCalledOnce();
  });
});

function describedText(element: HTMLElement): string {
  const ids = element.getAttribute("aria-describedby")?.split(/\s+/).filter(Boolean) ?? [];
  expect(ids.length).toBeGreaterThan(0);
  return ids
    .map((id) => {
      const node = document.getElementById(id);
      expect(node).not.toBeNull();
      return node?.textContent ?? "";
    })
    .join(" ");
}
