/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-page': '#FAF6EF',
        'bg-panel': '#F5F0E8',
        'bg-canvas': '#FBF8F2',
        'layer-top': '#FFFCF6',
        'layer-bottom': '#EFE7D8',
        'layer-border': '#D8CDB8',
        'layer-hover': '#FFFDF8',
        'text-primary': '#3A342E',
        'text-secondary': '#8A8074',
        'text-tertiary': '#B0A898',
        'accent': '#7C3AED',
        'accent-hover': '#6D28D9',
        'accent-soft': '#A78BFA',
        'error': '#DC2626',
        'warning': '#D97706',
        'success': '#059669',
      },
      boxShadow: {
        'soft': '0 4px 12px rgba(90,70,40,0.10)',
        'hover': '0 8px 20px rgba(90,70,40,0.16)',
      },
    },
  },
  plugins: [],
}