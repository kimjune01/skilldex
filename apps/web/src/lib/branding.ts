/**
 * White-label branding configuration
 *
 * Configure via environment variables:
 * - VITE_APP_NAME: Application name (default: "Skillomatic")
 * - VITE_APP_TAGLINE: Tagline shown on login (default: "Claude Code Skills for Recruiters")
 * - VITE_APP_LOGO_URL: URL to logo image (default: "/default-logo.png")
 * - VITE_APP_PRIMARY_COLOR: Primary brand color in HSL (default: "262.1 83.3% 57.8%")
 * - VITE_APP_FAVICON_URL: URL to favicon (default: "/default-logo.png")
 */

export interface BrandingConfig {
  appName: string;
  tagline: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  supportEmail?: string;
  websiteUrl?: string;
}

const defaultConfig: BrandingConfig = {
  appName: 'Skillomatic',
  tagline: 'Claude Code Skills for Recruiters',
  logoUrl: '/default-logo.png',
  faviconUrl: '/default-logo.png',
  primaryColor: '262.1 83.3% 57.8%', // Purple - matches current shadcn primary
};

export function getBrandingConfig(): BrandingConfig {
  return {
    appName: import.meta.env.VITE_APP_NAME || defaultConfig.appName,
    tagline: import.meta.env.VITE_APP_TAGLINE || defaultConfig.tagline,
    logoUrl: import.meta.env.VITE_APP_LOGO_URL || defaultConfig.logoUrl,
    faviconUrl: import.meta.env.VITE_APP_FAVICON_URL || defaultConfig.faviconUrl,
    primaryColor: import.meta.env.VITE_APP_PRIMARY_COLOR || defaultConfig.primaryColor,
    supportEmail: import.meta.env.VITE_APP_SUPPORT_EMAIL,
    websiteUrl: import.meta.env.VITE_APP_WEBSITE_URL,
  };
}

// Singleton instance for consistent access
export const branding = getBrandingConfig();

// Helper to apply primary color to CSS custom properties
export function applyBrandingStyles(config: BrandingConfig = branding): void {
  const root = document.documentElement;

  if (config.primaryColor) {
    root.style.setProperty('--primary', config.primaryColor);
  }

  // Update page title
  document.title = config.appName;

  // Update favicon
  const existingFavicon = document.querySelector('link[rel="icon"]');
  if (existingFavicon) {
    existingFavicon.setAttribute('href', config.faviconUrl);
  } else {
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.href = config.faviconUrl;
    document.head.appendChild(favicon);
  }
}
