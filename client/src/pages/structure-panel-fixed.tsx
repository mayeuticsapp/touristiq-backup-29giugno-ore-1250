import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  MessageCircle, 
  BarChart3,
  Package,
  Euro,
  CheckCircle
} from 'lucide-react';
import { Layout } from '@/components/layout';
import { useToast } from '@/hooks/use-toast';
import { AdvancedAccounting } from '@/components/advanced-accounting';

// Prezzi dei pacchetti IQCode
const PACKAGE_PRICES = {
  10: '€49',
  25: '€99', 
  50: '€179',
  100: '€299'
};

export default function StructurePanelFixed() {
  const params = useParams();
  const structureId = params.id;
  const { toast } = useToast();

  // Query per ottenere i dati della struttura
  const { data: structureData } = useQuery({
    queryKey: ['/api/structure', structureId],
    enabled: !!structureId
  });

  const structureCode = (structureData as any)?.iqCode || `TIQ-VV-STT-${structureId}`;
  const structureName = (structureData as any)?.name || `Struttura ${structureId}`;

  // Stati per il pannello
  const [iqCodesBalance, setIqCodesBalance] = useState(47);
  const [selectedPackageSize, setSelectedPackageSize] = useState<'25' | '50' | '75' | '100'>('25');
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [selectedCode, setSelectedCode] = useState('TIQ-IT-MARGHERITA');
  const [gestionaleAccess, setGestionaleAccess] = useState({
    hasAccess: true,
    hoursRemaining: 42
  });

  const navigation = [
    { icon: null, label: 'Dashboard Admin', href: '/admin' },
    { icon: null, label: 'Gestione Utenti', href: '/admin/users' },
    { icon: null, label: 'Dashboard Struttura', href: `/structure/${structureId}` },
    { icon: null, label: 'Pannello Completo', href: `/structure/${structureId}/panel` }
  ];

  const handlePurchasePackage = async () => {
    setPaymentStatus('processing');

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const packageSize = parseInt(selectedPackageSize);
      const newBalance = iqCodesBalance + packageSize;
      setIqCodesBalance(newBalance);
      setPaymentStatus('completed');
      toast({
        title: "Acquisto completato!",
        description: `Pacchetto ${selectedPackageSize} IQCode acquistato con successo. Nuovo saldo: ${newBalance}`,
      });
    } catch (error) {
      setPaymentStatus('failed');
      toast({
        title: "Errore pagamento",
        description: "Si è verificato un errore durante l'acquisto.",
        variant: "destructive"
      });
    }
  };

  const handleSendWhatsApp = async () => {
    try {
      window.open('https://wa.me/393662266720', '_blank');
      
      setIqCodesBalance(prev => prev - 1);
      
      toast({
        title: "Codice inviato!",
        description: `Codice ${selectedCode} inviato via WhatsApp!`,
      });
    } catch (error) {
      toast({
        title: "Errore invio",
        description: "Si è verificato un errore durante l'invio.",
        variant: "destructive"
      });
    }
  };

  return (
    <Layout
      title={`Pannello Struttura - ${structureName}`}
      role="structure"
      iqCode={structureCode}
      navigation={navigation}
      sidebarColor="bg-purple-600"
    >
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Pannello Completo Struttura</h1>
                  <p className="text-gray-600">{structureName} - {structureCode}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Saldo IQCode: {iqCodesBalance}
                  </Badge>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    Gestionale: {gestionaleAccess.hoursRemaining}h
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="packages" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="packages" className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Acquista Pacchetti
              </TabsTrigger>
              <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Invia via WhatsApp
              </TabsTrigger>
              <TabsTrigger value="accounting" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Mini Gestionale
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Acquisto Pacchetti */}
            <TabsContent value="packages" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Acquisto Pacchetti IQCode
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { size: '25', price: '€99', sumupLink: 'https://pay.sumup.com/b2c/QSJE461B' },
                      { size: '50', price: '€179', sumupLink: 'https://pay.sumup.com/b2c/QK6MLJC7' },
                      { size: '75', price: '€239', sumupLink: 'https://pay.sumup.com/b2c/Q9517L3P' },
                      { size: '100', price: '€299', sumupLink: 'https://pay.sumup.com/b2c/Q3BWI26N' }
                    ].map(({ size, price, sumupLink }) => (
                      <div 
                        key={size}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedPackageSize === size 
                            ? 'border-purple-500 bg-purple-50' 
                            : 'border-gray-200 hover:border-purple-300'
                        }`}
                        onClick={() => setSelectedPackageSize(size as '25' | '50' | '75' | '100')}
                      >
                        <div className="text-center">
                          <Package className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                          <div className="text-2xl font-bold">{size}</div>
                          <div className="text-sm text-gray-600">IQCode</div>
                          <div className="text-lg font-semibold text-purple-600 mt-2">{price}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6">
                    <Button 
                      onClick={() => {
                        const packages = [
                          { size: '25', sumupLink: 'https://pay.sumup.com/b2c/QSJE461B' },
                          { size: '50', sumupLink: 'https://pay.sumup.com/b2c/QK6MLJC7' },
                          { size: '75', sumupLink: 'https://pay.sumup.com/b2c/Q9517L3P' },
                          { size: '100', sumupLink: 'https://pay.sumup.com/b2c/Q3BWI26N' }
                        ];
                        const selectedPackage = packages.find(p => p.size === selectedPackageSize);
                        if (selectedPackage) {
                          window.open(selectedPackage.sumupLink, '_blank');
                        }
                      }}
                      className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                      <Euro className="w-4 h-4 mr-2" />
                      Acquista su SumUp - {selectedPackageSize} IQCode
                    </Button>

                    {paymentStatus === 'completed' && (
                      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-medium">Pagamento completato con successo!</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: Invio via WhatsApp */}
            <TabsContent value="whatsapp" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Invia Codice via WhatsApp
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="code-select">Seleziona Codice IQ</Label>
                      <Select value={selectedCode} onValueChange={setSelectedCode}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona un codice" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TIQ-IT-MARGHERITA">TIQ-IT-MARGHERITA</SelectItem>
                          <SelectItem value="TIQ-IT-LEONARDO">TIQ-IT-LEONARDO</SelectItem>
                          <SelectItem value="TIQ-IT-RAFFAELLO">TIQ-IT-RAFFAELLO</SelectItem>
                          <SelectItem value="TIQ-IT-MICHELANGELO">TIQ-IT-MICHELANGELO</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      onClick={handleSendWhatsApp}
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={iqCodesBalance <= 0}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Invia su WhatsApp (Costo: 1 IQCode)
                    </Button>

                    {iqCodesBalance <= 0 && (
                      <p className="text-sm text-red-600">
                        Saldo insufficiente. Acquista più IQCode per continuare.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: Mini Gestionale */}
            <TabsContent value="accounting">
              <AdvancedAccounting 
                structureCode={structureCode}
                hasAccess={gestionaleAccess.hasAccess || iqCodesBalance > 0}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}