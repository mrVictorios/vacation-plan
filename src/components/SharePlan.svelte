<script lang="ts">
  import { currentYear } from '../stores/year';
  import { region } from '../stores/region';
  import { totalDays, vacationDays } from '../stores/vacation';
  import { locale } from '../stores/locale';
  import LZString from 'lz-string';
  import { importPlanFromHashAndApply, runsToDates } from '../lib/share';

  type PlanBundle = {
    year: number;
    region: string;
    totalDays: number;
    selected: string[];
    schema: number;
  };

  function makeBundle(): PlanBundle {
    return {
      year: $currentYear,
      region: $region,
      totalDays: $totalDays,
      selected: Array.from($vacationDays).sort(),
      schema: 1,
    };
  }

  // Compact runs encoding: convert selected dates (ISO) into day offsets from Jan 1, then RLE runs
  function toDayIndex(iso: string): number {
    const d = new Date(iso);
    const start = new Date($currentYear, 0, 1);
    return Math.floor((d.getTime() - start.getTime()) / 86400000);
  }

  function buildRuns(dates: string[]): number[][] {
    const idx = dates.map(toDayIndex).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
    const runs: number[][] = [];
    let i = 0;
    while (i < idx.length) {
      const start = idx[i];
      let len = 1;
      let j = i + 1;
      while (j < idx.length && idx[j] === idx[j - 1] + 1) { len++; j++; }
      runs.push([start, len]);
      i = j;
    }
    return runs;
  }

  // runsToDates is imported from lib/share

  function downloadJSON() {
    const data = makeBundle();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vacation-plan-${data.year}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function toBase64Url(str: string): string {
    // Encode UTF-8 safely
    const enc = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16)));
    return btoa(enc).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function fromBase64Url(b64: string): string {
    const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
    const txt = atob(b64.replace(/-/g, '+').replace(/_/g, '/') + pad);
    let out = '';
    for (let i = 0; i < txt.length; i++) {
      const c = txt.charCodeAt(i).toString(16).padStart(2, '0');
      out += '%' + c;
    }
    return decodeURIComponent(out);
  }

  let importText = '';
  let importError: string | null = null;

  function copyLink() {
    const data = makeBundle();
    // Compact payload using runs
    const runs = buildRuns(data.selected);
    const compact = { y: data.year, rg: data.region, td: data.totalDays, r: runs, s: 2 };
    const json = JSON.stringify(compact);
    const payload = 'z:' + LZString.compressToEncodedURIComponent(json);
    const base = window.location.origin + window.location.pathname;
    const link = base + '#plan=' + payload;
    void navigator.clipboard.writeText(link);
  }

  function onFileSelected(e: Event) {
    const input = e.target as HTMLInputElement | null;
    if (!input || !input.files || input.files.length === 0) return;
    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        importText = reader.result;
      }
    };
    reader.readAsText(file);
  }

  function applyBundle(data: PlanBundle) {
    if (typeof data.year === 'number') currentYear.set(data.year);
    if (typeof data.region === 'string') region.set(data.region);
    if (typeof data.totalDays === 'number') totalDays.set(Math.max(0, Math.floor(data.totalDays)));
    if (Array.isArray(data.selected)) {
      const set = new Set<string>();
      for (const d of data.selected) set.add(d);
      vacationDays.set(set);
    }
  }

  function importFromText() {
    importError = null;
    let data: unknown;
    try {
      data = JSON.parse(importText);
    } catch (e) {
      importError = 'Invalid JSON';
      return;
    }
    const b = data as Partial<PlanBundle>;
    if (!b || typeof b !== 'object' || typeof b.year !== 'number' || !Array.isArray(b.selected)) {
      importError = 'Unsupported plan format';
      return;
    }
    applyBundle(b as PlanBundle);
  }

  function importFromHash() {
    importError = null;
    try {
      const applied = importPlanFromHashAndApply(window.location.hash || '');
      if (!applied) importError = 'Unsupported or empty link';
    } catch {
      importError = 'Failed to parse plan from link';
    }
  }

  // Link import now handled in App on mount (global). Keep manual import available.
</script>

<div class="space-y-3">
  <h3 class="text-base font-semibold">{ $locale === 'de-DE' ? 'Plan teilen' : 'Share plan' }</h3>
  <div class="flex flex-wrap gap-2">
    <button class="px-3 py-2 rounded-lg border border-zinc-300 dark:border-md-outline hover:bg-zinc-50 dark:hover:bg-zinc-800" on:click={downloadJSON}>
      { $locale === 'de-DE' ? 'Export als JSON' : 'Export JSON' }
    </button>
    <button class="px-3 py-2 rounded-lg bg-zinc-900 text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-md-primary" on:click={copyLink}>
      { $locale === 'de-DE' ? 'Link kopieren' : 'Copy link' }
    </button>
    <label class="px-3 py-2 rounded-lg border border-zinc-300 dark:border-md-outline cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800">
      <input type="file" accept="application/json" class="hidden" on:change={onFileSelected}>
      { $locale === 'de-DE' ? 'Datei importieren' : 'Import file' }
    </label>
  </div>
  <div class="space-y-2">
    <label class="block text-xs text-zinc-600 dark:text-zinc-300">{ $locale === 'de-DE' ? 'Plan einfügen (JSON)' : 'Paste plan (JSON)' }</label>
    <textarea class="w-full h-24 border border-zinc-300 dark:border-md-outline rounded p-2 bg-white dark:bg-md-surfaceDark" bind:value={importText} />
    <div class="flex items-center gap-2">
      <button class="px-3 py-2 rounded-lg bg-md-primary text-md-onPrimary hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-md-primary" on:click={importFromText}>
        { $locale === 'de-DE' ? 'Importieren' : 'Import' }
      </button>
      {#if importError}
        <span class="text-xs text-red-600">{importError}</span>
      {/if}
    </div>
  </div>
</div>
