import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Shield, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export function OneTimeCodeValidator() {
  const { toast } = useToast();
  const [code, setCode] = useState("");
  const [lastValidation, setLastValidation] = useState<{
    code: string;
    valid: boolean;
    used: boolean;
    message: string;
    timestamp: Date;
  } | null>(null);

  // Mutation per validare codice monouso
  const validateMutation = useMutation({
    mutationFn: (codeToValidate: string) => {
      // Aggiunge automaticamente TIQ-OTC- se il partner inserisce solo 5 cifre
      const fullCode = codeToValidate.length === 5 ? `TIQ-OTC-${codeToValidate}` : codeToValidate;
      return apiRequest('/api/partner/validate-one-time-code', {
        method: 'POST',
        body: { code: fullCode }
      });
    },
    onSuccess: (response: any) => {
      setLastValidation({
        code,
        valid: response.valid,
        used: response.used || false,
        message: response.message,
        timestamp: new Date()
      });
      
      if (response.valid && !response.used) {
        toast({
          title: "✅ Codice validato!",
          description: "Sconto applicato con successo",
          className: "bg-green-50 border-green-200"
        });
        setCode(""); // Reset input after successful validation
      } else if (response.used) {
        toast({
          title: "⚠️ Codice già utilizzato",
          description: "Questo codice è stato già usato in precedenza",
          variant: "destructive"
        });
      }
    },
    onError: (error: any) => {
      setLastValidation({
        code,
        valid: false,
        used: false,
        message: error.message || "Codice non valido",
        timestamp: new Date()
      });
      
      toast({
        title: "❌ Codice non valido",
        description: "Il codice inserito non è valido o è scaduto",
        variant: "destructive"
      });
    }
  });

  const handleValidate = () => {
    if (!code.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci le 5 cifre del codice TIQ-OTC",
        variant: "destructive"
      });
      return;
    }

    validateMutation.mutate(code.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleValidate();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Validazione Codice Partner
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Valida i codici monouso dei turisti per applicare sconti senza esporre gli IQCode principali
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Form di validazione */}
        <div className="space-y-3">
          <div>
            <Label htmlFor="otc-input">Chiedi al turista: "Mi dai il TIQ-OTC?"</Label>
            <div className="flex gap-2 mt-1">
              <div className="flex items-center border rounded-md">
                <span className="px-3 py-2 bg-gray-50 text-gray-700 border-r font-mono text-sm">
                  TIQ-OTC-
                </span>
                <Input
                  id="otc-input"
                  value={code}
                  onChange={(e) => {
                    // Accetta solo cifre, massimo 5
                    const numericValue = e.target.value.replace(/\D/g, '').slice(0, 5);
                    setCode(numericValue);
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="12345"
                  className="font-mono text-lg border-0 focus:ring-0 rounded-l-none"
                  disabled={validateMutation.isPending}
                  maxLength={5}
                />
              </div>
              <Button
                onClick={handleValidate}
                disabled={validateMutation.isPending || code.length !== 5}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {validateMutation.isPending ? "Verificando..." : "Valida"}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Il turista ti dirà solo 5 cifre (es: "uno-due-tre-quattro-cinque")
            </p>
          </div>
        </div>

        {/* Risultato ultima validazione */}
        {lastValidation && (
          <div className={`p-4 rounded-lg border ${
            lastValidation.valid && !lastValidation.used
              ? 'bg-green-50 border-green-200'
              : lastValidation.used
              ? 'bg-yellow-50 border-yellow-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {lastValidation.valid && !lastValidation.used ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : lastValidation.used ? (
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-sm font-semibold">
                    {lastValidation.code}
                  </span>
                  <Badge
                    variant={
                      lastValidation.valid && !lastValidation.used
                        ? "default"
                        : lastValidation.used
                        ? "secondary"
                        : "destructive"
                    }
                    className={
                      lastValidation.valid && !lastValidation.used
                        ? "bg-green-100 text-green-700"
                        : lastValidation.used
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }
                  >
                    {lastValidation.valid && !lastValidation.used
                      ? "VALIDATO"
                      : lastValidation.used
                      ? "GIÀ UTILIZZATO"
                      : "NON VALIDO"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700 mb-1">
                  {lastValidation.message}
                </p>
                <p className="text-xs text-gray-500">
                  Verificato: {lastValidation.timestamp.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Informazioni aggiuntive */}
        <div className="space-y-2 text-xs text-muted-foreground bg-gray-50 p-3 rounded-lg">
          <h4 className="font-semibold text-gray-700">ℹ️ Come funziona:</h4>
          <ul className="space-y-1">
            <li>• Chiedi al turista: <strong>"Mi dai il TIQ-OTC?"</strong></li>
            <li>• Il turista ti risponde solo <strong>5 cifre</strong> (es: "12345")</li>
            <li>• Digiti le 5 cifre qui sopra e validi</li>
            <li>• Ogni codice può essere utilizzato una sola volta</li>
            <li>• ✅ <strong>Privacy-first:</strong> l'IQCode principale rimane protetto</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}