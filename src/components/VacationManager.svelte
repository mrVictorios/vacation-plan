<script lang="ts">
  import { totalDays, remainingDays, vacationDays, clearAll } from '../stores/vacation';
  import { currentYear } from '../stores/year';
  import { locale } from '../stores/locale';

  function onInput(e: Event) {
    const v = Number((e.target as HTMLInputElement).value ?? 0);
    totalDays.set(Math.max(0, Math.floor(v)));
  }
  
  function remove(date: string) {
    vacationDays.update((s) => {
      s.delete(date);
      return new Set(s);
    });
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h2 class="text-lg font-semibold">{ $locale === 'de-DE' ? 'Dein Urlaub' : 'Your Vacation' }</h2>
    {#if $vacationDays.size > 0}
      <button class="px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
        on:click={clearAll}
      >{ $locale === 'de-DE' ? 'Alle zurücksetzen' : 'Reset all' }</button>
    {/if}
  </div>

  <div class="flex items-center gap-3">
    <label class="text-sm text-zinc-700 dark:text-zinc-300" for="days">{ $locale === 'de-DE' ? `Verfügbar (${$currentYear})` : `Available (${$currentYear})` }</label>
    <input id="days" type="number" min="0" class="border border-zinc-300 dark:border-md-outline rounded-lg px-2 py-1 w-24 bg-white dark:bg-md-surfaceDark text-zinc-900 dark:text-md-onSurfaceDark focus:outline-none focus-visible:ring-2 focus-visible:ring-md-primary" on:input={onInput} bind:value={$totalDays} />
  </div>

  <div class="flex items-center gap-2">
    <span class="badge border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-300 bg-sky-50 dark:bg-sky-900/30">{ $locale === 'de-DE' ? 'Übrig' : 'Remaining' }: {$remainingDays}</span>
    <span class="badge border-zinc-200 dark:border-md-outline text-zinc-700 dark:text-zinc-300">{ $locale === 'de-DE' ? 'Gewählt' : 'Selected' }: {$vacationDays.size}</span>
  </div>

  <div>
    <h3 class="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">{ $locale === 'de-DE' ? 'Ausgewählte Tage' : 'Selected days' }</h3>
    {#if $vacationDays.size === 0}
      <p class="text-sm text-zinc-500 dark:text-zinc-400">{ $locale === 'de-DE' ? 'Noch keine Tage gewählt. Klicke im Kalender auf Arbeitstage.' : 'No days selected yet. Click on working days in the calendar.' }</p>
    {:else}
      <div class="max-h-56 overflow-auto border border-zinc-200 dark:border-md-outline rounded-lg">
        <table class="w-full text-sm">
          <thead class="sticky top-0 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
            <tr>
              <th class="text-left px-3 py-2">{ $locale === 'de-DE' ? 'Datum' : 'Date' }</th>
              <th class="text-right px-3 py-2">{ $locale === 'de-DE' ? 'Aktionen' : 'Actions' }</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-200 dark:divide-md-outline">
            {#each Array.from($vacationDays).sort() as d}
              <tr>
                <td class="px-3 py-2 text-zinc-800 dark:text-md-onSurfaceDark">{new Date(d).toLocaleDateString($locale)}</td>
                <td class="px-3 py-2 text-right">
                  <button class="px-2 py-1 rounded border border-zinc-300 dark:border-md-outline hover:bg-zinc-50 dark:hover:bg-zinc-800" on:click={() => remove(d)}>{ $locale === 'de-DE' ? 'Entfernen' : 'Remove' }</button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
