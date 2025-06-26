import { Button } from "@/components/ui/button";
import { logout } from "@/lib/auth";
import { useLocation } from "wouter";
import { MapPin, LogOut } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  role: string;
  iqCode?: string;
  navigation: Array<{
    icon: React.ReactNode;
    label: string;
    href: string;
    onClick?: () => void;
  }>;
  sidebarColor: string;
}

export function Layout({ children, title, role, iqCode, navigation, sidebarColor }: LayoutProps) {
  const [, setLocation] = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      setLocation("/");
    } catch (error) {
      console.error("Errore durante il logout:", error);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <div className="flex items-center">
            <div className={`h-10 w-10 ${sidebarColor} rounded-full flex items-center justify-center mr-3`}>
              <MapPin className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">TouristIQ</h2>
              <p className="text-sm text-gray-500">{role}</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {navigation.map((item, index) => (
              <li key={index}>
                <button 
                  onClick={item.onClick || (() => window.location.href = item.href)}
                  className="w-full flex items-center p-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-left"
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
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm border-b p-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            <Button variant="ghost" onClick={handleLogout} className="flex items-center text-gray-600 hover:text-gray-900">
              <LogOut className="mr-2" size={16} />
              Esci
            </Button>
          </div>
        </header>
        
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
