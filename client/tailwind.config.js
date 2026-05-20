/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['Rajdhani', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: 'rgba(255, 255, 255, 0.04)',
        'surface-hover': 'rgba(255, 255, 255, 0.08)',
        'surface-strong': 'rgba(255, 255, 255, 0.1)',
        border: 'rgba(255, 255, 255, 0.06)',
        'border-hover': 'rgba(255, 255, 255, 0.12)',
        accent: '#e94560',
        'accent-dim': 'rgba(233, 69, 96, 0.15)',
        'accent-glow': 'rgba(233, 69, 96, 0.3)',
        gold: '#ffd700',
        green: '#34d399',
        'green-dim': 'rgba(52, 211, 153, 0.12)',
        blue: '#60a5fa',
        'blue-dim': 'rgba(96, 165, 250, 0.12)',
        text: '#f0f0f0',
        muted: 'rgba(255, 255, 255, 0.45)',
        'muted-dim': 'rgba(255, 255, 255, 0.06)',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.25)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.35)',
        glow: '0 4px 20px rgba(233, 69, 96, 0.25)',
      },
    },
  },
  plugins: [],
}
