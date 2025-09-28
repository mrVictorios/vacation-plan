/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'media',
  content: [
    './index.html',
    './src/**/*.{svelte,ts,js}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Noto Color Emoji',
          'sans-serif',
        ],
      },
      colors: {
        // iOS-like semantic hues for dark mode usage
        ios: {
          bg: '#1C1C1E',
          surface: '#2C2C2E',
          border: '#3A3A3C',
          text: '#F2F2F7',
          secondary: '#8E8E93',
          accent: '#0A84FF',
          red: '#FF453A',
          amber: '#FFD60A',
        },
      },
    },
  },
  plugins: [],
};
