/**
 * Units locked to the CAD-7 science sign-off.
 * HOMA-IR uses glucose in mmol/L and insulin in mU/L (numerically equal to µU/mL).
 * FLI uses the Bedogni 2006 equation, which takes triglycerides in mg/dL.
 */

export const ANALYSIS_WEEKS = [0, 4, 8, 12, 16, 20, 24] as const;
export type AnalysisWeek = (typeof ANALYSIS_WEEKS)[number];

/** Share of the baseline-to-Week-24 change expressed at each visit. */
export const LOSS_FRACTION: Record<AnalysisWeek, number> = {
  0: 0,
  4: 0.5,
  8: 0.62,
  12: 0.74,
  16: 0.84,
  20: 0.93,
  24: 1,
};

export type Arm = "Active" | "Placebo";

export type VisitName = "Baseline" | "Week 24";

export type Measures = {
  weightKg: number;
  heightCm: number;
  waistCm: number;
  glucoseMmolL: number;
  insulinUuMl: number;
  altUL: number;
  astUL: number;
  /** Held for FLI. Not a column on the measures grid. */
  triglyceridesMgDl: number;
  /** Held for FLI. Not a column on the measures grid. */
  ggtUL: number;
};

export type Subject = {
  usubjid: string;
  arm: Arm;
  baseline: Measures;
  week24: Measures;
};

export type BmiClass = "underweight" | "normal" | "overweight" | "obese";
export type WhtrBand = "lt0.5" | "mid" | "ge0.6";
export type FliBand = "lt30" | "mid" | "ge60";

/** Screening risk-band labels. Mid band excludes 60. Not a diagnosis. */
export const FLI_BAND_LABEL: Record<FliBand, string> = {
  lt30: "<30",
  mid: "30–<60",
  ge60: "≥60",
};

export function bmiKgM2(weightKg: number, heightCm: number): number {
  const meters = heightCm / 100;
  return weightKg / (meters * meters);
}

export function bmiClass(bmi: number): BmiClass {
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "normal";
  if (bmi < 30) return "overweight";
  return "obese";
}

export function whtr(waistCm: number, heightCm: number): number {
  return waistCm / heightCm;
}

export function whtrBand(value: number): WhtrBand {
  if (value < 0.5) return "lt0.5";
  if (value < 0.6) return "mid";
  return "ge0.6";
}

/** Glucose mmol/L × insulin mU/L ÷ 22.5. µU/mL and mU/L are the same number. */
export function homaIr(glucoseMmolL: number, insulinUuMl: number): number {
  return (glucoseMmolL * insulinUuMl) / 22.5;
}

export function fattyLiverIndex(
  bmi: number,
  waistCm: number,
  triglyceridesMgDl: number,
  ggtUL: number,
): number {
  const y =
    0.953 * Math.log(triglyceridesMgDl) +
    0.139 * bmi +
    0.718 * Math.log(ggtUL) +
    0.053 * waistCm -
    15.745;
  const e = Math.exp(y);
  return (100 * e) / (1 + e);
}

/** Screening risk band on an existing FLI score. A score of 60 is the upper band. */
export function fliBand(fli: number): FliBand {
  if (fli < 30) return "lt30";
  if (fli < 60) return "mid";
  return "ge60";
}

export function percentChange(baseline: number, followUp: number): number {
  return ((followUp - baseline) / baseline) * 100;
}

export function mean(values: number[]): number {
  if (values.length === 0) return Number.NaN;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function standardError(values: number[]): number {
  if (values.length < 2) return 0;
  const center = mean(values);
  const variance =
    values.reduce((sum, value) => sum + (value - center) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance / values.length);
}

export function median(values: number[]): number {
  if (values.length === 0) return Number.NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    const left = sorted[mid - 1];
    const right = sorted[mid];
    if (left === undefined || right === undefined) return Number.NaN;
    return (left + right) / 2;
  }
  return sorted[mid] ?? Number.NaN;
}

export function roundPercent(count: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((count / total) * 100);
}

export function measuresAtWeek(subject: Subject, week: AnalysisWeek): Measures {
  const fraction = LOSS_FRACTION[week];
  const blend = (baseline: number, week24: number) => baseline + (week24 - baseline) * fraction;
  return {
    weightKg: blend(subject.baseline.weightKg, subject.week24.weightKg),
    heightCm: subject.baseline.heightCm,
    waistCm: blend(subject.baseline.waistCm, subject.week24.waistCm),
    glucoseMmolL: blend(subject.baseline.glucoseMmolL, subject.week24.glucoseMmolL),
    insulinUuMl: blend(subject.baseline.insulinUuMl, subject.week24.insulinUuMl),
    altUL: blend(subject.baseline.altUL, subject.week24.altUL),
    astUL: blend(subject.baseline.astUL, subject.week24.astUL),
    triglyceridesMgDl: blend(subject.baseline.triglyceridesMgDl, subject.week24.triglyceridesMgDl),
    ggtUL: blend(subject.baseline.ggtUL, subject.week24.ggtUL),
  };
}

export function percentWeightChangeAt(subject: Subject, week: AnalysisWeek): number {
  const followUp = measuresAtWeek(subject, week).weightKg;
  return percentChange(subject.baseline.weightKg, followUp);
}

const FIELD_RANGES = {
  weightKg: [40, 250],
  heightCm: [140, 220],
  waistCm: [50, 200],
  glucoseMmolL: [2, 25],
  insulinUuMl: [1, 150],
  altUL: [1, 500],
  astUL: [1, 500],
} as const;

export type EditableField = keyof typeof FIELD_RANGES;

export const EDITABLE_FIELDS: EditableField[] = [
  "weightKg",
  "heightCm",
  "waistCm",
  "glucoseMmolL",
  "insulinUuMl",
  "altUL",
  "astUL",
];

export function fieldInRange(field: EditableField, value: number): boolean {
  const range = FIELD_RANGES[field];
  return Number.isFinite(value) && value >= range[0] && value <= range[1];
}

export function subjectSchemaOk(subject: Subject): boolean {
  return (["baseline", "week24"] as const).every((visit) =>
    EDITABLE_FIELDS.every((field) => fieldInRange(field, subject[visit][field])),
  );
}
