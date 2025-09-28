<script lang="ts">
  import DayCell from './DayCell.svelte';
  import { daysInMonth } from '../lib/date';
  import type { Readable } from 'svelte/store';
  import { locale } from '../stores/locale';
  import { weekdayShortNames, monthLongName } from '../lib/i18n';

  export let year: number;
  export let month: number; // 0-11
  export let holidays: Readable<Map<string, string>>;
  export let bridgeDays: Readable<Set<string>>;
  export let schoolDays: Readable<Set<string>>;

  $: monthName = monthLongName(year, month, $locale);
  const days = daysInMonth(year, month);
  $: weekdays = weekdayShortNames($locale);
  $: altBg = month % 2 === 0;
  $: bgClass = altBg ? 'bg-zinc-50 dark:bg-zinc-800/60' : 'bg-white dark:bg-zinc-900/40';
</script>

<section class={`h-full min-h-0 flex flex-col rounded-md ${bgClass}`}>
  <h3 class="font-semibold text-[11px] text-zinc-700 dark:text-zinc-200 mb-2 flex items-center justify-between leading-tight px-2 py-1 rounded">
    <span>{monthName} {year}</span>
    <span class="text-[10px] text-zinc-400 dark:text-zinc-500">{days.length}d</span>
  </h3>
  <!-- 7-column grid starting Monday -->
  <div class="grid grid-cols-7 auto-rows-fr gap-[2px] text-[10px] flex-1 min-h-0" role="rowgroup">
    <!-- Weekday headers (Mon-Sun, localized) -->
    {#each weekdays as w}
      <div class="text-zinc-500 dark:text-zinc-400 text-[10px] text-center py-0.5" role="columnheader" aria-label={w}>{w}</div>
    {/each}

    <!-- leading blanks to align first weekday (Mon-based) -->
    {#each Array((new Date(year, month, 1).getDay() + 6) % 7).fill(0) as _}
      <div class="py-0.5" role="gridcell" aria-hidden="true"></div>
    {/each}

    {#each days as d}
      <DayCell {d} {holidays} {bridgeDays} {schoolDays} />
    {/each}
  </div>
</section>
