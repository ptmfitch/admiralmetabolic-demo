import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MeasureInput } from "../components/MeasureInput";

function Harness({ initial = 84.5, digits = 1 }: { initial?: number; digits?: number }) {
  const [value, setValue] = useState(initial);
  return (
    <MeasureInput value={value} digits={digits} label="Weight (kg)" invalid={false} onChange={setValue} />
  );
}

describe("MeasureInput", () => {
  it("keeps a trailing decimal while the one-decimal value is still being typed", () => {
    render(<Harness />);
    const input = screen.getByRole("textbox", { name: "Weight (kg)" });

    fireEvent.change(input, { target: { value: "84." } });
    expect(input).toHaveValue("84.");

    fireEvent.change(input, { target: { value: "84.2" } });
    expect(input).toHaveValue("84.2");

    fireEvent.blur(input);
    expect(input).toHaveValue("84.2");
  });

  it("does not append a fractional suffix until blur", () => {
    render(<Harness />);
    const input = screen.getByRole("textbox", { name: "Weight (kg)" });

    fireEvent.change(input, { target: { value: "8" } });
    expect(input).toHaveValue("8");

    fireEvent.blur(input);
    expect(input).toHaveValue("8.0");
  });

  it("describes an invalid value with text, not only a red border", () => {
    render(
      <>
        <MeasureInput
          value={9}
          digits={1}
          label="Weight (kg)"
          invalid
          describedBy="schema-summary"
          onChange={() => {}}
        />
        <p id="schema-summary">1 field is outside the expected unit range.</p>
      </>,
    );

    const input = screen.getByRole("textbox", { name: "Weight (kg)" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("!")).toBeVisible();
    expect(screen.getByText("Out of range")).toBeVisible();

    const described = describedText(input);
    expect(described).toMatch(/Out of range/);
    expect(described).toMatch(/1 field is outside the expected unit range/);
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
