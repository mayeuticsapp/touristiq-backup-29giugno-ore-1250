import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, Hash, Euro, Percent, CheckCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface TiqOtcDiscountValidatorProps {
  onBackToDashboard?: () => void;
}

interface ValidationResult {
  valid: boolean;
  message: string;
  used: boolean;
  touristIqCode?: string;
}

interface DiscountApplication {
  success: boolean;
  message: string;
  discount: {
    percentage: number;
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
    touristSaved: number;
    partnerRevenue: number;
  };
}

export function TiqOtcDiscountValidator({ onBackToDashboard }: TiqOtcDiscountValidatorProps) {
  const [otcCode, setOtcCode] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [originalAmount, setOriginalAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const queryClient = useQueryClient();

  // Mutation per validare il codice TIQ-OTC
  const validateOtcMutation = useMutation({
    mutationFn: async (data: { code: string }) => {
      return await apiRequest('/api/partner/validate-one-time-code', {
        method: 'POST',
        body: JSON.stringify({
          code: data.code, // Solo le 5 cifre
          partnerName: 'Partner'
        })
      });
    },
    onSuccess: (data) => {
      setValidationResult(data);
      console.log('🎯 Risultato validazione:', data);
    },
    onError: (error) => {
      console.error('Errore validazione:', error);
      setValidationResult({
        valid: false,
        message: 'Errore durante la validazione del codice',
        used: false
      });
    }
  });

  // Mutation per applicare lo sconto
  const applyDiscountMutation = useMutation({
    mutationFn: async (data: {
      otcCode: string;
      touristIqCode: string;
      discountPercentage: number;
      originalAmount: number;
      description: string;
    }) => {
      return await apiRequest('/api/apply-discount-otc', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data: DiscountApplication) => {
      // Aggiorna le statistiche partner
      queryClient.invalidateQueries({ queryKey: ['/api/partner/discount-stats'] });
      
      // Reset form
      setOtcCode('');
      setDiscountPercentage('');
      setOriginalAmount('');
      setDescription('');
      setValidationResult(null);
    },
    onError: (error) => {
      console.error('Errore applicazione sconto:', error);
    }
  });

  const handleValidateCode = () => {
    if (!otcCode || otcCode.length !== 5) {
      setValidationResult({
        valid: false,
        message: 'Inserire un codice TIQ-OTC valido (5 cifre)',
        used: false
      });
      return;
    }

    setIsValidating(true);
    validateOtcMutation.mutate({ code: otcCode });
    setIsValidating(false);
  };

  const handleApplyDiscount = () => {
    if (!validationResult?.valid || !validationResult.touristIqCode) {
      return;
    }

    if (!discountPercentage || !originalAmount) {
      alert('Inserire percentuale di sconto e importo originale');
      return;
    }

    applyDiscountMutation.mutate({
      otcCode: `TIQ-OTC-${otcCode}`,
      touristIqCode: validationResult.touristIqCode,
      discountPercentage: parseFloat(discountPercentage),
      originalAmount: parseFloat(originalAmount),
      description
    });
  };

  const calculateDiscount = () => {
    if (!discountPercentage || !originalAmount) return null;
    
    const original = parseFloat(originalAmount);
    const percentage = parseFloat(discountPercentage);
    const discount = (original * percentage) / 100;
    const final = original - discount;
    
    return {
      original,
      percentage,
      discount,
      final
    };
  };

  const calculation = calculateDiscount();

  return (
    <div className="space-y-6">
      {/* Header con pulsante indietro */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-orange-600" />
          <h2 className="text-xl font-bold">Validatore TIQ-OTC con Sconto</h2>
        </div>
        {onBackToDashboard && (
          <Button variant="outline" onClick={onBackToDashboard}>
            ← Torna alla Dashboard
          </Button>
        )}
      </div>

      {/* Validazione Codice TIQ-OTC */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            Validazione Codice TIQ-OTC
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="otc-code">Codice TIQ-OTC (5 cifre)</Label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">TIQ-OTC-</span>
                <Input
                  id="otc-code"
                  type="text"
                  value={otcCode}
                  onChange={(e) => setOtcCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  placeholder="12345"
                  className="font-mono"
                  maxLength={5}
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleValidateCode}
                disabled={isValidating || validateOtcMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isValidating || validateOtcMutation.isPending ? 'Validando...' : 'Valida'}
              </Button>
            </div>
          </div>

          {validationResult && (
            <Alert className={validationResult.valid ? 'border-green-500' : 'border-red-500'}>
              <CheckCircle className={`h-4 w-4 ${validationResult.valid ? 'text-green-500' : 'text-red-500'}`} />
              <AlertDescription>
                {validationResult.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Applicazione Sconto - Visibile solo se validazione riuscita */}
      {validationResult?.valid && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Applicazione Sconto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discount-percentage">Percentuale Sconto (%)</Label>
                <Input
                  id="discount-percentage"
                  type="number"
                  value={discountPercentage}
                  onChange={(e) => setDiscountPercentage(e.target.value)}
                  placeholder="10"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <div>
                <Label htmlFor="original-amount">Importo Originale (€)</Label>
                <Input
                  id="original-amount"
                  type="number"
                  value={originalAmount}
                  onChange={(e) => setOriginalAmount(e.target.value)}
                  placeholder="50.00"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Descrizione (opzionale)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrizione del prodotto/servizio scontato..."
                rows={2}
              />
            </div>

            {/* Calcolo Automatico */}
            {calculation && (
              <Card className="bg-gray-50">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Importo Originale:</span>
                      <span className="float-right">€{calculation.original.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="font-medium">Sconto ({calculation.percentage}%):</span>
                      <span className="float-right text-red-600">-€{calculation.discount.toFixed(2)}</span>
                    </div>
                    <div className="col-span-2 border-t pt-2">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">Totale da Pagare:</span>
                        <span className="font-bold text-green-600">€{calculation.final.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="col-span-2 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Turista risparmia:</span>
                        <span>€{calculation.discount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Partner incassa:</span>
                        <span>€{calculation.final.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button 
              onClick={handleApplyDiscount}
              disabled={!calculation || applyDiscountMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {applyDiscountMutation.isPending ? 'Applicando...' : 'Applica Sconto'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Risultato Applicazione Sconto */}
      {applyDiscountMutation.isSuccess && (
        <Alert className="border-green-500">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-medium">Sconto applicato con successo!</div>
              <div className="text-sm">
                {applyDiscountMutation.data?.message}
              </div>
              {applyDiscountMutation.data?.discount && (
                <div className="text-xs space-y-1">
                  <div>💰 Turista ha risparmiato: €{applyDiscountMutation.data.discount.touristSaved.toFixed(2)}</div>
                  <div>📊 Partner ha incassato: €{applyDiscountMutation.data.discount.partnerRevenue.toFixed(2)}</div>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}