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
});
