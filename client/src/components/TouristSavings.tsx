import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, Target, Award, Calendar, MapPin, RefreshCw } from 'lucide-react';

interface TouristSaving {
  id: string;
  savedAmount: number;
  partnerCode: string;
  partnerName: string;
  discountDescription: string;
  appliedAt: string;
}

interface SavingsStats {
  totalSaved: number;
  savingsCount: number;
  averageSaving: number;
  topPartner: string;
  monthlyTotal: number;
}

const TouristSavings: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Query per ottenere i dati TIQ-OTC con plafond €150
  const { data: otcData, isLoading } = useQuery<{
    codes: any[];
    availableUses: number;
    totalDiscountUsed: number;
  }>({
    queryKey: ['/api/tourist/one-time-codes'],
    enabled: true,
    refetchInterval: 30000, // Aggiorna ogni 30 secondi
    refetchOnWindowFocus: true,
  });

  // Calcola statistiche dal nuovo sistema
  const usedCodes = otcData?.codes?.filter(code => code.isUsed && code.discountAmount > 0) || [];
  const totalSaved = otcData?.totalDiscountUsed || 0;
  const savingsCount = usedCodes.length;
  const averageSaving = savingsCount > 0 ? totalSaved / savingsCount : 0;
  const remainingPlafond = 150 - totalSaved;

  // Funzione per forzare l'aggiornamento dei dati
  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['/api/tourist/one-time-codes'] });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento risparmi...</p>
        </div>
      </div>
    );
  }

  if (totalSaved === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nessun risparmio ancora</h3>
          <p className="text-gray-600 mb-4">Inizia ad utilizzare i codici TIQ-OTC per risparmiare</p>
          <p className="text-sm text-orange-600 italic">Hai €150 di plafond disponibili questo mese!</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header con titolo e messaggio motivazionale */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-4 mb-2">
          <h2 className="text-2xl font-bold text-gray-900">{t('savings.title')}</h2>
          <Button 
            onClick={handleRefresh} 
            variant="outline" 
            size="sm"
            className="text-orange-600 border-orange-300 hover:bg-orange-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Aggiorna
          </Button>
        </div>
        <p className="text-orange-600 font-medium">{t('savings.yourSavings')}</p>
      </div>

      {/* Statistiche principali */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Totale risparmiato */}
        <Card className="bg-gradient-to-br from-emerald-50 to-green-100 border-emerald-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">Totale Risparmiato</CardTitle>
            <Wallet className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">{formatCurrency(totalSaved)}</div>
            <p className="text-xs text-emerald-700 mt-1">Fantastico!</p>
          </CardContent>
        </Card>

        {/* Numero transazioni */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Sconti Utilizzati</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{savingsCount}</div>
            <p className="text-xs text-blue-700 mt-1">Continua così!</p>
          </CardContent>
        </Card>

        {/* Media risparmio */}
        <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Media Sconto</CardTitle>
            <Target className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">{formatCurrency(averageSaving)}</div>
            <p className="text-xs text-amber-700 mt-1">Per transazione</p>
          </CardContent>
        </Card>

        {/* Plafond rimanente */}
        <Card className={`bg-gradient-to-br ${remainingPlafond <= 30 ? 'from-red-50 to-red-100 border-red-200' : remainingPlafond <= 75 ? 'from-yellow-50 to-yellow-100 border-yellow-200' : 'from-green-50 to-green-100 border-green-200'}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${remainingPlafond <= 30 ? 'text-red-800' : remainingPlafond <= 75 ? 'text-yellow-800' : 'text-green-800'}`}>
              Plafond Rimanente
            </CardTitle>
            <Award className={`h-4 w-4 ${remainingPlafond <= 30 ? 'text-red-600' : remainingPlafond <= 75 ? 'text-yellow-600' : 'text-green-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${remainingPlafond <= 30 ? 'text-red-900' : remainingPlafond <= 75 ? 'text-yellow-900' : 'text-green-900'}`}>
              {formatCurrency(remainingPlafond)}
            </div>
            <p className={`text-xs mt-1 ${remainingPlafond <= 30 ? 'text-red-700' : remainingPlafond <= 75 ? 'text-yellow-700' : 'text-green-700'}`}>
              Su €150 mensili
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cronologia risparmi recenti */}
      {usedCodes.length > 0 && (
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-orange-600" />
              Cronologia Sconti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {usedCodes.slice(0, 5).map((code) => (
                <div key={code.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{code.partnerName || 'Partner'}</p>
                      <p className="text-sm text-gray-600">{code.offerDescription || `Sconto ${code.discountPercentage}%`}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(code.usedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                      Risparmiato {formatCurrency(code.discountAmount)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Messaggio motivazionale finale */}
      <div className="text-center py-4">
        <p className="text-sm text-gray-600 italic">
          {remainingPlafond > 0 
            ? `Hai ancora ${formatCurrency(remainingPlafond)} di plafond disponibile questo mese! 🎯` 
            : "Hai utilizzato tutto il tuo plafond mensile di €150. Congratulazioni! 🌟"
          }
        </p>
      </div>
    </div>
  );
};

export default TouristSavings;