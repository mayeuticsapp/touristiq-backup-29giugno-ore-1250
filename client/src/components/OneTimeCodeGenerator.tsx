import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Shield, Copy, History, Plus, RefreshCw } from "lucide-react";

interface OneTimeCode {
  id: number;
  code: string;
  isUsed: boolean;
  usedBy?: string;
  usedByName?: string;
  originalAmount?: number;
  discountPercentage?: number;
  discountAmount?: number;
  offerDescription?: string;
  createdAt: string;
  usedAt?: string;
}

export function OneTimeCodeGenerator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showHistory, setShowHistory] = useState(false);
  const [lastGeneratedCode, setLastGeneratedCode] = useState<string | null>(null);

  // Query per ottenere i codici monouso e gli utilizzi disponibili
  const { data, isLoading, refetch, error } = useQuery({
    queryKey: ['/api/tourist/one-time-codes'],
    staleTime: 0,
    gcTime: 0,
    retry: 3,
    retryDelay: 1000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  });

  // Mutation per generare nuovo codice monouso
  const generateCodeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/tourist/generate-one-time-code');
      return await response.json();
    },
    onSuccess: (response: any) => {
      console.log('🎯 CODICE GENERATO FRONTEND:', response);
      
      // Salva il codice appena generato per visualizzarlo
      if (response.code) {
        setLastGeneratedCode(response.code);
      }
      
      toast({
        title: "✅ Codice monouso generato!",
        description: `Codice ${response.code} pronto per l'uso`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tourist/one-time-codes'] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore generazione codice",
        description: error.message || "Impossibile generare il codice monouso. Riprova.",
        variant: "destructive"
      });
    }
  });

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Codice copiato!",
        description: "Il codice monouso è stato copiato negli appunti"
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile copiare il codice",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Codici Monouso TIQ-OTC
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Caricamento...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    console.error('🔧 FRONTEND DEBUG: Errore query:', error);
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            Codici Monouso TIQ-OTC
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              ⚠️ Errore caricamento dati. Prova a ricaricare la pagina.
            </p>
            <Button 
              onClick={() => {
                console.log('🔄 MANUAL RETRY: Ricaricamento manuale...');
                refetch();
              }} 
              variant="outline" 
              size="sm" 
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Riprova
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const codes = data?.codes || [];
  const availableUses = data?.availableUses || 0;
  const latestCode = codes.find(code => !code.isUsed);
  
  console.log('🔧 FRONTEND DEBUG: Data ricevuta:', data);
  console.log('🔧 FRONTEND DEBUG: Error stato:', error);
  console.log('🔧 FRONTEND DEBUG: isLoading:', isLoading);
  console.log(`📊 FRONTEND DEBUG: codes=${codes.length}, availableUses=${availableUses}`);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-emerald-600" />
          Codici Monouso TIQ-OTC
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Genera codici temporanei monouso per sconti immediati
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ultimo codice generato */}
        {lastGeneratedCode && (
          <div className="p-4 bg-gradient-to-r from-emerald-100 to-blue-100 rounded-lg border-2 border-emerald-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-800">🎯 Ultimo codice generato</p>
                <p className="text-2xl font-bold text-emerald-700 font-mono">{lastGeneratedCode}</p>
                <p className="text-xs text-emerald-600 mt-1">Dillo al partner per ottenere lo sconto</p>
              </div>
              <Button
                onClick={() => copyToClipboard(lastGeneratedCode)}
                variant="outline"
                size="sm"
                className="bg-white hover:bg-emerald-50"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-3 p-2 bg-emerald-50 rounded text-xs text-emerald-700">
              💡 <strong>Come usare:</strong> Quando il partner chiede "mi dai il TIQ-OTC?" rispondi solo le 5 cifre: <span className="font-mono font-bold">{lastGeneratedCode.replace('TIQ-OTC-', '')}</span>
            </div>
          </div>
        )}

        {/* Plafond €150 - Nuovo Sistema */}
        <div className="p-4 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border-2 border-emerald-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-medium text-emerald-800">Plafond Sconti TIQ-OTC</p>
              <p className="text-2xl font-bold text-emerald-600">€{data?.totalDiscountUsed || 0} / €150</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => generateCodeMutation.mutate()}
                disabled={generateCodeMutation.isPending || (data?.totalDiscountUsed || 0) >= 150}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Genera Codice
              </Button>
            </div>
          </div>
          
          {/* Barra di progresso plafond */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(((data?.totalDiscountUsed || 0) / 150) * 100, 100)}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-gray-600">
            <span>Usato: €{data?.totalDiscountUsed || 0}</span>
            <span>Disponibile: €{150 - (data?.totalDiscountUsed || 0)}</span>
          </div>
          
          {/* Messaggio stato plafond */}
          {(data?.totalDiscountUsed || 0) >= 150 ? (
            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
              🚫 <strong>Plafond esaurito</strong> - Hai utilizzato tutti i €150 disponibili per questo mese
            </div>
          ) : (
            <div className="mt-3 p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-700">
              💎 <strong>Plafond attivo</strong> - Puoi ancora ottenere €{150 - (data?.totalDiscountUsed || 0)} di sconti
            </div>
          )}
        </div>



        {/* Informazione sistema plafond */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="text-2xl">💡</div>
            <div>
              <p className="text-sm text-blue-700 font-medium">Sistema Plafond €150</p>
              <p className="text-xs text-blue-600">
                Ogni turista TouristIQ riceve €150 di sconti mensili. Genera codici illimitati fino ad esaurimento plafond.
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Toggle cronologia */}
        <Button
          variant="ghost"
          onClick={() => setShowHistory(!showHistory)}
          className="w-full justify-center"
        >
          <History className="h-4 w-4 mr-2" />
          {showHistory ? 'Nascondi' : 'Mostra'} Cronologia
        </Button>

        {/* Cronologia codici */}
        {showHistory && (
          <div className="space-y-2">
            <h4 className="font-semibold">Cronologia Codici ({codes.length})</h4>
            {codes.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nessun codice generato</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {codes.map((code) => (
                  <div
                    key={code.id}
                    className={`p-3 rounded-lg border ${
                      code.isUsed
                        ? 'bg-gray-50 border-gray-200'
                        : 'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500">TIQ-OTC-</span>
                          <span className="font-mono text-sm font-bold">
                            {code.code.replace('TIQ-OTC-', '')}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(code.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={code.isUsed ? "secondary" : "default"}
                          className={code.isUsed ? "bg-gray-100" : "bg-green-100 text-green-700"}
                        >
                          {code.isUsed ? 'Utilizzato' : 'Attivo'}
                        </Badge>
                        {code.isUsed && code.usedByName && (
                          <p className="text-xs text-muted-foreground mt-1">
                            da {code.usedByName}
                          </p>
                        )}
                        {code.isUsed && (code.discountAmount || code.originalAmount) && (
                          <div className="text-xs text-emerald-600 mt-1 font-medium">
                            Sconto: €{code.discountAmount || 0} su €{code.originalAmount || 0}
                          </div>
                        )}
                        {code.isUsed && code.usedAt && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(code.usedAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}