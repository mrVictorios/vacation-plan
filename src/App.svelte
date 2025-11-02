<script lang="ts">
  // Root app: composes controls + year calendar
  import { currentYear } from './stores/year';
  import VacationManager from './components/VacationManager.svelte';
  
  import Calendar from './components/Calendar.svelte';
  import Legend from './components/Legend.svelte';
  import { derived } from 'svelte/store';
  import { locale } from './stores/locale';
  import LocaleSwitcher from './components/LocaleSwitcher.svelte';
  import RegionSelector from './components/RegionSelector.svelte';
  import { region } from './stores/region';
  import { holidaysStore, bridgeDaysStore, loadHolidays, loadingHolidays, holidaysError } from './stores/holidays';
  import { vacationDays, totalDays } from './stores/vacation';
  import AutoPlan from './components/AutoPlan.svelte';
  import { getSchoolHolidays, getSchoolDaysSet } from './lib/school_holidays';
  import { toISODate } from './lib/date';
  import SharePlan from './components/SharePlan.svelte';
  import ChangelogTab from './components/ChangelogTab.svelte';
  import { density, calendarScale } from './stores/ui';
  import { buildSharePayload, importPlanFromHashAndApply } from './lib/share';
  import { onMount } from 'svelte';
  import { ZOOM_MIN, ZOOM_MAX } from './lib/constants';

  import { activeSidebarTab } from './stores/ui';

  const HOLIDAY_API_CONSENT_KEY = 'holiday:api:consent';
  let holidayApiConsent = false;
  let showHolidayApiModal = false;

  // UI helpers for density toggle
  $: compactActive = $density === 'compact';
  $: comfortableActive = $density === 'comfortable';
  $: compactClass = `px-2 py-1 text-xs rounded ${compactActive ? 'bg-zinc-900 text-white' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`;
  $: comfortableClass = `px-2 py-1 text-xs rounded ${comfortableActive ? 'bg-zinc-900 text-white' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`;

  function onScaleInput(e: Event) {
    const t = e.target as HTMLInputElement | null;
    if (!t) return;
    const numericValue = Number(t.value);
    if (!Number.isNaN(numericValue)) {
      const clamped = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, numericValue / 100));
      calendarScale.set(clamped);
    }
  }
  
  function onYearChange(e: Event) {
    const selectedValue = (e.target as HTMLSelectElement).value;
    const parsedYear = parseInt(selectedValue, 10);
    if (!Number.isNaN(parsedYear)) {
      currentYear.set(parsedYear);
    }
  }

  // Load holidays when year or region changes, honoring consent
  $: loadHolidays($currentYear, $region, holidayApiConsent);

  const holidays = holidaysStore;
  const bridgeDays = bridgeDaysStore;

  // Derive school holiday dates for highlight (memoized)
  const schoolDays = derived([currentYear, region], ([$yearValue, $regionCode]) => {
    return getSchoolHolidays($yearValue, $regionCode).length
      ? getSchoolDaysSet($yearValue, $regionCode)
      : new Set<string>();
  });

  // Avoid overwriting an incoming share link before we import it
  let suppressShareUrlUpdate = true;

  onMount(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(HOLIDAY_API_CONSENT_KEY);
        if (stored === 'true') {
          holidayApiConsent = true;
        } else if (stored === 'false') {
          holidayApiConsent = false;
        } else {
          showHolidayApiModal = true;
        }
      } catch {
        showHolidayApiModal = true;
      }
    } else {
      showHolidayApiModal = true;
    }
    if (typeof window !== 'undefined') {
      // Try to import shared plan once on load
      importPlanFromHashAndApply(window.location.hash);
      // Listen for future hash changes (e.g., user pastes a link later)
      const onHash = () => { importPlanFromHashAndApply(window.location.hash); };
      window.addEventListener('hashchange', onHash);
      // Re-enable share URL updates after initial import attempt
      queueMicrotask(() => { suppressShareUrlUpdate = false; });
      return () => window.removeEventListener('hashchange', onHash);
    }
  });

  function acceptHolidayApiUsage() {
    holidayApiConsent = true;
    showHolidayApiModal = false;
    try { localStorage.setItem(HOLIDAY_API_CONSENT_KEY, 'true'); } catch {}
    loadHolidays($currentYear, $region, true);
  }

  function declineHolidayApiUsage() {
    holidayApiConsent = false;
    showHolidayApiModal = false;
    try { localStorage.setItem(HOLIDAY_API_CONSENT_KEY, 'false'); } catch {}
    loadHolidays($currentYear, $region, false);
  }

  // Update URL with shareable link on state changes
  $: (function updateShareUrl() {
    if (typeof window === 'undefined' || suppressShareUrlUpdate) return;
    const selected = Array.from($vacationDays).sort();
    const payload = buildSharePayload($currentYear, $region, $totalDays, selected);
    const base = window.location.origin + window.location.pathname;
    const newHash = 'plan=' + payload;
    const currentHash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : window.location.hash;
    if (currentHash !== newHash) {
      history.replaceState(null, '', base + '#' + newHash);
    }
  })();
</script>

<main class="w-full h-full min-h-full p-3 md:p-4 flex flex-col gap-3">
  <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">
        {#if $locale === 'de-DE'}Urlaubsplaner — Deutschland{:else}Vacation Planner — Germany{/if}
      </h1>
      <p class="text-sm text-zinc-600 dark:text-zinc-400">
        {#if $locale === 'de-DE'}Deutsche Feiertage je Bundesland, Brückentage (optional) und Schulferien. Plane lange Urlaube (≥7 Tage) und verteile sie gleichmäßig übers Jahr.{:else}German public holidays per region, optional bridge days, and school holidays. Plan long breaks (≥7 days) and spread them evenly across the year.{/if}
      </p>
    </div>
    <div class="flex items-center gap-2 flex-wrap justify-end">
      <LocaleSwitcher />
      <RegionSelector />
      <label class="text-sm text-zinc-600 dark:text-zinc-300 ml-2" for="year">{ $locale === 'de-DE' ? 'Jahr' : 'Year' }</label>
      <select id="year" class="border border-zinc-300 dark:border-md-outline rounded-lg px-2 py-1 text-sm bg-white dark:bg-md-surfaceDark text-zinc-900 dark:text-md-onSurfaceDark focus:outline-none focus-visible:ring-2 focus-visible:ring-md-primary" value={$currentYear} on:change={onYearChange}>
        {#each Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i) as y}
          <option value={y}>{y}</option>
        {/each}
      </select>
      <div class="ml-2 inline-flex items-center gap-1 border border-zinc-300 dark:border-md-outline rounded-lg p-0.5" role="tablist" aria-label="Density">
        <button role="tab" aria-selected={$density === 'compact'}
          class={compactClass}
          on:click={() => density.set('compact')}
        >{ $locale === 'de-DE' ? 'Kompakt' : 'Compact' }</button>
        <button role="tab" aria-selected={$density === 'comfortable'}
          class={comfortableClass}
          on:click={() => density.set('comfortable')}
        >{ $locale === 'de-DE' ? 'Komfort' : 'Comfort' }</button>
      </div>
      <label class="ml-2 text-xs text-zinc-600 dark:text-zinc-300">{ $locale === 'de-DE' ? 'Zoom' : 'Zoom' }</label>
      <input type="range" min="80" max="120" step="5" class="ml-1 align-middle" value={$calendarScale * 100} on:input={onScaleInput} />
      <span class="text-xs text-zinc-600 dark:text-zinc-300">{Math.round($calendarScale * 100)}%</span>
      
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
          {:else if !holidayApiConsent}
            <span class="text-amber-600">{ $locale === 'de-DE' ? 'Fallback-Daten (API deaktiviert)' : 'Fallback data (API disabled)' }</span>
          {:else}
            <span>{ $locale === 'de-DE' ? 'Feiertage' : 'Holidays' }</span>
          {/if}
          {#if !holidayApiConsent}
            <button class="underline text-[11px] text-zinc-600 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-white"
              on:click={() => { showHolidayApiModal = true; }}
            >
              { $locale === 'de-DE' ? 'API aktivieren' : 'Enable API' }
            </button>
          {/if}
        </div>
      </div>
      <div class="mt-2 h-full min-h-0 overflow-auto">
        <!-- Full-year calendar with zoom; inner wrapper width compensates scale -->
        <div class="inline-block" style="transform-origin: top left; will-change: transform; transform: scale({$calendarScale}); width: calc(100% / {$calendarScale});">
          {#key $currentYear}
            <Calendar {holidays} {bridgeDays} year={$currentYear} schoolDays={schoolDays} />
          {/key}
        </div>
      </div>
    </div>

    <div class="hidden lg:block lg:sticky lg:top-3 self-start h-[calc(100vh-1rem)] min-h-0">
      <div class="card p-0 md:p-0 h-full flex flex-col">
        <div class="px-3 md:px-4 pt-3">
          <div class="flex w-full items-center gap-1 border-b border-zinc-200 dark:border-md-outline" role="tablist" aria-label="Planner tabs">
            <button
              role="tab"
              aria-selected={$activeSidebarTab === 'vacation'}
              class={`flex-1 text-center px-3 py-2 text-sm rounded-t ${$activeSidebarTab === 'vacation' ? 'text-md-onPrimary bg-green-600 text-white' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              on:click={() => activeSidebarTab.set('vacation')}
            >{ $locale === 'de-DE' ? 'Urlaub' : 'Vacation' }</button>
            <button
              role="tab"
              aria-selected={$activeSidebarTab === 'auto'}
              class={`flex-1 text-center px-3 py-2 text-sm rounded-t ${$activeSidebarTab === 'auto' ? 'text-md-onPrimary bg-zinc-900 text-white' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              on:click={() => activeSidebarTab.set('auto')}
            >{ $locale === 'de-DE' ? 'Auto-Plan' : 'Auto Plan' }</button>
            <button
              role="tab"
              aria-selected={$activeSidebarTab === 'share'}
              class={`flex-1 text-center px-3 py-2 text-sm rounded-t ${$activeSidebarTab === 'share' ? 'text-md-onPrimary bg-zinc-900 text-white' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              on:click={() => activeSidebarTab.set('share')}
            >{ $locale === 'de-DE' ? 'Teilen' : 'Share' }</button>
            <button
              role="tab"
              aria-selected={$activeSidebarTab === 'changelog'}
              class={`flex-1 text-center px-3 py-2 text-sm rounded-t ${$activeSidebarTab === 'changelog' ? 'text-md-onPrimary bg-blue-600 text-white' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              on:click={() => activeSidebarTab.set('changelog')}
            >Changelog</button>
          </div>
        </div>
        <div class="p-3 md:p-4 flex-1 min-h-0 overflow-auto">
          {#if $activeSidebarTab === 'vacation'}
            <VacationManager />
          {:else if $activeSidebarTab === 'auto'}
            <AutoPlan />
          {:else if $activeSidebarTab === 'share'}
            <SharePlan />
          {:else}
            <ChangelogTab />
          {/if}
        </div>
      </div>
    </div>
  </section>

  {#if showHolidayApiModal}
    <div class="fixed inset-0 z-30 flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true">
      <div class="max-w-md w-full rounded-lg bg-white dark:bg-md-surfaceDark p-5 shadow-xl">
        <h2 class="text-lg font-semibold text-zinc-900 dark:text-md-onSurfaceDark mb-3">
          { $locale === 'de-DE' ? 'Feiertage API verwenden?' : 'Use the Feiertage API?' }
        </h2>
        <p class="text-sm text-zinc-700 dark:text-zinc-300 mb-3">
          {#if $locale === 'de-DE'}
            Wir können aktuelle Feiertage direkt von feiertage-api.de abrufen. Damit erklärst du dich einverstanden, dass der Browser eine Anfrage an diese externe API sendet. Alternativ kannst du mit den eingebauten Fallback-Daten weiterarbeiten.
          {:else}
            We can fetch up-to-date holidays from feiertage-api.de. Accepting allows your browser to request data from this external API. You can also continue with the built-in fallback dataset.
          {/if}
        </p>
        <div class="flex flex-col sm:flex-row sm:justify-end gap-2">
          <button class="px-3 py-2 rounded-lg border border-zinc-300 dark:border-md-outline text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            on:click={declineHolidayApiUsage}
          >
            { $locale === 'de-DE' ? 'Nur Fallback nutzen' : 'Use fallback only' }
          </button>
          <button class="px-3 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
            on:click={acceptHolidayApiUsage}
          >
            { $locale === 'de-DE' ? 'API akzeptieren' : 'Accept API usage' }
          </button>
        </div>
      </div>
    </div>
  {/if}

  <footer class="text-xs text-zinc-500 dark:text-zinc-400">
    Holidays include Buß- und Bettag (Saxony only). Bridge day logic follows German common practice.
  </footer>
</main>

<style>
</style>
