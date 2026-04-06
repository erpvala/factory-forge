import React from 'react';
import { Loader2 } from 'lucide-react';

interface MobileButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
}

const MobileButton: React.FC<MobileButtonProps> = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  iconPosition = 'left',
  className = ''
}) => {
  const baseClasses = `
    inline-flex items-center justify-center
    font-medium rounded-lg transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `;

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px]', // 36px minimum touch target
    md: 'px-4 py-3 text-base min-h-[44px]', // 44px minimum touch target
    lg: 'px-6 py-4 text-lg min-h-[48px]' // 48px for better accessibility
  };

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 active:bg-gray-800',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500 active:bg-blue-100',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500 active:bg-gray-200',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800'
  };

  const classes = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
  `;

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Loading...</span>
        </>
      );
    }

    if (icon && iconPosition === 'left') {
      return (
        <>
          {icon}
          <span>{children}</span>
        </>
      );
    }

    if (icon && iconPosition === 'right') {
      return (
        <>
          <span>{children}</span>
          {icon}
        </>
      );
    }

    return <span>{children}</span>;
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={classes}
    >
      {renderContent()}
    </button>
  );
};

export default MobileButton;
