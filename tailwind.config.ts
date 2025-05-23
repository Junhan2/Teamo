import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  safelist: [
    // Gray Cool palette classes
    'bg-gray-cool-25', 'bg-gray-cool-50', 'bg-gray-cool-100', 'bg-gray-cool-200',
    'bg-gray-cool-300', 'bg-gray-cool-400', 'bg-gray-cool-500', 'bg-gray-cool-600',
    'bg-gray-cool-700', 'bg-gray-cool-800', 'bg-gray-cool-900',
    'text-gray-cool-25', 'text-gray-cool-50', 'text-gray-cool-100', 'text-gray-cool-200',
    'text-gray-cool-300', 'text-gray-cool-400', 'text-gray-cool-500', 'text-gray-cool-600',
    'text-gray-cool-700', 'text-gray-cool-800', 'text-gray-cool-900',
    'border-gray-cool-25', 'border-gray-cool-50', 'border-gray-cool-100', 'border-gray-cool-200',
    'border-gray-cool-300', 'border-gray-cool-400', 'border-gray-cool-500', 'border-gray-cool-600',
    'border-gray-cool-700', 'border-gray-cool-800', 'border-gray-cool-900',
    'hover:bg-gray-cool-50', 'hover:bg-gray-cool-100', 'hover:bg-gray-cool-200', 
    'hover:bg-gray-cool-300', 'hover:bg-gray-cool-400', 'hover:bg-gray-cool-500',
    'hover:bg-gray-cool-600', 'hover:bg-gray-cool-700', 'hover:bg-gray-cool-800',
    'hover:border-gray-cool-300', 'hover:border-gray-cool-400', 'hover:border-gray-cool-500',
    'hover:border-gray-cool-600', 'hover:border-gray-cool-700', 'hover:border-gray-cool-800',
    'focus:ring-gray-cool-400', 'focus:ring-gray-cool-500',
    'from-gray-cool-25', 'via-gray-cool-50', 'to-gray-cool-100',
    // Sky colors for buttons
    'from-sky-500', 'to-sky-600', 'from-sky-600', 'to-sky-700',
    'focus:ring-sky-300', 'bg-sky-100', 'bg-sky-200', 'text-sky-700',
    'border-sky-600', 'border-sky-700', 'bg-blue-300', 'border-sky-900',
    // Additional classes for components
    'bg-gradient-to-br', 'from-gray-cool-25', 'via-gray-cool-50', 'to-gray-cool-100/50',
    'bg-white', 'bg-white/90', 'bg-white/80', 'backdrop-blur-md', 'backdrop-blur-sm',
    'shadow-sm', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl',
    'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-2xl', 'rounded-full',
    'border', 'border-2', 'outline', 'outline-1', 'outline-offset-[-1px]', 'outline-black/20',
    'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl',
    'font-normal', 'font-medium', 'font-semibold', 'font-bold',
    'uppercase', 'tracking-wide', 'animate-fadeIn', 'animate-pulse',
    // Specific color values
    'bg-[#EFF1F5]', 'bg-[#DCDFEA]', 'bg-[#F9F9FB]', 'bg-[#404968]', 'bg-[#30374E]',
    'text-[#404968]', 'text-[#7D89AF]', 'text-[#5D6A97]', 'text-[#065f46]', 'text-[#1e40af]', 'text-[#92400e]',
    'hover:bg-[#EFF1F5]', 'hover:bg-[#DCDFEA]', 'hover:bg-[#30374E]',
    'border-[#B9C0D4]', 'border-[#DCDFEA]', 'border-[#059669]', 'border-[#2563eb]', 'border-[#d97706]',
    'bg-[#d1fae5]', 'bg-[#dbeafe]', 'bg-[#fef3c7]',
    // Status colors
    'bg-emerald-100', 'bg-emerald-200', 'bg-emerald-300', 'bg-emerald-400', 'bg-emerald-500',
    'text-emerald-600', 'text-emerald-700', 'text-emerald-800',
    'bg-blue-100', 'bg-blue-200', 'bg-blue-300', 'bg-blue-400', 'bg-blue-500',
    'text-blue-600', 'text-blue-700', 'text-blue-800',
    'bg-amber-100', 'bg-amber-200', 'bg-amber-300', 'bg-amber-400', 'bg-amber-500',
    'text-amber-600', 'text-amber-700', 'text-amber-800',
    'border-emerald-400', 'border-white', 'animate-pulse',
    // Gradient classes
    'bg-gradient-to-r', 'from-sky-400', 'to-sky-600', 'from-sky-500', 'to-sky-600',
    'from-sky-600', 'to-sky-700', 'hover:from-sky-600', 'hover:to-sky-700',
    'from-emerald-400', 'to-emerald-500', 'from-blue-400', 'to-blue-500',
    'from-amber-400', 'to-amber-500'
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			'dm-sans': ['var(--font-dm-sans)', 'sans-serif'],
  			'fira-mono': ['var(--font-fira-mono)', 'monospace'],
  		},
  		colors: {
  			// Gray Cool Palette
  			'gray-cool': {
  				25: '#FCFCFD',
  				50: '#F9F9FB',
  				100: '#EFF1F5',
  				200: '#DCDFEA',
  				300: '#B9C0D4',
  				400: '#7D89AF',
  				500: '#5D6A97',
  				600: '#4A5578',
  				700: '#404968',
  				800: '#30374E',
  				900: '#111322',
  				950: '#0C0E19'
  			},
  			// Light mode color scheme - individual keys for Tailwind classes
  			'light-background': '#FCFCFD',
  			'light-primary': '#404968',
  			'light-secondary': '#5D6A97', 
  			'light-muted': '#7D89AF',
  			'light-accent': '#3fcf8e',
  			'light-hover': '#00bb68',
  			'light-border': '#DCDFEA',
  			'light-input': '#F9F9FB',
  			// Light mode color scheme (legacy object)
  			light: {
  				background: '#fcfcfc',
  				primary: '#171717',
  				secondary: '#525252', 
  				muted: '#707070',
  				accent: '#3fcf8e',
  				hover: '#00bb68',
  				'green-button': '#72E3AD',
  				'button-text': '#171717',
  				border: 'rgba(0, 0, 0, 0.20)',
  				input: '#FDFDFD'
  			},
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
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
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
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
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
};
export default config;