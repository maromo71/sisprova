/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        monokai: {
          bg: '#272822',
          panel: '#1e1f1c',
          card: '#34352f',
          cardHover: '#3e3d32',
          border: '#49483e',
          divider: '#3e3d32',
          fg: '#f8f8f2',
          comment: '#75715e',
          sub: '#cfcfc2',
          pink: '#f92672',
          green: '#a6e22e',
          cyan: '#66d9ef',
          orange: '#fd971f',
          yellow: '#e6db74',
          purple: '#ae81ff',
        },
      },
      screens: {
        print: { raw: "print" },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        serif: ["Crimson Pro", "Georgia", "Cambria", "Times New Roman", "serif"],
        mono: ["JetBrains Mono", "Fira Code", "Courier New", "monospace"],
      },
    },
  },
  plugins: [],
}


