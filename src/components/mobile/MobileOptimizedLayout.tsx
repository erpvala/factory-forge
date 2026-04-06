import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronLeft, Home, User, Settings, Bell, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MobileOptimizedLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  rightAction?: React.ReactNode;
}

const MobileOptimizedLayout: React.FC<MobileOptimizedLayoutProps> = ({
  children,
  title,
  showBackButton = false,
  onBackClick,
  rightAction
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-3">
            {isMobile && (
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 text-gray-700" />
              </button>
            )}
            
            {showBackButton && (
              <button
                onClick={onBackClick}
                className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="Go back"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
            )}
            
            {title && (
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {title}
              </h1>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {rightAction}
            
            {/* Notifications */}
            <button
              className="p-2 rounded-md hover:bg-gray-100 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-gray-700" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={closeMobileMenu}
          />
          
          {/* Sidebar */}
          <div className="relative bg-white w-72 h-full shadow-xl">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <button
                  onClick={closeMobileMenu}
                  className="p-2 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-700" />
                </button>
              </div>
            </div>
            
            <nav className="flex-1 overflow-y-auto">
              <div className="p-2">
                <Link
                  to="/app"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                  onClick={closeMobileMenu}
                >
                  <Home className="w-5 h-5 text-gray-700" />
                  <span className="text-gray-900">Dashboard</span>
                </Link>
                
                <Link
                  to="/profile"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                  onClick={closeMobileMenu}
                >
                  <User className="w-5 h-5 text-gray-700" />
                  <span className="text-gray-900">Profile</span>
                </Link>
                
                <Link
                  to="/settings"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                  onClick={closeMobileMenu}
                >
                  <Settings className="w-5 h-5 text-gray-700" />
                  <span className="text-gray-900">Settings</span>
                </Link>
              </div>
            </nav>
            
            <div className="p-4 border-t border-gray-200">
              <button
                className="flex items-center space-x-3 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors w-full text-left"
                onClick={() => {
                  // Handle logout
                  closeMobileMenu();
                }}
              >
                <LogOut className="w-5 h-5 text-red-600" />
                <span className="text-red-600">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation (Optional) */}
      {isMobile && (
        <nav className="bg-white border-t border-gray-200 sticky bottom-0">
          <div className="grid grid-cols-4 gap-1">
            <button className="flex flex-col items-center py-2 px-3 text-gray-700 hover:bg-gray-50 transition-colors">
              <Home className="w-5 h-5 mb-1" />
              <span className="text-xs">Home</span>
            </button>
            
            <button className="flex flex-col items-center py-2 px-3 text-gray-700 hover:bg-gray-50 transition-colors">
              <Bell className="w-5 h-5 mb-1" />
              <span className="text-xs">Alerts</span>
            </button>
            
            <button className="flex flex-col items-center py-2 px-3 text-gray-700 hover:bg-gray-50 transition-colors">
              <User className="w-5 h-5 mb-1" />
              <span className="text-xs">Profile</span>
            </button>
            
            <button className="flex flex-col items-center py-2 px-3 text-gray-700 hover:bg-gray-50 transition-colors">
              <Settings className="w-5 h-5 mb-1" />
              <span className="text-xs">Settings</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
};

export default MobileOptimizedLayout;
