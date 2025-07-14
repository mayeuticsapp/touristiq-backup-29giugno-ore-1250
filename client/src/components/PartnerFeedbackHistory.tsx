import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageSquare, ThumbsUp, ThumbsDown, Clock, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface PartnerFeedbackHistoryProps {
  partnerCode: string;
}

interface FeedbackItem {
  id: number;
  tourist_iq_code: string;
  partner_code: string;
  otc_code: string;
  rating: string;
  notes: string | null;
  created_at: string;
}

export const PartnerFeedbackHistory: React.FC<PartnerFeedbackHistoryProps> = ({ partnerCode }) => {
  const { data: feedbacks, isLoading, error } = useQuery<FeedbackItem[]>({
    queryKey: ['/api/partner/feedbacks'],
    refetchInterval: 30000, // Aggiorna ogni 30 secondi
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Cronologia Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
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
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Cronologia Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              Errore nel caricamento dei feedback
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!feedbacks || feedbacks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Cronologia Feedback
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            <MessageSquare className="mx-auto mb-2 w-8 h-8 text-gray-400" />
            <p>Nessun feedback ricevuto ancora</p>
            <p className="text-sm mt-1">I feedback dei turisti appariranno qui</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const positiveFeedbacks = feedbacks.filter(f => f.rating === 'positive').length;
  const negativeFeedbacks = feedbacks.filter(f => f.rating === 'negative').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Cronologia Feedback ({feedbacks.length})
        </CardTitle>
        <div className="flex gap-4 mt-2">
          <Badge className="bg-green-100 text-green-700">
            <ThumbsUp className="w-3 h-3 mr-1" />
            {positiveFeedbacks} Positivi
          </Badge>
          <Badge className="bg-red-100 text-red-700">
            <ThumbsDown className="w-3 h-3 mr-1" />
            {negativeFeedbacks} Negativi
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {feedbacks.map((feedback) => (
            <div 
              key={feedback.id} 
              className={`p-4 rounded-lg border-l-4 ${
                feedback.rating === 'positive' 
                  ? 'bg-green-50 border-green-400' 
                  : 'bg-red-50 border-red-400'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {feedback.rating === 'positive' ? (
                    <ThumbsUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <ThumbsDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`font-medium ${
                    feedback.rating === 'positive' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    Feedback {feedback.rating === 'positive' ? 'Positivo' : 'Negativo'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  {formatDate(feedback.created_at)}
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Codice TIQ-OTC:</span> {feedback.otc_code}
              </div>
              
              {feedback.notes && (
                <div className={`text-sm ${
                  feedback.rating === 'positive' ? 'text-green-700' : 'text-red-700'
                }`}>
                  <span className="font-medium">Note:</span> {feedback.notes}
                </div>
              )}
              
              <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                <User className="w-3 h-3" />
                Turista anonimo • {feedback.rating === 'positive' ? 'Esperienza positiva' : 'Esperienza da migliorare'}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};