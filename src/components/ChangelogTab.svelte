<script lang="ts">
  import { locale } from '../stores/locale';

  type Entry = {
    date: string;
    text: { de: string; en: string };
  };

  const entries: Entry[] = [
    {
      date: '2025-11-02',
      text: {
        de: 'Automatische Planung berücksichtigt jetzt die Mindestanzahl an Urlaubstagen, Feiertage-Fallbacks liefern für alle Bundesländer exakte Daten und der API-Hinweis erscheint als bestätigungsmodal.',
        en: 'Auto planner now honors the minimum break setting, regional holiday fallbacks provide accurate data, and a consent modal explains the Feiertage API usage.',
      },
    },
  ];
</script>

<div class="space-y-3">
  <h3 class="text-base font-semibold text-zinc-800 dark:text-md-onSurfaceDark">Changelog</h3>
  <p class="text-sm text-zinc-600 dark:text-zinc-300">
    {#if $locale === 'de-DE'}
      Neueste Änderungen am Planer werden hier aufgeführt.
    {:else}
      Track the latest updates to the planner below.
    {/if}
  </p>

  <ul class="space-y-2 text-sm">
    {#each entries as entry}
      <li class="border border-zinc-200 dark:border-md-outline rounded-lg p-3">
        <div class="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">{entry.date}</div>
        <div class="text-zinc-700 dark:text-zinc-200">
          {#if $locale === 'de-DE'}
            {entry.text.de}
          {:else}
            {entry.text.en}
          {/if}
        </div>
      </li>
    {/each}
  </ul>
</div>
