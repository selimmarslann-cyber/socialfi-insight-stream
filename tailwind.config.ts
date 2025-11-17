import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
    theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
      extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
        colors: {
          border: "hsl(var(--border))",
          input: "hsl(var(--input))",
          ring: "hsl(var(--ring-hsl))",
          background: "hsl(var(--background))",
          foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        positive: {
          DEFAULT: "hsl(var(--positive))",
          foreground: "hsl(var(--positive-foreground))",
        },
        negative: {
          DEFAULT: "hsl(var(--negative))",
          foreground: "hsl(var(--negative-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
          surface: {
            DEFAULT: "var(--color-surface)",
            muted: "var(--color-surface-muted)",
            elevated: "var(--color-surface-elevated)",
          },
          brand: {
            indigo: "var(--color-accent-indigo)",
            cyan: "var(--color-accent-cyan)",
            gradient: "var(--color-accent-gradient)",
            gold: "var(--color-chip-gold)",
          },
          text: {
            primary: "var(--color-text-primary)",
            secondary: "var(--color-text-secondary)",
            muted: "var(--color-text-muted)",
          },
          intent: {
            danger: "var(--color-danger)",
            success: "var(--color-success)",
          },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
          lg: "var(--radius-card)",
          md: "var(--radius-input)",
          sm: "calc(var(--radius-input) - 2px)",
          card: "var(--radius-card)",
          chip: "var(--radius-chip)",
          button: "var(--radius-button)",
          input: "var(--radius-input)",
        },
        spacing: {
          page: "var(--space-page)",
          section: "var(--space-section)",
          "card-padding": "var(--space-card-padding)",
          "grid-gap": "var(--space-grid-gap)",
        },
        boxShadow: {
          "card-elevated": "var(--shadow-elevated-card)",
          "card-soft": "var(--shadow-elevated-subtle)",
        },
        backgroundImage: {
          "brand-gradient": "var(--color-accent-gradient)",
        },
        fontSize: {
          "ds-h1": ["var(--type-h1-size)", { lineHeight: "1.2", fontWeight: "600" }],
          "ds-h2": ["var(--type-h2-size)", { lineHeight: "1.25", fontWeight: "600" }],
          "ds-h3": ["var(--type-h3-size)", { lineHeight: "1.3", fontWeight: "600" }],
          "ds-body": ["var(--type-body-size)", { lineHeight: "1.55" }],
          "ds-label": ["var(--type-label-size)", { lineHeight: "1", letterSpacing: "0.12em", fontWeight: "600" }],
          "ds-mono": ["var(--type-mono-size)", { lineHeight: "1.2", fontFamily: "'JetBrains Mono', monospace" }],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
