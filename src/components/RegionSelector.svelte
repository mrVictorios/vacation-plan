<script lang="ts">
  import { region, germanRegions } from '../stores/region';
  import { locale } from '../stores/locale';
</script>

<label class="flex items-center gap-2">
  <span class="text-sm text-zinc-600 dark:text-zinc-300">{ $locale === 'de-DE' ? 'Bundesland' : 'Region' }</span>
  <select class="border border-zinc-300 dark:border-md-outline rounded-lg px-2 py-1 text-sm bg-white dark:bg-md-surfaceDark text-zinc-900 dark:text-md-onSurfaceDark focus:outline-none focus-visible:ring-2 focus-visible:ring-md-primary" bind:value={$region}>
    {#each germanRegions as r}
      <option value={r.code}>{r.name}</option>
    {/each}
  </select>
</label>
