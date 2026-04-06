// @ts-nocheck
// Simple mobile navigation component without external dependencies
import React, { useState } from 'react';

interface MobileNavProps {
  items: {
    label: string;
    href: string;
    icon?: string; // Simple text icon or emoji
  }[];
  isOpen: boolean;
  onClose: () => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ items, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Navigation Panel */}
      <div className="fixed left-0 top-0 h-full w-72 bg-white shadow-xl">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Close menu"
            >
              <span className="text-xl">×</span>
            </button>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto">
          <div className="p-2">
            {items.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                onClick={onClose}
              >
                {item.icon && (
                  <span className="text-lg">{item.icon}</span>
                )}
                <span className="text-gray-900">{item.label}</span>
              </a>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
};

// Mobile bottom navigation component
interface MobileBottomNavProps {
  items: {
    label: string;
    icon: string; // Simple text icon or emoji
    onClick: () => void;
  }[];
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ items }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40">
      <div className="grid grid-cols-4 gap-1">
        {items.map((item, index) => (
          <button
            key={index}
            onClick={item.onClick}
            className="flex flex-col items-center py-2 px-3 text-gray-700 hover:bg-gray-50 transition-colors min-h-[44px]"
          >
            <span className="text-lg mb-1">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default MobileNav;
