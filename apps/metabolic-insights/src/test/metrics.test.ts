import { analyze } from "../lib/analyze";
import { createSeedSubjects } from "../lib/cohort";
import { bmiKgM2, fattyLiverIndex, homaIr, percentChange, whtr } from "../lib/metrics";

describe("locked metabolic units", () => {
  it("computes HOMA-IR as glucose mmol/L × insulin mU/L ÷ 22.5", () => {
    expect(homaIr(5.8, 18.2)).toBeCloseTo((5.8 * 18.2) / 22.5, 6);
  });

  it("computes BMI in kg/m² and WHtR as a dimensionless ratio", () => {
    expect(bmiKgM2(84.1, 172)).toBeCloseTo(84.1 / 1.72 ** 2, 6);
    expect(whtr(96, 172)).toBeCloseTo(96 / 172, 6);
  });

  it("keeps the Bedogni FLI on a 0–100 scale", () => {
    const fli = fattyLiverIndex(28.4, 96, 128, 28);
    expect(fli).toBeGreaterThan(0);
    expect(fli).toBeLessThan(100);
  });

  it("treats weight loss as a negative percent change from baseline", () => {
    expect(percentChange(98.4, 84.1)).toBeCloseTo(((84.1 - 98.4) / 98.4) * 100, 6);
  });
});

describe("synthetic CAD-7 cohort", () => {
  const subjects = createSeedSubjects();
  const analysis = analyze(subjects, 24);

  it("uses masked ids only", () => {
    expect(subjects).toHaveLength(48);
    expect(subjects.every((subject) => /^CAD7-\d{3}$/.test(subject.usubjid))).toBe(true);
    expect(analysis.nActive).toBe(24);
    expect(analysis.nPlacebo).toBe(24);
  });

  it("matches the signed-off Week 24 weight summaries", () => {
    expect(analysis.activeMeanPct).toBeCloseTo(-14.8, 1);
    expect(analysis.placeboMeanPct).toBeCloseTo(-1.9, 1);
    expect(analysis.activeMeanKg).toBeCloseTo(-14.2, 1);
    expect(analysis.thresholds.map((row) => row.activeCount)).toEqual([15, 10, 5]);
    expect(analysis.thresholds.map((row) => row.placeboCount)).toEqual([2, 1, 0]);
  });

  it("places Active Week 24 BMI and WHtR into the signed-off bands", () => {
    expect(analysis.bmiBands.map((row) => row.count)).toEqual([7, 9, 8]);
    expect(analysis.whtrBands.map((row) => row.count)).toEqual([10, 9, 5]);
  });

  it("reports HOMA-IR medians from mmol/L glucose and mU/L insulin", () => {
    expect(analysis.homaMedianActive).toBeCloseTo(2.1, 1);
    expect(analysis.homaMedianPlacebo).toBeCloseTo(3.8, 1);
    expect(analysis.homaDeltaActive).toBeCloseTo(-1.4, 1);
    expect(analysis.fliBands.map((row) => row.count)).toEqual([8, 10, 6]);
  });
});
