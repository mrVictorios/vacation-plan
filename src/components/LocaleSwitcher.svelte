<script lang="ts">
  import { locale } from '../stores/locale';

  const options = [
    { key: 'de-DE', label: 'DE' },
    { key: 'en-US', label: 'EN' },
  ] as const;

  function setLoc(k: 'de-DE' | 'en-US') {
    locale.set(k);
  }
</script>

<div class="inline-flex items-center rounded-lg border border-zinc-300 dark:border-md-outline p-0.5 bg-white dark:bg-md-surfaceDark" role="tablist" aria-label="Locale">
  {#each options as o}
    <button
      role="tab"
      aria-selected={$locale === o.key}
      class="px-2 py-1 text-sm rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-md-primary transition-colors
        { $locale === o.key ? 'bg-md-primary text-md-onPrimary' : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800' }"
      on:click={() => setLoc(o.key)}
    >{o.label}</button>
  {/each}
</div>
