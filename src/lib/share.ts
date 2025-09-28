import LZString from 'lz-string';

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

