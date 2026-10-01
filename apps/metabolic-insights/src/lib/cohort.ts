import {
  bmiClass,
  bmiKgM2,
  fattyLiverIndex,
  fliBand,
  type BmiClass,
  type Measures,
  type Subject,
  type WhtrBand,
  whtr,
  whtrBand,
} from "./metrics";

type GeneratedSpec = {
  usubjid: string;
  arm: "Active" | "Placebo";
  pct: number;
  bmi: number;
  whtr: number;
  b0: number;
  fli: number;
  homaBaseline: number;
  homaWeek24: number;
  alt: number;
  ast: number;
};

const ACTIVE_GENERATED: GeneratedSpec[] = [
  spec("CAD7-002", "Active", -32, 22.5, 0.46, 98, 18, 4.2, 1.4, 36, 32),
  spec("CAD7-003", "Active", -29, 23.2, 0.47, 97, 22, 4.4, 1.5, 40, 34),
  spec("CAD7-004", "Active", -27.5, 23.8, 0.48, 96, 20, 4.6, 1.6, 44, 36),
  spec("CAD7-005", "Active", -26.2, 24.2, 0.46, 99, 24, 4.8, 1.7, 38, 33),
  spec("CAD7-006", "Active", -25.1, 24.6, 0.49, 95, 20, 5.0, 1.8, 48, 40),
  spec("CAD7-007", "Active", -24.4, 22.8, 0.47, 100, 22, 5.2, 1.9, 42, 35),
  spec("CAD7-008", "Active", -23.1, 24.0, 0.48, 94, 18, 3.4, 1.95, 46, 39),
  spec("CAD7-009", "Active", -22.0, 26.5, 0.54, 101, 45, 3.6, 2.0, 52, 44),
  spec("CAD7-010", "Active", -21.2, 27.4, 0.55, 93, 48, 5.4, 2.0, 50, 42),
  spec("CAD7-011", "Active", -20.1, 28.2, 0.56, 102, 45, 5.6, 2.05, 54, 45),
  spec("CAD7-012", "Active", -19.4, 27.0, 0.55, 97, 50, 5.8, 2.05, 41, 34),
  spec("CAD7-013", "Active", -17.6, 28.8, 0.62, 96, 52, 6.0, 2.05, 58, 49),
  spec("CAD7-015", "Active", -15.4, 29.4, 0.63, 98, 55, 6.2, 2.15, 60, 51),
  spec("CAD7-016", "Active", -7.346, 31.2, 0.64, 95, 78, 6.4, 2.6, 62, 53),
  spec("CAD7-017", "Active", -3.646, 32.5, 0.66, 99, 78, 3.9, 3.0, 57, 48),
  spec("CAD7-018", "Active", -1.146, 33.0, 0.45, 94, 75, 4.1, 3.2, 49, 41),
  spec("CAD7-019", "Active", 0.154, 34.2, 0.55, 100, 55, 4.3, 3.6, 55, 46),
  spec("CAD7-020", "Active", 1.354, 31.8, 0.54, 96, 55, 4.5, 4.0, 51, 43),
  spec("CAD7-021", "Active", 2.054, 35.0, 0.63, 98, 76, 4.7, 4.4, 66, 55),
  spec("CAD7-023", "Active", 2.554, 33.8, 0.46, 95, 80, 4.9, 4.8, 47, 40),
  spec("CAD7-024", "Active", 3.452, 28.6, 0.48, 97, 48, 5.1, 5.2, 43, 37),
];

const PLACEBO_GENERATED: GeneratedSpec[] = [
  spec("CAD7-025", "Placebo", -22, 31.5, 0.62, 104, 70, 4.8, 4.2, 46, 40),
  spec("CAD7-026", "Placebo", -16.5, 30.2, 0.58, 99, 62, 4.4, 3.9, 44, 38),
  spec("CAD7-027", "Placebo", -2.4, 32.0, 0.61, 101, 68, 4.2, 3.2, 50, 42),
  spec("CAD7-028", "Placebo", -1.8, 29.4, 0.57, 96, 55, 4.0, 3.3, 41, 36),
  spec("CAD7-029", "Placebo", -1.5, 33.1, 0.64, 108, 74, 4.6, 3.4, 58, 49),
  spec("CAD7-030", "Placebo", -1.2, 28.8, 0.55, 94, 48, 3.8, 3.45, 39, 34),
  spec("CAD7-032", "Placebo", -1.0, 31.0, 0.6, 100, 64, 4.1, 3.5, 47, 40),
  spec("CAD7-033", "Placebo", -0.8, 30.4, 0.59, 97, 58, 3.9, 3.55, 43, 37),
  spec("CAD7-034", "Placebo", -0.6, 34.0, 0.66, 110, 78, 4.7, 3.6, 61, 52),
  spec("CAD7-035", "Placebo", -0.5, 29.0, 0.54, 95, 46, 3.7, 3.65, 40, 35),
  spec("CAD7-036", "Placebo", -0.4, 32.6, 0.63, 103, 72, 4.3, 3.7, 52, 44),
  spec("CAD7-037", "Placebo", -0.3, 28.4, 0.52, 92, 42, 3.6, 3.75, 38, 33),
  spec("CAD7-038", "Placebo", -0.2, 31.8, 0.6, 102, 66, 4.5, 3.85, 49, 41),
  spec("CAD7-039", "Placebo", -0.1, 30.0, 0.57, 98, 56, 4.0, 4.1, 45, 39),
  spec("CAD7-040", "Placebo", 0, 33.4, 0.65, 107, 76, 4.9, 4.3, 57, 48),
  spec("CAD7-041", "Placebo", 0.2, 29.6, 0.55, 96, 50, 3.8, 4.4, 42, 36),
  spec("CAD7-042", "Placebo", 0.3, 32.2, 0.62, 104, 69, 4.4, 4.5, 51, 43),
  spec("CAD7-043", "Placebo", 0.4, 28.2, 0.53, 93, 44, 3.5, 4.6, 37, 32),
  spec("CAD7-044", "Placebo", 0.5, 31.2, 0.59, 100, 63, 4.2, 4.8, 48, 41),
  spec("CAD7-045", "Placebo", 0.6, 30.8, 0.58, 99, 60, 4.1, 5.0, 46, 39),
  spec("CAD7-046", "Placebo", 0.8, 29.8, 0.56, 97, 52, 3.9, 5.2, 43, 37),
  spec("CAD7-047", "Placebo", 1.0, 33.6, 0.64, 109, 75, 4.8, 5.4, 59, 50),
  spec("CAD7-048", "Placebo", 1.863, 32.4, 0.61, 105, 67, 4.6, 5.6, 53, 45),
];

function spec(
  usubjid: string,
  arm: "Active" | "Placebo",
  pct: number,
  bmi: number,
  whtrValue: number,
  b0: number,
  fli: number,
  homaBaseline: number,
  homaWeek24: number,
  alt: number,
  ast: number,
): GeneratedSpec {
  return { usubjid, arm, pct, bmi, whtr: whtrValue, b0, fli, homaBaseline, homaWeek24, alt, ast };
}

function round(value: number, digits: number): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function fitFli(bmi: number, waistCm: number, targetFli: number): { triglyceridesMgDl: number; ggtUL: number } {
  const triglyceridesMgDl = targetFli < 30 ? 70 : targetFli < 60 ? 100 : 180;
  const ggtUL = solveGgt(bmi, waistCm, triglyceridesMgDl, targetFli);
  const achieved = fattyLiverIndex(bmi, waistCm, triglyceridesMgDl, ggtUL);
  if (fliBand(achieved) === fliBand(targetFli)) return { triglyceridesMgDl, ggtUL };
  let lo = 40;
  let hi = 500;
  const ggt = 25;
  for (let i = 0; i < 40; i += 1) {
    const mid = (lo + hi) / 2;
    if (fattyLiverIndex(bmi, waistCm, mid, ggt) < targetFli) lo = mid;
    else hi = mid;
  }
  return { triglyceridesMgDl: round((lo + hi) / 2, 1), ggtUL: ggt };
}

function solveGgt(bmi: number, waistCm: number, triglyceridesMgDl: number, targetFli: number): number {
  let lo = 8;
  let hi = 500;
  for (let i = 0; i < 48; i += 1) {
    const mid = (lo + hi) / 2;
    const value = fattyLiverIndex(bmi, waistCm, triglyceridesMgDl, mid);
    if (value < targetFli) lo = mid;
    else hi = mid;
  }
  return round((lo + hi) / 2, 1);
}

function labsForHoma(homa: number, preferredGlucose: number): { glucoseMmolL: number; insulinUuMl: number } {
  let glucose = preferredGlucose;
  let insulin = (homa * 22.5) / glucose;
  if (insulin > 40) {
    insulin = 38;
    glucose = (homa * 22.5) / insulin;
  } else if (insulin < 4) {
    insulin = 5;
    glucose = (homa * 22.5) / insulin;
  }
  return { glucoseMmolL: round(glucose, 1), insulinUuMl: round(insulin, 1) };
}

function heightForClass(weightKg: number, targetBmi: number, expected: BmiClass): number {
  let height = Math.round(100 * Math.sqrt(weightKg / targetBmi));
  for (let guard = 0; guard < 12; guard += 1) {
    const current = bmiKgM2(weightKg, height);
    if (bmiClass(current) === expected) return height;
    height += current > targetBmi ? 1 : -1;
  }
  return height;
}

function waistForBand(heightCm: number, target: number, expected: WhtrBand): number {
  let waist = Math.round(target * heightCm);
  for (let guard = 0; guard < 8; guard += 1) {
    if (whtrBand(whtr(waist, heightCm)) === expected) return waist;
    if (whtr(waist, heightCm) > target) waist -= 1;
    else waist += 1;
  }
  return waist;
}

function buildGenerated(item: GeneratedSpec, baselineKg: number): Subject {
  const week24Weight = round(baselineKg * (1 + item.pct / 100), 1);
  const expectedBmi = bmiClass(item.bmi);
  const expectedWhtr = whtrBand(item.whtr);
  const heightCm = heightForClass(week24Weight, item.bmi, expectedBmi);
  const waist24 = waistForBand(heightCm, item.whtr, expectedWhtr);
  const waistDelta = item.pct < -5 ? 8 : item.pct < 0 ? 3 : -1;
  const waistBaseline = Math.max(60, waist24 + waistDelta);
  const bmi24 = bmiKgM2(week24Weight, heightCm);
  const fitted = fitFli(bmi24, waist24, item.fli);
  const triglyceridesWeek24 = fitted.triglyceridesMgDl;
  const ggt24 = fitted.ggtUL;
  const triglyceridesBaseline = round(triglyceridesWeek24 + (item.pct < -10 ? 28 : 8), 1);
  const bmi0 = bmiKgM2(baselineKg, heightCm);
  const ggt0 = solveGgt(bmi0, waistBaseline, triglyceridesBaseline, Math.min(95, item.fli + 12));
  const glucosePreference = item.arm === "Active" ? 5.3 : 5.6;
  const baselineLabs = labsForHoma(item.homaBaseline, glucosePreference + 0.4);
  const week24Labs = labsForHoma(item.homaWeek24, glucosePreference);
  const altDrop = item.pct < -10 ? 14 : 3;
  const measures = (visit: "baseline" | "week24"): Measures => {
    const followUp = visit === "week24";
    return {
      weightKg: followUp ? week24Weight : round(baselineKg, 1),
      heightCm,
      waistCm: followUp ? waist24 : waistBaseline,
      glucoseMmolL: followUp ? week24Labs.glucoseMmolL : baselineLabs.glucoseMmolL,
      insulinUuMl: followUp ? week24Labs.insulinUuMl : baselineLabs.insulinUuMl,
      altUL: followUp ? Math.max(12, item.alt - altDrop) : item.alt,
      astUL: followUp ? Math.max(12, item.ast - Math.round(altDrop * 0.8)) : item.ast,
      triglyceridesMgDl: followUp ? triglyceridesWeek24 : triglyceridesBaseline,
      ggtUL: followUp ? ggt24 : ggt0,
    };
  };
  return {
    usubjid: item.usubjid,
    arm: item.arm,
    baseline: measures("baseline"),
    week24: measures("week24"),
  };
}

function activeBaselineShift(): number {
  const pinnedDelta = 84.1 - 98.4 + (86.7 - 104.2) + (91.5 - 112);
  const target = -14.2 * 24 - pinnedDelta;
  const sumPct = ACTIVE_GENERATED.reduce((sum, item) => sum + item.pct, 0);
  const sumB0Pct = ACTIVE_GENERATED.reduce((sum, item) => sum + item.b0 * item.pct, 0);
  return (target * 100 - sumB0Pct) / sumPct;
}

const PINNED: Subject[] = [
  {
    usubjid: "CAD7-001",
    arm: "Active",
    baseline: pinned(98.4, 172, 108, 5.8, 18.2, 42, 38, 110, 40),
    week24: pinned(84.1, 172, 96, 5.1, 12.4, 28, 26, 70, 28),
  },
  {
    usubjid: "CAD7-014",
    arm: "Active",
    baseline: pinned(104.2, 168, 114, 6.4, 22.1, 55, 48, 176, 52),
    week24: pinned(86.7, 168, 99, 5.3, 14.0, 31, 29, 148, 36),
  },
  {
    usubjid: "CAD7-022",
    arm: "Placebo",
    baseline: pinned(96.8, 175, 106, 5.6, 16.8, 39, 35, 154, 34),
    week24: pinned(94.9, 175, 104, 5.5, 16.1, 37, 34, 150, 33),
  },
  {
    usubjid: "CAD7-031",
    arm: "Active",
    baseline: pinned(112.0, 180, 122, 7.1, 28.4, 68, 61, 188, 61),
    week24: pinned(91.5, 180, 104, 5.4, 15.2, 34, 32, 160, 44),
  },
];

function pinned(
  weightKg: number,
  heightCm: number,
  waistCm: number,
  glucoseMmolL: number,
  insulinUuMl: number,
  altUL: number,
  astUL: number,
  triglyceridesMgDl: number,
  ggtUL: number,
): Measures {
  return {
    weightKg,
    heightCm,
    waistCm,
    glucoseMmolL,
    insulinUuMl,
    altUL,
    astUL,
    triglyceridesMgDl,
    ggtUL,
  };
}

/** Tune pinned GGT so Week 24 FLI lands in the intended band without touching visible labs. */
function tunePinnedFli(subject: Subject, target: number): Subject {
  const bmi = bmiKgM2(subject.week24.weightKg, subject.week24.heightCm);
  const ggt = solveGgt(bmi, subject.week24.waistCm, subject.week24.triglyceridesMgDl, target);
  return {
    ...subject,
    week24: { ...subject.week24, ggtUL: ggt },
    baseline: {
      ...subject.baseline,
      ggtUL: solveGgt(
        bmiKgM2(subject.baseline.weightKg, subject.baseline.heightCm),
        subject.baseline.waistCm,
        subject.baseline.triglyceridesMgDl,
        Math.min(92, target + 15),
      ),
    },
  };
}

export function createSeedSubjects(): Subject[] {
  const shift = activeBaselineShift();
  const generatedActive = ACTIVE_GENERATED.map((item) => buildGenerated(item, item.b0 + shift));
  const generatedPlacebo = PLACEBO_GENERATED.map((item) => buildGenerated(item, item.b0));
  const pinned = PINNED.map((subject, index) => {
    const targets = [26, 46, 55, 72];
    const target = targets[index];
    return target === undefined ? subject : tunePinnedFli(subject, target);
  });
  const generated = stampHoma([...generatedActive, ...generatedPlacebo]);
  return [...pinned, ...generated].sort((a, b) => a.usubjid.localeCompare(b.usubjid));
}

function withHoma(subject: Subject, visit: "baseline" | "week24", homa: number): Subject {
  const measures = subject[visit];
  const insulinUuMl = round((homa * 22.5) / measures.glucoseMmolL, 2);
  return { ...subject, [visit]: { ...measures, insulinUuMl } };
}

/** Place generated insulin so arm medians match the signed-off HOMA-IR figures. Pinned rows stay as displayed. */
function stampHoma(subjects: Subject[]): Subject[] {
  const activeWeek24 = [1.7, 1.7, 1.7, 1.7, 1.7, 1.7, 1.7, 1.7, 1.7, 1.7, 1.7, 2.05, 2.15, 4.2, 4.2, 4.2, 4.2, 4.2, 4.2, 4.2, 4.2];
  const activeBaseline = [2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 3.4, 3.6, 6.5, 6.5, 6.5, 6.5, 6.5, 6.5, 6.5, 6.5];
  const placeboWeek24 = [3.1, 3.1, 3.1, 3.1, 3.1, 3.1, 3.1, 3.1, 3.1, 3.1, 3.1, 3.75, 3.85, 5.5, 5.5, 5.5, 5.5, 5.5, 5.5, 5.5, 5.5, 5.5, 5.5];
  let activeIndex = 0;
  let placeboIndex = 0;
  return subjects.map((subject) => {
    if (subject.arm === "Active") {
      const week24 = activeWeek24[activeIndex];
      const baseline = activeBaseline[activeIndex];
      activeIndex += 1;
      if (week24 === undefined || baseline === undefined) return subject;
      return withHoma(withHoma(subject, "week24", week24), "baseline", baseline);
    }
    const week24 = placeboWeek24[placeboIndex];
    placeboIndex += 1;
    if (week24 === undefined) return subject;
    return withHoma(subject, "week24", week24);
  });
}
