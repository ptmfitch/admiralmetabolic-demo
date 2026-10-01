import { useCallback, useMemo, useState } from "react";
import { analyze, DEFAULT_CONFIG, type AnalysisConfig } from "./lib/analyze";
import { createSeedSubjects } from "./lib/cohort";
import { type EditableField, type Subject } from "./lib/metrics";
import { ConfigScreen } from "./screens/ConfigScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { MeasuresScreen } from "./screens/MeasuresScreen";
import { ProcessingScreen } from "./screens/ProcessingScreen";

type Screen = "measures" | "config" | "processing" | "outcomes";

export function App() {
  const [screen, setScreen] = useState<Screen>("measures");
  const [subjects, setSubjects] = useState<Subject[]>(() => createSeedSubjects());
  const [config, setConfig] = useState<AnalysisConfig>(DEFAULT_CONFIG);

  const analysis = useMemo(() => analyze(subjects, config.primaryWeek), [subjects, config.primaryWeek]);

  const onChange = useCallback(
    (usubjid: string, visit: "baseline" | "week24", field: EditableField, value: number) => {
      setSubjects((current) =>
        current.map((subject) => {
          if (subject.usubjid !== usubjid) return subject;
          if (field === "heightCm") {
            return {
              ...subject,
              baseline: { ...subject.baseline, heightCm: value },
              week24: { ...subject.week24, heightCm: value },
            };
          }
          return { ...subject, [visit]: { ...subject[visit], [field]: value } };
        }),
      );
    },
    [],
  );

  const finish = useCallback(() => setScreen("outcomes"), []);

  if (screen === "config") {
    return (
      <ConfigScreen
        config={config}
        subjectCount={subjects.length}
        onChange={setConfig}
        onBack={() => setScreen("measures")}
        onRun={() => setScreen("processing")}
      />
    );
  }

  if (screen === "processing") {
    return <ProcessingScreen populationN={subjects.length} primaryWeek={config.primaryWeek} onDone={finish} />;
  }

  if (screen === "outcomes") {
    return <DashboardScreen analysis={analysis} config={config} />;
  }

  return (
    <MeasuresScreen
      subjects={subjects}
      onChange={onChange}
      onImport={() => setSubjects(createSeedSubjects())}
      onContinue={() => setScreen("config")}
    />
  );
}
