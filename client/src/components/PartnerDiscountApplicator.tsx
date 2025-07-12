import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calculator, Receipt, Euro, Percent, AlertCircle, CheckCircle } from "lucide-react";

interface DiscountResult {
  success: boolean;
  message: string;
  originalAmount: number;
  discountPercentage: number;
  discountAmount: number;
  finalAmount: number;
  newTotalUsed: number;
  remainingPlafond: number;
}

export function PartnerDiscountApplicator() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    code: "",
    originalAmount: "",
    discountPercentage: "",
    offerDescription: ""
  });
  const [lastResult, setLastResult] = useState<DiscountResult | null>(null);

  // Mutation per applicare lo sconto
  const applyDiscountMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('POST', '/api/partner/apply-discount', data);
      return await response.json();
    },
    onSuccess: (result: DiscountResult) => {
      setLastResult(result);
      toast({
        title: "✅ Sconto applicato con successo!",
        description: `Sconto di €${result.discountAmount} applicato al codice ${formData.code.replace('TIQ-OTC-', '')}`
      });
      // Reset form
      setFormData({
        code: "",
        originalAmount: "",
        discountPercentage: "",
        offerDescription: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Errore applicazione sconto",
        description: error.message || "Impossibile applicare lo sconto. Riprova.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.originalAmount || !formData.discountPercentage) {
      toast({
        title: "Campi obbligatori mancanti",
        description: "Inserisci codice TIQ-OTC, importo originale e percentuale sconto",
        variant: "destructive"
      });
      return;
    }

    // Aggiungi prefisso TIQ-OTC se non presente
    const fullCode = formData.code.startsWith('TIQ-OTC-') ? formData.code : `TIQ-OTC-${formData.code}`;
    
    applyDiscountMutation.mutate({
      ...formData,
      code: fullCode
    });
  };

  const calculatePreview = () => {
    const original = parseFloat(formData.originalAmount || "0");
    const percentage = parseFloat(formData.discountPercentage || "0");
    const discount = (original * percentage) / 100;
    const final = original - discount;
    
    return { original, percentage, discount, final };
  };

  const preview = calculatePreview();

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-blue-600" />
          Applicatore Sconto TIQ-OTC
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Sistema plafond €150 per turista - Applica sconti ai codici TIQ-OTC
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risultato ultimo sconto applicato */}
        {lastResult && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold text-green-800">Sconto Applicato con Successo</h4>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-green-700">
                  <strong>Importo originale:</strong> €{lastResult.originalAmount.toFixed(2)}
                </p>
                <p className="text-green-700">
                  <strong>Sconto ({lastResult.discountPercentage}%):</strong> €{lastResult.discountAmount.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-green-700">
                  <strong>Importo finale:</strong> €{lastResult.finalAmount.toFixed(2)}
                </p>
                <p className="text-green-700">
                  <strong>Transazione completata</strong> ✅
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form applicazione sconto */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="code">Codice TIQ-OTC</Label>
              <Input
                id="code"
                type="text"
                placeholder="12345 (solo le 5 cifre)"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                className="font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                Inserisci solo le 5 cifre del codice (es: 12345)
              </p>
            </div>

            <div>
              <Label htmlFor="originalAmount">Importo Originale (€)</Label>
              <Input
                id="originalAmount"
                type="number"
                step="0.01"
                min="0"
                placeholder="25.00"
                value={formData.originalAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, originalAmount: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="discountPercentage">Sconto (%)</Label>
              <Input
                id="discountPercentage"
                type="number"
                step="1"
                min="0"
                max="100"
                placeholder="20"
                value={formData.discountPercentage}
                onChange={(e) => setFormData(prev => ({ ...prev, discountPercentage: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="offerDescription">Descrizione Offerta</Label>
              <Input
                id="offerDescription"
                type="text"
                placeholder="Aperitivo serale"
                value={formData.offerDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, offerDescription: e.target.value }))}
              />
            </div>
          </div>

          {/* Anteprima calcolo */}
          {formData.originalAmount && formData.discountPercentage && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Anteprima Calcolo
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-blue-700 flex items-center gap-1">
                    <Euro className="h-3 w-3" />
                    <strong>Importo:</strong> €{preview.original.toFixed(2)}
                  </p>
                  <p className="text-blue-700 flex items-center gap-1">
                    <Percent className="h-3 w-3" />
                    <strong>Sconto:</strong> {preview.percentage}%
                  </p>
                </div>
                <div>
                  <p className="text-blue-700">
                    <strong>Sconto €:</strong> €{preview.discount.toFixed(2)}
                  </p>
                  <p className="text-blue-700 text-lg font-bold">
                    <strong>Totale:</strong> €{preview.final.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={applyDiscountMutation.isPending}
          >
            {applyDiscountMutation.isPending ? "Applicando..." : "Applica Sconto"}
          </Button>
        </form>

        {/* Informazioni sistema */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <h4 className="font-semibold text-amber-800">Sistema Plafond €150</h4>
          </div>
          <p className="text-sm text-amber-700">
            Ogni turista ha un plafond mensile di €150 per gli sconti. Il sistema limita automaticamente 
            gli sconti applicabili al plafond disponibile per evitare superamenti.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}