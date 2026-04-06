// @ts-nocheck
// Mobile utility functions for responsive design

export interface MobileBreakpoints {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
}

export const getMobileBreakpoints = (): MobileBreakpoints => {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      screenWidth: 1920,
      screenHeight: 1080
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;

  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    screenWidth: width,
    screenHeight: height
  };
};

export const getResponsiveClasses = (mobile: string, tablet?: string, desktop?: string): string => {
  const { isMobile, isTablet, isDesktop } = getMobileBreakpoints();
  
  if (isMobile) return mobile;
  if (isTablet && tablet) return tablet;
  if (isDesktop && desktop) return desktop;
  return mobile;
};

export const getTouchTargetClass = (size: 'sm' | 'md' | 'lg' = 'md'): string => {
  const sizes = {
    sm: 'min-h-[36px] px-3 py-2',
    md: 'min-h-[44px] px-4 py-3',
    lg: 'min-h-[48px] px-6 py-4'
  };
  
  return sizes[size];
};

export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - for older browsers
    navigator.msMaxTouchPoints > 0
  );
};

export const addTouchOptimization = (baseClasses: string): string => {
  if (isTouchDevice()) {
    return `${baseClasses} touch-manipulation`;
  }
  return baseClasses;
};
