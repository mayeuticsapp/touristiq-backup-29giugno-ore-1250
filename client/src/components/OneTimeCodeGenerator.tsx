import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Shield, Copy, History, Plus } from "lucide-react";

interface OneTimeCode {
  id: number;
  code: string;
  isUsed: boolean;
  usedBy?: string;
  usedByName?: string;
  createdAt: string;
  usedAt?: string;
}

export function OneTimeCodeGenerator() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showHistory, setShowHistory] = useState(false);

  // Query per ottenere i codici monouso e gli utilizzi disponibili
  const { data, isLoading } = useQuery({
    queryKey: ['/api/tourist/one-time-codes'],
    queryFn: () => apiRequest('/api/tourist/one-time-codes') as Promise<{
      codes: OneTimeCode[];
      availableUses: number;
    }>
  });

  // Mutation per generare nuovo codice monouso
  const generateCodeMutation = useMutation({
    mutationFn: () => apiRequest('/api/tourist/generate-one-time-code', {
      method: 'POST'
    }),
    onSuccess: (response: any) => {
      toast({
        title: "Codice monouso generato!",
        description: response.message
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tourist/one-time-codes'] });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Impossibile generare il codice monouso",
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

  const codes = data?.codes || [];
  const availableUses = data?.availableUses || 0;
  const latestCode = codes.find(code => !code.isUsed);

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
        {/* Stato attuale */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg border">
          <div>
            <p className="text-sm font-medium">Codici disponibili</p>
            <p className="text-2xl font-bold text-emerald-600">{availableUses}</p>
          </div>
          <Button
            onClick={() => generateCodeMutation.mutate()}
            disabled={generateCodeMutation.isPending || availableUses <= 0}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Genera Codice
          </Button>
        </div>

        {/* Codice attivo */}
        {latestCode && (
          <div className="space-y-3">
            <h4 className="font-semibold">Codice Attivo</h4>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-amber-700 bg-amber-100 px-2 py-1 rounded">
                      TIQ-OTC-
                    </span>
                    <span className="font-mono text-2xl font-bold text-amber-800 tracking-wider">
                      {latestCode.code.replace('TIQ-OTC-', '')}
                    </span>
                  </div>
                  <p className="text-xs text-amber-600">
                    Generato: {new Date(latestCode.createdAt).toLocaleString()}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(latestCode.code.replace('TIQ-OTC-', ''))}
                  className="border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-amber-700 mt-2 bg-amber-100 p-2 rounded">
                💡 <strong>Quando il partner chiede "mi dai il TIQ-OTC?"</strong><br/>
                Rispondi solo: <span className="font-mono font-bold">{latestCode.code.replace('TIQ-OTC-', '')}</span>
              </p>
            </div>
          </div>
        )}

        {availableUses <= 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              ⚠️ Codici monouso esauriti. Contatta la struttura ricettiva per una ricarica.
            </p>
          </div>
        )}

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