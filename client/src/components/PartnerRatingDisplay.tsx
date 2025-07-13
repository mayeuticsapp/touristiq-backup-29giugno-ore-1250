import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ThumbsUp, ThumbsDown, AlertTriangle, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface PartnerRatingDisplayProps {
  partnerCode: string;
}

interface PartnerRating {
  id: number;
  partner_code: string;
  positive_feedbacks: number;
  negative_feedbacks: number;
  total_feedbacks: number;
  current_rating: string;
  warning_level: number;
  last_updated: string;
  is_excluded: boolean;
}

export const PartnerRatingDisplay: React.FC<PartnerRatingDisplayProps> = ({ partnerCode }) => {
  const { data: rating, isLoading, error } = useQuery<{ rating: PartnerRating | null }>({
    queryKey: ['/api/partner/rating'],
    refetchInterval: 30000, // Aggiorna ogni 30 secondi
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Valutazione Qualità</CardTitle>
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
          <CardTitle>Valutazione Qualità</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Errore nel caricamento della valutazione
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!rating?.rating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Valutazione Qualità</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">
            <p>Nessuna valutazione disponibile</p>
            <p className="text-sm mt-1">Le valutazioni appariranno quando i turisti inizieranno a valutare il vostro servizio</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { positive_feedbacks, negative_feedbacks, total_feedbacks, current_rating, warning_level, is_excluded } = rating.rating;
  
  // Converti i dati dal formato backend
  const positiveCount = positive_feedbacks;
  const negativeCount = negative_feedbacks;
  const totalCount = total_feedbacks;
  const positivePercentage = parseFloat(current_rating);
  
  // Converti warning_level numerico in stringa
  const getWarningLevelString = (level: number, excluded: boolean): string => {
    if (excluded) return 'excluded';
    switch (level) {
      case 0: return 'green';  // >= 70%
      case 1: return 'yellow'; // >= 60%
      case 2: return 'orange'; // >= 50%
      case 3: return 'red';    // >= 40%
      case 4: return 'red';    // < 40%
      default: return 'green';
    }
  };
  
  const warningLevel = getWarningLevelString(warning_level, is_excluded);

  const getWarningColor = (level: string) => {
    switch (level) {
      case 'green': return 'bg-green-100 text-green-800';
      case 'yellow': return 'bg-yellow-100 text-yellow-800';
      case 'orange': return 'bg-orange-100 text-orange-800';
      case 'red': return 'bg-red-100 text-red-800';
      case 'excluded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getWarningMessage = (level: string) => {
    switch (level) {
      case 'green':
        return 'Ottimo lavoro! La qualità del vostro servizio è eccellente.';
      case 'yellow':
        return 'Attenzione: la qualità del servizio può essere migliorata.';
      case 'orange':
        return 'Avviso importante: è necessario migliorare urgentemente la qualità del servizio.';
      case 'red':
        return 'Avviso critico: la qualità del servizio è sotto la soglia minima accettabile.';
      case 'excluded':
        return 'Il vostro account è stato temporaneamente sospeso a causa di valutazioni negative persistenti.';
      default:
        return 'Continuate a fornire un servizio di qualità.';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Valutazione Qualità
          <Badge className={getWarningColor(warningLevel)}>
            {positivePercentage.toFixed(1)}%
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Statistiche principali */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <ThumbsUp className="w-5 h-5 text-green-500 mr-1" />
                <span className="text-2xl font-bold text-green-600">{positiveCount}</span>
              </div>
              <p className="text-sm text-gray-600">Positive</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <ThumbsDown className="w-5 h-5 text-red-500 mr-1" />
                <span className="text-2xl font-bold text-red-600">{negativeCount}</span>
              </div>
              <p className="text-sm text-gray-600">Negative</p>
            </div>
            
            <div className="text-center">
              <div className="mb-1">
                <span className="text-2xl font-bold text-gray-700">{totalCount}</span>
              </div>
              <p className="text-sm text-gray-600">Totali</p>
            </div>
          </div>

          {/* Barra di progresso */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${positivePercentage}%` }}
            ></div>
          </div>

          {/* Messaggio di stato */}
          <Alert className={`border-l-4 ${warningLevel === 'red' || warningLevel === 'excluded' ? 'border-red-500' : 
                                       warningLevel === 'orange' ? 'border-orange-500' : 
                                       warningLevel === 'yellow' ? 'border-yellow-500' : 
                                       'border-green-500'}`}>
            <AlertDescription>
              {getWarningMessage(warningLevel)}
            </AlertDescription>
          </Alert>

          {/* Soglie di qualità */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>Soglie di qualità:</p>
            <div className="grid grid-cols-2 gap-2">
              <p>• Eccellente: ≥70%</p>
              <p>• Buona: ≥60%</p>
              <p>• Migliorabile: ≥50%</p>
              <p>• Critica: &lt;40%</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};