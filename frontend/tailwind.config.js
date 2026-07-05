/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // MediQuick AI urgency color system — non-negotiable
        'self-care':  '#16a34a',   // green  — "✓ Manageable at Home"
        'consult':    '#d97706',   // amber  — "⚠ See a Doctor Soon"
        'emergency':  '#dc2626',   // red    — "🚨 Seek Emergency Care"
      },
    },
  },
  plugins: [],
}
