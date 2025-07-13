import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, TrendingUp, Calendar } from "lucide-react";

interface GuestSavingsStatsProps {
  structureCode: string;
}

interface SavingsStats {
  totalSavingsGenerated: number;
  totalCodesIssued: number;
  activeGuestsCount: number;
  averageSavingPerGuest: number;
  lastUpdated: string;
}

export default function GuestSavingsStats({ structureCode }: GuestSavingsStatsProps) {
  const [stats, setStats] = useState<SavingsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/structure/guest-savings-stats', {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Errore nel recupero statistiche');
        }

        const data = await response.json();
        setStats(data.stats);
      } catch (error) {
        console.error('Errore caricamento statistiche risparmio ospiti:', error);
        setError('Errore nel caricamento delle statistiche');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [structureCode]);

  if (loading) {
    return (
      <Card className="w-full bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-emerald-800 flex items-center gap-2 text-lg">
            <DollarSign className="w-5 h-5" />
            Risparmio Totale Ospiti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-emerald-200 rounded mb-2"></div>
            <div className="h-4 bg-emerald-100 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full bg-gradient-to-r from-red-50 to-rose-50 border-red-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-red-800 flex items-center gap-2 text-lg">
            <DollarSign className="w-5 h-5" />
            Risparmio Totale Ospiti
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-700">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <Card className="w-full bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-emerald-800 flex items-center gap-2 text-lg">
          <DollarSign className="w-5 h-5" />
          Risparmio Totale Ospiti
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Risparmio Totale - Valore principale */}
          <div className="text-center p-4 bg-white rounded-lg border border-emerald-200">
            <div className="text-3xl font-bold text-emerald-700 mb-1">
              €{stats.totalSavingsGenerated.toFixed(2)}
            </div>
            <div className="text-sm text-emerald-600">
              I tuoi ospiti hanno risparmiato complessivamente
            </div>
          </div>

          {/* Statistiche dettagliate */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-white rounded-lg border border-emerald-200">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-lg font-semibold text-emerald-700">
                {stats.totalCodesIssued}
              </div>
              <div className="text-xs text-emerald-600">
                Codici Emessi
              </div>
            </div>

            <div className="text-center p-3 bg-white rounded-lg border border-emerald-200">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-lg font-semibold text-emerald-700">
                {stats.activeGuestsCount}
              </div>
              <div className="text-xs text-emerald-600">
                Ospiti Attivi
              </div>
            </div>

            <div className="text-center p-3 bg-white rounded-lg border border-emerald-200">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-lg font-semibold text-emerald-700">
                €{stats.averageSavingPerGuest.toFixed(2)}
              </div>
              <div className="text-xs text-emerald-600">
                Media per Ospite
              </div>
            </div>
          </div>

          {/* Messaggio motivazionale */}
          <div className="text-center p-3 bg-emerald-100 rounded-lg">
            <p className="text-sm text-emerald-700">
              {stats.totalSavingsGenerated > 0 
                ? `Grazie ai tuoi codici IQ, i tuoi ospiti hanno risparmiato €${stats.totalSavingsGenerated.toFixed(2)}! 
                   Continua a generare codici per aumentare la soddisfazione degli ospiti.`
                : "Inizia a generare codici IQ per i tuoi ospiti e monitora i loro risparmi qui!"
              }
            </p>
          </div>

          {/* Timestamp ultimo aggiornamento */}
          <div className="text-center text-xs text-emerald-500">
            Ultimo aggiornamento: {new Date(stats.lastUpdated).toLocaleString('it-IT')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}