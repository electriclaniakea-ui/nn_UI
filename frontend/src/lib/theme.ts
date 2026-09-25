export const theme = {
  colors: {
    bgPage: '#FAF6EF',
    bgPanel: '#F5F0E8',
    bgCanvas: '#FBF8F2',
    layerTop: '#FFFCF6',
    layerBottom: '#EFE7D8',
    layerBorder: '#D8CDB8',
    layerHover: '#FFFDF8',
    textPrimary: '#3A342E',
    textSecondary: '#8A8074',
    accent: '#7C3AED',
    accentSoft: '#A78BFA',
    error: '#DC2626',
    warning: '#D97706',
    success: '#059669',
  },
  shadows: {
    soft: '0 4px 12px rgba(90,70,40,0.10)',
    hover: '0 8px 20px rgba(90,70,40,0.16)',
  },
  fonts: {
    logo: "'Orbitron', sans-serif",
    chinese: "'Noto Sans SC', 'Source Han Sans CN', sans-serif",
    english: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    code: "'JetBrains Mono', 'Monaco', 'Consolas', monospace",
  },
  sizes: {
    topBarHeight: 56,
    bottomBarHeight: 140,
    propertyPanelWidth: 320,
    diamondSize: 80,
    triangleSize: 64,
    nodeSpacing: 48,
    mainButtonSize: 48,
    branchButtonSize: 24,
  },
  animations: {
    duration: {
      fast: '120ms ease-out',
      normal: '150ms ease-out',
      slow: '200ms ease-out',
      dialog: '180ms',
    },
  },
} as const

export type Theme = typeof theme