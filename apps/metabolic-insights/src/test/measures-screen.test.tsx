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

  it("tabs from the summary through the cells to Continue", async () => {
    renderScreen(withOutOfRange(createSeedSubjects()));
    const user = userEvent.setup();
    const summary = screen.getByRole("link", { name: "Correct them before analysis." });
    const cells = screen.getAllByRole("textbox");
    const continueButton = screen.getByRole("button", { name: "Continue to analysis setup" });
    const firstCell = cells[0];
    const lastCell = cells.at(-1);
    if (!firstCell || !lastCell) throw new Error("expected measure cells");

    summary.focus();
    await user.tab();
    expect(firstCell).toHaveFocus();

    await user.tab({ shift: true });
    expect(summary).toHaveFocus();

    lastCell.focus();
    await user.tab();
    expect(continueButton).toHaveFocus();

    expect(summary.compareDocumentPosition(firstCell) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(lastCell.compareDocumentPosition(continueButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole("alert").compareDocumentPosition(screen.getByRole("table")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("sets scroll-padding-bottom with a class and does not reorder or set tabindex", () => {
    const { container } = renderScreen(withOutOfRange(createSeedSubjects()));
    const scroller = screen.getByRole("heading", { name: "Subject measures" }).closest(".scroll-pb-24");
    expect(scroller).not.toBeNull();

    const continueButton = screen.getByRole("button", { name: "Continue to analysis setup" });
    const bar = continueButton.parentElement;
    expect(bar?.className).toContain("sticky");
    expect(bar?.className).toContain("bottom-0");
    expect(bar?.className).not.toMatch(/\border-/);

    expect(container.querySelector("[tabindex]")).toBeNull();
    for (const node of container.querySelectorAll<HTMLElement>("[class]")) {
      for (const token of node.className.split(/\s+/)) {
        expect(token.split(":").pop()).not.toMatch(/^order-/);
      }
    }
  });

  it("shows every hidden invalid cell and focuses the first one from Show all", async () => {
    const user = userEvent.setup();
    renderScreen(withOutOfRange(createSeedSubjects()));

    await user.click(screen.getByRole("button", { name: "Visit: Week 24" }));

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("2 fields need fixing. They're hidden by the current filter.");
    expect(screen.getByText("Fix 2 invalid fields to continue.")).toBeVisible();
    expect(screen.queryByRole("textbox", { name: "CAD7-001 Baseline Weight (kg)" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Show all" }));

    const weight = screen.getByRole("textbox", { name: "CAD7-001 Baseline Weight (kg)" });
    expect(weight).toHaveFocus();
    expect(screen.getByRole("button", { name: "All subjects (48)" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "2 fields are outside the expected unit range. Correct them before analysis.",
    );
    expect(screen.getByRole("button", { name: "Continue to analysis setup" })).toHaveAttribute("aria-disabled", "true");
  });

  it("uses the singular hidden-filter sentence when the only invalid cell is filtered out", async () => {
    const user = userEvent.setup();
    const subjects = createSeedSubjects().map((subject) => {
      if (subject.usubjid !== "CAD7-001") return subject;
      return { ...subject, baseline: { ...subject.baseline, weightKg: 9 } };
    });
    renderScreen(subjects);

    await user.click(screen.getByRole("button", { name: "Visit: Week 24" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "1 field needs fixing. It's hidden by the current filter.",
    );
    expect(screen.getByText("Fix 1 invalid field to continue.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Show all" })).toBeInTheDocument();
  });

  it("names the hidden count and links to the first visible invalid cell", async () => {
    const user = userEvent.setup();
    const subjects = createSeedSubjects().map((subject) => {
      if (subject.usubjid !== "CAD7-001") return subject;
      return {
        ...subject,
        baseline: { ...subject.baseline, weightKg: 9 },
        week24: { ...subject.week24, waistCm: 10 },
      };
    });
    renderScreen(subjects);

    await user.click(screen.getByRole("button", { name: "Visit: Week 24" }));

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("2 fields need fixing (1 hidden by filter)");
    expect(screen.queryByRole("button", { name: "Show all" })).not.toBeInTheDocument();

    const visible = screen.getByRole("textbox", { name: "CAD7-001 Week 24 Waist (cm)" });
    const link = screen.getByRole("link", { name: "Correct them before analysis." });
    expect(link).toHaveAttribute("href", `#${visible.id}`);
    expect(screen.queryByRole("textbox", { name: "CAD7-001 Baseline Weight (kg)" })).not.toBeInTheDocument();

    await user.click(link);
    expect(visible).toHaveFocus();
    expect(screen.getByText("Fix 2 invalid fields to continue.")).toBeVisible();
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
