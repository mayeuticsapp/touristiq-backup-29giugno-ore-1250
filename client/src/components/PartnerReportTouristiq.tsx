import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  Clock, 
  Award,
  BarChart3,
  RefreshCw,
  DollarSign
} from 'lucide-react';

interface TouristiqStats {
  totalDiscounts: number;
  totalClients: number;
  totalRevenue: number;
  averageDiscount: number;
  recentTransactions: any[];
  period: string;
}

interface DiscountHistory {
  id: number;
  code: string;
  discountAmount: number;
  usedAt: string;
  touristIqCode: string;
  partnerName: string;
}

export default function PartnerReportTouristiq() {
  const [stats, setStats] = useState<TouristiqStats | null>(null);
  const [history, setHistory] = useState<DiscountHistory[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('7');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const { toast } = useToast();

  const loadStats = async (days: string = '7') => {
    setIsLoading(true);
    try {
      const response = await apiRequest('GET', `/api/partner/touristiq-stats?days=${days}`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
        setLastUpdate(new Date().toLocaleString('it-IT'));
      } else {
        toast({
          title: "Errore",
          description: data.message || "Errore nel caricamento delle statistiche",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Errore caricamento statistiche:', error);
      toast({
        title: "Errore",
        description: "Errore di connessione al server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadHistory = async (limit: string = '50') => {
    try {
      const response = await apiRequest('GET', `/api/partner/discount-history?limit=${limit}`);
      const data = await response.json();
      
      if (data.success) {
        setHistory(data.data);
      }
    } catch (error) {
      console.error('Errore caricamento cronologia:', error);
    }
  };

  useEffect(() => {
    loadStats(selectedPeriod);
    loadHistory();
  }, [selectedPeriod]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleRefresh = () => {
    loadStats(selectedPeriod);
    loadHistory();
  };

  const getRevenueColor = (revenue: number) => {
    if (revenue >= 100) return 'text-green-600';
    if (revenue >= 50) return 'text-yellow-600';
    return 'text-orange-600';
  };

  const getClientsBadgeColor = (clients: number) => {
    if (clients >= 10) return 'bg-green-500';
    if (clients >= 5) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <div className="space-y-6">
      {/* Header con controlli */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Report TouristIQ</h2>
          <p className="text-sm text-gray-500">
            Statistiche dettagliate dei clienti TouristIQ
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 giorni</SelectItem>
              <SelectItem value="14">14 giorni</SelectItem>
              <SelectItem value="30">30 giorni</SelectItem>
              <SelectItem value="90">90 giorni</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={handleRefresh} 
            disabled={isLoading}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Aggiorna
          </Button>
        </div>
      </div>

      {/* Statistiche principali */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Clienti TouristIQ</p>
                  <p className="text-2xl font-bold">{stats.totalClients}</p>
                </div>
                <Badge className={getClientsBadgeColor(stats.totalClients)}>
                  <Users className="h-4 w-4" />
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Sconti Erogati</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.totalDiscounts)}</p>
                </div>
                <Badge className="bg-orange-500">
                  <DollarSign className="h-4 w-4" />
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Ricavi Stimati</p>
                  <p className={`text-2xl font-bold ${getRevenueColor(stats.totalRevenue)}`}>
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                </div>
                <Badge className="bg-green-500">
                  <TrendingUp className="h-4 w-4" />
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Sconto Medio</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.averageDiscount)}</p>
                </div>
                <Badge className="bg-purple-500">
                  <Award className="h-4 w-4" />
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs per dettagli */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions">Transazioni Recenti</TabsTrigger>
          <TabsTrigger value="analytics">Analisi Dettagliata</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Ultimi Sconti Applicati
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length > 0 ? (
                <div className="space-y-3">
                  {history.slice(0, 10).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">TIQ-OTC-{transaction.code}</Badge>
                          <span className="text-sm text-gray-600">
                            {formatDate(transaction.usedAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Cliente: {transaction.touristIqCode.slice(-6)}...
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {formatCurrency(transaction.discountAmount)}
                        </p>
                        <p className="text-sm text-gray-500">sconto</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Nessuna transazione nel periodo selezionato</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analisi del Valore TouristIQ</CardTitle>
            </CardHeader>
            <CardContent>
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-800">Impatto Economico</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Ricavi da clienti TouristIQ:</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(stats.totalRevenue)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Investimento in sconti:</span>
                        <span className="font-medium text-orange-600">
                          {formatCurrency(stats.totalDiscounts)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-sm font-medium text-gray-800">ROI stimato:</span>
                        <span className="font-bold text-green-600">
                          {stats.totalDiscounts > 0 ? 
                            `${((stats.totalRevenue - stats.totalDiscounts) / stats.totalDiscounts * 100).toFixed(1)}%` : 
                            '0%'
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-800">Metriche Clienti</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Clienti TouristIQ serviti:</span>
                        <span className="font-medium">{stats.totalClients}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Transazioni totali:</span>
                        <span className="font-medium">{stats.recentTransactions.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Sconto medio per cliente:</span>
                        <span className="font-medium">{formatCurrency(stats.averageDiscount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer info */}
      {lastUpdate && (
        <div className="text-center">
          <p className="text-sm text-gray-500">
            <Calendar className="h-4 w-4 inline mr-1" />
            Ultimo aggiornamento: {lastUpdate}
          </p>
        </div>
      )}
    </div>
  );
}