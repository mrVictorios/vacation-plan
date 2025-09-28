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

export const autoPlannerSettings = writable<AutoPlannerSettings>(defaults);
