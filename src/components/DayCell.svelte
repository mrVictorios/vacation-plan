<script lang="ts">
  import type { Readable } from 'svelte/store';
  import { isWeekend, toISODate } from '../lib/date';
  import { locale } from '../stores/locale';
  import { vacationDays, toggleVacation, remainingDays } from '../stores/vacation';
  import { density } from '../stores/ui';

  export let date: Date;
  export let holidays: Readable<Map<string, string>>;
  export let bridgeDays: Readable<Set<string>>;
  export let schoolDays: Readable<Set<string>>;

  $: iso = toISODate(date);
  $: isWknd = isWeekend(date);
  $: holidayName = $holidays.get(iso);
  $: isHoliday = Boolean(holidayName);
  $: isBridge = $bridgeDays.has(iso);
  $: isSchool = $schoolDays ? $schoolDays.has(iso) : false;
  $: isSelected = $vacationDays.has(iso);

  // Responsive density classes
  $: sizeClasses = $density === 'compact'
    ? 'py-0.5 min-h-[22px] sm:min-h-[24px] md:min-h-[28px] lg:min-h-[32px] text-[8px] sm:text-[9px] md:text-[10px]'
    : 'py-1 min-h-[34px] sm:min-h-[36px] md:min-h-[40px] lg:min-h-[44px] text-[9px] sm:text-[10px] md:text-xs';

  $: dateSizeClasses = $density === 'compact'
    ? 'text-[10px] sm:text-[11px] md:text-xs'
    : 'text-[11px] sm:text-xs md:text-sm';

  // Visual state classes
  $: stateClasses = isSelected
    ? 'bg-green-600 text-white border-green-600 hover:bg-green-500 active:bg-green-700'
    : isHoliday
      ? 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800'
      : isBridge
        ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800'
        : isWknd
          ? 'bg-zinc-50 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
          : isSchool
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
            : 'bg-white dark:bg-md-surfaceDark text-zinc-900 dark:text-md-onSurfaceDark border-zinc-200 dark:border-md-outline hover:bg-zinc-50 dark:hover:bg-zinc-800 active:bg-zinc-100 dark:active:bg-zinc-700';

  // Only allow vacation selection on working days and not public holidays
  function onClick() {
    if (isHoliday || isWknd) return;
    // prevent selecting more than available
    if (!isSelected && $remainingDays <= 0) return;
    toggleVacation(iso);
  }

  $: ariaLabel = (() => {
    const loc = $locale;
    const fmt = new Intl.DateTimeFormat(loc, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    const base = fmt.format(date);
    if (isHoliday) return `${base} — ${holidayName}`;
    if (isBridge) return `${base} — ${loc === 'de-DE' ? 'Brückentag' : 'Bridge day'}`;
    if (isSelected) return `${base} — ${loc === 'de-DE' ? 'Urlaub gewählt' : 'Vacation selected'}`;
    if (isWknd) return `${base} — ${loc === 'de-DE' ? 'Wochenende' : 'Weekend'}`;
    return `${base} — ${loc === 'de-DE' ? 'Arbeitstag' : 'Workday'}`;
  })();
</script>

<button
  class={`relative h-full flex flex-col items-center justify-center border rounded-lg transition-colors select-none touch-manipulation text-center overflow-hidden font-medium ${sizeClasses} ${stateClasses}`}
    focus:outline-none focus-visible:ring-2 focus-visible:ring-md-primary focus-visible:ring-offset-1 focus-visible:ring-offset-transparent
    disabled:opacity-60 disabled:cursor-not-allowed
  on:click={onClick}
  title={
    isHoliday
      ? holidayName
      : isBridge
        ? ($locale === 'de-DE' ? 'Brückentag' : 'Bridge day')
        : isSchool
          ? ($locale === 'de-DE' ? 'Schulferien' : 'School holidays')
        : isSelected
          ? ($locale === 'de-DE' ? 'Urlaub gewählt' : 'Vacation selected')
          : ($locale === 'de-DE' ? 'Arbeitstag' : 'Workday')
  }
  aria-pressed={isSelected}
  aria-label={ariaLabel}
>
  <span class={`font-semibold ${dateSizeClasses}`}>{date.getDate()}</span>
  {#if isHoliday}
    <span class="truncate max-w-[6rem]" aria-label="Holiday">{holidayName}</span>
  {:else if isBridge}
    <span class="text-[10px] text-amber-700 dark:text-amber-300">{ $locale === 'de-DE' ? 'Brücke' : 'Bridge' }</span>
  {:else if isSelected}
    <span class="text-[10px] text-white/90">{ $locale === 'de-DE' ? 'Urlaub' : 'Vacation' }</span>
  {/if}
</button>
