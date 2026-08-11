import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import { HISTORY_LOGS } from "@/data/historyMock";

type Store = {
  filter: string;
  setFilter: (v: string) => void;
  baseId: string;
  setBaseId: (v: string) => void;
  compareId: string;
  setCompareId: (v: string) => void;
  split: number;
  setSplit: (v: number) => void;
  showDiff: boolean;
  setShowDiff: (v: boolean) => void;
  logs: string[];
  statusLabel: string;
  setStatusLabel: (v: string) => void;
};

const Ctx = createContext<Store | null>(null);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [filter, setFilter] = useState("All");
  const [baseId, setBaseId] = useState("v1.1");
  const [compareId, setCompareId] = useState("v1.4");
  const [split, setSplit] = useState(50);
  const [showDiff, setShowDiff] = useState(true);
  const [statusLabel, setStatusLabel] = useState("Ready");

  const value = useMemo<Store>(
    () => ({
      filter,
      setFilter,
      baseId,
      setBaseId,
      compareId,
      setCompareId,
      split,
      setSplit,
      showDiff,
      setShowDiff,
      logs: HISTORY_LOGS,
      statusLabel,
      setStatusLabel,
    }),
    [filter, baseId, compareId, split, showDiff, statusLabel],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useHistory() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useHistory must be used inside HistoryProvider");
  return ctx;
}