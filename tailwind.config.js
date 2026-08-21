/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		fontFamily: {
  			inter: ['var(--font-inter)'],
                        sans: ['Plus Jakarta Sans', 'sans-serif'],
                        "body-lg": ["Plus Jakarta Sans"],
                        "headline-lg-mobile": ["Plus Jakarta Sans"],
                        "label-sm": ["Plus Jakarta Sans"],
                        "headline-lg": ["Plus Jakarta Sans"],
                        "body-sm": ["Plus Jakarta Sans"],
                        "headline-md": ["Plus Jakarta Sans"],
                        "label-md": ["Plus Jakarta Sans"]
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
                        "xl": "0.75rem",
                        "full": "9999px"
  		},
                    "spacing": {
                        "margin-desktop": "auto",
                        "container-padding": "24px",
                        "margin-mobile": "16px",
                        "base": "8px",
                        "max-width": "1200px",
                        "gutter": "16px"
                    },
  		colors: {
                        "tertiary-fixed-dim": "#ffba20",
                        "secondary-fixed-dim": "#c3c7cc",
                        "surface-tint": "#006d41",
                        "on-error": "#ffffff",
                        "surface-container-lowest": "#ffffff",
                        "on-tertiary-container": "#5f4300",
                        "on-surface": "#0b1c30",
                        "on-primary-fixed": "#002110",
                        "on-secondary-fixed-variant": "#43474b",
                        "surface-dim": "#cbdbf5",
                        "surface-container-high": "#dce9ff",
                        "on-secondary-container": "#616569",
                        "on-primary": "#ffffff",
                        "primary-fixed-dim": "#2fe190",
                        "on-tertiary-fixed-variant": "#5e4200",
                        "on-primary-fixed-variant": "#005230",
                        "on-primary-container": "#005331",
                        "error-container": "#ffdad6",
                        "tertiary-container": "#edab00",
                        "on-background": "#0b1c30",
                        "on-secondary-fixed": "#181c20",
                        "surface": "#f8f9ff",
                        "secondary-fixed": "#dfe3e8",
                        "secondary": "#5b5f63",
                        "surface-variant": "#d3e4fe",
                        "error": "#ba1a1a",
                        "tertiary": "#7c5800",
                        "primary-container": "#00d182",
                        "on-error-container": "#93000a",
                        "primary-fixed": "#58ffaa",
                        "surface-bright": "#f8f9ff",
                        "surface-container-highest": "#d3e4fe",
                        "inverse-on-surface": "#eaf1ff",
                        "on-tertiary": "#ffffff",
                        "on-tertiary-fixed": "#271900",
                        "on-surface-variant": "#3c4a40",
                        "tertiary-fixed": "#ffdea8",
                        "surface-container": "#e5eeff",
                        "on-secondary": "#ffffff",
                        "secondary-container": "#dfe3e8",
                        "outline-variant": "#bacbbd",
                        "inverse-surface": "#213145",
                        "surface-container-low": "#eff4ff",
                        "outline": "#6c7b6f",

  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}