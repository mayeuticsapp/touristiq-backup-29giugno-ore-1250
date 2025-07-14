import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, AlertTriangle, XCircle, Eye, Shield } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface PartnerWarning {
  id: number;
  partner_code: string;
  total_feedbacks: number;
  positive_feedbacks: number;
  negative_feedbacks: number;
  current_rating: string;
  warning_level: number;
  last_updated: string;
  is_excluded: boolean;
  excluded_at: string | null;
  excluded_by: string | null;
}

export const AdminPartnerWarnings: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: warnings, isLoading, error } = useQuery<{ warnings: PartnerWarning[] }>({
    queryKey: ['/api/admin/partner-warnings'],
    refetchInterval: 30000, // Aggiorna ogni 30 secondi
  });

  // Rimosse funzioni di esclusione automatica - ora solo warning per contatto admin

  const getWarningLevelString = (level: number): string => {
    switch (level) {
      case 0: return 'none';
      case 1: return 'Warning Basso';
      case 2: return 'Warning Medio';
      case 3: return 'Warning Alto';
      case 4: return 'CRITICO - Contattare';
      default: return 'unknown';
    }
  };

  const getWarningColor = (level: number): string => {
    switch (level) {
      case 0: return 'bg-green-100 text-green-800';
      case 1: return 'bg-yellow-100 text-yellow-800';
      case 2: return 'bg-orange-100 text-orange-800';
      case 3: return 'bg-red-100 text-red-800';
      case 4: return 'bg-red-200 text-red-900 font-bold'; // Critico ma non escluso
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getWarningIcon = (level: number) => {
    switch (level) {
      case 0: return <Shield className="w-4 h-4" />;
      case 1: return <Eye className="w-4 h-4" />;
      case 2: return <AlertTriangle className="w-4 h-4" />;
      case 3: return <XCircle className="w-4 h-4" />;
      case 4: return <XCircle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getWarningMessage = (level: number): string => {
    switch (level) {
      case 1: return 'Attenzione - Qualità del servizio da migliorare';
      case 2: return 'Warning - Necessario intervento per migliorare il servizio';
      case 3: return 'Allarme - Situazione critica da monitorare';
      case 4: return 'CRITICO - Contattare immediatamente per ammonimento';
      default: return 'Status sconosciuto';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Warning Partner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Warning Partner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Errore nel caricamento dei warning partner
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!warnings?.warnings || warnings.warnings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Warning Partner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">
            <Shield className="mx-auto mb-2 w-8 h-8 text-green-500" />
            <p>Nessun warning attivo</p>
            <p className="text-sm mt-1">Tutti i partner hanno una qualità del servizio ottimale</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-600" />
          Warning Partner ({warnings.warnings.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {warnings.warnings.map((warning) => (
            <div key={warning.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {getWarningIcon(warning.warning_level)}
                    <span className="font-semibold">{warning.partner_code}</span>
                  </div>
                  <Badge className={getWarningColor(warning.warning_level)}>
                    {parseFloat(warning.current_rating).toFixed(1)}% 
                    - {getWarningLevelString(warning.warning_level)}
                  </Badge>
                </div>
                
                {warning.warning_level === 4 && (
                  <Badge variant="destructive" className="pulse-animation">
                    CONTATTARE SUBITO
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <ThumbsUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-lg font-bold text-green-600">
                      {warning.positive_feedbacks}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Positive</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <ThumbsDown className="w-4 h-4 text-red-500 mr-1" />
                    <span className="text-lg font-bold text-red-600">
                      {warning.negative_feedbacks}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Negative</p>
                </div>
                
                <div className="text-center">
                  <div className="mb-1">
                    <span className="text-lg font-bold text-gray-700">
                      {warning.total_feedbacks}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">Totali</p>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div 
                  className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${parseFloat(warning.current_rating)}%` }}
                ></div>
              </div>

              <Alert className={`border-l-4 ${warning.warning_level === 3 ? 'border-red-500' : 
                                           warning.warning_level === 2 ? 'border-orange-500' : 
                                           'border-yellow-500'}`}>
                <AlertDescription className="text-sm">
                  {getWarningMessage(warning.warning_level)}
                </AlertDescription>
              </Alert>

              <div className="text-xs text-gray-500 mt-2">
                <p>Ultimo aggiornamento: {new Date(warning.last_updated).toLocaleString('it-IT')}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};