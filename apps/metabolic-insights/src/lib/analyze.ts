import {
  ANALYSIS_WEEKS,
  type AnalysisWeek,
  type Arm,
  type BmiClass,
  type FliBand,
  type Subject,
  type WhtrBand,
  bmiClass,
  bmiKgM2,
  fattyLiverIndex,
  FLI_BAND_LABEL,
  fliBand,
  homaIr,
  mean,
  measuresAtWeek,
  median,
  percentChange,
  percentWeightChangeAt,
  roundPercent,
  standardError,
  whtr,
  whtrBand,
} from "./metrics";

export type AnalysisConfig = {
  population: "FAS";
  arms: "Active vs Placebo";
  baselineVisit: "Week 0 / Day 1";
  primaryWeek: AnalysisWeek;
  outputs: {
    meanChange: boolean;
    responders: boolean;
    bmi: boolean;
    whtr: boolean;
    fli: boolean;
    homa: boolean;
    tte: boolean;
  };
};

export const DEFAULT_CONFIG: AnalysisConfig = {
  population: "FAS",
  arms: "Active vs Placebo",
  baselineVisit: "Week 0 / Day 1",
  primaryWeek: 24,
  outputs: {
    meanChange: true,
    responders: true,
    bmi: true,
    whtr: true,
    fli: true,
    homa: true,
    tte: true,
  },
};

export type ArmSeriesPoint = {
  week: AnalysisWeek;
  meanPct: number;
  se: number;
};

export type ThresholdRate = {
  threshold: 15 | 20 | 25;
  activeCount: number;
  activeN: number;
  placeboCount: number;
  placeboN: number;
  activePct: number;
  placeboPct: number;
};

export type BandShare = {
  key: string;
  label: string;
  count: number;
  total: number;
  pct: number;
};

export type Analysis = {
  nActive: number;
  nPlacebo: number;
  activeMeanPct: number;
  placeboMeanPct: number;
  activeMeanKg: number;
  series: Record<Arm, ArmSeriesPoint[]>;
  thresholds: ThresholdRate[];
  bmiBands: BandShare[];
  whtrBands: BandShare[];
  fliBands: BandShare[];
  homaMedianActive: number;
  homaMedianPlacebo: number;
  homaDeltaActive: number;
  incidence: { week: AnalysisWeek; activePct: number; placeboPct: number }[];
};

function byArm(subjects: Subject[], arm: Arm): Subject[] {
  return subjects.filter((subject) => subject.arm === arm);
}

function responderCount(subjects: Subject[], week: AnalysisWeek, threshold: number): number {
  return subjects.filter((subject) => percentWeightChangeAt(subject, week) <= -threshold).length;
}

function share(label: string, key: string, count: number, total: number): BandShare {
  return { key, label, count, total, pct: roundPercent(count, total) };
}

export function analyze(subjects: Subject[], week: AnalysisWeek): Analysis {
  const active = byArm(subjects, "Active");
  const placebo = byArm(subjects, "Placebo");
  const activePct = active.map((subject) => percentWeightChangeAt(subject, week));
  const placeboPct = placebo.map((subject) => percentWeightChangeAt(subject, week));
  const activeKg = active.map((subject) => {
    const followUp = measuresAtWeek(subject, week).weightKg;
    return followUp - subject.baseline.weightKg;
  });

  const seriesFor = (armSubjects: Subject[]): ArmSeriesPoint[] =>
    ANALYSIS_WEEKS.map((visit) => {
      const values = armSubjects.map((subject) => percentWeightChangeAt(subject, visit));
      return { week: visit, meanPct: mean(values), se: standardError(values) };
    });

  const thresholds = ([15, 20, 25] as const).map((threshold) => {
    const activeCount = responderCount(active, week, threshold);
    const placeboCount = responderCount(placebo, week, threshold);
    return {
      threshold,
      activeCount,
      activeN: active.length,
      placeboCount,
      placeboN: placebo.length,
      activePct: active.length === 0 ? 0 : (activeCount / active.length) * 100,
      placeboPct: placebo.length === 0 ? 0 : (placeboCount / placebo.length) * 100,
    };
  });

  const activeAtWeek = active.map((subject) => measuresAtWeek(subject, week));
  const bmiCounts: Record<BmiClass, number> = { underweight: 0, normal: 0, overweight: 0, obese: 0 };
  const whtrCounts: Record<WhtrBand, number> = { "lt0.5": 0, mid: 0, "ge0.6": 0 };
  const fliCounts: Record<FliBand, number> = { lt30: 0, mid: 0, ge60: 0 };
  for (const measures of activeAtWeek) {
    bmiCounts[bmiClass(bmiKgM2(measures.weightKg, measures.heightCm))] += 1;
    whtrCounts[whtrBand(whtr(measures.waistCm, measures.heightCm))] += 1;
    fliCounts[
      fliBand(
        fattyLiverIndex(
          bmiKgM2(measures.weightKg, measures.heightCm),
          measures.waistCm,
          measures.triglyceridesMgDl,
          measures.ggtUL,
        ),
      )
    ] += 1;
  }

  const homaAt = (armSubjects: Subject[], visit: AnalysisWeek) =>
    armSubjects.map((subject) => {
      const measures = measuresAtWeek(subject, visit);
      return homaIr(measures.glucoseMmolL, measures.insulinUuMl);
    });

  const homaMedianActive = median(homaAt(active, week));
  const homaBaselineActive = median(homaAt(active, 0));

  return {
    nActive: active.length,
    nPlacebo: placebo.length,
    activeMeanPct: mean(activePct),
    placeboMeanPct: mean(placeboPct),
    activeMeanKg: mean(activeKg),
    series: { Active: seriesFor(active), Placebo: seriesFor(placebo) },
    thresholds,
    bmiBands: [
      share("Normal 18.5–24.9", "normal", bmiCounts.normal, active.length),
      share("Overweight 25–29.9", "overweight", bmiCounts.overweight, active.length),
      share("Obese I–III ≥30", "obese", bmiCounts.obese, active.length),
    ],
    whtrBands: [
      share("< 0.5", "lt0.5", whtrCounts["lt0.5"], active.length),
      share("0.5 – < 0.6", "mid", whtrCounts.mid, active.length),
      share("≥ 0.6", "ge0.6", whtrCounts["ge0.6"], active.length),
    ],
    fliBands: [
      share(FLI_BAND_LABEL.lt30, "lt30", fliCounts.lt30, active.length),
      share(FLI_BAND_LABEL.mid, "mid", fliCounts.mid, active.length),
      share(FLI_BAND_LABEL.ge60, "ge60", fliCounts.ge60, active.length),
    ],
    homaMedianActive,
    homaMedianPlacebo: median(homaAt(placebo, week)),
    homaDeltaActive: homaMedianActive - homaBaselineActive,
    incidence: ANALYSIS_WEEKS.map((visit) => ({
      week: visit,
      activePct: active.length === 0 ? 0 : (responderCount(active, visit, 15) / active.length) * 100,
      placeboPct:
        placebo.length === 0 ? 0 : (responderCount(placebo, visit, 15) / placebo.length) * 100,
    })),
  };
}

export function formatRate(count: number, total: number): string {
  if (total === 0) return "0%";
  return `${((count / total) * 100).toFixed(1)}%`;
}

export function kgChange(subject: Subject, week: AnalysisWeek): number {
  return measuresAtWeek(subject, week).weightKg - subject.baseline.weightKg;
}

export function endpointPercent(subject: Subject, week: AnalysisWeek): number {
  return percentChange(subject.baseline.weightKg, measuresAtWeek(subject, week).weightKg);
}
