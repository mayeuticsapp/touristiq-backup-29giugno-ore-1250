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

  // Query per ottenere le statistiche dei risparmi
  const { data: savingsStats, isLoading: isLoadingStats } = useQuery<{ stats: SavingsStats }>({
    queryKey: ['/api/tourist/savings/stats'],
    enabled: true,
    refetchInterval: 30000, // Aggiorna ogni 30 secondi
    refetchOnWindowFocus: true,
  });

  // Query per ottenere la cronologia dei risparmi
  const { data: savingsHistory, isLoading: isLoadingHistory } = useQuery<{ savings: TouristSaving[] }>({
    queryKey: ['/api/tourist/savings'],
    enabled: true,
    refetchInterval: 30000, // Aggiorna ogni 30 secondi
    refetchOnWindowFocus: true,
  });

  const stats = savingsStats?.stats;
  const savings = savingsHistory?.savings || [];

  // Funzione per forzare l'aggiornamento dei dati
  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['/api/tourist/savings/stats'] });
    await queryClient.invalidateQueries({ queryKey: ['/api/tourist/savings'] });
  };

  if (isLoadingStats || isLoadingHistory) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('savings.loading')}</p>
        </div>
      </div>
    );
  }

  if (!stats || stats.totalSaved === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('savings.noSavingsYet')}</h3>
          <p className="text-gray-600 mb-4">{t('savings.startSaving')}</p>
          <p className="text-sm text-orange-600 italic">{t('savings.motivationalMessage')}</p>
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
            <CardTitle className="text-sm font-medium text-emerald-800">{t('savings.totalSaved')}</CardTitle>
            <Wallet className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">{formatCurrency(stats.totalSaved)}</div>
            <p className="text-xs text-emerald-700 mt-1">{t('savings.wow')}</p>
          </CardContent>
        </Card>

        {/* Numero transazioni */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">{t('savings.savingsCount')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.savingsCount}</div>
            <p className="text-xs text-blue-700 mt-1">{t('savings.keepSaving')}</p>
          </CardContent>
        </Card>

        {/* Media risparmio */}
        <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-amber-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">{t('savings.averageSaving')}</CardTitle>
            <Target className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">{formatCurrency(stats.averageSaving)}</div>
            <p className="text-xs text-amber-700 mt-1">{t('savings.thisMonth')}</p>
          </CardContent>
        </Card>

        {/* Partner preferito */}
        <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">{t('savings.topPartner')}</CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-purple-900 truncate">{stats.topPartner || t('savings.noPartner')}</div>
            <p className="text-xs text-purple-700 mt-1">{t('savings.thisMonth')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Cronologia risparmi recenti */}
      {savings.length > 0 && (
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-orange-600" />
              {t('savings.recentSavings')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {savings.slice(0, 5).map((saving) => (
                <div key={saving.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{saving.partnerName}</p>
                      <p className="text-sm text-gray-600">{saving.discountDescription}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(saving.appliedAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                      {t('savings.earned')} {formatCurrency(saving.savedAmount)}
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
        <p className="text-sm text-gray-600 italic">{t('savings.motivationalMessage')}</p>
      </div>
    </div>
  );
};

export default TouristSavings;