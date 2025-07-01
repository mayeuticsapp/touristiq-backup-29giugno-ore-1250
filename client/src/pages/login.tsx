import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function Login() {
  const [iqCode, setIqCode] = useState('');
  const [rememberCode, setRememberCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const savedCode = localStorage.getItem('rememberedIqCode');
    if (savedCode) {
      setIqCode(savedCode);
      setRememberCode(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!iqCode.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci il tuo IQCode",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const data = await apiRequest('POST', '/api/login', { iqCode: iqCode.trim() });
      
      if (data.success) {
        if (rememberCode) {
          localStorage.setItem('rememberedIqCode', iqCode.trim());
        } else {
          localStorage.removeItem('rememberedIqCode');
        }
        
        toast({
          title: "Accesso completato!",
          description: `Benvenuto nel sistema TouristIQ`,
        });

        // Redirigo in base al ruolo
        const role = data.user.role;
        const userId = data.user.id || data.user.iqCode;
        
        switch(role) {
          case 'admin':
            window.location.href = '/admin';
            break;
          case 'tourist':
            window.location.href = '/tourist';
            break;
          case 'structure':
            window.location.href = `/structure/${userId}`;
            break;
          case 'partner':
            window.location.href = `/partner/${userId}`;
            break;
          default:
            window.location.href = '/';
        }
      }
    } catch (error: any) {
      console.error('Errore login:', error);
      toast({
        title: "Errore di accesso",
        description: error.message || "IQCode non valido. Riprova.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">

      {/* Content */}
      <div className="relative z-10 max-w-md w-full space-y-8">
        {/* Logo e Titolo */}
        <div className="text-center">
          <div className="flex justify-center items-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-2xl">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-2xl">
            TouristIQ
          </h1>
          <p className="text-white text-2xl drop-shadow-lg font-medium bg-black/20 px-6 py-2 rounded-full backdrop-blur-sm">
            🌴 La Tua Vacanza Inizia Qui 🌊
          </p>
          <p className="text-white/90 text-lg drop-shadow-lg font-medium mt-3">
            Inserisci il tuo IQCode per accedere
          </p>
        </div>

        {/* Form di Login */}
        <Card className="shadow-2xl bg-white/90 backdrop-blur-xl border-2 border-orange-200/50 relative z-10">
          <CardContent className="pt-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label
                  htmlFor="iqCode"
                  className="block text-lg font-semibold text-gray-800 mb-3"
                >
                  IQCode
                </label>
                <Input
                  id="iqCode"
                  type="text"
                  value={iqCode}
                  onChange={(e) => setIqCode(e.target.value)}
                  className="w-full px-4 py-3 text-lg border-2 border-orange-200 rounded-xl focus:border-orange-500 focus:ring-orange-500 bg-white/80 backdrop-blur-sm transition-all duration-200"
                  placeholder="TIQ-IT-ADMIN"
                  autoComplete="username"
                  disabled={isLoading}
                />
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="remember"
                  checked={rememberCode}
                  onCheckedChange={(checked) => setRememberCode(checked === true)}
                  className="border-orange-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                />
                <label
                  htmlFor="remember"
                  className="text-gray-700 font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Ricorda questo IQCode
                </label>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl shadow-xl transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Accesso in corso...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-2">
                    <span>🏖️ Accedi alla Vacanza 🏖️</span>
                  </span>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 flex items-center justify-center space-x-2">
                <span>❓ Non funziona? Niente panico!</span>
                <a
                  href="mailto:info@touristiq.it"
                  className="text-orange-600 hover:text-orange-700 font-medium underline"
                >
                  Scrivici a info@touristiq.it
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}