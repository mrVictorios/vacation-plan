<script lang="ts">
  import { currentYear } from '../stores/year';
  import { locale } from '../stores/locale';
  import { autoPlannerSettings } from '../stores/autoPlanner';
  import { holidaysStore, bridgeDaysStore } from '../stores/holidays';
  import { remainingDays, totalDays, vacationDays } from '../stores/vacation';
  import { generateAutoPlanDetailed, generateAutoPlanVariants, type AutoPlanResult } from '../lib/auto_planner';
  import { region } from '../stores/region';
  import { getSchoolHolidays } from '../lib/school_holidays';

  let preview: AutoPlanResult | null = null;
  let variants: AutoPlanResult[] = [];
  let variantIndex = 0;

  function generatePreview() {
    const year = $currentYear;
    const holidays = $holidaysStore;
    const bridges = $bridgeDaysStore;
    const budget = $autoPlannerSettings.replaceExisting ? $totalDays : $remainingDays;
    const school = $autoPlannerSettings.respectSchoolHolidays ? getSchoolHolidays(year, $region) : [];
    const input = {
      year,
      holidays,
      bridgeDays: bridges,
      budget: Math.max(0, budget),
      settings: {
        useBridgeDays: $autoPlannerSettings.useBridgeDays,
        maxConsecutiveVacationWeeks: $autoPlannerSettings.maxConsecutiveVacationWeeks,
        maxConsecutiveWorkWeeks: $autoPlannerSettings.maxConsecutiveWorkWeeks,
        preferEvenSpread: $autoPlannerSettings.preferEvenSpread,
        respectSchoolHolidays: $autoPlannerSettings.respectSchoolHolidays,
        ignoredMonths: $autoPlannerSettings.ignoredMonths,
        minBreakDays: $autoPlannerSettings.minBreakDays,
      },
      schoolHolidays: school,
    };
    variants = generateAutoPlanVariants(input, 5, Date.now());
    variantIndex = 0;
    if (variants.length > 0) {
      preview = variants[0];
    } else {
      preview = null;
    }
  }

  function applyPreview() {
    let current: AutoPlanResult | null;
    if (preview) {
      current = preview;
    } else {
      current = null;
    }
    if (current === null) return;
    const plan = current.days;
    if (plan.size === 0) return;
    vacationDays.update((s) => {
      const base = $autoPlannerSettings.replaceExisting ? new Set<string>() : new Set(s);
      for (const iso of plan) base.add(iso);
      return base;
    });
  }

  function onIgnoreMonthChange(month: number, e: Event) {
    const tgt = e.target as HTMLInputElement | null;
    let checked = false;
    if (tgt && typeof tgt.checked === 'boolean') {
      checked = tgt.checked;
    }
    autoPlannerSettings.update((s) => {
      const set = new Set<number>(s.ignoredMonths);
      if (checked) {
        set.add(month);
      } else {
        set.delete(month);
      }
      const next = Array.from(set).sort((a, b) => a - b);
      return { ...s, ignoredMonths: next };
    });
  }
</script>

<div class="space-y-3">
  <h3 class="text-base font-semibold">{ $locale === 'de-DE' ? 'Automatische Planung' : 'Automatic Planning' }</h3>
  <div class="grid grid-cols-2 gap-2 text-sm">
    <label class="col-span-2 inline-flex items-center gap-2">
      <input type="checkbox" bind:checked={$autoPlannerSettings.useBridgeDays} class="accent-md-primary">
      <span class="text-zinc-700 dark:text-zinc-300">{ $locale === 'de-DE' ? 'Brückentage nutzen' : 'Use bridge days' }</span>
    </label>
    <label class="flex items-center justify-between gap-2">
      <span class="text-zinc-700 dark:text-zinc-300">{ $locale === 'de-DE' ? 'max. Urlaubwochen in Folge' : 'Max vacation weeks in a row' }</span>
      <input type="number" min="1" class="w-20 border border-zinc-300 dark:border-md-outline rounded px-2 py-1 bg-white dark:bg-md-surfaceDark" bind:value={$autoPlannerSettings.maxConsecutiveVacationWeeks}>
    </label>
    <label class="flex items-center justify-between gap-2">
      <span class="text-zinc-700 dark:text-zinc-300">{ $locale === 'de-DE' ? 'max. Arbeitswochen in Folge' : 'Max work weeks in a row' }</span>
      <input type="number" min="1" class="w-20 border border-zinc-300 dark:border-md-outline rounded px-2 py-1 bg-white dark:bg-md-surfaceDark" bind:value={$autoPlannerSettings.maxConsecutiveWorkWeeks}>
    </label>
    <label class="flex items-center justify-between gap-2">
      <span class="text-zinc-700 dark:text-zinc-300">{ $locale === 'de-DE' ? 'min. Urlaubstage am Stück' : 'Min break days' }</span>
      <input type="number" min="1" class="w-20 border border-zinc-300 dark:border-md-outline rounded px-2 py-1 bg-white dark:bg-md-surfaceDark" bind:value={$autoPlannerSettings.minBreakDays}>
    </label>
    <label class="col-span-2 inline-flex items-center gap-2">
      <input type="checkbox" bind:checked={$autoPlannerSettings.replaceExisting} class="accent-md-primary">
      <span class="text-zinc-700 dark:text-zinc-300">{ $locale === 'de-DE' ? 'Bestehende Auswahl ersetzen' : 'Replace existing selection' }</span>
    </label>
    <label class="col-span-2 inline-flex items-center gap-2">
      <input type="checkbox" bind:checked={$autoPlannerSettings.preferEvenSpread} class="accent-md-primary">
      <span class="text-zinc-700 dark:text-zinc-300">{ $locale === 'de-DE' ? 'Gleichmäßig über das Jahr verteilen' : 'Prefer even spread across year' }</span>
    </label>
    <label class="col-span-2 inline-flex items-center gap-2">
      <input type="checkbox" bind:checked={$autoPlannerSettings.respectSchoolHolidays} class="accent-md-primary">
      <span class="text-zinc-700 dark:text-zinc-300">{ $locale === 'de-DE' ? 'Schulferien berücksichtigen' : 'Respect school holidays' }</span>
    </label>
    <!-- Ignore months -->
    <div class="col-span-2">
      <div class="text-xs text-zinc-600 dark:text-zinc-300 mb-1">{ $locale === 'de-DE' ? 'Monate ausschließen' : 'Exclude months' }</div>
      <div class="grid grid-cols-3 sm:grid-cols-4 gap-1">
        {#each Array.from({ length: 12 }, (_, monthNumber) => monthNumber) as monthNumber}
          <label class="inline-flex items-center gap-2 px-2 py-1 rounded border border-zinc-200 dark:border-md-outline hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer">
            <input type="checkbox"
              checked={$autoPlannerSettings.ignoredMonths.includes(monthNumber)}
              on:change={(e) => onIgnoreMonthChange(monthNumber, e)}
            />
            <span class="text-xs">
              {new Intl.DateTimeFormat($locale, { month: 'long' }).format(new Date(2025, monthNumber, 1))}
            </span>
          </label>
        {/each}
      </div>
    </div>
  </div>
  <div class="flex items-center gap-2">
    <button class="px-3 py-2 rounded-lg bg-md-primary text-md-onPrimary hover:opacity-95 active:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-md-primary" on:click={generatePreview}>
      { $locale === 'de-DE' ? 'Vorschau erstellen' : 'Generate preview' }
    </button>
    <button class="px-3 py-2 rounded-lg border border-zinc-300 dark:border-md-outline text-zinc-800 dark:text-md-onSurfaceDark hover:bg-zinc-50 dark:hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-md-primary disabled:opacity-50" on:click={applyPreview} disabled={!preview}>
      { $locale === 'de-DE' ? 'Plan anwenden' : 'Apply plan' }
    </button>
    {#if variants.length > 0}
      <span class="text-xs text-zinc-600 dark:text-zinc-300">{ $locale === 'de-DE' ? 'Option' : 'Option' } {variantIndex + 1}/{variants.length} · Score {variants[variantIndex].summary.score.toFixed(1)}</span>
      <button class="text-xs underline" on:click={() => { if (!variants.length) return; variantIndex = (variantIndex - 1 + variants.length) % variants.length; preview = variants[variantIndex]; }}>&lt;</button>
      <button class="text-xs underline" on:click={() => { if (!variants.length) return; variantIndex = (variantIndex + 1) % variants.length; preview = variants[variantIndex]; }}>&gt;</button>
    {/if}
  </div>

  {#if preview}
    <div class="mt-2 border border-zinc-200 dark:border-md-outline rounded-lg overflow-hidden">
      <div class="px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 flex items-center justify-between">
        <div>{ $locale === 'de-DE' ? 'Zusammenfassung' : 'Summary' } — {preview.summary.usedVacationDays}/{preview.summary.availableVacationDays} { $locale === 'de-DE' ? 'Tage' : 'days' } · Score {preview.summary.score.toFixed(1)}</div>
      </div>
      <div class="p-3">
        <table class="w-full text-sm table-fixed">
          <thead class="text-left text-zinc-600 dark:text-zinc-300 sticky top-0 bg-zinc-50 dark:bg-zinc-800">
            <tr>
              <th class="py-1">{ $locale === 'de-DE' ? 'Start' : 'Start' }</th>
              <th class="py-1">{ $locale === 'de-DE' ? 'Ende' : 'End' }</th>
              <th class="py-1">{ $locale === 'de-DE' ? 'Dauer' : 'Duration' }</th>
              <th class="py-1">{ $locale === 'de-DE' ? 'Feiertage' : 'Holidays' }</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-200 dark:divide-md-outline">
            {#each preview.schedule as e}
              <tr>
                <td class="py-1 pr-2">{new Date(e.startISO).toLocaleDateString($locale)}</td>
                <td class="py-1 pr-2">{new Date(e.endISO).toLocaleDateString($locale)}</td>
                <td class="py-1 pr-2">{e.durationDays} { $locale === 'de-DE' ? 'Tage' : 'days' }</td>
                <td class="py-1">
                  {#if e.holidaysUsed.length === 0}
                    —
                  {:else}
                    {e.holidaysUsed.map(h => h.name).join(', ')}
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  {/if}
</div>
