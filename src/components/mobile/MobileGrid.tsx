// @ts-nocheck
// Mobile-optimized grid component with responsive breakpoints
import React from 'react';
import { getResponsiveClasses } from '@/utils/mobileUtils';

interface MobileGridProps {
  children: React.ReactNode;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  className?: string;
}

const MobileGrid: React.FC<MobileGridProps> = ({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = { mobile: 'gap-4', tablet: 'gap-6', desktop: 'gap-8' },
  className = ''
}) => {
  const getGridClasses = () => {
    const mobileCols = cols.mobile || 1;
    const tabletCols = cols.tablet || cols.mobile || 1;
    const desktopCols = cols.desktop || cols.tablet || cols.mobile || 1;

    const mobileGap = gap.mobile || 'gap-4';
    const tabletGap = gap.tablet || gap.mobile || 'gap-4';
    const desktopGap = gap.desktop || gap.tablet || gap.mobile || 'gap-4';

    return `
      grid-cols-${mobileCols}
      md:grid-cols-${tabletCols}
      lg:grid-cols-${desktopCols}
      ${mobileGap}
      md:${tabletGap}
      lg:${desktopGap}
      grid
    `;
  };

  return (
    <div className={`${getGridClasses()} ${className}`}>
      {children}
    </div>
  );
};

export default MobileGrid;
