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
        serif: ['Fraunces', 'Georgia', 'ui-serif', 'serif'],
      },
      boxShadow: {
        sheet: '0 18px 50px rgba(33,28,22,0.12), 0 2px 8px rgba(33,28,22,0.06)',
        card: '0 1px 3px rgba(33,28,22,0.06), 0 6px 18px rgba(33,28,22,0.06)',
      },
    },
  },
  plugins: [],
}
