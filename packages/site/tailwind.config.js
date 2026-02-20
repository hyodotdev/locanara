/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Locanara Oatmeal/Crow palette
        primary: {
          DEFAULT: "#2d2a26",
          light: "#6b6560",
        },
        accent: {
          DEFAULT: "#b8956b",
          hover: "#a6845c",
          orange: "#e95420",
        },
        background: {
          primary: "#faf8f5",
          secondary: "#f2efe9",
          dark: "#121212",
          "dark-secondary": "#1e1e1e",
        },
        text: {
          primary: "#2d2a26",
          secondary: "#6b6560",
          "dark-primary": "#f0f0f0",
          "dark-secondary": "#999999",
        },
        // Sidebar colors
        sidebar: {
          DEFAULT: "#fdfcfb",
          dark: "#0a0a0a",
          active: "rgba(45, 42, 38, 0.08)",
          hover: "rgba(45, 42, 38, 0.04)",
          border: "rgba(45, 42, 38, 0.06)",
        },
        // Code block colors
        code: {
          bg: "#f7f5f2",
          "bg-dark": "#1a1a1a",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ["SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", "monospace"],
      },
      fontSize: {
        xs: "0.75rem",
        sm: "0.8125rem",
        base: "0.875rem",
        md: "0.9375rem",
        lg: "1rem",
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.875rem",
        "4xl": "2.25rem",
        "5xl": "3rem",
      },
      maxWidth: {
        docs: "900px",
        "docs-full": "1400px",
      },
      borderRadius: {
        none: "0",
        sm: "0.25rem",
        DEFAULT: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
      },
      boxShadow: {
        subtle: "0 4px 12px rgba(0, 0, 0, 0.08)",
        card: "0 8px 24px rgba(0, 0, 0, 0.12)",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
            color: "#2d2a26",
            fontSize: "0.875rem",
            lineHeight: "1.7",
            h1: {
              fontSize: "1.5rem",
              fontWeight: "700",
              marginBottom: "0.75rem",
              color: "#2d2a26",
            },
            h2: {
              fontSize: "1.25rem",
              fontWeight: "600",
              marginTop: "2rem",
              marginBottom: "0.5rem",
              paddingTop: "1rem",
              color: "#2d2a26",
            },
            h3: {
              fontSize: "1.1rem",
              fontWeight: "600",
              marginTop: "1.5rem",
              color: "#2d2a26",
            },
            a: {
              color: "#2d2a26",
              fontWeight: "500",
              textDecoration: "underline",
              textUnderlineOffset: "2px",
              "&:hover": {
                color: "#6b6560",
              },
            },
            code: {
              backgroundColor: "rgba(45, 42, 38, 0.06)",
              padding: "0.15em 0.4em",
              borderRadius: "4px",
              fontSize: "0.85em",
              fontWeight: "400",
              color: "#2d2a26",
              "&::before": { content: "none" },
              "&::after": { content: "none" },
            },
            "pre code": {
              backgroundColor: "transparent",
              padding: "0",
              borderRadius: "0",
            },
            strong: {
              color: "#2d2a26",
              fontWeight: "600",
            },
            table: {
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.8125rem",
            },
            th: {
              backgroundColor: "rgba(45, 42, 38, 0.04)",
              padding: "0.5rem 0.75rem",
              fontWeight: "600",
              textAlign: "left",
              borderBottom: "1px solid rgba(45, 42, 38, 0.1)",
            },
            td: {
              padding: "0.5rem 0.75rem",
              borderBottom: "1px solid rgba(45, 42, 38, 0.06)",
            },
            "tbody tr:hover": {
              backgroundColor: "rgba(45, 42, 38, 0.02)",
            },
          },
        },
        invert: {
          css: {
            color: "#f0f0f0",
            h1: { color: "#f0f0f0" },
            h2: { color: "#f0f0f0" },
            h3: { color: "#f0f0f0" },
            h4: { color: "#f0f0f0" },
            a: {
              color: "#f0f0f0",
              "&:hover": { color: "#999999" },
            },
            strong: { color: "#f0f0f0" },
            code: {
              color: "#f0f0f0",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            },
            th: {
              color: "#f0f0f0",
              backgroundColor: "rgba(255, 255, 255, 0.06)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            },
            td: {
              borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
            },
            "tbody tr:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.04)",
            },
            blockquote: {
              color: "#cccccc",
              borderLeftColor: "rgba(255, 255, 255, 0.2)",
            },
            hr: {
              borderColor: "rgba(255, 255, 255, 0.1)",
            },
            "ol > li::marker": { color: "#999999" },
            "ul > li::marker": { color: "#999999" },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
