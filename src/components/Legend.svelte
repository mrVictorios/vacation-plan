<script lang="ts">
  import { locale } from '../stores/locale';
  const t = {
    holiday: { de: 'Feiertag', en: 'Public holiday' },
    bridge: { de: 'Brückentag', en: 'Bridge day' },
    vacation: { de: 'Urlaub', en: 'Vacation' },
    weekend: { de: 'Wochenende', en: 'Weekend' },
    workday: { de: 'Arbeitstag', en: 'Workday' },
  } as const;
</script>

<div class="flex flex-wrap gap-2 text-xs">
  <span class="badge bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800">{ $locale === 'de-DE' ? t.holiday.de : t.holiday.en }</span>
  <span class="badge bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800">{ $locale === 'de-DE' ? t.bridge.de : t.bridge.en }</span>
  <span class="badge bg-sky-600 text-white border-sky-600">{ $locale === 'de-DE' ? t.vacation.de : t.vacation.en }</span>
  <span class="badge bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700">{ $locale === 'de-DE' ? t.weekend.de : t.weekend.en }</span>
  <span class="badge bg-white dark:bg-ios-surface text-zinc-800 dark:text-ios-text border-zinc-200 dark:border-ios-border">{ $locale === 'de-DE' ? t.workday.de : t.workday.en }</span>
</div>
