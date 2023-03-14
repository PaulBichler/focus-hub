/** @type {import('tailwindcss').Config} */

const colors = require('tailwindcss/colors')

module.exports = {
  content: [
    "./src/**/*.{html,js}",
    "./node_modules/flowbite/**/*.js"
  ],
  safelist: [
    'border-t-4',
    {
      pattern: /bg-(red|green|blue|gray)-(50|400|700|800)/,
    },
    {
      pattern: /border-(red|green|blue)-(300|700|800)/,
    },
    {
      pattern: /text-(red|green|blue)-(400|800)/,
    },
  ],
  theme: {
    extend: { }
  },
  plugins: [
    require('flowbite/plugin')
  ],
  darkMode: 'class'
}
