<script lang="ts">
  import DayCell from './DayCell.svelte';
  import { daysInMonth } from '../lib/date';
  import type { Readable } from 'svelte/store';
  import { density } from '../stores/ui';
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
  <h3 class="font-semibold text-zinc-700 dark:text-zinc-200 mb-1 flex items-center justify-between leading-tight rounded { $density === 'compact' ? 'text-[10px] px-1 py-0.5' : 'text-[11px] px-2 py-1' }">
    <span>{monthName} {year}</span>
    <span class="text-zinc-400 dark:text-zinc-500 { $density === 'compact' ? 'text-[9px]' : 'text-[10px]' }">{days.length}d</span>
  </h3>
  <!-- 7-column grid starting Monday -->
  <div class="grid grid-cols-7 auto-rows-fr flex-1 min-h-0 { $density === 'compact' ? 'gap-[1px] text-[9px]' : 'gap-[2px] text-[10px]' }" role="rowgroup">
    <!-- Weekday headers (Mon-Sun, localized) -->
    {#each weekdays as w}
      <div class="text-zinc-500 dark:text-zinc-400 text-center { $density === 'compact' ? 'text-[9px] py-0.5' : 'text-[10px] py-1' }" role="columnheader" aria-label={w}>{w}</div>
    {/each}

    <!-- leading blanks to align first weekday (Mon-based) -->
    {#each Array((new Date(year, month, 1).getDay() + 6) % 7).fill(0) as _}
      <div class="{ $density === 'compact' ? 'py-0.5' : 'py-1' }" role="gridcell" aria-hidden="true"></div>
    {/each}

    {#each days as d}
      <DayCell {d} {holidays} {bridgeDays} {schoolDays} />
    {/each}
  </div>
</section>
