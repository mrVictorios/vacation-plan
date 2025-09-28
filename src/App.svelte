<script lang="ts">
  // Root app: composes controls + year calendar
  import { currentYear } from './stores/year';
  import { holidaysForYear, bridgeDaysForYear } from './lib/holidays';
  import VacationManager from './components/VacationManager.svelte';
  
  import Calendar from './components/Calendar.svelte';
  import Legend from './components/Legend.svelte';
  import { derived } from 'svelte/store';
  import { locale } from './stores/locale';
  import LocaleSwitcher from './components/LocaleSwitcher.svelte';
  import RegionSelector from './components/RegionSelector.svelte';
  import { region } from './stores/region';
  import { holidaysStore, bridgeDaysStore, loadHolidays, loadingHolidays, holidaysError } from './stores/holidays';
  import { vacationDays, clearAll } from './stores/vacation';
  import { onMount } from 'svelte';

  // Load holidays when year or region changes
  $: loadHolidays($currentYear, $region);

  const holidays = holidaysStore;
  const bridgeDays = bridgeDaysStore;
</script>

<main class="w-full h-full min-h-full p-3 md:p-4 flex flex-col gap-3">
  <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">
        {#if $locale === 'de-DE'}Urlaubsplaner — Sachsen (DE){:else}Vacation Planner — Saxony (DE){/if}
      </h1>
      <p class="text-sm text-zinc-600 dark:text-zinc-400">
        {#if $locale === 'de-DE'}Feiertage für Sachsen, Brückentage automatisch berechnet. Weise Urlaubstage zu und optimiere lange Wochenenden.{:else}Public holidays for Saxony; bridge days auto-computed. Assign vacation days to plan long weekends.{/if}
      </p>
    </div>
    <div class="flex items-center gap-2 flex-wrap justify-end">
      <LocaleSwitcher />
      <RegionSelector />
      <label class="text-sm text-zinc-600 dark:text-zinc-300 ml-2" for="year">{ $locale === 'de-DE' ? 'Jahr' : 'Year' }</label>
      <select id="year" class="border border-zinc-300 dark:border-md-outline rounded-lg px-2 py-1 text-sm bg-white dark:bg-md-surfaceDark text-zinc-900 dark:text-md-onSurfaceDark focus:outline-none focus-visible:ring-2 focus-visible:ring-md-primary" bind:value={$currentYear}>
        {#each Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 1 + i) as y}
          <option value={y}>{y}</option>
        {/each}
      </select>
      <button
        class="ml-2 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-md-outline bg-white dark:bg-md-surfaceDark text-sm text-zinc-800 dark:text-md-onSurfaceDark hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-md-primary disabled:opacity-50"
        on:click={() => { if (confirm($locale === 'de-DE' ? 'Alle ausgewählten Tage zurücksetzen?' : 'Reset all selected days?')) clearAll(); }}
        disabled={$vacationDays.size === 0}
        aria-disabled={$vacationDays.size === 0}
      >{ $locale === 'de-DE' ? 'Tage zurücksetzen' : 'Reset days' }</button>
    </div>
  </header>

  <section class="grid gap-3 lg:grid-cols-[3fr,1fr] flex-1 min-h-0">
    <div class="card p-3 md:p-4 h-full min-h-0">
      <div class="flex items-center justify-between">
        <Legend />
        <div class="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
          {#if $loadingHolidays}
            <span>{ $locale === 'de-DE' ? 'Lade Feiertage…' : 'Loading holidays…' }</span>
          {:else if $holidaysError}
            <span class="text-red-600">{ $locale === 'de-DE' ? 'Feiertage (Fallback)' : 'Holidays (fallback)' }</span>
          {:else}
            <span>{ $locale === 'de-DE' ? 'Feiertage' : 'Holidays' }</span>
          {/if}
        </div>
      </div>
      <div class="mt-2 h-full min-h-0">
        <!-- Full-year calendar -->
        <Calendar {holidays} {bridgeDays} year={$currentYear} />
      </div>
    </div>

    <div class="card p-3 md:p-4 h-fit lg:sticky lg:top-3 self-start hidden lg:block">
      <VacationManager />
    </div>
  </section>
  
  <footer class="text-xs text-zinc-500 dark:text-zinc-400">
    Holidays include Buß- und Bettag (Saxony only). Bridge day logic follows German common practice.
  </footer>
</main>

<style>
</style>
