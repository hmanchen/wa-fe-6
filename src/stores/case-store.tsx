"use client";

import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
} from "react";
import type { DiscoveryStep } from "@/types";

interface CaseStoreState {
  activeCaseId: string | null;
  activeStep: DiscoveryStep | null;
}

type CaseStoreAction =
  | { type: "SET_ACTIVE_CASE_ID"; payload: string | null }
  | { type: "SET_ACTIVE_STEP"; payload: DiscoveryStep | null }
  | { type: "RESET" };

const initialState: CaseStoreState = {
  activeCaseId: null,
  activeStep: null,
};

function caseStoreReducer(
  state: CaseStoreState,
  action: CaseStoreAction
): CaseStoreState {
  switch (action.type) {
    case "SET_ACTIVE_CASE_ID":
      return { ...state, activeCaseId: action.payload };
    case "SET_ACTIVE_STEP":
      return { ...state, activeStep: action.payload };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

interface CaseStoreContextValue {
  state: CaseStoreState;
  setActiveCaseId: (id: string | null) => void;
  setActiveStep: (step: DiscoveryStep | null) => void;
  resetCaseStore: () => void;
}

const CaseStoreContext = createContext<CaseStoreContextValue | null>(null);

export function CaseStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(caseStoreReducer, initialState);

  const setActiveCaseId = (id: string | null) => {
    dispatch({ type: "SET_ACTIVE_CASE_ID", payload: id });
  };

  const setActiveStep = (step: DiscoveryStep | null) => {
    dispatch({ type: "SET_ACTIVE_STEP", payload: step });
  };

  const resetCaseStore = () => {
    dispatch({ type: "RESET" });
  };

  const value: CaseStoreContextValue = {
    state,
    setActiveCaseId,
    setActiveStep,
    resetCaseStore,
  };

  return (
    <CaseStoreContext.Provider value={value}>
      {children}
    </CaseStoreContext.Provider>
  );
}

export function useCaseStore() {
  const context = useContext(CaseStoreContext);
  if (!context) {
    throw new Error("useCaseStore must be used within a CaseStoreProvider");
  }
  return context;
}
