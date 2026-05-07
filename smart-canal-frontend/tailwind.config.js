/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Noto Sans Sinhala', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        healthy: '#10B981',
        warning: '#F59E0B',
        critical: '#EF4444',
        info: '#3B82F6',
        glass: 'rgba(255,255,255,0.15)',
        'surface-light': '#ffffff',
        'surface-dark': '#1f2937',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 4px 20px rgba(0,0,0,0.08)',
        'glass': '0 8px 32px rgba(31,38,135,0.15)',
        'neo': '8px 8px 16px #d1d5db, -8px -8px 16px #ffffff',
        'neo-dark': '8px 8px 16px #111827, -8px -8px 16px #1f2937',
      },
      backgroundImage: {
        'login-pattern': "url('https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&auto=format&fit=crop')",
      },
    },
  },
  plugins: [],
}