/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        paper: '#faf8f5',
        ink: { DEFAULT: '#1f2328', soft: '#4b5058', mute: '#7a7f87' },
        line: { DEFAULT: '#e6e2da', strong: '#d4cfc4' },
        accent: { DEFAULT: '#4338ca', soft: '#eceafc', dark: '#352ba8' },
        ok: { DEFAULT: '#2f7a4f', soft: '#e6f2ea' },
        bad: { DEFAULT: '#b3372f', soft: '#fbebe9' },
        warn: { DEFAULT: '#9a6a12', soft: '#fbf1dc' },
      },
      boxShadow: { card: '0 1px 2px rgba(31,35,40,0.05)', pop: '0 12px 32px rgba(31,35,40,0.16)' },
    },
  },
  plugins: [],
};
