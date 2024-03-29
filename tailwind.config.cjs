/** @type {import('tailwindcss').Config} */

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
    extend: {
      colors: {
        primary: {"50":"#eff6ff","100":"#dbeafe","200":"#bfdbfe","300":"#93c5fd","400":"#60a5fa","500":"#3b82f6","600":"#2563eb","700":"#1d4ed8","800":"#1e40af","900":"#1e3a8a"}
      } 
    },
    fontFamily: {
      'body': [
        'Inter', 
        'ui-sans-serif', 
        'system-ui', 
        '-apple-system', 
        'system-ui', 
        'Segoe UI', 
        'Roboto', 
        'Helvetica Neue', 
        'Arial', 
        'Noto Sans', 
        'sans-serif', 
        'Apple Color Emoji', 
        'Segoe UI Emoji', 
        'Segoe UI Symbol', 
        'Noto Color Emoji'
      ],
      'sans': [
        'Inter', 
        'ui-sans-serif', 
        'system-ui', 
        '-apple-system', 
        'system-ui', 
        'Segoe UI', 
        'Roboto', 
        'Helvetica Neue', 
        'Arial', 
        'Noto Sans', 
        'sans-serif', 
        'Apple Color Emoji', 
        'Segoe UI Emoji', 
        'Segoe UI Symbol', 
        'Noto Color Emoji'
      ]
    }
  },
  plugins: [
    require('flowbite/plugin')
  ],
  darkMode: 'class'
}
