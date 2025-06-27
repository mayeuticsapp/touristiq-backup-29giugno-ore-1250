import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, LogIn, AlertTriangle, Loader2 } from "lucide-react";
import { login } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";

const STORAGE_KEY = "touristiq_last_code";

export default function Login() {
  const [iqCode, setIqCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberCode, setRememberCode] = useState(false);
  const [, setLocation] = useLocation();

  // Carica ultimo codice salvato al mount
  useEffect(() => {
    const savedCode = localStorage.getItem(STORAGE_KEY);
    if (savedCode) {
      setIqCode(savedCode);
      setRememberCode(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!iqCode.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await login(iqCode.trim().toUpperCase());
      console.log("Login risposta:", response);

      // Salva codice IQ se richiesto
      if (rememberCode) {
        localStorage.setItem(STORAGE_KEY, iqCode.trim().toUpperCase());
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }

      // Invalidate auth cache to force refresh
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });

      // Extended delay to ensure cookie is properly set and session persists
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Redirect based on role
      switch (response.role) {
        case "admin":
          console.log("Reindirizzamento ad admin");
          setLocation("/admin");
          break;
        case "tourist":
          console.log("Reindirizzamento a tourist");
          setLocation("/tourist");
          break;
        case "structure":
          console.log("Reindirizzamento a structure");
          // Extract ID from structure code (e.g., TIQ-VV-STT-8311 -> 8311)
          const structureId = response.iqCode.split('-').pop();
          setLocation(`/structure/${structureId}`);
          break;
        case "partner":
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
          <p className="text-gray-600 text-lg">
            Inserisci il tuo codice IQ per accedere
          </p>
        </div>

        {/* Login Form */}
        <Card className="shadow-xl">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="iqCode"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Codice IQ
                </label>
                <Input
                  id="iqCode"
                  type="text"
                  required
                  value={iqCode}
                  onChange={(e) => setIqCode(e.target.value.toUpperCase())}
                  placeholder="es. TIQ-IT-LEONARDO"
                  maxLength={25}
                  className="text-center text-lg font-medium tracking-wider uppercase w-full"
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberCode}
                  onCheckedChange={(checked) => setRememberCode(checked === true)}
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Ricorda questo codice IQ
                </label>
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
          {/* Support Message */}
          <div className="mt-6 flex items-center justify-center rounded-md bg-blue-50 px-4 py-3 text-sm text-blue-800">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-blue-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 12H8m8 0a4 4 0 00-8 0m8 0a4 4 0 01-8 0M4 6h16M4 6v12h16V6"
              />
            </svg>
            <span>
              Non funziona? Niente panico!{" "}
              <a
                href="mailto:info@touristiq.it"
                className="font-semibold underline text-blue-700"
              >
                Scrivici a info@touristiq.it
              </a>
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
