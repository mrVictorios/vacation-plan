import { writable } from 'svelte/store';

type Locale = 'de-DE' | 'en-US';

function getInitial(): Locale {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('locale') as Locale | null : null;
  if (saved === 'de-DE' || saved === 'en-US') return saved;
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'de-DE';
  return nav?.startsWith('de') ? 'de-DE' : 'en-US';
}

export const locale = writable<Locale>(getInitial());

locale.subscribe((val) => {
  try { localStorage.setItem('locale', val); } catch {}
});
