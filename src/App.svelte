<script lang="ts">
  // Root app: composes controls + year calendar
  import { currentYear } from './stores/year';
  import VacationManager from './components/VacationManager.svelte';
  
  import Calendar from './components/Calendar.svelte';
  import Legend from './components/Legend.svelte';
  import { derived, get } from 'svelte/store';
  import { locale } from './stores/locale';
  import LocaleSwitcher from './components/LocaleSwitcher.svelte';
  import RegionSelector from './components/RegionSelector.svelte';
  import { region } from './stores/region';
  import { holidaysStore, bridgeDaysStore, loadHolidays, loadingHolidays, holidaysError } from './stores/holidays';
  import { vacationDays, totalDays } from './stores/vacation';
  import AutoPlan from './components/AutoPlan.svelte';
  import { getSchoolHolidays, getSchoolDaysSet } from './lib/school_holidays';
  import SharePlan from './components/SharePlan.svelte';
  import ChangelogTab from './components/ChangelogTab.svelte';
  import { density, calendarScale, themeMode, type ThemeMode } from './stores/ui';
  import { buildSharePayload, importPlanFromHashAndApply } from './lib/share';
  import { onMount } from 'svelte';
  import { ZOOM_MIN, ZOOM_MAX } from './lib/constants';

  import { activeSidebarTab } from './stores/ui';

  const HOLIDAY_API_CONSENT_KEY = 'holiday:api:consent';
  let holidayApiConsent = false;
  let showHolidayApiModal = false;
  let removeSystemThemeListener: (() => void) | null = null;
  let isDesktop = false;
  let mobileView: 'calendar' | 'assistant' = 'calendar';

  function syncThemePreference(mode: ThemeMode) {
    if (typeof window === 'undefined') return;
    if (removeSystemThemeListener) {
      removeSystemThemeListener();
      removeSystemThemeListener = null;
    }
    const root = document.documentElement;
    const body = document.body;
    const apply = (isDark: boolean) => {
      root.classList.toggle('dark', isDark);
      body.classList.remove('theme-light', 'theme-dark');
      body.classList.add(isDark ? 'theme-dark' : 'theme-light');
    };

    if (mode === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const update = (matches: boolean) => apply(matches);
      update(media.matches);
      const listener = (event: MediaQueryListEvent) => update(event.matches);
      if (typeof media.addEventListener === 'function') {
        media.addEventListener('change', listener);
        removeSystemThemeListener = () => media.removeEventListener('change', listener);
      } else {
        // @ts-expect-error legacy browsers
        media.addListener(listener);
        removeSystemThemeListener = () => {
          // @ts-expect-error legacy browsers
          media.removeListener(listener);
        };
      }
    } else {
      apply(mode === 'dark');
    }
  }

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
    let unsubscribeTheme: (() => void) | undefined;
    let removeHashListener: (() => void) | undefined;
    let removeDesktopListener: (() => void) | undefined;

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

      syncThemePreference(get(themeMode));
      unsubscribeTheme = themeMode.subscribe((mode) => syncThemePreference(mode));

      importPlanFromHashAndApply(window.location.hash);
      const onHash = () => { importPlanFromHashAndApply(window.location.hash); };
      window.addEventListener('hashchange', onHash);
      queueMicrotask(() => { suppressShareUrlUpdate = false; });
      removeHashListener = () => window.removeEventListener('hashchange', onHash);

      const desktopMedia = window.matchMedia('(min-width: 1024px)');
      const updateDesktop = () => {
        isDesktop = desktopMedia.matches;
        if (isDesktop) mobileView = 'calendar';
      };
      updateDesktop();
      const desktopListener = (event: MediaQueryListEvent) => {
        isDesktop = event.matches;
        if (isDesktop) mobileView = 'calendar';
      };
      if (typeof desktopMedia.addEventListener === 'function') {
        desktopMedia.addEventListener('change', desktopListener);
        removeDesktopListener = () => desktopMedia.removeEventListener('change', desktopListener);
      } else {
        // @ts-expect-error legacy
        desktopMedia.addListener(desktopListener);
        removeDesktopListener = () => {
          // @ts-expect-error legacy
          desktopMedia.removeListener(desktopListener);
        };
      }
    } else {
      showHolidayApiModal = true;
    }

    return () => {
      if (removeHashListener) removeHashListener();
      if (removeDesktopListener) removeDesktopListener();
      if (unsubscribeTheme) unsubscribeTheme();
      if (removeSystemThemeListener) {
        removeSystemThemeListener();
        removeSystemThemeListener = null;
      }
    };
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

<main class="min-h-screen bg-zinc-50 dark:bg-zinc-950">
<header class="border-b border-zinc-200 bg-white/90 px-6 py-8 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
  <div class="mx-auto w-full max-w-7xl space-y-4">
    <span class="section-title">{ $locale === 'de-DE' ? 'Jahresübersicht' : 'Year overview' }</span>
    <h1 class="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-white">
      {#if $locale === 'de-DE'}Urlaubsplaner für Deutschland{:else}Vacation Planner for Germany{/if}
    </h1>
    <p class="max-w-3xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
      {#if $locale === 'de-DE'}
        Plane deinen Jahresurlaub mit regionalen Feiertagen, Brückentagen und Schulferien. Nutze automatische Vorschläge oder stelle deinen Plan manuell zusammen.
      {:else}
        Plan your year of time off with regional holidays, bridge days, and school breaks. Use automatic suggestions or build the schedule manually.
      {/if}
    </p>
  </div>
</header>

  <div class="px-6 py-8">
    <div class="mx-auto w-full max-w-7xl mb-4 lg:hidden">
      <div class="flex items-center gap-2 rounded-full border border-zinc-200 bg-white p-1 dark:border-md-outline dark:bg-zinc-900" role="tablist" aria-label={$locale === 'de-DE' ? 'Ansichten' : 'Views'}>
        <button
          role="tab"
          aria-selected={mobileView === 'calendar'}
          class={`flex-1 px-3 py-1.5 text-sm font-semibold rounded-full transition ${mobileView === 'calendar' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'text-zinc-600 dark:text-zinc-300'}`}
          on:click={() => { mobileView = 'calendar'; }}
        >{ $locale === 'de-DE' ? 'Kalender' : 'Calendar' }</button>
        <button
          role="tab"
          aria-selected={mobileView === 'assistant'}
          class={`flex-1 px-3 py-1.5 text-sm font-semibold rounded-full transition ${mobileView === 'assistant' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'text-zinc-600 dark:text-zinc-300'}`}
          on:click={() => { mobileView = 'assistant'; }}
        >{ $locale === 'de-DE' ? 'Assistent' : 'Assistant' }</button>
      </div>
    </div>
    <div class="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[minmax(0,2.2fr)_minmax(320px,1fr)] xl:grid-cols-[minmax(0,3fr)_minmax(360px,1fr)]">
      <section class={`panel flex flex-col gap-5 ${!isDesktop && mobileView === 'assistant' ? 'hidden lg:flex' : 'flex'}`}>
        <div class="flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <span class="section-title">{ $locale === 'de-DE' ? 'Kalender' : 'Calendar' }</span>
          <div class="flex items-center gap-2">
            <label for="calendarYear" class="font-semibold">{ $locale === 'de-DE' ? 'Jahr' : 'Year' }</label>
            <select
              id="calendarYear"
              class="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-md-primary dark:border-md-outline dark:bg-md-surfaceDark dark:text-md-onSurfaceDark"
              value={$currentYear}
              on:change={onYearChange}
            >
              {#each Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i) as y}
                <option value={y}>{y}</option>
              {/each}
            </select>
          </div>
          <div class="flex items-center gap-2">
            <label class="font-semibold">{ $locale === 'de-DE' ? 'Bundesland' : 'Region' }</label>
            <RegionSelector />
          </div>
          <div class="flex items-center gap-2">
            <label for="calendarZoom" class="font-semibold">{ $locale === 'de-DE' ? 'Zoom' : 'Zoom' }</label>
            <input
              id="calendarZoom"
              type="range"
              min="80"
              max="150"
              step="5"
              class="w-32 accent-zinc-900 dark:accent-zinc-100"
              value={$calendarScale * 100}
              on:input={onScaleInput}
            />
            <span class="w-12 text-right font-semibold">{Math.round($calendarScale * 100)}%</span>
          </div>
        </div>
        <div class="relative flex-1 overflow-hidden rounded-xl border border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900/70">
          <div class="h-full overflow-auto px-3 py-4">
            <div class="inline-block" style="transform-origin: top left; transform: scale({$calendarScale}); width: calc(100% / {$calendarScale});">
              {#key $currentYear}
                <Calendar {holidays} {bridgeDays} year={$currentYear} schoolDays={schoolDays} />
              {/key}
            </div>
          </div>
        </div>
        <Legend />
      </section>

      <aside class={`panel flex h-full flex-col gap-5 ${!isDesktop && mobileView === 'calendar' ? 'hidden lg:flex' : 'flex'}`}>
        <div class="rounded-xl border border-zinc-200 bg-white p-4 dark:border-md-outline dark:bg-zinc-900/70 flex flex-col gap-3">
          <div class="flex flex-wrap items-center gap-3">
            <span class="section-title">{ $locale === 'de-DE' ? 'Sprache' : 'Language' }</span>
            <LocaleSwitcher />
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="section-title">{ $locale === 'de-DE' ? 'Darstellung' : 'Appearance' }</span>
            <div class="flex flex-wrap items-center gap-2">
              <button
                class={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${$themeMode === 'system' ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900' : 'border-zinc-300 text-zinc-600 dark:border-md-outline dark:text-zinc-300'}`}
                on:click={() => themeMode.set('system')}
              >System</button>
              <button
                class={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${$themeMode === 'light' ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900' : 'border-zinc-300 text-zinc-600 dark:border-md-outline dark:text-zinc-300'}`}
                on:click={() => themeMode.set('light')}
              >{ $locale === 'de-DE' ? 'Hell' : 'Light' }</button>
              <button
                class={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${$themeMode === 'dark' ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900' : 'border-zinc-300 text-zinc-600 dark:border-md-outline dark:text-zinc-300'}`}
                on:click={() => themeMode.set('dark')}
              >{ $locale === 'de-DE' ? 'Dunkel' : 'Dark' }</button>
            </div>
          </div>
          <div class="space-y-2 text-xs text-zinc-600 dark:text-zinc-300">
            {#if holidayApiConsent}
              <div class="flex items-center gap-2">
                <span class="badge border-transparent bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">{ $locale === 'de-DE' ? 'API aktiv' : 'API enabled' }</span>
                <button class="btn btn-secondary text-xs px-3 py-1.5" on:click={() => { showHolidayApiModal = true; }}>
                  { $locale === 'de-DE' ? 'Einstellungen' : 'Preferences' }
                </button>
              </div>
              <p>{ $locale === 'de-DE' ? 'Feiertage werden live von feiertage-api.de geladen.' : 'Holidays are synced live from feiertage-api.de.' }</p>
            {:else}
              <div class="flex items-center gap-2">
                <span class="badge border-transparent bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">{ $locale === 'de-DE' ? 'Fallback aktiv' : 'Fallback active' }</span>
                <button class="btn btn-primary text-xs px-3 py-1.5" on:click={() => { showHolidayApiModal = true; }}>
                  { $locale === 'de-DE' ? 'API erlauben' : 'Enable API' }
                </button>
              </div>
              <p>{ $locale === 'de-DE' ? 'Es werden eingebaute Feiertage ohne Live-Sync genutzt.' : 'Using built-in fallback holidays without live sync.' }</p>
            {/if}
          </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3">
          <span class="section-title">{ $locale === 'de-DE' ? 'Assistent' : 'Assistant' }</span>
          <div class="flex gap-2 rounded-full border border-zinc-200 bg-white p-1 dark:border-md-outline dark:bg-zinc-900" role="tablist" aria-label="Planner tabs">
            <button
              role="tab"
              aria-selected={$activeSidebarTab === 'vacation'}
              class={`px-3 py-1.5 text-xs font-semibold rounded-full transition ${$activeSidebarTab === 'vacation' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'text-zinc-600 dark:text-zinc-300'}`}
              on:click={() => activeSidebarTab.set('vacation')}
            >{ $locale === 'de-DE' ? 'Urlaub' : 'Vacation' }</button>
            <button
              role="tab"
              aria-selected={$activeSidebarTab === 'auto'}
              class={`px-3 py-1.5 text-xs font-semibold rounded-full transition ${$activeSidebarTab === 'auto' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'text-zinc-600 dark:text-zinc-300'}`}
              on:click={() => activeSidebarTab.set('auto')}
            >{ $locale === 'de-DE' ? 'Auto-Plan' : 'Auto Plan' }</button>
            <button
              role="tab"
              aria-selected={$activeSidebarTab === 'share'}
              class={`px-3 py-1.5 text-xs font-semibold rounded-full transition ${$activeSidebarTab === 'share' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'text-zinc-600 dark:text-zinc-300'}`}
              on:click={() => activeSidebarTab.set('share')}
            >{ $locale === 'de-DE' ? 'Teilen' : 'Share' }</button>
            <button
              role="tab"
              aria-selected={$activeSidebarTab === 'changelog'}
              class={`px-3 py-1.5 text-xs font-semibold rounded-full transition ${$activeSidebarTab === 'changelog' ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900' : 'text-zinc-600 dark:text-zinc-300'}`}
              on:click={() => activeSidebarTab.set('changelog')}
            >Changelog</button>
          </div>
        </div>
        <div class="flex-1 overflow-hidden rounded-xl border border-zinc-100 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/70">
          <div class="h-full overflow-auto">
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
      </aside>
    </div>
  </div>

  {#if showHolidayApiModal}
    <div class="fixed inset-0 z-30 flex items-center justify-center bg-black/50 px-4" role="dialog" aria-modal="true">
      <div class="card w-full max-w-md p-6 shadow-2xl">
        <h2 class="mb-3 text-lg font-semibold text-zinc-900 dark:text-md-onSurfaceDark">
          { $locale === 'de-DE' ? 'Feiertage API verwenden?' : 'Use the Feiertage API?' }
        </h2>
        <p class="mb-4 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {#if $locale === 'de-DE'}
            Wir können aktuelle Feiertage direkt von feiertage-api.de abrufen. Damit erklärst du dich einverstanden, dass der Browser eine Anfrage an diese externe API sendet. Alternativ kannst du mit den eingebauten Fallback-Daten weiterarbeiten.
          {:else}
            We can fetch up-to-date holidays from feiertage-api.de. Accepting allows your browser to request data from this external API. You can also continue with the built-in fallback dataset.
          {/if}
        </p>
        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button class="btn btn-secondary" on:click={declineHolidayApiUsage}>
            { $locale === 'de-DE' ? 'API ablehnen' : 'Reject API' }
          </button>
          <button class="btn btn-primary" on:click={acceptHolidayApiUsage}>
            { $locale === 'de-DE' ? 'API akzeptieren' : 'Accept API usage' }
          </button>
        </div>
      </div>
    </div>
  {/if}

  <footer class="px-6 pb-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
    Holidays include Buß- und Bettag (Saxony only). Bridge day logic follows German common practice.
  </footer>
</main>

<style>
</style>
