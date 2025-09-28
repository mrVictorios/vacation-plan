<script lang="ts">
  import MonthView from './MonthView.svelte';
  import type { Readable } from 'svelte/store';

  export let year: number;
  // Maps and sets are provided via stores so they recompute when year changes
  export let holidays: Readable<Map<string, string>>; // ISO date -> holiday name
  export let bridgeDays: Readable<Set<string>>; // ISO date strings
  export let schoolDays: Readable<Set<string>>; // ISO date strings for school holidays
</script>

<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2" role="grid" aria-label="Year calendar">
  {#each Array.from({ length: 12 }, (_, i) => i) as month}
    <MonthView {year} {month} {holidays} {bridgeDays} {schoolDays} />
  {/each}
</div>
