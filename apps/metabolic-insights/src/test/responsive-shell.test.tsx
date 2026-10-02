import { fireEvent, render, screen } from "@testing-library/react";
import { App } from "../App";

function mockViewport(compact: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: query.includes("max-width") ? compact : !compact,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

describe("responsive shell", () => {
  afterEach(() => {
    Reflect.deleteProperty(window, "matchMedia");
  });

  it("keeps locked FLI bands, the MASH line, and HOMA units on analysis setup", () => {
    mockViewport(true);
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Continue to analysis setup" }));

    expect(screen.getByText("<30 / 30–<60 / ≥60")).toBeInTheDocument();
    expect(screen.getByText("Risk bands only — not MASH diagnosis")).toBeInTheDocument();
    expect(screen.getByText("mmol/L · mU/L ÷ 22.5")).toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent("Demo · synthetic data · not for clinical use");
    expect(document.body.textContent).not.toMatch(/Validated/);
    expect(screen.getByText("2 / 4")).toBeInTheDocument();
  });

  it("swaps the measures table for subject cards on a phone viewport", () => {
    mockViewport(true);
    render(<App />);

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Subject measure cards" })).toBeInTheDocument();
    expect(screen.getAllByText("CAD7-001").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Continue to analysis setup" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Import ADaM" })).toBeInTheDocument();
    expect(screen.getByRole("note")).toHaveTextContent("Demo · synthetic data · not for clinical use");
  });

  it("keeps a sticky USUBJID column on the iPad grid", () => {
    mockViewport(false);
    render(<App />);

    expect(screen.queryByRole("list", { name: "Subject measure cards" })).not.toBeInTheDocument();
    const usubjid = screen.getByRole("columnheader", { name: "USUBJID" });
    expect(usubjid.className).toContain("sticky");
    expect(usubjid.className).toContain("left-0");
    expect(screen.getByText("1 / 4 Inputs")).toBeInTheDocument();
  });
});
