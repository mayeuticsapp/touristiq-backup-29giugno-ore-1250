import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, Hash, Euro, Percent, CheckCircle, XCircle } from 'lucide-react';
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
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [originalAmount, setOriginalAmount] = useState('');
  const [otcCode, setOtcCode] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [description, setDescription] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const queryClient = useQueryClient();

  // Mutation per validare il codice TIQ-OTC
  const validateOtcMutation = useMutation({
    mutationFn: async (data: { code: string }) => {
      console.log('🔍 Tentativo validazione con codice:', data.code);
      const response = await apiRequest('POST', '/api/partner/validate-one-time-code', {
        code: data.code, // Solo le 5 cifre
        partnerName: 'Partner'
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setValidationResult(data);
      console.log('🎯 Risultato validazione:', data);
    },
    onError: (error) => {
      console.error('❌ Errore validazione:', error);
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
      const response = await apiRequest('POST', '/api/apply-otc-discount', data);
      return await response.json();
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

    console.log('🔍 Validazione codice iniziata:', otcCode);
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

      {/* Avviso sui dati veritieri */}
      <Alert className="border-amber-200 bg-amber-50">
        <AlertDescription className="text-amber-800">
          <strong>⚠️ Attenzione:</strong> I dati inseriti devono essere veritieri e corrispondenti all'acquisto reale. 
          L'inserimento di dati non corretti o fittizi comporta la sospensione dell'account partner e possibili sanzioni.
        </AlertDescription>
      </Alert>

      {/* STEP 1: Percentuale Sconto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Step 1: Percentuale Sconto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="discount-percentage">Percentuale Sconto (%)</Label>
            <Input
              id="discount-percentage"
              type="number"
              placeholder="10"
              value={discountPercentage}
              onChange={(e) => setDiscountPercentage(e.target.value)}
              min="0"
              max="100"
              step="0.1"
            />
            <p className="text-sm text-gray-600">
              Inserisci la percentuale di sconto che applicherai (es: 10 per 10%)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* STEP 2: Importo Originale - solo se percentuale inserita */}
      {discountPercentage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Euro className="h-5 w-5" />
              Step 2: Importo Originale
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="original-amount">Importo Originale (€)</Label>
              <Input
                id="original-amount"
                type="number"
                placeholder="9.00"
                value={originalAmount}
                onChange={(e) => setOriginalAmount(e.target.value)}
                min="0"
                step="0.01"
              />
              <p className="text-sm text-gray-600">
                Inserisci il prezzo originale del prodotto/servizio prima dello sconto
              </p>
            </div>

            {/* Anteprima calcolo */}
            {calculation && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Anteprima Sconto</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Importo originale:</span>
                    <span>€{calculation.original.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sconto {calculation.percentage}%:</span>
                    <span className="text-red-600">-€{calculation.discount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold border-t pt-1">
                    <span>Totale finale:</span>
                    <span className="text-green-600">€{calculation.final.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP 3: Validazione Codice TIQ-OTC - solo se entrambi i campi sono compilati */}
      {discountPercentage && originalAmount && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Step 3: Validazione Codice TIQ-OTC
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otc-code">Codice TIQ-OTC (5 cifre)</Label>
              <div className="flex gap-2">
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-gray-100 border border-r-0 rounded-l-md text-sm font-medium">
                    TIQ-<br/>OTC-
                  </span>
                  <Input
                    id="otc-code"
                    type="text"
                    placeholder="12345"
                    value={otcCode}
                    onChange={(e) => setOtcCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    className="rounded-l-none max-w-24"
                    maxLength={5}
                  />
                </div>
                <Button 
                  onClick={handleValidateCode}
                  disabled={!otcCode || otcCode.length !== 5 || isValidating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isValidating ? 'Validando...' : 'Valida'}
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Il turista ti dirà solo le <strong>5 cifre</strong> (es: "sette-sette-uno-tre-sette")
              </p>
            </div>

            {/* Risultato validazione */}
            {validationResult && (
              <Alert className={validationResult.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <AlertDescription className="flex items-center gap-2">
                  {validationResult.valid ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  {validationResult.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Descrizione opzionale e applicazione finale */}
      {validationResult?.valid && !validationResult.used && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Finalizza Sconto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrizione (opzionale)</Label>
              <Textarea
                id="description"
                placeholder="Descrizione del prodotto/servizio scontato..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <Button 
              onClick={handleApplyDiscount}
              disabled={applyDiscountMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {applyDiscountMutation.isPending ? 'Applicando...' : 'Applica Sconto'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Risultato applicazione sconto */}
      {applyDiscountMutation.isSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <strong>Sconto applicato con successo!</strong>
            <br />
            Il turista ha risparmiato €{applyDiscountMutation.data.discount.touristSaved.toFixed(2)} 
            e tu hai incassato €{applyDiscountMutation.data.discount.partnerRevenue.toFixed(2)}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}