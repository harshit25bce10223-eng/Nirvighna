/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm Temple Palette (Pilgrim Portal)
        cream: {
          DEFAULT: '#FCEEE1',
          light: '#FFF5EB',
        },
        temple: {
          // Primary Accent (selected states, CTAs)
          orange: '#DD8536',
          // Dark Accent (headers, active pills)
          brown: '#7A3E1D',
          // Soft Highlight (badges, selected-but-calm states)
          peach: '#F5D9B8',
          // Text colors
          text: '#4A3226',
          textMuted: '#8B7355',
        },
        // Dark Warm Theme (Command Centre)
        darkWarm: {
          bg: '#2B1F18',
          card: '#3A2E25',
          rust: '#B5482F',
        },
        // Legacy colors (keep for gradual migration)
        indigo: {
          dark: '#1B2A4A',
          DEFAULT: '#1B2A4A',
          card: '#16223D',
        },
        gold: {
          light: '#F4C465',
          DEFAULT: '#E3A32A',
          dark: '#C78919',
        },
        ivory: {
          DEFAULT: '#FAF7F0',
          dark: '#F0EAD6',
        },
        maroon: {
          light: '#B24350',
          DEFAULT: '#8C2F39',
          dark: '#6A2129',
        },
        alertRed: '#C1443C',
        successGreen: '#3F7D5C',
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
      },
      boxShadow: {
        warm: '0 4px 20px -2px rgba(140, 47, 57, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        goldGlow: '0 0 15px rgba(227, 163, 42, 0.35)',
        alertGlow: '0 0 20px rgba(193, 68, 60, 0.4)',
        temple: '0 4px 16px -2px rgba(122, 62, 29, 0.12), 0 2px 8px -1px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
