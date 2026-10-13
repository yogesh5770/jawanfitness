/**
 * JAWAN FITNESS — UNIFIED DESIGN SYSTEM TOKENS
 * Compliant with Material 3, WCAG 2.1 AA, and Fluid Responsive Architecture.
 */

export const tokens = {
  touch: {
    minSize: '48px', // Material 3 / WCAG 2.5.5 touch target minimum
    minTouchClass: 'min-h-[48px] min-w-[48px]'
  },
  typography: {
    fontDisplay: "'Outfit', system-ui, sans-serif",
    fontBody: "'Plus Jakarta Sans', system-ui, sans-serif",
    fontTech: "'Space Grotesk', monospace",
    fluid: {
      xs: 'clamp(0.75rem, 0.7rem + 0.25vw, 0.8125rem)',     // 12px -> 13px
      sm: 'clamp(0.8125rem, 0.75rem + 0.3vw, 0.875rem)',    // 13px -> 14px
      base: 'clamp(0.875rem, 0.8rem + 0.35vw, 1rem)',       // 14px -> 16px
      lg: 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',          // 16px -> 18px
      xl: 'clamp(1.125rem, 1rem + 0.65vw, 1.25rem)',        // 18px -> 20px
      '2xl': 'clamp(1.25rem, 1.1rem + 0.85vw, 1.5rem)',     // 20px -> 24px
      '3xl': 'clamp(1.5rem, 1.25rem + 1.25vw, 1.875rem)',   // 24px -> 30px
      '4xl': 'clamp(1.875rem, 1.5rem + 1.75vw, 2.25rem)'    // 30px -> 36px
    }
  },
  radius: {
    sm: '0.5rem',    // 8px
    md: '0.75rem',   // 12px
    lg: '1rem',      // 16px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    full: '9999px'
  },
  elevation: {
    level0: 'none',
    level1: '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.08)',
    level2: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    level3: '0 10px 15px -3px rgba(0, 0, 0, 0.15), 0 4px 6px -4px rgba(0, 0, 0, 0.15)',
    level4: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)'
  },
  motion: {
    durationFast: '150ms',
    durationStandard: '250ms',
    durationEmphasized: '350ms',
    easeStandard: 'cubic-bezier(0.2, 0.0, 0, 1.0)',
    easeDecelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1.0)',
    easeAccelerate: 'cubic-bezier(0.3, 0.0, 1.0, 1.0)'
  }
} as const;
