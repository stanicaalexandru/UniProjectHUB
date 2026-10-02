/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: '#d9a066',
        tone: { blue: '#5b7fa8', green: '#6b9a7d', amber: '#c49a5a', orange: '#c9825a', rose: '#b06a78', violet: '#8a7aa6' },
        // Etichetele de stare: fundal deschis si text inchis, in aceleasi tonuri prafuite
        badge: {
          slate: { bg: '#eef1f5', fg: '#556274' },
          blue: { bg: '#e5ecf4', fg: '#3e5f86' },
          green: { bg: '#e6efe9', fg: '#4b7a5c' },
          emerald: { bg: '#dfece4', fg: '#3c6b4e' },
          amber: { bg: '#f5ecdf', fg: '#8a6430' },
          violet: { bg: '#ece7f1', fg: '#6a5784' },
          rose: { bg: '#f4e5e8', fg: '#94505d' },
          yellow: { bg: '#f6efd9', fg: '#7d6a2e' },
          orange: { bg: '#f6e6dc', fg: '#8f5536' },
        },
        blue: { 50: '#f1f5fa', 100: '#e1e9f3', 200: '#c3d3e6', 300: '#a3bcdb', 400: '#7f9fc8', 500: '#4d70a0', 600: '#2c5282', 700: '#1e3a5f', 800: '#182f4d', 900: '#13263e', 950: '#0c1828' },
      },
    },
  },
  plugins: [],
}
