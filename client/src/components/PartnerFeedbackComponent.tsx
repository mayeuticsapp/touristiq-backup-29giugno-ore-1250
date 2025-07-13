import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ThumbsUp, ThumbsDown, CheckCircle, XCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface PartnerFeedbackComponentProps {
  partnerCode: string;
  partnerName: string;
  onFeedbackSubmitted?: () => void;
}

export const PartnerFeedbackComponent: React.FC<PartnerFeedbackComponentProps> = ({
  partnerCode,
  partnerName,
  onFeedbackSubmitted
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const handleFeedback = async (feedbackType: 'positive' | 'negative') => {
    setIsSubmitting(true);
    try {
      await apiRequest('POST', '/api/feedback', {
        partnerCode,
        feedback: feedbackType
      });

      setFeedbackGiven(true);
      
      toast({
        title: "Feedback inviato",
        description: `Grazie per aver valutato ${partnerName}!`,
      });

      if (onFeedbackSubmitted) {
        onFeedbackSubmitted();
      }
    } catch (error) {
      console.error('Errore invio feedback:', error);
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'invio del feedback. Riprova più tardi.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (feedbackGiven) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center space-x-2">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <span className="text-green-700 font-medium">Feedback inviato con successo!</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-lg">
          Valuta {partnerName}
        </CardTitle>
        <p className="text-center text-sm text-gray-600">
          La tua valutazione ci aiuta a mantenere alta la qualità del servizio
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center space-x-6">
          <Button
            onClick={() => handleFeedback('positive')}
            disabled={isSubmitting}
            className="flex flex-col items-center space-y-2 h-20 w-20 bg-green-100 hover:bg-green-200 text-green-700"
            variant="outline"
          >
            <ThumbsUp className="w-6 h-6" />
            <span className="text-xs">Positiva</span>
          </Button>
          
          <Button
            onClick={() => handleFeedback('negative')}
            disabled={isSubmitting}
            className="flex flex-col items-center space-y-2 h-20 w-20 bg-red-100 hover:bg-red-200 text-red-700"
            variant="outline"
          >
            <ThumbsDown className="w-6 h-6" />
            <span className="text-xs">Negativa</span>
          </Button>
        </div>
        
        {isSubmitting && (
          <div className="mt-4 text-center text-sm text-gray-500">
            Invio feedback in corso...
          </div>
        )}
      </CardContent>
    </Card>
  );
};