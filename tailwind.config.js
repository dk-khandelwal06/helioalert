/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-app)',
        surface: 'var(--bg-surface)',
        'surface-elevated': 'var(--bg-elevated)',
        border: 'var(--border-color)',
        'border-highlight': 'var(--border-highlight)',
        foreground: 'var(--text-main)',
        'muted-foreground': 'var(--text-muted)',
        
        solar: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        telemetry: {
          cyan: '#06b6d4',
          ice: '#38bdf8',
          blue: '#2563eb',
          gold: '#f59e0b',
          orange: '#ea580c',
          danger: '#ef4444',
          success: '#10b981',
          quiet: '#3b82f6',
          unsettled: '#eab308',
          active: '#f97316',
          storm: '#ef4444',
          severe: '#dc2626',
          extreme: '#b91c1c'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'SFMono-Regular', 'Menlo', 'monospace']
      },
      boxShadow: {
        'glow-solar': '0 0 25px -5px rgba(245, 158, 11, 0.3)',
        'glow-telemetry': '0 0 25px -5px rgba(6, 182, 212, 0.3)',
        'glow-danger': '0 0 30px -5px rgba(239, 68, 68, 0.4)',
      }
    },
  },
  plugins: [],
}

