/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0084FF',
        secondary: '#44BDD8',
        dark: '#1C1E21',
        darker: '#242526',
        light: '#F0F2F5'
      }
    },
  },
  plugins: [],
}