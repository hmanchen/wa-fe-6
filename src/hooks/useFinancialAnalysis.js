import { useState, useRef, useCallback } from "react";
import { buildFinancialAnalysisPrompt } from "@/services/financialAnalysisPrompt";
import { runFinancialFreedomAnalysis } from "@/services/financialAnalysisService";

const ANALYSIS_STEPS = [
  { message: "Reading your financial profile...", duration: 1500 },
  { message: "Running budget audit vs benchmarks...", duration: 1800 },
  { message: "Analyzing housing strategy...", duration: 1800 },
  { message: "Checking debt structure...", duration: 1700 },
  { message: "Modeling retirement scenarios...", duration: 1800 },
  { message: "Finding hidden money...", duration: 1800 },
  { message: "Building action plan...", duration: 1600 },
  { message: "Finalizing your report...", duration: 1000 },
];

function hashString(value) {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) {
    h = (h << 5) - h + value.charCodeAt(i);
    h |= 0;
  }
  return String(h);
}

export function useFinancialAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ step: 0, message: "", percent: 0 });
  const cacheRef = useRef({});
  const stepTimerRef = useRef(null);

  const classifyError = (err) => {
    if (err?.type === "RATE_LIMIT" || err?.status === 429) {
      return { type: "RATE_LIMIT", message: "Analysis engine busy. Wait 30 seconds and try again." };
    }
    if (err?.type === "PARSE_ERROR") {
      return { type: "PARSE_ERROR", message: "Response was malformed. Please try again." };
    }
    if (err?.type === "AUTH_ERROR" || err?.status === 401) {
      return { type: "AUTH_ERROR", message: "API authentication failed. Contact support." };
    }
    if (err?.name === "TypeError" || err?.type === "NETWORK_ERROR") {
      return { type: "NETWORK_ERROR", message: "Connection failed. Check your internet and try again." };
    }
    return { type: "GENERIC", message: err?.message || "Analysis failed. Please try again." };
  };

  const startProgressAnimation = useCallback(() => {
    let stepIndex = 0;
    const advance = () => {
      if (stepIndex < ANALYSIS_STEPS.length) {
        const step = ANALYSIS_STEPS[stepIndex];
        setProgress({
          step: stepIndex,
          message: step.message,
          percent: Math.round((stepIndex / ANALYSIS_STEPS.length) * 90),
        });
        stepIndex += 1;
        stepTimerRef.current = setTimeout(advance, step.duration);
      }
    };
    advance();
  }, []);

  const stopProgressAnimation = useCallback(() => {
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    setProgress({ step: ANALYSIS_STEPS.length, message: "Complete!", percent: 100 });
  }, []);

  const runAnalysis = useCallback(
    async (clientData, fullAnalysis, healthScore) => {
      const prompt = buildFinancialAnalysisPrompt(clientData, fullAnalysis, healthScore);
      const cacheKey = clientData?.caseId
        ? `${clientData.caseId}:${hashString(prompt)}`
        : null;

      setIsLoading(true);
      setError(null);
      setResult(null);
      startProgressAnimation();

      try {
        const data = await runFinancialFreedomAnalysis(clientData.caseId, prompt);
        stopProgressAnimation();
        await new Promise((r) => setTimeout(r, 600));
        setResult(data);
      } catch (err) {
        stopProgressAnimation();
        setError(classifyError(err));
      } finally {
        setIsLoading(false);
      }
    },
    [startProgressAnimation, stopProgressAnimation]
  );

  const resetAnalysis = useCallback(() => {
    setResult(null);
    setError(null);
    setProgress({ step: 0, message: "", percent: 0 });
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
  }, []);

  const rerunAnalysis = useCallback(
    async (clientData, fullAnalysis, healthScore) => {
      if (clientData?.caseId) {
        for (const k of Object.keys(cacheRef.current)) {
          if (k.startsWith(`${clientData.caseId}:`)) delete cacheRef.current[k];
        }
      }
      resetAnalysis();
      await runAnalysis(clientData, fullAnalysis, healthScore);
    },
    [resetAnalysis, runAnalysis]
  );

  return {
    isLoading,
    result,
    error,
    progress,
    runAnalysis,
    resetAnalysis,
    rerunAnalysis,
  };
}
