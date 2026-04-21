import type { Config } from 'tailwindcss';
import tailwindAnimate from 'tailwindcss-animate';

/**
 * IRMS Design System — Tailwind Configuration
 *
 * Industrial Precision direction:
 * - Muted neutral base (Slate)
 * - Single brand color (Steel Blue)
 * - Semantic risk colors reserved for safety indicators
 * - Tight default radius (4px)
 * - Minimal shadows, purposeful motion
 *
 * Referenced by: src/styles/globals.css (defines the CSS variables)
 */
const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      // ─── COLORS ────────────────────────────────────────────────
      colors: {
        // shadcn/ui base tokens (mapped to CSS vars in globals.css)
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        // ─── IRMS BRAND ─────────────────────────────────────────
        brand: {
          50: 'hsl(214, 100%, 97%)',
          100: 'hsl(214, 95%, 93%)',
          200: 'hsl(213, 97%, 87%)',
          300: 'hsl(212, 96%, 78%)',
          400: 'hsl(213, 94%, 68%)',
          500: 'hsl(217, 91%, 50%)',
          600: 'hsl(221, 83%, 42%)', // Primary default
          700: 'hsl(224, 76%, 35%)',
          800: 'hsl(226, 71%, 28%)',
          900: 'hsl(224, 64%, 23%)',
          950: 'hsl(229, 84%, 13%)',
        },

        // ─── SEMANTIC — RISK SEVERITY ───────────────────────────
        // Triple-redundancy: color + icon + label (see RiskBadge)
        // Reserved for safety-critical indicators ONLY.
        risk: {
          low: {
            DEFAULT: 'hsl(var(--risk-low))',
            fg: 'hsl(var(--risk-low-fg))',
            bg: 'hsl(var(--risk-low-bg))',
          },
          medium: {
            DEFAULT: 'hsl(var(--risk-medium))',
            fg: 'hsl(var(--risk-medium-fg))',
            bg: 'hsl(var(--risk-medium-bg))',
          },
          high: {
            DEFAULT: 'hsl(var(--risk-high))',
            fg: 'hsl(var(--risk-high-fg))',
            bg: 'hsl(var(--risk-high-bg))',
          },
          extreme: {
            DEFAULT: 'hsl(var(--risk-extreme))',
            fg: 'hsl(var(--risk-extreme-fg))',
            bg: 'hsl(var(--risk-extreme-bg))',
          },
        },

        // ─── SEMANTIC — ACTION STATUS ───────────────────────────
        status: {
          open: 'hsl(var(--status-open))',
          'in-progress': 'hsl(var(--status-in-progress))',
          review: 'hsl(var(--status-review))',
          closed: 'hsl(var(--status-closed))',
          rejected: 'hsl(var(--status-rejected))',
        },

        // ─── SEMANTIC — BOWTIE ELEMENTS ─────────────────────────
        bowtie: {
          threat: 'hsl(var(--bowtie-threat))',
          topevent: 'hsl(var(--bowtie-topevent))',
          'barrier-preventive': 'hsl(var(--bowtie-barrier-preventive))',
          'barrier-mitigative': 'hsl(var(--bowtie-barrier-mitigative))',
          consequence: 'hsl(var(--bowtie-consequence))',
          escalation: 'hsl(var(--bowtie-escalation))',
        },
      },

      // ─── TYPOGRAPHY ────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '0.875rem', letterSpacing: '0.02em' }], // 11px
        xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],         // 12px
        sm: ['0.875rem', { lineHeight: '1.25rem' }],                              // 14px — UI default
        base: ['1rem', { lineHeight: '1.5rem' }],                                 // 16px
        lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],    // 18px
        xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],     // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.02em' }],      // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.02em' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.03em' }],   // 36px
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },

      // ─── SPACING ────────────────────────────────────────────────
      // Tailwind default 4px scale + a few additions
      spacing: {
        '4.5': '1.125rem', // 18px
        '15': '3.75rem',   // 60px — sidebar item height
        '17': '4.25rem',   // 68px
      },

      // ─── RADIUS ─────────────────────────────────────────────────
      // Overriding shadcn default to be tighter (industrial feel)
      borderRadius: {
        lg: '0.5rem',  // 8px
        md: '0.375rem', // 6px
        DEFAULT: '0.25rem', // 4px — IRMS default
        sm: '0.125rem', // 2px — badge, chip
      },

      // ─── SHADOWS ────────────────────────────────────────────────
      boxShadow: {
        sm: '0 1px 2px rgb(0 0 0 / 0.04)',
        DEFAULT: '0 1px 3px rgb(0 0 0 / 0.08), 0 1px 2px rgb(0 0 0 / 0.04)',
        md: '0 4px 6px rgb(0 0 0 / 0.07), 0 2px 4px rgb(0 0 0 / 0.04)',
        lg: '0 10px 15px rgb(0 0 0 / 0.08), 0 4px 6px rgb(0 0 0 / 0.04)',
        // Focus ring as shadow (sometimes more reliable than outline)
        'focus-ring': '0 0 0 2px hsl(var(--background)), 0 0 0 4px hsl(var(--ring))',
        // No xl / 2xl — industrial design doesn't need those
      },

      // ─── MOTION ─────────────────────────────────────────────────
      transitionDuration: {
        75: '75ms',
        DEFAULT: '150ms',
        200: '200ms',
        300: '300ms',
        500: '500ms', // Max — anything slower feels laggy
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.16, 1, 0.3, 1)', // ease-out
        'ease-in': 'cubic-bezier(0.7, 0, 0.84, 0)',
        'ease-in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
      },

      // ─── KEYFRAMES (shadcn-compatible) ─────────────────────────
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in-from-top': {
          from: { transform: 'translateY(-0.5rem)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 200ms ease-out',
        'accordion-up': 'accordion-up 200ms ease-out',
        'fade-in': 'fade-in 150ms ease-out',
        'slide-in-from-top': 'slide-in-from-top 200ms ease-out',
      },

      // ─── LINE HEIGHT (stand-alone) ─────────────────────────────
      lineHeight: {
        tight: '1.15',
        snug: '1.375',
        normal: '1.5',
        relaxed: '1.625',
      },

      // ─── LETTER SPACING ────────────────────────────────────────
      letterSpacing: {
        tighter: '-0.03em',
        tight: '-0.02em',
        normal: '0',
        wide: '0.01em',
        wider: '0.02em',
        widest: '0.05em',
      },

      // ─── GRID COLS untuk Risk Matrix 5×5 ───────────────────────
      gridTemplateColumns: {
        'risk-matrix-5': 'auto repeat(5, minmax(0, 1fr))',
        'risk-matrix-6': 'auto repeat(6, minmax(0, 1fr))',
      },
    },
  },
  plugins: [tailwindAnimate],
};

export default config;
