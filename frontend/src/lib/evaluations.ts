import type { Evaluation } from "@/types";

// Media scorurilor evaluarilor care au un scor (optional doar cele finalizate), cu punctajul maxim mediu
export function averageScore(evaluations: Evaluation[], onlyCompleted = false) {
  const scored = evaluations.filter(e => Number(e.totalScore) > 0 && (!onlyCompleted || e.status === "completed"));
  if (scored.length === 0) return null;
  return {
    score: scored.reduce((s, e) => s + Number(e.totalScore), 0) / scored.length,
    max: scored.reduce((s, e) => s + Number(e.maxScore || 100), 0) / scored.length,
    count: scored.length,
  };
}
