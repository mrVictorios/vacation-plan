import { writable } from 'svelte/store';

export type AutoPlannerSettings = {
  useBridgeDays: boolean;
  maxConsecutiveVacationWeeks: number;
  maxConsecutiveWorkWeeks: number;
  replaceExisting: boolean;
  preferEvenSpread: boolean;
  respectSchoolHolidays: boolean;
  ignoredMonths: number[]; // 0-11 months to exclude from planning
};

const defaults: AutoPlannerSettings = {
  useBridgeDays: true,
  maxConsecutiveVacationWeeks: 2,
  maxConsecutiveWorkWeeks: 8,
  replaceExisting: true,
  preferEvenSpread: true,
  respectSchoolHolidays: false,
  ignoredMonths: [],
};

function safeGet(key: string): string | null { try { return localStorage.getItem(key); } catch { return null; } }
function safeSet(key: string, value: string) { try { localStorage.setItem(key, value); } catch {} }

function loadInitial(): AutoPlannerSettings {
  const raw = safeGet('planner:settings');
  if (!raw) return defaults;
  try {
    const obj = JSON.parse(raw) as Partial<AutoPlannerSettings>;
    const s: AutoPlannerSettings = {
      useBridgeDays: typeof obj.useBridgeDays === 'boolean' ? obj.useBridgeDays : defaults.useBridgeDays,
      maxConsecutiveVacationWeeks: Number.isFinite(obj.maxConsecutiveVacationWeeks as number) ? Math.max(1, Math.floor(obj.maxConsecutiveVacationWeeks as number)) : defaults.maxConsecutiveVacationWeeks,
      maxConsecutiveWorkWeeks: Number.isFinite(obj.maxConsecutiveWorkWeeks as number) ? Math.max(1, Math.floor(obj.maxConsecutiveWorkWeeks as number)) : defaults.maxConsecutiveWorkWeeks,
      replaceExisting: typeof obj.replaceExisting === 'boolean' ? obj.replaceExisting : defaults.replaceExisting,
      preferEvenSpread: typeof obj.preferEvenSpread === 'boolean' ? obj.preferEvenSpread : defaults.preferEvenSpread,
      respectSchoolHolidays: typeof obj.respectSchoolHolidays === 'boolean' ? obj.respectSchoolHolidays : defaults.respectSchoolHolidays,
      ignoredMonths: Array.isArray(obj.ignoredMonths) ? (obj.ignoredMonths as number[]).filter((m) => Number.isInteger(m) && m >= 0 && m <= 11) : defaults.ignoredMonths,
    };
    return s;
  } catch {
    return defaults;
  }
}

export const autoPlannerSettings = writable<AutoPlannerSettings>(loadInitial());
autoPlannerSettings.subscribe((v) => safeSet('planner:settings', JSON.stringify(v)));
