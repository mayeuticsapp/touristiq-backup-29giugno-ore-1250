import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, TrendingUp, Users, CreditCard, Building } from 'lucide-react';

interface StructureStats {
  structureCode: string;
  structureName: string;
  totalSavingsGenerated: number;
  totalCodesIssued: number;
  activeGuestsCount: number;
  averageSavingPerGuest: number;
}

interface AdminGuestSavingsResponse {
  success: boolean;
  globalStats: {
    totalStructures: number;
    totalSavingsGenerated: number;
    totalCodesIssued: number;
    totalActiveGuests: number;
    structureBreakdown: StructureStats[];
  };
  lastUpdated: string;
}

export default function AdminGuestSavingsStats() {
  const { data, isLoading, error } = useQuery<AdminGuestSavingsResponse>({
    queryKey: ['/api/admin/all-guest-savings-stats'],
    refetchInterval: 30000, // Aggiorna ogni 30 secondi
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Statistiche Risparmio Ospiti - Sistema Globale
          </CardTitle>
          <CardDescription>
            Panoramica completa dei risparmi generati da tutte le strutture
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Caricamento statistiche globali...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data || !data.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <TrendingUp className="h-5 w-5" />
            Errore nel caricamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600">Errore nel caricamento delle statistiche globali</p>
            <p className="text-sm text-gray-500 mt-2">
              Riprova o contatta il supporto tecnico
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { globalStats } = data;

  return (
    <div className="space-y-6">
      {/* Statistiche Globali */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Statistiche Globali Risparmio Ospiti
          </CardTitle>
          <CardDescription>
            Panoramica completa dell'ecosistema TouristIQ
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Building className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">
                {globalStats.totalStructures}
              </div>
              <div className="text-sm text-gray-600">Strutture Attive</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">
                €{globalStats.totalSavingsGenerated.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Risparmio Totale</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <CreditCard className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-purple-600">
                {globalStats.totalCodesIssued}
              </div>
              <div className="text-sm text-gray-600">Codici Emessi</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold text-orange-600">
                {globalStats.totalActiveGuests}
              </div>
              <div className="text-sm text-gray-600">Ospiti Attivi</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Breakdown per Struttura */}
      <Card>
        <CardHeader>
          <CardTitle>Dettaglio per Struttura</CardTitle>
          <CardDescription>
            Performance individuali delle strutture ricettive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {globalStats.structureBreakdown.map((structure, index) => (
              <div key={structure.structureCode} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {structure.structureName}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {structure.structureCode}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-green-600">
                    €{structure.totalSavingsGenerated.toFixed(2)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-purple-600">
                      {structure.totalCodesIssued}
                    </div>
                    <div className="text-gray-500">Codici</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-orange-600">
                      {structure.activeGuestsCount}
                    </div>
                    <div className="text-gray-500">Ospiti</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-blue-600">
                      €{structure.averageSavingPerGuest.toFixed(2)}
                    </div>
                    <div className="text-gray-500">Media/Ospite</div>
                  </div>
                </div>
                
                {index < globalStats.structureBreakdown.length - 1 && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
          </div>
          
          {globalStats.structureBreakdown.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Nessuna struttura con dati di risparmio disponibili
            </div>
          )}
        </CardContent>
      </Card>
      
      <div className="text-xs text-gray-500 text-center">
        Ultimo aggiornamento: {new Date(data.lastUpdated).toLocaleString('it-IT')}
      </div>
    </div>
  );
}