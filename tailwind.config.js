/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'wa-bg':              '#111b21',
        'wa-panel':           '#202c33',
        'wa-panel-hover':     '#2a3942',
        'wa-header':          '#202c33',
        'wa-input-bg':        '#2a3942',
        'wa-green':           '#00a884',
        'wa-msg-out':         '#005c4b',
        'wa-msg-in':          '#202c33',
        'wa-text':            '#e9edef',
        'wa-text-secondary':  '#8696a0',
        'wa-border':          '#2a3942',
        'wa-icon':            '#aebac1',
        'wa-search-bg':       '#2a3942',
        'wa-chat-bg':         '#0b141a',
        'wa-active':          '#2a3942',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
