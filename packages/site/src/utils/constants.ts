// Founding Member Program Configuration
// This file is the single source of truth for all product and seat configuration

// Seat inventory limits
export const SEAT_CONFIG = {
  individual: {
    total: 100,
    label: "Individual",
    sublabel: "Founding Member",
  },
  enterprise: {
    total: 20,
    label: "Enterprise",
    sublabel: "Founding Partner",
  },
} as const;
