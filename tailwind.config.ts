import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@coinbase/onchainkit/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#1a1b26',
        surface: '#242530',
        primary: '#ff6b9d',
        success: '#10b981',
        warning: '#f59e0b',
        text: '#ffffff',
        muted: '#a1a1aa',
      },
      maxWidth: {
        mobile: '448px', // 28rem - mobile-first max width
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
      },
      minHeight: {
        'touch': '44px', // Minimum touch target size
      },
      borderRadius: {
        'card': '12px',
      },
    },
  },
  plugins: [],
}

export default config
