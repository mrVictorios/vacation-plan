/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{svelte,ts,js}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Roboto',
          'Segoe UI',
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
        // Material Design 3 inspired tokens
        md: {
          primary: '#6750A4',
          onPrimary: '#FFFFFF',
          surface: '#FFFFFF',
          surfaceDark: '#1C1B1F',
          surfaceVariant: '#E7E0EC',
          outline: '#79747E',
          onSurface: '#1D1B20',
          onSurfaceDark: '#E6E1E5',
        },
      },
    },
  },
  plugins: [],
};
