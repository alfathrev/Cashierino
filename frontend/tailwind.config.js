/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        theme: {
          primary: 'var(--theme-primary)',
          'primary-hover': 'var(--theme-primary-hover)',
          'primary-light': 'var(--theme-primary-light)',
          'primary-subtle': 'var(--theme-primary-subtle)',
          border: 'var(--theme-border)',
          ring: 'var(--theme-ring)',
        },
        surface: {
          sidebar: '#FFFFFF',
          card: '#FFFFFF',
          subtle: '#F8F9FB',
          border: '#F0F2F5',
        }
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.04), 0 2px 6px -1px rgba(0, 0, 0, 0.02)',
        'float': '0 12px 36px -4px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
        'btn': '0 8px 24px -4px var(--theme-shadow)',
      }
    },
  },
  plugins: [],
}
