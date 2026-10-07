/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0f172a', // Slate 900
        surface: '#1e293b',    // Slate 800
        surfaceHover: '#334155', // Slate 700
        primary: '#0ea5e9',    // Sky 500
        primaryHover: '#0284c7', // Sky 600
        critical: '#ef4444',   // Red 500
        high: '#f97316',       // Orange 500
        medium: '#eab308',     // Yellow 500
        low: '#22c55e',        // Green 500
        info: '#3b82f6',       // Blue 500
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
