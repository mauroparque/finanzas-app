/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // === Editorial Orgánico Palette ===
        // Primary backgrounds
        stone: {
          50:  '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
          950: '#0c0a09',
        },
        // Terracotta — primary accent (actions, active states, CTAs)
        terracotta: {
          50:  '#fdf3f0',
          100: '#fbe6df',
          200: '#f6cdbf',
          300: '#f0ae96',
          400: '#e88560',
          500: '#d9622e',
          600: '#c44e1e',
          700: '#a33d17',
          800: '#823117',
          900: '#6b2c18',
        },
        // Sage — secondary accent (info, tags, subtle highlights)
        sage: {
          50:  '#f3f6f0',
          100: '#e4ecde',
          200: '#c9d8be',
          300: '#a5bd97',
          400: '#7f9e70',
          500: '#5e8152',
          600: '#4a6840',
          700: '#3c5333',
          800: '#32432b',
          900: '#293826',
        },
        // Navy — text, links, data headers
        navy: {
          50:  '#eff3f8',
          100: '#dbe5f1',
          200: '#bdcfe4',
          300: '#92afd2',
          400: '#6589bb',
          500: '#456ba3',
          600: '#355589',
          700: '#2c4470',
          800: '#273b5e',
          900: '#25334f',
        },
      },
      fontFamily: {
        sans:  ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['Lora', 'ui-serif', 'Georgia', 'serif'],
        mono:  ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'soft':  '0 2px 8px 0 rgb(0 0 0 / 0.06)',
        'card':  '0 4px 16px 0 rgb(0 0 0 / 0.08)',
        'float': '0 8px 32px 0 rgb(0 0 0 / 0.12)',
      },
    },
  },
  plugins: [],
};
