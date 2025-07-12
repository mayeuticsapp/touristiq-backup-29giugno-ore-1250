
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MapPin, LogIn, AlertTriangle, Loader2, Shield, KeyRound } from "lucide-react";
import { login } from "@/lib/auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { isTemporaryCode } from "@/lib/temp-code-utils";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/LanguageSelector";

const STORAGE_KEY = "touristiq_last_code";

export default function Login() {
  const [iqCode, setIqCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [rememberCode, setRememberCode] = useState(false);
  const [, setLocation] = useLocation();
  
  // Stati per recupero IQCode
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [secretWord, setSecretWord] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const { toast } = useToast();
  const { t } = useTranslation();

  // Mutation per recupero IQCode
  const recoveryMutation = useMutation({
    mutationFn: async (data: { secretWord: string; birthDate: string }) => {
      const response = await apiRequest("POST", "/api/recover-iqcode", data);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: t('auth.recovery.success'),
        description: `${t('auth.recovery.yourCode')}: ${data.iqCode}`,
        duration: 8000,
      });
      setIqCode(data.iqCode);
      setShowRecoveryModal(false);
      setSecretWord("");
      setBirthDate("");
    },
    onError: (error: any) => {
      const errorMessage = error.message.includes("404") 
        ? t('auth.recovery.notFound')
        : error.message.includes("409")
        ? t('auth.recovery.alreadyActive')
        : t('auth.recovery.error');
      
      toast({
        title: t('common.error'),
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Funzione per il recupero IQCode
  const handleRecovery = () => {
    if (!secretWord.trim() || !birthDate.trim()) {
      toast({
        title: t('validation.required'),
        description: t('auth.recovery.missingFields'),
        variant: "destructive",
      });
      return;
    }

    recoveryMutation.mutate({
      secretWord: secretWord.trim(),
      birthDate: birthDate.trim(),
    });
  };

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

    // Prevent double submission
    if (isLoading || isSubmitting) return;
    if (!iqCode.trim()) return;

    const trimmedCode = iqCode.trim();

    // 🔍 CONTROLLO CRITICO: Intercetta codici temporanei
    if (isTemporaryCode(trimmedCode)) {
      toast({
        title: t('auth.tempCode.detected'),
        description: t('auth.tempCode.redirecting'),
      });
      
      // Reindirizza immediatamente alla pagina di attivazione
      setLocation(`/activate-temp-code`);
      
      // Imposta il codice temporaneo nel localStorage per la pagina di attivazione
      localStorage.setItem('temp_code_for_activation', trimmedCode);
      return;
    }

    setIsLoading(true);
    setIsSubmitting(true);
    setError("");

    try {
      // Non trasformare in maiuscolo i codici temporanei
      const codeToSend = isTemporaryCode(trimmedCode) ? trimmedCode : trimmedCode.toUpperCase();
      const response = await login(codeToSend);


      // Salva codice IQ se richiesto
      if (rememberCode) {
        localStorage.setItem(STORAGE_KEY, iqCode.trim().toUpperCase());
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }

      // Invalidate auth cache and validation-related caches to force refresh
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/iqcode/validation-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/iqcode/validation-status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tourist/real-offers"] });

      // Shorter delay for better UX while ensuring cookie is set
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Redirect based on role
      switch (response.role) {
        case "admin":
          setLocation("/admin");
          break;
        case "tourist":
          setLocation("/tourist");
          break;
        case "structure":
          // Extract ID from structure code (e.g., TIQ-VV-STT-8311 -> 8311)
          const structureId = response.iqCode.split('-').pop();
          setLocation(`/structure/${structureId}`);
          break;
        case "partner":
          setLocation("/partner");
          break;
        default:
          setError(t('auth.errors.unknownRole'));
      }
    } catch (error: any) {
      setError(error.message || t('auth.errors.invalid'));
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Language Selector - Top Right */}
        <div className="absolute top-4 right-4 z-50">
          <LanguageSelector />
        </div>
      {/* Sfondo Naturale Mediterraneo */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-blue-500 to-cyan-600">
        {/* Sole splendente */}
        <div className="absolute top-16 right-20 w-24 h-24 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full opacity-90 animate-pulse shadow-2xl">
          <div className="absolute inset-2 bg-gradient-to-br from-yellow-200 to-orange-300 rounded-full animate-glow" />
          {/* Raggi del sole */}
          <div className="absolute -top-8 left-1/2 w-1 h-16 bg-yellow-300/60 transform -translate-x-1/2 animate-pulse" />
          <div className="absolute -bottom-8 left-1/2 w-1 h-16 bg-yellow-300/60 transform -translate-x-1/2 animate-pulse" />
          <div className="absolute -left-8 top-1/2 h-1 w-16 bg-yellow-300/60 transform -translate-y-1/2 animate-pulse" />
          <div className="absolute -right-8 top-1/2 h-1 w-16 bg-yellow-300/60 transform -translate-y-1/2 animate-pulse" />
          <div className="absolute -top-6 -left-6 w-1 h-12 bg-yellow-300/40 transform rotate-45 animate-pulse" style={{animationDelay: '0.5s'}} />
          <div className="absolute -top-6 -right-6 w-1 h-12 bg-yellow-300/40 transform -rotate-45 animate-pulse" style={{animationDelay: '0.5s'}} />
          <div className="absolute -bottom-6 -left-6 w-1 h-12 bg-yellow-300/40 transform -rotate-45 animate-pulse" style={{animationDelay: '0.5s'}} />
          <div className="absolute -bottom-6 -right-6 w-1 h-12 bg-yellow-300/40 transform rotate-45 animate-pulse" style={{animationDelay: '0.5s'}} />
        </div>

        {/* Nuvole soffici */}
        <div className="absolute top-20 left-16 w-40 h-16 bg-white/80 rounded-full opacity-90 animate-float">
          <div className="absolute -left-4 top-2 w-24 h-12 bg-white/70 rounded-full" />
          <div className="absolute right-2 -top-2 w-20 h-14 bg-white/75 rounded-full" />
        </div>
        <div className="absolute top-32 right-40 w-32 h-12 bg-white/70 rounded-full opacity-80 animate-float" style={{animationDelay: '2s'}} />
        <div className="absolute top-10 left-1/2 w-28 h-10 bg-white/60 rounded-full opacity-75 animate-float" style={{animationDelay: '4s'}} />

        {/* Montagne calabresi in lontananza */}
        <div className="absolute bottom-1/3 left-0 w-full h-48">
          <div className="absolute bottom-0 left-0 w-1/3 h-32 bg-gradient-to-t from-green-700 to-green-500 opacity-60" 
               style={{clipPath: 'polygon(0% 100%, 50% 20%, 100% 100%)'}} />
          <div className="absolute bottom-0 left-1/4 w-1/3 h-40 bg-gradient-to-t from-green-800 to-green-600 opacity-70" 
               style={{clipPath: 'polygon(0% 100%, 60% 10%, 100% 100%)'}} />
          <div className="absolute bottom-0 right-0 w-1/3 h-36 bg-gradient-to-t from-green-600 to-green-400 opacity-50" 
               style={{clipPath: 'polygon(0% 100%, 40% 25%, 100% 100%)'}} />
        </div>

        {/* Mare cristallino con onde */}
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-blue-600 via-cyan-500 to-transparent">
          {/* Onde animate */}
          <div className="absolute bottom-0 w-full h-8 bg-gradient-to-r from-white/30 via-cyan-300/40 to-white/30 animate-pulse" />
          <div className="absolute bottom-2 w-full h-6 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" style={{animationDelay: '0.5s'}} />
          <div className="absolute bottom-4 w-full h-4 bg-gradient-to-r from-white/15 via-cyan-200/30 to-white/15 animate-pulse" style={{animationDelay: '1s'}} />

          {/* Riflessi del sole sul mare */}
          <div className="absolute bottom-8 right-16 w-2 h-12 bg-yellow-200/60 animate-twinkle" />
          <div className="absolute bottom-12 right-20 w-1 h-8 bg-yellow-300/50 animate-twinkle" style={{animationDelay: '0.7s'}} />
          <div className="absolute bottom-6 right-24 w-3 h-6 bg-orange-200/40 animate-twinkle" style={{animationDelay: '1.4s'}} />
        </div>

        {/* Palme tropicali */}
        <div className="absolute bottom-1/4 left-8 w-4 h-32 bg-gradient-to-t from-amber-700 to-amber-600 opacity-80">
          {/* Fronde */}
          <div className="absolute -top-2 -left-8 w-20 h-6 bg-green-500 rounded-full opacity-70 transform -rotate-12" />
          <div className="absolute -top-2 -right-4 w-16 h-6 bg-green-600 rounded-full opacity-70 transform rotate-12" />
          <div className="absolute -top-4 -left-6 w-18 h-5 bg-green-400 rounded-full opacity-60 transform -rotate-45" />
          <div className="absolute -top-4 -right-2 w-14 h-5 bg-green-500 rounded-full opacity-60 transform rotate-45" />
        </div>

        <div className="absolute bottom-1/4 right-12 w-3 h-28 bg-gradient-to-t from-amber-800 to-amber-700 opacity-70">
          {/* Fronde */}
          <div className="absolute -top-2 -left-6 w-16 h-5 bg-green-600 rounded-full opacity-80 transform -rotate-20" />
          <div className="absolute -top-2 -right-2 w-14 h-5 bg-green-500 rounded-full opacity-80 transform rotate-20" />
          <div className="absolute -top-3 -left-4 w-12 h-4 bg-green-400 rounded-full opacity-60 transform -rotate-50" />
        </div>

        {/* Gabbiani in volo */}
        <div className="absolute top-1/3 left-1/3 text-white/60 animate-float text-2xl">🕊️</div>
        <div className="absolute top-1/4 right-1/3 text-white/50 animate-float text-lg" style={{animationDelay: '2s'}}>🕊️</div>
        <div className="absolute top-2/5 left-2/3 text-white/40 animate-float text-xl" style={{animationDelay: '4s'}}>🕊️</div>
      </div>

      {/* Overlay morbido per leggibilità */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/20" />
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center relative z-10">
          <div className="mx-auto h-28 w-28 bg-gradient-to-br from-orange-400 via-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-2xl border-4 border-white/60 backdrop-blur-sm">
            <MapPin className="text-white text-5xl drop-shadow-xl" size={48} />
          </div>
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-2xl">
            TouristIQ
          </h1>
          <p className="text-white text-2xl drop-shadow-lg font-medium bg-black/20 px-6 py-2 rounded-full backdrop-blur-sm">
            {t('tourist.subtitle')}
          </p>
          <p className="text-white/90 text-lg drop-shadow-lg font-medium mt-3">
            {t('auth.subtitle')}
          </p>
        </div>

        {/* Login Form */}
        <Card className="shadow-2xl bg-white/90 backdrop-blur-xl border-2 border-orange-200/50 relative z-10">
          <CardContent className="pt-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label
                  htmlFor="iqCode"
                  className="block text-lg font-semibold text-gray-800 mb-3"
                >
                  {t('auth.iqCodeLabel')}
                </label>
                <Input
                  id="iqCode"
                  type="text"
                  required
                  value={iqCode}
                  onChange={(e) => setIqCode(e.target.value.toUpperCase())}
                  placeholder={t('auth.iqCodePlaceholder')}
                  maxLength={100}
                  className="text-center text-xl font-bold tracking-wider uppercase w-full h-14 bg-orange-50 border-2 border-orange-200 text-gray-800 placeholder:text-gray-500 focus:bg-orange-100 focus:border-orange-400 transition-all duration-300"
                  disabled={isLoading || isSubmitting}
                />
              </div>

              {/* Frase di supporto per recupero IQCode */}
              <div className="text-center text-sm text-gray-600 space-y-2">
                <p>{t('auth.forgotCode')}</p>
                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setShowRecoveryModal(true)}
                    className="text-blue-600 hover:text-blue-800 font-medium underline transition-colors"
                  >
                    👉 {t('auth.recoverWithCustode')}
                  </button>
                </div>
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
                  {t('auth.rememberCode')}
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white text-xl font-bold py-4 h-16 shadow-xl border-2 border-orange-300 transition-all duration-300 transform hover:scale-105 hover:shadow-orange-500/30"
                disabled={isLoading || isSubmitting}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    {t('common.loading')}...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-3" size={24} />
                    {t('auth.loginButton')}
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
              {t('auth.support.text')}{" "}
              <a
                href="mailto:info@touristiq.it"
                className="font-semibold underline text-blue-700"
              >
                {t('auth.support.email')}
              </a>
            </span>
          </div>
        </Card>

        {/* Modale Recupero IQCode */}
        <Dialog open={showRecoveryModal} onOpenChange={setShowRecoveryModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-blue-600" />
                {t('auth.custode.title')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                {t('auth.custode.description')}
              </p>
              
              <div>
                <Label htmlFor="recoverySecretWord">{t('auth.custode.secretWord')}</Label>
                <Input
                  id="recoverySecretWord"
                  type="text"
                  value={secretWord}
                  onChange={(e) => setSecretWord(e.target.value)}
                  placeholder={t('auth.custode.secretWordPlaceholder')}
                  disabled={recoveryMutation.isPending}
                />
              </div>
              
              <div>
                <Label htmlFor="recoveryBirthDate">{t('auth.custode.birthDate')}</Label>
                <Input
                  id="recoveryBirthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  disabled={recoveryMutation.isPending}
                />
              </div>
              
              <Button 
                onClick={handleRecovery}
                disabled={recoveryMutation.isPending || !secretWord.trim() || !birthDate.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {recoveryMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.loading')}...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    {t('auth.recovery.recoverCode')}
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
