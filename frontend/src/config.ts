// API configuration
export const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3301/api";

// Theme configuration
export const THEME_CONFIG = {
  defaultPrimaryColor: "#1890ff",
  defaultThemeMode: "auto" as const,
  transitionDuration: 300, // ms
  borderRadius: 8,
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
};

// Layout configuration
export const LAYOUT_CONFIG = {
  headerHeight: 64,
  siderWidth: 200,
  siderCollapsedWidth: 80,
  footerHeight: 40,
  contentPadding: 24,
};

// Responsive breakpoints
export const BREAKPOINTS = {
  xs: 480,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
};

// Animation configuration
export const ANIMATION_CONFIG = {
  duration: 300,
  easing: "cubic-bezier(0.4, 0, 0.2, 1)",
};

// Other configuration constants can be added here
