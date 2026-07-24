/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
        extend: {
                fontFamily: {
                        'heading': ['Bebas Neue', 'Arial Narrow', 'sans-serif'],
                        'body': ['DM Sans', 'sans-serif'],
                        'mono': ['IBM Plex Mono', 'monospace'],
                },
                borderRadius: {
                        lg: 'var(--radius)',
                        md: 'calc(var(--radius) - 2px)',
                        sm: 'calc(var(--radius) - 4px)'
                },
                colors: {
                        background: 'var(--background)',
                        foreground: 'var(--foreground)',
                        card: {
                                DEFAULT: 'var(--card)',
                                foreground: 'var(--card-foreground)'
                        },
                        popover: {
                                DEFAULT: 'var(--popover)',
                                foreground: 'var(--popover-foreground)'
                        },
                        primary: {
                                DEFAULT: 'var(--primary)',
                                foreground: 'var(--primary-foreground)'
                        },
                        secondary: {
                                DEFAULT: 'var(--secondary)',
                                foreground: 'var(--secondary-foreground)'
                        },
                        muted: {
                                DEFAULT: 'var(--muted)',
                                foreground: 'var(--muted-foreground)'
                        },
                        accent: {
                                DEFAULT: 'var(--accent)',
                                foreground: 'var(--accent-foreground)'
                        },
                        destructive: {
                                DEFAULT: 'var(--destructive)',
                                foreground: 'var(--destructive-foreground)'
                        },
                        border: 'var(--border)',
                        input: 'var(--input)',
                        ring: 'var(--ring)',
                        chart: {
                                '1': 'hsl(var(--chart-1))',
                                '2': 'hsl(var(--chart-2))',
                                '3': 'hsl(var(--chart-3))',
                                '4': 'hsl(var(--chart-4))',
                                '5': 'hsl(var(--chart-5))'
                        },
                        fire: '#ef4444',
                        gold: '#EC5B13',
                        'fire-hover': '#FF7A2F',
                        amber: '#f59e0b',
                        emerald: '#22c55e',
                        azure: '#3b82f6',
                        violet: '#7c3aed',
                },
                keyframes: {
                        'accordion-down': {
                                from: { height: '0' },
                                to: { height: 'var(--radix-accordion-content-height)' }
                        },
                        'accordion-up': {
                                from: { height: 'var(--radix-accordion-content-height)' },
                                to: { height: '0' }
                        },
                        'pulse-glow': {
                                '0%, 100%': { opacity: '1' },
                                '50%': { opacity: '0.5' }
                        },
                        'slide-up': {
                                from: { opacity: '0', transform: 'translateY(10px)' },
                                to: { opacity: '1', transform: 'translateY(0)' }
                        },
                        'fade-in': {
                                from: { opacity: '0' },
                                to: { opacity: '1' }
                        }
                },
                animation: {
                        'accordion-down': 'accordion-down 0.2s ease-out',
                        'accordion-up': 'accordion-up 0.2s ease-out',
                        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
                        'slide-up': 'slide-up 0.3s ease-out',
                        'fade-in': 'fade-in 0.2s ease-out'
                }
        }
  },
  plugins: [require("tailwindcss-animate")],
};
