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
          bg: '#090d16',        // Fundo profundo neutro
          panel: '#0f172a',     // Slate 900 (Painéis e barras)
          card: '#1e293b',      // Slate 800 (Cards e containers)
          cardHover: '#334155', // Slate 700 (Hover suave)
          border: '#334155',    // Slate 700 (Bordas nítidas sem ofuscar)
          divider: '#1e293b',   // Slate 800 (Divisores)
          fg: '#f8fafc',        // Slate 50 (Texto nítido de alta ergonomia)
          comment: '#94a3b8',   // Slate 400 (Textos secundários claros)
          sub: '#cbd5e1',       // Slate 300 (Subtítulos)
          pink: '#6366f1',      // Indigo moderno (substitui rosa neon)
          green: '#10b981',     // Emerald 500 equilibrado
          cyan: '#38bdf8',      // Sky 400 calmo e legível
          orange: '#f59e0b',    // Amber 500 quente
          yellow: '#eab308',    // Yellow 500
          purple: '#8b5cf6',    // Violet 500 elegante
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


