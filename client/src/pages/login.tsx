import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, LogIn, AlertTriangle, Loader2 } from "lucide-react";
import { login } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";

export default function Login() {
  const [iqCode, setIqCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!iqCode.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await login(iqCode.trim().toUpperCase());
      console.log("Login risposta:", response);
      
      // Invalidate auth cache to force refresh
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      // Small delay to ensure cookie is set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Redirect based on role
      switch (response.role) {
        case 'admin':
          console.log("Reindirizzamento ad admin");
          setLocation("/admin");
          break;
        case 'tourist':
          console.log("Reindirizzamento a tourist");
          setLocation("/tourist");
          break;
        case 'structure':
          console.log("Reindirizzamento a structure");
          setLocation("/structure");
          break;
        case 'partner':
          console.log("Reindirizzamento a partner");
          setLocation("/partner");
          break;
        default:
          setError("Ruolo non riconosciuto");
      }
    } catch (error: any) {
      console.error("Errore login:", error);
      setError(error.message || "Codice IQ non valido. Riprova.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-tourist-blue rounded-full flex items-center justify-center mb-6">
            <MapPin className="text-white text-3xl" size={32} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">TouristIQ</h1>
          <p className="text-gray-600 text-lg">Inserisci il tuo codice IQ per accedere</p>
        </div>

        {/* Login Form */}
        <Card className="shadow-xl">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="iqCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Codice IQ
                </label>
                <Input
                  id="iqCode"
                  type="text"
                  required
                  value={iqCode}
                  onChange={(e) => setIqCode(e.target.value.toUpperCase())}
                  placeholder="es. ADMIN001"
                  maxLength={15}
                  className="text-center text-lg font-medium tracking-wider uppercase"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-tourist-blue hover:bg-tourist-dark text-lg font-medium py-3"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifica in corso...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2" size={16} />
                    Accedi
                  </>
                )}
              </Button>
            </form>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
