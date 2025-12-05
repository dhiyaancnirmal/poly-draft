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
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        text: 'var(--foreground)',
        surface: {
          DEFAULT: 'var(--surface)',
          highlight: 'var(--surface-highlight)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
        muted: 'var(--muted)',
        border: 'var(--border)',
      },
      fontFamily: {
        sans: ['var(--font-tiktok-sans)', '"TikTok Sans"', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
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
        'sm': '6px',
        DEFAULT: '10px',
        'md': '14px',
        'lg': '16px',
        'xl': '18px',
        '2xl': '22px',
        '3xl': '28px',
        'full': '9999px',
        'card': '18px', // Softer rounding for cards
        'pill': '9999px',
      },
      boxShadow: {
        'glow': '0 0 20px -5px var(--primary)',
        'card': '0 8px 30px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}

export default config
