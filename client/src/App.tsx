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
import PartnerDashboard from "@/pages/partner-dashboard";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole: string }) {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getCurrentUser,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !user) {
    return <Redirect to="/" />;
  }

  if (user.role !== requiredRole) {
    return <Redirect to="/" />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      
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
      
      <Route path="/structure">
        <ProtectedRoute requiredRole="structure">
          <StructureDashboard />
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
