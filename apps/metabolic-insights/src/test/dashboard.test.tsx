import { render, screen } from "@testing-library/react";
import { analyze, DEFAULT_CONFIG } from "../lib/analyze";
import { createSeedSubjects } from "../lib/cohort";
import { DashboardScreen } from "../screens/DashboardScreen";

describe("DashboardScreen", () => {
  it("labels BMI bands with the selected primary week", () => {
    const subjects = createSeedSubjects();
    render(
      <DashboardScreen
        analysis={analyze(subjects, 12)}
        config={{ ...DEFAULT_CONFIG, primaryWeek: 12 }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Weight outcomes · Week 12" })).toBeInTheDocument();
    expect(screen.getByText("WHO class · Week 12 Active")).toBeInTheDocument();
    expect(screen.queryByText("WHO class · Week 24 Active")).not.toBeInTheDocument();
  });

  it("shows WHtR and FLI band labels with severity words and non-color swatch tones", () => {
    const subjects = createSeedSubjects();
    const { container } = render(
      <DashboardScreen analysis={analyze(subjects, 24)} config={DEFAULT_CONFIG} />,
    );

    expect(screen.getByText("Lower · < 0.5")).toBeInTheDocument();
    expect(screen.getByText("Increased · 0.5 – < 0.6")).toBeInTheDocument();
    expect(screen.getByText("High · ≥ 0.6")).toBeInTheDocument();
    expect(screen.getByText("Unlikely · < 30")).toBeInTheDocument();
    expect(screen.getByText("Indeterminate · 30 – <60")).toBeInTheDocument();
    expect(screen.getByText("Likely · ≥ 60")).toBeInTheDocument();

    const tones = [...container.querySelectorAll("[data-band-tone]")].map(
      (node) => node.getAttribute("data-band-tone"),
    );
    expect(tones).toEqual(["low", "mid", "high", "low", "mid", "high", "low", "mid", "high"]);
  });
});
