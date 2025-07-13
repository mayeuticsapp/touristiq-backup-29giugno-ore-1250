import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Clock, TrendingUp, Users, Receipt } from "lucide-react";

interface StructureTiqOtcSavingsProps {
  structureCode: string;
}

interface TiqOtcSavingsData {
  success: boolean;
  structureCode: string;
  totalSavings: number;
  totalTransactions: number;
  recentTransactions: Array<{
    code: string;
    amount: number;
    tourist: string;
    partnerName: string;
    usedAt: string;
    description: string;
  }>;
  lastUpdated: string;
}

export default function StructureTiqOtcSavings({ structureCode }: StructureTiqOtcSavingsProps) {
  const [lastRefresh, setLastRefresh] = useState<string>("");

  const { data: savingsData, isLoading, refetch } = useQuery<TiqOtcSavingsData>({
    queryKey: ['/api/structure/tiq-otc-savings', structureCode],
    queryFn: async () => {
      const response = await fetch(`/api/structure/tiq-otc-savings/${structureCode}`);
      if (!response.ok) {
        throw new Error('Failed to fetch TIQ-OTC savings data');
      }
      return response.json();
    },
    refetchInterval: 30000, // Auto-refresh ogni 30 secondi
  });

  useEffect(() => {
    if (savingsData?.lastUpdated) {
      setLastRefresh(new Date(savingsData.lastUpdated).toLocaleTimeString('it-IT'));
    }
  }, [savingsData]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Sconti TIQ-OTC Generati
          </CardTitle>
          <CardDescription>
            Risparmi totali ottenuti dai tuoi ospiti
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!savingsData?.success) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <TrendingUp className="h-5 w-5" />
            Errore Caricamento Dati
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Impossibile caricare i dati dei risparmi TIQ-OTC.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
          Sconti TIQ-OTC Generati
        </CardTitle>
        <CardDescription>
          Risparmi totali ottenuti dai tuoi ospiti {lastRefresh && `(aggiornato alle ${lastRefresh})`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Statistiche principali */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 bg-emerald-100 rounded-full">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  €{savingsData.totalSavings.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">Totale Risparmi</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                <Receipt className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {savingsData.totalTransactions}
                </p>
                <p className="text-sm text-muted-foreground">Transazioni</p>
              </div>
            </div>
          </div>

          {/* Messaggio motivazionale */}
          {savingsData.totalSavings > 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-sm text-emerald-800">
                🎉 <strong>Ottimo lavoro!</strong> I tuoi ospiti hanno risparmiato complessivamente €{savingsData.totalSavings.toFixed(2)} 
                grazie al sistema TIQ-OTC. Questo contribuisce al successo dell'ecosistema TouristIQ!
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                📋 <strong>Pronto per iniziare!</strong> Quando i tuoi ospiti utilizzeranno i codici TIQ-OTC 
                presso i partner, vedrai qui i loro risparmi in tempo reale.
              </p>
            </div>
          )}

          {/* Transazioni recenti */}
          {savingsData.recentTransactions.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Transazioni Recenti
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {savingsData.recentTransactions.map((transaction, index) => (
                  <div 
                    key={transaction.code} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {transaction.partnerName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Codice: {transaction.code} • {new Date(transaction.usedAt).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-emerald-600">
                        €{transaction.amount.toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottone refresh manuale */}
          <div className="flex justify-center">
            <button 
              onClick={() => refetch()}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <Clock className="h-4 w-4" />
              Aggiorna Dati
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}