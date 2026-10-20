import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createSeedSubjects } from "../lib/cohort";
import { fieldRangeMessage, type Subject } from "../lib/metrics";
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
  it("ties each invalid input and the blocked Continue button to the counted alert", async () => {
    const { onContinue } = renderScreen(withOutOfRange(createSeedSubjects()));

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("2 fields are outside the expected unit range. Correct them before analysis.");

    const weight = screen.getByRole("textbox", { name: "CAD7-001 Baseline Weight (kg)" });
    const waist = screen.getByRole("textbox", { name: "CAD7-001 Baseline Waist (cm)" });
    for (const input of [weight, waist]) {
      expect(input).toHaveAttribute("aria-invalid", "true");
      expect(input.className).toContain("border-2");
      const described = describedText(input);
      expect(described).toContain(fieldRangeMessage(input === weight ? "weightKg" : "waistCm"));
      expect(described).toMatch(/2 fields are outside the expected unit range/);
      expect(input.getAttribute("aria-describedby")).toContain(alert.id);
    }
    expect(screen.getByText(fieldRangeMessage("weightKg"))).toBeVisible();
    expect(screen.getByText(fieldRangeMessage("waistCm"))).toBeVisible();

    const jump = screen.getByRole("link", { name: "Correct them before analysis." });
    expect(jump).toHaveAttribute("href", `#${weight.id}`);
    fireEvent.click(jump);
    expect(weight).toHaveFocus();

    expect(screen.getByRole("textbox", { name: "CAD7-001 Baseline Height (cm)" })).toHaveAttribute(
      "aria-invalid",
      "false",
    );
    expect(screen.getAllByText("!")).toHaveLength(2);

    const continueButton = screen.getByRole("button", { name: "Continue to analysis setup" });
    expect(continueButton).toHaveAttribute("aria-disabled", "true");
    expect(continueButton).toHaveAttribute("aria-describedby", alert.id);
    expect(screen.getByText("Fix 2 invalid fields to continue.")).toBeVisible();

    fireEvent.click(continueButton);
    continueButton.focus();
    await userEvent.keyboard("{Enter}");
    await userEvent.keyboard("{ }");
    expect(onContinue).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Subject measures" })).toBeInTheDocument();
  });

  it("uses singular wording when one field is invalid", () => {
    const subjects = createSeedSubjects().map((subject) => {
      if (subject.usubjid !== "CAD7-001") return subject;
      return { ...subject, baseline: { ...subject.baseline, weightKg: 9 } };
    });
    renderScreen(subjects);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "1 field is outside the expected unit range. Correct it before analysis.",
    );
    expect(screen.getByText("Fix 1 invalid field to continue.")).toBeVisible();
    expect(screen.getByText(fieldRangeMessage("weightKg"))).toBeVisible();
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
    expect(screen.getByText("Ready to continue to Analysis Setup")).toBeVisible();
    expect(screen.queryByText(fieldRangeMessage("weightKg"))).not.toBeInTheDocument();

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
