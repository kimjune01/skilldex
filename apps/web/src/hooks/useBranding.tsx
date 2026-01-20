import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { branding, applyBrandingStyles, type BrandingConfig } from '@/lib/branding';

const BrandingContext = createContext<BrandingConfig>(branding);

interface BrandingProviderProps {
  children: ReactNode;
  config?: Partial<BrandingConfig>;
}

export function BrandingProvider({ children, config }: BrandingProviderProps) {
  const mergedConfig: BrandingConfig = {
    ...branding,
    ...config,
  };

  useEffect(() => {
    applyBrandingStyles(mergedConfig);
  }, [mergedConfig]);

  return (
    <BrandingContext.Provider value={mergedConfig}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding(): BrandingConfig {
  return useContext(BrandingContext);
}
