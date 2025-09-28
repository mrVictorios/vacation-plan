import LZString from 'lz-string';
import { currentYear } from '../stores/year';
import { region } from '../stores/region';
import { totalDays, vacationDays } from '../stores/vacation';

export type CompactPlan = { y: number; rg: string; td: number; r: number[][]; s: number };

function toDayIndex(iso: string, year: number): number {
  const date = new Date(iso);
  const start = new Date(year, 0, 1);
  return Math.floor((date.getTime() - start.getTime()) / 86400000);
}

export function buildCompactRuns(selected: string[], year: number): number[][] {
  const indices = selected.map((iso) => toDayIndex(iso, year)).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  const runs: number[][] = [];
  let i = 0;
  while (i < indices.length) {
    const start = indices[i];
    let length = 1;
    let j = i + 1;
    while (j < indices.length && indices[j] === indices[j - 1] + 1) { length++; j++; }
    runs.push([start, length]);
    i = j;
  }
  return runs;
}

export function buildSharePayload(year: number, region: string, totalDays: number, selected: string[]): string {
  const runs = buildCompactRuns(selected, year);
  const compact: CompactPlan = { y: year, rg: region, td: totalDays, r: runs, s: 2 };
  const json = JSON.stringify(compact);
  return 'z:' + LZString.compressToEncodedURIComponent(json);
}

export type PlanBundle = {
  year: number;
  region: string;
  totalDays: number;
  selected: string[];
  schema: number;
};

export function runsToDates(year: number, runs: number[][]): string[] {
  const out: string[] = [];
  for (const [start, len] of runs) {
    for (let k = 0; k < len; k++) {
      const d = new Date(year, 0, 1);
      d.setDate(d.getDate() + start + k);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      out.push(`${y}-${m}-${day}`);
    }
  }
  return out;
}

export function tryParsePlanFromHash(hash: string): PlanBundle | null {
  const m = (hash || '').match(/plan=([^&]+)/);
  if (!m) return null;
  try {
    const raw = m[1];
    if (raw.startsWith('z:')) {
      const compressed = raw.slice(2);
      const json = LZString.decompressFromEncodedURIComponent(compressed) || '';
      const obj = JSON.parse(json) as any;
      if (obj && typeof obj === 'object' && Array.isArray(obj.r) && typeof obj.y === 'number') {
        const selected = runsToDates(obj.y, obj.r as number[][]);
        return {
          year: obj.y,
          region: obj.rg || 'SN',
          totalDays: typeof obj.td === 'number' ? obj.td : 30,
          selected,
          schema: obj.s || 2,
        };
      }
      // Fallback to full bundle format
      if (obj && typeof obj.year === 'number' && Array.isArray(obj.selected)) {
        return obj as PlanBundle;
      }
      return null;
    }
    // Support legacy uncompressed JSON after plan=
    const fallback = JSON.parse(decodeURIComponent(raw));
    if (fallback && typeof fallback.year === 'number' && Array.isArray(fallback.selected)) {
      return fallback as PlanBundle;
    }
    return null;
  } catch {
    return null;
  }
}

export function applyPlanBundle(b: PlanBundle) {
  if (typeof b.year === 'number') currentYear.set(b.year);
  if (typeof b.region === 'string') region.set(b.region);
  if (typeof b.totalDays === 'number') totalDays.set(Math.max(0, Math.floor(b.totalDays)));
  if (Array.isArray(b.selected)) {
    const set = new Set<string>();
    for (const d of b.selected) set.add(d);
    vacationDays.set(set);
  }
}

export function importPlanFromHashAndApply(hash: string): boolean {
  const parsed = tryParsePlanFromHash(hash);
  if (!parsed) return false;
  applyPlanBundle(parsed);
  return true;
}
