/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0a0a0a',
        panel: '#111114',
        sorted: '#22c55e',
        key: '#f59e0b',
        accentBlue: '#3b82f6',
        accentPurple: '#a855f7',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-green': '0 0 18px rgba(34,197,94,0.55), 0 0 4px rgba(34,197,94,0.9)',
        'glow-amber': '0 0 22px rgba(245,158,11,0.6), 0 0 6px rgba(245,158,11,0.9)',
      },
    },
  },
  plugins: [],
}
