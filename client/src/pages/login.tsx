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
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Sfondo Spettacolare */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        {/* Overlay con pattern geometrico */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              radial-gradient(circle at 25% 25%, #00D4FF 0%, transparent 25%),
              radial-gradient(circle at 75% 75%, #FF6B6B 0%, transparent 25%),
              radial-gradient(circle at 50% 50%, #4ECDC4 0%, transparent 30%),
              linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.1) 50%, transparent 60%)
            `,
            backgroundSize: '400px 400px, 300px 300px, 500px 500px, 100px 100px'
          }}
        />
        
        {/* Forme fluttuanti animate */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full opacity-30 animate-float" />
        <div className="absolute top-40 right-32 w-24 h-24 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full opacity-25 animate-bounce" style={{animationDelay: '1s'}} />
        <div className="absolute bottom-32 left-32 w-20 h-20 bg-gradient-to-r from-green-400 to-cyan-500 rounded-full opacity-30 animate-float" style={{animationDelay: '2s'}} />
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-gradient-to-r from-orange-400 to-red-500 rounded-full opacity-20 animate-pulse" style={{animationDelay: '0.5s'}} />
        
        {/* Forme aggiuntive per dinamismo */}
        <div className="absolute top-1/2 left-10 w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full opacity-25 animate-float" style={{animationDelay: '3s'}} />
        <div className="absolute top-10 right-10 w-12 h-12 bg-gradient-to-r from-pink-400 to-red-500 rounded-full opacity-30 animate-bounce" style={{animationDelay: '4s'}} />
        
        {/* Particelle luminose */}
        <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-white rounded-full opacity-60 animate-twinkle" />
        <div className="absolute top-3/4 left-1/4 w-1 h-1 bg-yellow-300 rounded-full opacity-80 animate-twinkle" style={{animationDelay: '0.7s'}} />
        <div className="absolute top-1/2 right-1/4 w-3 h-3 bg-cyan-300 rounded-full opacity-50 animate-twinkle" style={{animationDelay: '1.4s'}} />
        <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-purple-300 rounded-full opacity-70 animate-twinkle" style={{animationDelay: '2.1s'}} />
        
        {/* Onde marine stilizzate */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-cyan-600/40 to-transparent">
          <div className="absolute bottom-0 w-full h-8 bg-gradient-to-r from-blue-400/30 via-cyan-400/30 to-blue-400/30 animate-pulse" />
        </div>
        
        {/* Pattern a rete tecnologico */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px'
          }}
        />
      </div>
      
      {/* Glassmorphism overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center relative z-10">
          <div className="mx-auto h-24 w-24 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-2xl border-4 border-white/30 backdrop-blur-sm animate-pulse">
            <MapPin className="text-white text-4xl drop-shadow-lg" size={40} />
          </div>
          <h1 className="text-5xl font-bold text-white mb-3 drop-shadow-2xl bg-gradient-to-r from-cyan-200 via-white to-purple-200 bg-clip-text text-transparent">
            TouristIQ
          </h1>
          <p className="text-white/90 text-xl drop-shadow-lg font-medium">
            Inserisci il tuo codice IQ per accedere
          </p>
        </div>

        {/* Login Form */}
        <Card className="shadow-2xl bg-white/15 backdrop-blur-xl border border-white/30 relative z-10 animate-glow">
          <CardContent className="pt-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label
                  htmlFor="iqCode"
                  className="block text-lg font-semibold text-white mb-3 drop-shadow-lg"
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
                  className="text-center text-xl font-bold tracking-wider uppercase w-full h-14 bg-white/20 border-white/30 text-white placeholder:text-white/60 backdrop-blur-sm focus:bg-white/30 focus:border-white/50 transition-all duration-300"
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="remember"
                  checked={rememberCode}
                  onCheckedChange={(checked) => setRememberCode(checked === true)}
                  className="border-white/50 data-[state=checked]:bg-white/30 data-[state=checked]:border-white"
                />
                <label
                  htmlFor="remember"
                  className="text-white/90 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 drop-shadow-sm"
                >
                  Ricorda questo codice IQ
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-xl font-bold py-4 h-16 shadow-2xl border border-white/20 backdrop-blur-sm transition-all duration-300 transform hover:scale-105 hover:shadow-cyan-500/25"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    Verifica in corso...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-3" size={24} />
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
