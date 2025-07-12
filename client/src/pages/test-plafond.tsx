import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Layout } from "@/components/layout";
import { Calculator, User, Euro, TrendingUp, AlertCircle } from "lucide-react";

export default function TestPlafond() {
  const [touristCode, setTouristCode] = useState("");
  const [selectedTourist, setSelectedTourist] = useState<string | null>(null);

  // Query per ottenere i dati del turista selezionato
  const { data: touristData, isLoading, refetch } = useQuery({
    queryKey: ['/api/tourist/one-time-codes', selectedTourist],
    enabled: !!selectedTourist,
    staleTime: 0,
    gcTime: 0
  });

  const handleSelectTourist = () => {
    if (touristCode.trim()) {
      setSelectedTourist(touristCode.trim());
    }
  };

  const totalUsed = touristData?.totalDiscountUsed || 0;
  const remaining = 150 - totalUsed;
  const percentage = (totalUsed / 150) * 100;

  return (
    <Layout>
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Test Sistema Plafond €150</h1>
          <p className="text-gray-600">Verifica il funzionamento del sistema di plafond sconti TIQ-OTC</p>
        </div>

        {/* Selezione Turista */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Seleziona Turista
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <Label htmlFor="touristCode">Codice IQ Turista</Label>
                <Input
                  id="touristCode"
                  placeholder="es: TIQ-IT-0306-STUPENDO"
                  value={touristCode}
                  onChange={(e) => setTouristCode(e.target.value)}
                  className="font-mono"
                />
              </div>
              <Button onClick={handleSelectTourist} disabled={!touristCode.trim()}>
                Carica Dati
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Dati Turista */}
        {selectedTourist && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Plafond Status */}
            <Card className={`${remaining <= 0 ? 'border-red-200 bg-red-50' : remaining <= 30 ? 'border-yellow-200 bg-yellow-50' : 'border-green-200 bg-green-50'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Stato Plafond
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-sm text-gray-500">Caricamento...</p>
                ) : (
                  <div className="space-y-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-800">
                        €{totalUsed.toFixed(2)} / €150.00
                      </p>
                      <p className="text-sm text-gray-600">
                        Turista: {selectedTourist}
                      </p>
                    </div>

                    {/* Barra di progresso */}
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div 
                        className={`h-4 rounded-full transition-all duration-300 ${
                          percentage >= 100 ? 'bg-red-500' : 
                          percentage >= 80 ? 'bg-yellow-500' : 
                          'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Utilizzato: {percentage.toFixed(1)}%</span>
                      <span>Rimanente: €{remaining.toFixed(2)}</span>
                    </div>

                    {/* Status Badge */}
                    <div className="flex justify-center">
                      <Badge 
                        variant={remaining <= 0 ? "destructive" : remaining <= 30 ? "secondary" : "default"}
                        className={`${
                          remaining <= 0 ? 'bg-red-100 text-red-800' : 
                          remaining <= 30 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-green-100 text-green-800'
                        }`}
                      >
                        {remaining <= 0 ? "Plafond Esaurito" : 
                         remaining <= 30 ? "Plafond in Esaurimento" : 
                         "Plafond Disponibile"}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Statistiche */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Statistiche
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-sm text-gray-500">Caricamento...</p>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {touristData?.codes?.length || 0}
                        </div>
                        <div className="text-sm text-blue-600">Codici Totali</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {touristData?.codes?.filter(c => c.isUsed).length || 0}
                        </div>
                        <div className="text-sm text-green-600">Codici Usati</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Codici Disponibili:</span>
                        <span className="font-medium">{touristData?.availableUses || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Sconto Medio:</span>
                        <span className="font-medium">
                          €{touristData?.codes?.filter(c => c.isUsed && c.discountAmount).length > 0 ? 
                            (touristData.codes.filter(c => c.isUsed && c.discountAmount).reduce((sum, c) => sum + (c.discountAmount || 0), 0) / 
                             touristData.codes.filter(c => c.isUsed && c.discountAmount).length).toFixed(2) : 
                            '0.00'}
                        </span>
                      </div>
                    </div>

                    <Button 
                      onClick={() => refetch()} 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                    >
                      Aggiorna Dati
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cronologia Transazioni */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Euro className="h-5 w-5" />
                  Cronologia Transazioni
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-sm text-gray-500">Caricamento...</p>
                ) : touristData?.codes?.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Nessuna transazione trovata per questo turista
                  </p>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {touristData?.codes?.filter(c => c.isUsed).map((code, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium font-mono text-sm">
                            {code.code}
                          </div>
                          <div className="text-xs text-gray-500">
                            {code.usedByName || 'Partner'} • {code.usedAt ? new Date(code.usedAt).toLocaleDateString() : 'Data non disponibile'}
                          </div>
                          {code.offerDescription && (
                            <div className="text-xs text-gray-600 mt-1">
                              {code.offerDescription}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            €{code.discountAmount?.toFixed(2) || '0.00'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {code.discountPercentage || 0}% su €{code.originalAmount?.toFixed(2) || '0.00'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Informazioni Sistema */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Informazioni Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• <strong>Plafond Mensile:</strong> Ogni turista ha €150 di sconti disponibili al mese</p>
              <p>• <strong>Calcolo Automatico:</strong> Il sistema calcola automaticamente il totale degli sconti utilizzati</p>
              <p>• <strong>Limite Dinamico:</strong> Gli sconti vengono limitati automaticamente al plafond rimanente</p>
              <p>• <strong>Codici Illimitati:</strong> I turisti possono generare codici illimitati fino ad esaurimento plafond</p>
              <p>• <strong>Tracciamento Completo:</strong> Ogni transazione viene tracciata con importi, percentuali e partner</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}