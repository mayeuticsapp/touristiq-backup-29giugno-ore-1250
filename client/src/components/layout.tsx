import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth";
import { useLocation } from "wouter";
import { MapPin, LogOut, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { queryClient } from "@/lib/queryClient";

interface SidebarItem {
  icon: any;
  label: string;
  href: string;
  onClick?: () => void;
  className?: string;
}

interface LayoutProps {
  children: React.ReactNode;
  currentUser?: { role: string; iqCode: string };
  sidebarItems?: SidebarItem[];
  // Legacy support
  title?: string;
  role?: string;
  iqCode?: string;
  navigation?: SidebarItem[];
  sidebarColor?: string;
}

export function Layout({ 
  children, 
  currentUser, 
  sidebarItems,
  // Legacy props
  title, 
  role, 
  iqCode, 
  navigation, 
  sidebarColor 
}: LayoutProps) {
  const [, setLocation] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Support both new and legacy prop formats
  const userRole = currentUser?.role || role || '';
  const userIqCode = currentUser?.iqCode || iqCode || '';
  const navItems = sidebarItems || navigation || [];
  const bgColor = sidebarColor || 'bg-blue-600';

  const handleLogout = async () => {
    try {
      await logout();
      
      // Clear all cached data on logout
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/iqcode/validation-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/iqcode/validation-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tourist/real-offers"] });
      queryClient.clear(); // Clear all cache
      
      setLocation("/");
    } catch (error) {
      console.error("Errore durante il logout:", error);
    }
  };

  // Chiudi menu mobile quando si ridimensiona a desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen">
      {/* Mobile Header Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white shadow-md border-b">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
          
          <div className="flex items-center">
            <div className={`h-8 w-8 ${sidebarColor} rounded-full flex items-center justify-center mr-2`}>
              <MapPin className="text-white" size={16} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">TouristIQ</h2>
          </div>
          
          <Button variant="ghost" size="sm" onClick={handleLogout} className="p-2">
            <LogOut size={16} />
          </Button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        <div className="p-6 border-b">
          <div className="flex items-center">
            <div className={`h-10 w-10 ${bgColor} rounded-full flex items-center justify-center mr-3`}>
              <MapPin className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">TouristIQ</h2>
              <p className="text-sm text-gray-500">{userRole}</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item, index) => (
              <li key={index}>
                <button 
                  onClick={() => {
                    if (item.onClick) {
                      item.onClick();
                    } else {
                      window.location.href = item.href;
                    }
                    // Chiudi menu mobile dopo click
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center p-3 rounded-lg transition-colors text-left ${
                    item.label === "Elimina Account" 
                      ? "text-red-600 hover:bg-red-50 hover:text-red-700" 
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {item.icon}
                  <span className="ml-3">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto md:ml-0">
        {/* Desktop Header */}
        <header className="hidden md:block bg-white shadow-sm border-b p-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">{title || 'Dashboard'}</h1>
              {userIqCode && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  {userIqCode}
                </span>
              )}
            </div>
            <Button variant="ghost" onClick={handleLogout} className="flex items-center text-gray-600 hover:text-gray-900">
              <LogOut className="mr-2" size={16} />
              Esci
            </Button>
          </div>
        </header>
        
        {/* Mobile Header Spacer */}
        <div className="md:hidden h-16"></div>
        
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
