import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getCurrentUser } from "./lib/auth";
import Login from "@/pages/login";
import AdminDashboard from "@/pages/admin-dashboard";
import TouristDashboard from "@/pages/tourist-dashboard";
import StructureDashboard from "@/pages/structure-dashboard";
import StructurePanel from "@/pages/structure-panel-fixed";
import PartnerDashboard from "@/pages/partner-dashboard";
import UserManagement from "@/pages/user-management";
import ActivateTempCode from "@/pages/activate-temp-code";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import "./i18n";

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole: string }) {
  const { t } = useTranslation();
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getCurrentUser,
    retry: false,
    refetchOnMount: true,
  });

  console.log(`ProtectedRoute - Ruolo richiesto: ${requiredRole}`, { user, isLoading, error });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">{t('common.loading')}...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    console.log("Errore autenticazione o utente non trovato:", error);
    return <Redirect to="/" />;
  }

  if (user.role !== requiredRole) {
    console.log(`Ruolo non corrispondente. Richiesto: ${requiredRole}, Utente: ${user.role}`);
    return <Redirect to="/" />;
  }

  console.log(`Accesso autorizzato per ruolo: ${user.role}`);
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      
      <Route path="/activate-temp-code" component={ActivateTempCode} />
      
      <Route path="/admin/users">
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard activeSection="users" />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/iqcodes">
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard activeSection="iqcodes" />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/stats">
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard activeSection="stats" />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/settings">
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard activeSection="settings" />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin/user-management">
        <ProtectedRoute requiredRole="admin">
          <UserManagement />
        </ProtectedRoute>
      </Route>
      
      <Route path="/admin">
        <ProtectedRoute requiredRole="admin">
          <AdminDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/tourist">
        <ProtectedRoute requiredRole="tourist">
          <TouristDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/structure/:id/panel">
        <ProtectedRoute requiredRole="structure">
          <StructurePanel />
        </ProtectedRoute>
      </Route>
      
      <Route path="/structure/:id">
        <ProtectedRoute requiredRole="structure">
          <StructureDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/structure">
        <ProtectedRoute requiredRole="structure">
          <StructureDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/partner/:id">
        <ProtectedRoute requiredRole="partner">
          <PartnerDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route path="/partner">
        <ProtectedRoute requiredRole="partner">
          <PartnerDashboard />
        </ProtectedRoute>
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
