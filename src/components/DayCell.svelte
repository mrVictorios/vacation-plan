<script lang="ts">
  import type { Readable } from 'svelte/store';
  import { isWeekend, toISODate } from '../lib/date';
  import { locale } from '../stores/locale';
  import { vacationDays, toggleVacation, remainingDays } from '../stores/vacation';

  export let d: Date;
  export let holidays: Readable<Map<string, string>>;
  export let bridgeDays: Readable<Set<string>>;

  $: iso = toISODate(d);
  $: isWknd = isWeekend(d);
  $: holidayName = $holidays.get(iso);
  $: isHoliday = Boolean(holidayName);
  $: isBridge = $bridgeDays.has(iso);
  $: isSelected = $vacationDays.has(iso);

  // Only allow vacation selection on working days and not public holidays
  function onClick() {
    if (isHoliday || isWknd) return;
    // prevent selecting more than available
    if (!isSelected && $remainingDays <= 0) return;
    toggleVacation(iso);
  }
</script>

<button
  class="relative h-full flex flex-col items-center justify-center border rounded-md py-1 transition-colors select-none
    text-[10px] text-center overflow-hidden font-medium
    focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 dark:focus-visible:ring-sky-300 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent
    disabled:opacity-60 disabled:cursor-not-allowed
    {isSelected
      ? 'bg-sky-600 text-white border-sky-600 hover:bg-sky-500 active:bg-sky-700'
      : isHoliday
        ? 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800'
        : isBridge
          ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800'
          : isWknd
            ? 'bg-zinc-50 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
            : 'bg-white dark:bg-ios-surface text-zinc-900 dark:text-ios-text border-zinc-200 dark:border-ios-border hover:bg-zinc-50 dark:hover:bg-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-700'}"
  on:click={onClick}
  title={
    isHoliday
      ? holidayName
      : isBridge
        ? ($locale === 'de-DE' ? 'Brückentag' : 'Bridge day')
        : isSelected
          ? ($locale === 'de-DE' ? 'Urlaub gewählt' : 'Vacation selected')
          : ($locale === 'de-DE' ? 'Arbeitstag' : 'Workday')
  }
>
  <span class="font-semibold text-[11px]">{d.getDate()}</span>
  {#if isHoliday}
    <span class="truncate max-w-[6rem]" aria-label="Holiday">{holidayName}</span>
  {:else if isBridge}
    <span class="text-[10px] text-amber-700 dark:text-amber-300">{ $locale === 'de-DE' ? 'Brücke' : 'Bridge' }</span>
  {:else if isSelected}
    <span class="text-[10px] text-white/90">{ $locale === 'de-DE' ? 'Urlaub' : 'Vacation' }</span>
  {/if}
</button>
