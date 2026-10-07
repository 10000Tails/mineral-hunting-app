import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { COMMODITY_GROUPS, groupForCodes } from '../config/commodities';
import { DEV_STATUSES, type DevStatus, type MineralSite } from '../data/types';

interface FiltersValue {
  groups: Set<string>;
  statuses: Set<DevStatus>;
  toggleGroup: (key: string) => void;
  toggleStatus: (status: DevStatus) => void;
  setAllGroups: (on: boolean) => void;
  reset: () => void;
  matches: (site: MineralSite) => boolean;
  activeCount: number;
}

const allGroups = () => new Set(COMMODITY_GROUPS.map((g) => g.key));
const allStatuses = () => new Set<DevStatus>(DEV_STATUSES);

const FiltersContext = createContext<FiltersValue | null>(null);

function toggled<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState(allGroups);
  const [statuses, setStatuses] = useState(allStatuses);

  const toggleGroup = useCallback((key: string) => setGroups((s) => toggled(s, key)), []);
  const toggleStatus = useCallback((st: DevStatus) => setStatuses((s) => toggled(s, st)), []);
  const setAllGroups = useCallback((on: boolean) => setGroups(on ? allGroups() : new Set()), []);
  const reset = useCallback(() => {
    setGroups(allGroups());
    setStatuses(allStatuses());
  }, []);

  const value = useMemo<FiltersValue>(
    () => ({
      groups,
      statuses,
      toggleGroup,
      toggleStatus,
      setAllGroups,
      reset,
      matches: (site) =>
        statuses.has(site.devStatus) && groups.has(groupForCodes(site.commodityCodes).key),
      activeCount:
        COMMODITY_GROUPS.length - groups.size + (DEV_STATUSES.length - statuses.size),
    }),
    [groups, statuses, toggleGroup, toggleStatus, setAllGroups, reset]
  );

  return <FiltersContext.Provider value={value}>{children}</FiltersContext.Provider>;
}

export function useFilters(): FiltersValue {
  const ctx = useContext(FiltersContext);
  if (!ctx) throw new Error('useFilters must be used inside FiltersProvider');
  return ctx;
}
