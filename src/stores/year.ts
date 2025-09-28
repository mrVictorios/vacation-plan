import { writable } from 'svelte/store';

// Year selector store (defaults to current year)
export const currentYear = writable(new Date().getFullYear());

