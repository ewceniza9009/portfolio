export type AccentKey = 'green' | 'indigo' | 'teal' | 'blue' | 'orange' | 'violet' | 'gold';

export interface AccentSet {
  accent: string;
  accentHover: string;
  accentDim: string;
  accentSecondary: string;
  accentSecondaryHover: string;
  accentSecondaryDim: string;
}

export interface AccentTheme {
  name: string;
  light: AccentSet;
  dark: AccentSet;
}

export const ACCENT_THEMES: Record<AccentKey, AccentTheme> = {
  gold: {
    name: 'Gold (Default)',
    light: {
      accent: '#a1781b',
      accentHover: '#876313',
      accentDim: 'rgba(161, 120, 27, 0.08)',
      accentSecondary: '#cca43d',
      accentSecondaryHover: '#ab8a30',
      accentSecondaryDim: 'rgba(202, 164, 61, 0.08)'
    },
    dark: {
      accent: '#f3ca65',
      accentHover: '#e5ba4c',
      accentDim: 'rgba(243, 202, 101, 0.15)',
      accentSecondary: '#cca03d',
      accentSecondaryHover: '#b28a30',
      accentSecondaryDim: 'rgba(204, 160, 61, 0.12)'
    }
  },
  green: {
    name: 'Green',
    light: {
      accent: '#10b981',
      accentHover: '#059669',
      accentDim: 'rgba(16, 185, 129, 0.1)',
      accentSecondary: '#0ea5e9',
      accentSecondaryHover: '#0284c7',
      accentSecondaryDim: 'rgba(14, 165, 233, 0.08)'
    },
    dark: {
      accent: '#22c55e',
      accentHover: '#16a34a',
      accentDim: 'rgba(34, 197, 94, 0.15)',
      accentSecondary: '#14b8a6',
      accentSecondaryHover: '#0d9488',
      accentSecondaryDim: 'rgba(20, 184, 166, 0.12)'
    }
  },
  indigo: {
    name: 'Indigo (Stripe)',
    light: {
      accent: '#635bff',
      accentHover: '#4e45e4',
      accentDim: 'rgba(99, 91, 255, 0.1)',
      accentSecondary: '#7c3aed',
      accentSecondaryHover: '#6d28d9',
      accentSecondaryDim: 'rgba(124, 58, 237, 0.08)'
    },
    dark: {
      accent: '#7a73ff',
      accentHover: '#938eff',
      accentDim: 'rgba(122, 115, 255, 0.15)',
      accentSecondary: '#a78bfa',
      accentSecondaryHover: '#c4b5fd',
      accentSecondaryDim: 'rgba(167, 139, 250, 0.12)'
    }
  },
  teal: {
    name: 'Teal (Vercel)',
    light: {
      accent: '#0d9488',
      accentHover: '#0f766e',
      accentDim: 'rgba(13, 148, 136, 0.08)',
      accentSecondary: '#0284c7',
      accentSecondaryHover: '#0369a1',
      accentSecondaryDim: 'rgba(2, 132, 199, 0.08)'
    },
    dark: {
      accent: '#14b8a6',
      accentHover: '#2dd4bf',
      accentDim: 'rgba(20, 184, 166, 0.15)',
      accentSecondary: '#38bdf8',
      accentSecondaryHover: '#0ea5e9',
      accentSecondaryDim: 'rgba(56, 189, 248, 0.12)'
    }
  },
  blue: {
    name: 'Blue (Azure)',
    light: {
      accent: '#0066cc',
      accentHover: '#0052a3',
      accentDim: 'rgba(0, 102, 204, 0.08)',
      accentSecondary: '#4f46e5',
      accentSecondaryHover: '#4338ca',
      accentSecondaryDim: 'rgba(79, 70, 229, 0.08)'
    },
    dark: {
      accent: '#38bdf8',
      accentHover: '#7dd3fc',
      accentDim: 'rgba(56, 189, 248, 0.15)',
      accentSecondary: '#6366f1',
      accentSecondaryHover: '#4f46e5',
      accentSecondaryDim: 'rgba(99, 102, 241, 0.12)'
    }
  },
  orange: {
    name: 'Orange (Apple)',
    light: {
      accent: '#ea580c',
      accentHover: '#c2410c',
      accentDim: 'rgba(234, 88, 12, 0.08)',
      accentSecondary: '#b45309',
      accentSecondaryHover: '#92400e',
      accentSecondaryDim: 'rgba(180, 83, 9, 0.08)'
    },
    dark: {
      accent: '#f97316',
      accentHover: '#fb923c',
      accentDim: 'rgba(249, 115, 22, 0.15)',
      accentSecondary: '#f59e0b',
      accentSecondaryHover: '#d97706',
      accentSecondaryDim: 'rgba(245, 158, 11, 0.12)'
    }
  },
  violet: {
    name: 'Violet (Obsidian)',
    light: {
      accent: '#7c3aed',
      accentHover: '#6d28d9',
      accentDim: 'rgba(124, 58, 237, 0.08)',
      accentSecondary: '#db2777',
      accentSecondaryHover: '#be185d',
      accentSecondaryDim: 'rgba(219, 39, 119, 0.08)'
    },
    dark: {
      accent: '#a78bfa',
      accentHover: '#c4b5fd',
      accentDim: 'rgba(167, 139, 250, 0.15)',
      accentSecondary: '#f472b6',
      accentSecondaryHover: '#ec4899',
      accentSecondaryDim: 'rgba(244, 114, 182, 0.12)'
    }
  }
};
