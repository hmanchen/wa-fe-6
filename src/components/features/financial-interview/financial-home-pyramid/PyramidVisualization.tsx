"use client";

import { PyramidLevel } from "./PyramidLevel";
import { LevelDetailPanel } from "./LevelDetailPanel";

const LEVEL_META = [
  {
    id: 5 as const,
    title: "Financial Freedom",
    subtitle: "Your ultimate outcome",
    width: "w-[50%] min-w-[200px] md:w-[30%] md:min-w-[280px]",
  },
  {
    id: 4 as const,
    title: "Progressive Planning",
    subtitle: "Legacy and transfer strategy",
    width: "w-[62%] min-w-[240px] md:w-[46%] md:min-w-[360px]",
  },
  {
    id: 3 as const,
    title: "Aggressive Planning",
    subtitle: "Growth and wealth expansion",
    width: "w-[74%] min-w-[280px] md:w-[62%] md:min-w-[480px]",
  },
  {
    id: 2 as const,
    title: "Offensive Planning",
    subtitle: "Stability building",
    width: "w-[86%] min-w-[320px] md:w-[78%] md:min-w-[600px]",
  },
  {
    id: 1 as const,
    title: "Defensive Planning",
    subtitle: "Foundation",
    width: "w-[98%] min-w-[340px] md:w-[94%] md:min-w-[720px]",
  },
];

export function PyramidVisualization({
  activeLevel,
  onSelect,
  levelStatuses,
  levelSummaries,
  levelData,
}: {
  activeLevel: 1 | 2 | 3 | 4 | 5;
  onSelect: (level: 1 | 2 | 3 | 4 | 5) => void;
  levelStatuses: Record<1 | 2 | 3 | 4 | 5, "healthy" | "attention" | "not_started">;
  levelSummaries: Record<1 | 2 | 3 | 4 | 5, string>;
  levelData: Record<1 | 2 | 3 | 4 | 5, any>;
}) {
  const delayByLevel: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 100,
    2: 300,
    3: 500,
    4: 700,
    5: 900,
  };

  return (
    <div className="relative px-0 md:px-8">
      <style>{`
        @keyframes build-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-soft {
          0%,100% { opacity: .65; }
          50% { opacity: 1; }
        }
      `}</style>

      <div className="absolute -left-14 top-3 bottom-8 hidden flex-col items-center justify-center md:flex">
        <div className="mb-2 h-0 w-0 border-l-[8px] border-r-[8px] border-b-[12px] border-l-transparent border-r-transparent border-b-[#F4D03F]" />
        <div
          className="relative h-[70%] w-[2px]"
          style={{ background: "linear-gradient(to top, #1B365D, #F4D03F)" }}
        />
        <span
          className="mt-3 text-[11px] font-semibold uppercase tracking-[3px] text-muted-foreground"
          style={{ writingMode: "vertical-lr", transform: "rotate(180deg)" }}
        >
          Build from here
        </span>
      </div>

      <div className="flex flex-col items-center gap-1.5 py-6">
        {LEVEL_META.map((lvl) => (
          <div key={lvl.id} className="w-full">
            <div className="flex justify-center">
              <div className={lvl.width}>
                <PyramidLevel
                  level={lvl.id}
                  title={lvl.title}
                  subtitle={lvl.subtitle}
                  status={levelStatuses[lvl.id]}
                  isActive={activeLevel === lvl.id}
                  onClick={() => onSelect(lvl.id)}
                  summary={levelSummaries[lvl.id]}
                  delayMs={delayByLevel[lvl.id]}
                />
              </div>
            </div>

            {lvl.id === 1 && (
              <div className="mt-1 flex items-center justify-center gap-1 text-[11px] font-bold uppercase tracking-[2px] text-[#1B365D]">
                <span style={{ animation: "pulse-soft 2s ease-in-out infinite" }}>▲</span>
                <span style={{ animation: "pulse-soft 2s ease-in-out infinite" }}>
                  Start Here - Build from the foundation up
                </span>
              </div>
            )}

            {activeLevel === lvl.id && (
              <div
                className="mx-auto mt-3 w-full max-w-[900px] rounded-xl border bg-white p-4 shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
                style={{ animation: "slide-down .3s ease" }}
              >
                <LevelDetailPanel level={lvl.id} data={levelData[lvl.id]} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

