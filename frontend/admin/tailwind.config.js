/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'x-blue-50':'#ADBFFF',
        'x-blue-100':'#708FFF',
        'x-blue-500':'#0037FF',
        'x-blue-800':'#14154E',
        'x-blue-900':'#0e092a',
      }
    },
  },
  plugins: [],
}
