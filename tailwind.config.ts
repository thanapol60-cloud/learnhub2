import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Institutional navy — the primary voice of the interface
        brand: {
          50: '#f3f6fb',
          100: '#e4ecf6',
          200: '#c7d8ec',
          300: '#9dbadd',
          400: '#6c95c9',
          500: '#4975b1',
          600: '#375c95',
          700: '#2d4a79',
          800: '#274063',
          900: '#1e3252',
          950: '#101d33',
        },
        ink: '#0d1726',
        primary: '#274063',
        success: '#15803d',
        warning: '#b45309',
        danger: '#b91c1c',
      },
      boxShadow: {
        card: '0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06)',
        raised: '0 2px 4px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.08)',
      },
      borderRadius: {
        lg: '0.5rem',
        xl: '0.75rem',
      },
    },
  },
  plugins: [],
}
export default config
