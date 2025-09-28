import { toISODate, isWeekend } from './date';

export type AutoPlannerSettings = {
  useBridgeDays: boolean;
  maxConsecutiveVacationWeeks: number; // default 2
  maxConsecutiveWorkWeeks: number; // default 8
  preferEvenSpread?: boolean;
  respectSchoolHolidays?: boolean;
  ignoredMonths?: number[]; // months (0-11) to skip
};

export type AutoPlanInput = {
  year: number;
  budget: number; // number of vacation days we can assign
  holidays: Map<string, string>; // ISO -> name
  bridgeDays: Set<string>; // ISO strings (full set; may be ignored if useBridgeDays=false)
  settings: AutoPlannerSettings;
  schoolHolidays?: { start: Date; end: Date; name: string }[];
};

type DayInfo = { date: Date; iso: string; isWeekend: boolean; isHoliday: boolean; isWorking: boolean };
type Window = { start: number; end: number; needed: number; score: number; isoSet: Set<string>; midMonth: number; quarter: number };

export type VacationEntry = {
  startISO: string;
  endISO: string;
  durationDays: number;
  holidaysUsed: { iso: string; name: string }[];
};

export type AutoPlanResult = {
  days: Set<string>;
  schedule: VacationEntry[];
  summary: { usedVacationDays: number; availableVacationDays: number; score: number };
};

// Public API: compute a set of ISO dates representing selected vacation days
export function generateAutoPlan(input: AutoPlanInput): Set<string> {
  const { year, holidays, bridgeDays, budget, settings } = input;
  if (budget <= 0) return new Set();

  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const days = enumerateDays(start, end, holidays);

  let bridgesForScore: Set<string>;
  if (settings.useBridgeDays) {
    bridgesForScore = bridgeDays;
  } else {
    bridgesForScore = new Set<string>();
  }
  let excludeBridgeDays: Set<string>;
  if (settings.useBridgeDays) {
    excludeBridgeDays = new Set<string>();
  } else {
    excludeBridgeDays = bridgeDays;
  }
  const windows = enumerateWindows(days, settings, bridgesForScore, excludeBridgeDays);
  // Anchor-first: try to choose typical German breaks first (summer, Christmas)
  let school: { start: Date; end: Date; name: string }[];
  if (input.schoolHolidays) {
    school = input.schoolHolidays;
  } else {
    school = [];
  }
  const anchored = pickAnchors(days, windows, budget, settings, school);
  // Ensure one occurrence of a break with length equal to maxConsecutiveVacationWeeks (if budget allows)
  const withMax = pickMaxWeeksOccurrence(days, windows, budget - anchored.selected.size, settings, anchored.ranges);
  const preRanges = withMax.ranges;
  const preSelected = new Set<string>(anchored.selected);
  for (const d of withMax.selected) preSelected.add(d);
  const chosen = selectWindows(
    windows.filter((w) => !overlapsAny(w, preRanges)),
    budget - preSelected.size,
    settings,
    preRanges
  );
  // Merge anchors and window choices
  for (const d of preSelected) chosen.add(d);

  // If constraints on consecutive work weeks are violated, insert minimal windows
  let completed = fillLongWorkGaps(days, chosen, budget, settings, holidays, excludeBridgeDays);
  // Try to consume remaining budget by adding best adjacent/bridge candidates
  const remaining = budget - completed.size;
  if (remaining > 0) {
    let bridgeBonusSet: Set<string>;
    if (settings.useBridgeDays) {
      bridgeBonusSet = bridgeDays;
    } else {
      bridgeBonusSet = new Set<string>();
    }
    completed = fillRemaining(days, holidays, bridgeBonusSet, completed, remaining, settings, excludeBridgeDays);
  }
  return completed;
}

export function generateAutoPlanDetailed(input: AutoPlanInput): AutoPlanResult {
  const days = generateAutoPlan(input);
  const schedule = buildScheduleFromSelection(input.year, input.holidays, days);
  const score = evaluateRecreationScore(input.year, input.holidays, days);
  return {
    days,
    schedule,
    summary: { usedVacationDays: Array.from(days).length, availableVacationDays: input.budget, score },
  };
}

// Produce multiple variants by jittering window scores slightly and reselecting.
export function generateAutoPlanVariants(input: AutoPlanInput, count = 5): AutoPlanResult[] {
  const { year, holidays, bridgeDays, budget, settings } = input;
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const days = enumerateDays(start, end, holidays);
  let bridges: Set<string>;
  if (settings.useBridgeDays) {
    bridges = bridgeDays;
  } else {
    bridges = new Set<string>();
  }
  let excludeBridgeDays: Set<string>;
  if (settings.useBridgeDays) {
    excludeBridgeDays = new Set<string>();
  } else {
    excludeBridgeDays = bridgeDays;
  }
  const baseWindows = enumerateWindows(days, settings, bridges, excludeBridgeDays);

  const variants: AutoPlanResult[] = [];
  for (let i = 0; i < count; i++) {
    // Jitter window scores by up to ±10%
    const jittered = baseWindows.map(w => ({ ...w, score: w.score * (0.9 + Math.random() * 0.2) }));
    // Optionally flip even-spread preference for some variants to diversify
    let preferEven: boolean;
    if (settings.preferEvenSpread !== false) {
      preferEven = (i % 2 === 0);
    } else {
      preferEven = false;
    }
    const localSettings: AutoPlannerSettings = { ...settings, preferEvenSpread: preferEven };
    let school: { start: Date; end: Date; name: string }[];
    if (input.schoolHolidays) {
      school = input.schoolHolidays;
    } else {
      school = [];
    }
    const anchored = pickAnchors(days, jittered, budget, localSettings, school);
    const withMax = pickMaxWeeksOccurrence(days, jittered, budget - anchored.selected.size, localSettings, anchored.ranges);
    const preRanges = withMax.ranges;
    const preSelected = new Set<string>(anchored.selected);
    for (const d of withMax.selected) preSelected.add(d);
    const picked = selectWindows(
      jittered.filter((w) => !overlapsAny(w, preRanges)),
      budget - preSelected.size,
      localSettings,
      preRanges
    );
    for (const d of preSelected) picked.add(d);
    for (const d of anchored.selected) picked.add(d);
    let completed = fillLongWorkGaps(days, picked, budget, localSettings, holidays, excludeBridgeDays);
    const rem = budget - completed.size;
    if (rem > 0) {
      let bridgeBonusSet: Set<string>;
      if (localSettings.useBridgeDays) {
        bridgeBonusSet = bridges;
      } else {
        bridgeBonusSet = new Set<string>();
      }
      completed = fillRemaining(days, holidays, bridgeBonusSet, completed, rem, localSettings, excludeBridgeDays);
    }
    const schedule = buildScheduleFromSelection(year, holidays, completed);
    const score = evaluateRecreationScore(year, holidays, completed);
    variants.push({ days: completed, schedule, summary: { usedVacationDays: completed.size, availableVacationDays: budget, score } });
  }
  // Sort by score desc
  variants.sort((a, b) => b.summary.score - a.summary.score);
  return variants;
}

function enumerateDays(start: Date, end: Date, holidays: Map<string, string>): DayInfo[] {
  const out: DayInfo[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = toISODate(d);
    const weekend = isWeekend(d);
    const holiday = holidays.has(iso);
    out.push({ date: new Date(d), iso, isWeekend: weekend, isHoliday: holiday, isWorking: !weekend && !holiday });
  }
  return out;
}

function enumerateWindows(
  days: DayInfo[],
  settings: AutoPlannerSettings,
  bridgeDaysForScore: Set<string>,
  excludeBridgeDays: Set<string>
): Window[] {
  const maxLen = settings.maxConsecutiveVacationWeeks * 7 + 2; // allow small spill over weekends
  const minLen = 7; // prefer long-term vacations (>= 7 contiguous days off)
  const ignored = new Set<number>(settings.ignoredMonths ?? []);
  const res: Window[] = [];
  for (let i = 0; i < days.length; i++) {
    for (let L = minLen; L <= maxLen && i + L <= days.length; L++) {
      const slice = days.slice(i, i + L);
      const needed = slice.reduce((a, d) => a + (d.isWorking ? 1 : 0), 0);
      if (needed === 0) continue;
      // base score with stronger encouragement for crossing the 7-day threshold
      const totalLen = L;
      let score = totalLen < 7 ? totalLen * 0.5 : (totalLen === 7 ? 8 : 8 + (totalLen - 7) * 0.5);
      // weekend extension preference
      const startDow = slice[0].date.getDay();
      const endDow = slice[slice.length - 1].date.getDay();
      if (startDow === 1) score += 0.4; // Monday start
      if (endDow === 5) score += 0.4; // Friday end
      // bridge day usage
      if (bridgeDaysForScore.size > 0) {
        const bcount = slice.reduce((a, d) => a + (bridgeDaysForScore.has(d.iso) ? 1 : 0), 0);
        score += bcount * 0.8;
      }
      // month balance: moderate bonus for spring/summer/autumn over clustering in one season
      const midDate = slice[Math.floor(slice.length / 2)].date;
      const mid = midDate.getMonth();
      const seasonal = seasonWeight(mid);
      score += seasonal;

      // Skip if any working day within the window falls into an ignored month
      let includesIgnored = false;
      for (const di of slice) {
        if (di.isWorking) {
          const month = di.date.getMonth();
          if (ignored.has(month)) {
            includesIgnored = true;
            break;
          }
          if (excludeBridgeDays.size > 0 && excludeBridgeDays.has(di.iso)) {
            includesIgnored = true;
            break;
          }
        }
      }
      if (includesIgnored) {
        continue;
      }

      const isoSet = new Set<string>(slice.filter((d) => d.isWorking).map((d) => d.iso));
      // prefer windows that require fewer vacation days for the benefit
      score = score / needed;
      if (!ignored.has(mid)) {
        res.push({ start: i, end: i + L - 1, needed, score, isoSet, midMonth: mid, quarter: Math.floor(mid / 3) });
      }
    }
  }
  // sort by score, break ties by fewer needed days then earlier start
  res.sort((a, b) => (b.score - a.score) || (a.needed - b.needed) || (a.start - b.start));
  return res;
}

function seasonWeight(month: number): number {
  // Encourage spread: slight preference for May–Sep windows, but not mandatory
  if (month >= 4 && month <= 8) return 0.4; // late spring/summer
  if (month === 11 || month <= 1) return 0.1; // deep winter small boost for short breaks
  return 0.2; // neutral seasons
}

function selectWindows(
  windows: Window[],
  budget: number,
  settings: AutoPlannerSettings,
  preRanges: { start: number; end: number }[] = []
): Set<string> {
  const picked = new Set<string>();
  const ranges: { start: number; end: number }[] = [...preRanges];
  let remaining = budget;
  const minGap = 21; // ~3 weeks gap between breaks to avoid clustering

  // If even spread preferred, first pick one high-value window per quarter when possible
  if (settings.preferEvenSpread) {
    const chosenQuarters = new Set<number>();
    for (let q = 0; q < 4 && remaining > 0; q++) {
      const candidate = windows
        .filter(w => w.quarter === q && Math.ceil((w.end - w.start + 1) / 7) <= settings.maxConsecutiveVacationWeeks && w.needed <= remaining)
        .sort((a, b) => b.score - a.score)[0];
      if (!candidate) continue;
      // gap/overlap check
      let ok = true;
      for (const r of ranges) {
        const overlap = !(candidate.end < r.start || candidate.start > r.end);
        const gap = Math.min(Math.abs(candidate.start - r.end), Math.abs(r.start - candidate.end));
        if (overlap || gap < minGap) { ok = false; break; }
      }
      if (ok && !chosenQuarters.has(q)) {
        for (const iso of candidate.isoSet) picked.add(iso);
        ranges.push({ start: candidate.start, end: candidate.end });
        remaining -= candidate.needed;
        chosenQuarters.add(q);
      }
    }
  }

  for (const w of windows) {
    if (remaining <= 0) break;
    if (w.needed > remaining) continue;
    // respect max consecutive vacation weeks
    const lengthWeeks = Math.ceil((w.end - w.start + 1) / 7);
    if (lengthWeeks > settings.maxConsecutiveVacationWeeks) continue;
    // overlap and clustering check
    let ok = true;
    for (const r of ranges) {
      const overlap = !(w.end < r.start || w.start > r.end);
      const gap = Math.min(Math.abs(w.start - r.end), Math.abs(r.start - w.end));
      if (overlap || gap < minGap) { ok = false; break; }
    }
    if (!ok) continue;
    for (const iso of w.isoSet) picked.add(iso);
    ranges.push({ start: w.start, end: w.end });
    remaining -= w.needed;
  }
  return picked;
}

function fillLongWorkGaps(
  days: DayInfo[],
  current: Set<string>,
  budget: number,
  settings: AutoPlannerSettings,
  holidays: Map<string, string>,
  excludeBridgeDays: Set<string>
): Set<string> {
  const out = new Set(current);
  const maxWork = settings.maxConsecutiveWorkWeeks * 7;
  if (maxWork <= 0) return out;
  let remaining = budget - out.size;
  if (remaining <= 0) return out;

  // Build off calendar (weekends/holidays + selected)
  const off = new Set<string>();
  for (const d of days) if (!d.isWorking || out.has(d.iso)) off.add(d.iso);

  // Find long stretches of pure workdays and add a single day near the middle
  let i = 0;
  while (i < days.length && remaining > 0) {
    // skip existing off days
    while (i < days.length && off.has(days[i].iso)) i++;
    const start = i;
    while (i < days.length && !off.has(days[i].iso) && days[i].isWorking) i++;
    const end = i - 1;
    const runLen = end >= start ? (end - start + 1) : 0;
    if (runLen > maxWork) {
      const mid = start + Math.floor(runLen / 2);
      const candidate = days
        .slice(Math.max(start, mid - 2), Math.min(end + 1, mid + 3))
        .find((d) => {
          if (!d.isWorking) return false;
          if (settings.ignoredMonths && settings.ignoredMonths.includes(d.date.getMonth())) return false;
          if (excludeBridgeDays.size > 0 && excludeBridgeDays.has(d.iso)) return false;
          return true;
        });
      if (candidate && !out.has(candidate.iso)) {
        out.add(candidate.iso);
        remaining--;
        off.add(candidate.iso);
      }
    }
  }
  return out;
}

// Greedy fill to consume remaining budget, prioritizing days that attach to off blocks and bridge opportunities.
function fillRemaining(
  days: DayInfo[],
  holidays: Map<string, string>,
  bridgeDays: Set<string>,
  current: Set<string>,
  remaining: number,
  settings?: AutoPlannerSettings,
  excludeBridgeDays?: Set<string>,
): Set<string> {
  const out = new Set(current);
  if (remaining <= 0) return out;

  // Build off set including current
  const off = new Set<string>();
  for (const d of days) if (!d.isWorking || out.has(d.iso)) off.add(d.iso);

  type Cand = { iso: string; score: number };
  const cands: Cand[] = [];
  for (let i = 0; i < days.length; i++) {
    const d = days[i];
    if (!d.isWorking) continue;
    if (out.has(d.iso)) continue;
    if (settings?.ignoredMonths && settings.ignoredMonths.includes(d.date.getMonth())) continue;
    if (excludeBridgeDays && excludeBridgeDays.size > 0 && excludeBridgeDays.has(d.iso)) continue;
    const prev = days[i - 1];
    const next = days[i + 1];
    let score = 0;
    // Attach to existing off days strongly
    if (prev && off.has(prev.iso)) score += 2.0;
    if (next && off.has(next.iso)) score += 2.0;
    // Bridge day bonus
    if (bridgeDays.has(d.iso)) score += 1.5;
    // Prefer Friday/Monday to extend weekends
    const dow = d.date.getDay();
    if (dow === 1 || dow === 5) score += 0.8;
    // Light seasonal bonus to spread
    const m = d.date.getMonth();
    score += (m >= 4 && m <= 8) ? 0.3 : 0.1;
    cands.push({ iso: d.iso, score });
  }
  cands.sort((a, b) => b.score - a.score);
  for (const c of cands) {
    if (remaining <= 0) break;
    if (out.has(c.iso)) continue;
    out.add(c.iso);
    remaining--;
  }
  return out;
}

// Anchors: aim for one summer break (Jul–Aug) and one Christmas break (late Dec)
function pickAnchors(days: DayInfo[], windows: Window[], budget: number, settings: AutoPlannerSettings, schoolHolidays: { start: Date; end: Date; name: string }[]) {
  const ranges: { start: number; end: number }[] = [];
  const selected = new Set<string>();
  let remaining = budget;
  // helper: try pick best window matching predicate
  const tryPick = (pred: (w: Window) => boolean) => {
    const candidates = windows
      .filter(pred)
      .sort((a, b) => b.score - a.score);
    for (const w of candidates) {
      if (w.needed > remaining) continue;
      if (Math.ceil((w.end - w.start + 1) / 7) > settings.maxConsecutiveVacationWeeks) continue;
      if (overlapsAny(w, ranges)) continue;
      for (const iso of w.isoSet) selected.add(iso);
      ranges.push({ start: w.start, end: w.end });
      remaining -= w.needed;
      return true;
    }
    return false;
  };

  if (settings.respectSchoolHolidays && schoolHolidays.length > 0) {
    // Choose window with largest overlap with any school holiday period first
    const scored = windows.map(w => {
      const overlap = overlapWithSchoolHoliday(w, days, schoolHolidays);
      return { w, overlap };
    }).filter(x => x.overlap > 0).sort((a, b) => b.overlap - a.overlap || b.w.score - a.w.score);
    for (const { w } of scored) {
      if (remaining <= 0) break;
      if (w.needed > remaining) continue;
      if (Math.ceil((w.end - w.start + 1) / 7) > settings.maxConsecutiveVacationWeeks) continue;
      if (overlapsAny(w, ranges)) continue;
      for (const iso of w.isoSet) selected.add(iso);
      ranges.push({ start: w.start, end: w.end });
      remaining -= w.needed;
      break;
    }
  }

  // Summer anchor: window whose mid-month is July/August
  tryPick((w) => w.midMonth === 6 || w.midMonth === 7);

  // Christmas anchor: window ending near end of December
  tryPick((w) => {
    const endDate = days[w.end].date;
    return endDate.getMonth() === 11 && endDate.getDate() >= 20;
  });

  return { selected, ranges };
}

// Try to select one window whose length in weeks equals maxConsecutiveVacationWeeks
function pickMaxWeeksOccurrence(
  days: DayInfo[],
  windows: Window[],
  remainingBudget: number,
  settings: AutoPlannerSettings,
  ranges: { start: number; end: number }[]
) {
  const selected = new Set<string>();
  const newRanges = [...ranges];
  const maxWeeks = settings.maxConsecutiveVacationWeeks;
  if (maxWeeks <= 0) return { selected, ranges: newRanges };
  const candidates = windows
    .filter(w => {
      const weeks = Math.ceil((w.end - w.start + 1) / 7);
      if (weeks !== maxWeeks) return false;
      if (w.needed > remainingBudget) return false;
      if (overlapsAny(w, newRanges)) return false;
      return true;
    })
    .sort((a, b) => b.score - a.score);
  if (candidates.length > 0) {
    const best = candidates[0];
    for (const iso of best.isoSet) selected.add(iso);
    newRanges.push({ start: best.start, end: best.end });
  }
  return { selected, ranges: newRanges };
}

function overlapWithSchoolHoliday(w: Window, days: DayInfo[], schoolHolidays: { start: Date; end: Date; name: string }[]): number {
  const ws = days[w.start].date.getTime();
  const we = days[w.end].date.getTime();
  let best = 0;
  for (const sh of schoolHolidays) {
    const s = sh.start.getTime();
    const e = sh.end.getTime();
    const ov = Math.max(0, Math.min(we, e) - Math.max(ws, s));
    const daysOverlap = Math.ceil(ov / 86400000);
    if (daysOverlap > best) best = daysOverlap;
  }
  return best;
}

function overlapsAny(w: Window, ranges: { start: number; end: number }[]): boolean {
  for (const r of ranges) {
    const overlap = !(w.end < r.start || w.start > r.end);
    if (overlap) return true;
  }
  return false;
}

// Build schedule entries from selected days. A vacation entry is a contiguous block of off days
// (weekends/holidays + selected vacation days) that contains at least one selected vacation day.
export function buildScheduleFromSelection(year: number, holidays: Map<string, string>, selected: Set<string>): VacationEntry[] {
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const result: VacationEntry[] = [];
  let curStart: Date | null = null;
  let curEnd: Date | null = null;
  let hasSelected = false;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = toISODate(d);
    const off = selected.has(iso) || isWeekend(d) || holidays.has(iso);
    if (off) {
      if (!curStart) { curStart = new Date(d); hasSelected = selected.has(iso); }
      curEnd = new Date(d);
      if (selected.has(iso)) hasSelected = true;
    } else {
      if (curStart && curEnd && hasSelected) {
        const entry = makeEntry(curStart, curEnd, holidays);
        result.push(entry);
      }
      curStart = curEnd = null; hasSelected = false;
    }
  }
  if (curStart && curEnd && hasSelected) result.push(makeEntry(curStart, curEnd, holidays));
  return result;
}

function makeEntry(start: Date, end: Date, holidays: Map<string, string>): VacationEntry {
  const holidaysUsed: { iso: string; name: string }[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = toISODate(d);
    const name = holidays.get(iso);
    if (name) holidaysUsed.push({ iso, name });
  }
  const durationDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
  return { startISO: toISODate(start), endISO: toISODate(end), durationDays, holidaysUsed };
}

function evaluateRecreationScore(year: number, holidays: Map<string, string>, selected: Set<string>): number {
  // Simple score based on breaks built from selection
  const breaks = buildScheduleFromSelection(year, holidays, selected);
  let score = 0;
  for (const b of breaks) {
    const len = b.durationDays;
    score += len <= 7 ? len : 7 + (len - 7) * 0.5;
    // bonus if it includes holidays (smart leverage)
    score += Math.min(2, b.holidaysUsed.length) * 0.5;
  }
  // distribution: penalize clustering using variance of break start months
  const byMonth = Array(12).fill(0);
  for (const b of breaks) {
    const m = new Date(b.startISO).getMonth();
    byMonth[m]++;
  }
  const mean = byMonth.reduce((a, b) => a + b, 0) / 12;
  const variance = byMonth.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 12;
  score -= variance;
  return score;
}
