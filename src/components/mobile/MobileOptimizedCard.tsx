// @ts-nocheck
// Mobile-optimized card component with responsive design
import React from 'react';

interface MobileOptimizedCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
  onClick?: () => void;
}

const MobileOptimizedCard: React.FC<MobileOptimizedCardProps> = ({
  children,
  title,
  subtitle,
  className = '',
  onClick
}) => {
  const baseClasses = `
    bg-white rounded-lg shadow-sm border border-gray-200 p-4
    transition-all duration-200 hover:shadow-md
    ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}
    ${className}
  `;

  return (
    <div className={baseClasses} onClick={onClick}>
      {(title || subtitle) && (
        <div className="mb-3">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default MobileOptimizedCard;
