import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingCart, 
  BarChart3,
  Package,
  Euro,
  CheckCircle
} from 'lucide-react';
import { Layout } from '@/components/layout';
import { useToast } from '@/hooks/use-toast';
import { AdvancedAccounting } from '@/components/advanced-accounting';
import TermsAndConditionsModal from '@/components/TermsAndConditionsModal';

const PACKAGE_PRICES = {
  10: "49.90",
  25: "99.90", 
  50: "179.90",
  100: "299.90"
};

export default function StructurePanel() {
  const params = useParams();
  const structureId = params.id;
  const { toast } = useToast();
  
  const { data: structureData } = useQuery({
    queryKey: ['/api/structure', structureId],
    enabled: !!structureId
  });
  
  const structureCode = (structureData as any)?.iqCode || `TIQ-VV-STT-${structureId}`;
  const structureName = (structureData as any)?.name || `Struttura ${structureId}`;
  
  const [iqCodesBalance, setIqCodesBalance] = useState(0);
  const [selectedPackageSize, setSelectedPackageSize] = useState(25);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [gestionaleAccess, setGestionaleAccess] = useState({ hasAccess: true, hoursRemaining: 48 });
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('purchase');

  const navigation = [
    { icon: <ShoppingCart size={20} />, label: "Dashboard Struttura", href: `/structure/${structureId}` },
    { icon: <BarChart3 size={20} />, label: "Pannello Completo", href: `/structure/${structureId}/panel` }
  ];

  useEffect(() => {
    loadStructureData();
  }, [structureCode]);

  const loadStructureData = async () => {
    try {
      setIqCodesBalance(18);
    } catch (error) {
      console.error('Errore caricamento dati:', error);
    }
  };

  const handlePurchasePackage = () => {
    // Apri il modal delle condizioni generali prima di procedere
    setShowTermsModal(true);
  };

  const handleTermsAccepted = () => {
    setPaymentStatus('processing');
    
    setTimeout(() => {
      setPaymentStatus('completed');
      setIqCodesBalance(prev => prev + selectedPackageSize);
      
      toast({
        title: "Acquisto completato!",
        description: `Pacchetto da ${selectedPackageSize} IQCode aggiunto al tuo saldo`,
      });
    }, 2000);
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
                  <h1 className="text-2xl font-bold text-gray-900">Pannello Completo Struttura</h1>
                  <p className="text-gray-600">Struttura {structureId} - {structureCode}</p>
                </div>
                <div className="flex gap-4">
                  <Badge variant="outline" className="px-3 py-1">
                    Saldo IQCode: {iqCodesBalance}
                  </Badge>
                  <Badge variant="secondary" className="px-3 py-1">
                    Gestionale: 42h
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="purchase" className="flex items-center gap-2">
                <ShoppingCart size={16} />
                Acquista Pacchetti
              </TabsTrigger>
              <TabsTrigger value="accounting" className="flex items-center gap-2">
                <BarChart3 size={16} />
                Mini Gestionale
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Acquisto Pacchetti */}
            <TabsContent value="purchase">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      Seleziona Pacchetto IQCode
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(PACKAGE_PRICES).map(([size, price]) => (
                        <Button
                          key={size}
                          variant={selectedPackageSize === parseInt(size) ? "default" : "outline"}
                          className="p-4 h-auto flex flex-col"
                          onClick={() => setSelectedPackageSize(parseInt(size))}
                        >
                          <span className="text-lg font-bold">{size} IQCode</span>
                          <span className="text-sm">€{price}</span>
                        </Button>
                      ))}
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Pacchetto selezionato:</span>
                        <span className="font-semibold">{selectedPackageSize} IQCode</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Prezzo:</span>
                        <span className="font-semibold">€{PACKAGE_PRICES[selectedPackageSize as keyof typeof PACKAGE_PRICES]}</span>
                      </div>
                    </div>
                    
                    <Button 
                      onClick={handlePurchasePackage}
                      disabled={paymentStatus === 'processing'}
                      className="w-full"
                    >
                      {paymentStatus === 'processing' ? (
                        <>
                          <Package className="w-4 h-4 mr-2 animate-spin" />
                          Elaborazione in corso...
                        </>
                      ) : paymentStatus === 'completed' ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Acquisto Completato
                        </>
                      ) : (
                        <>
                          <Euro className="w-4 h-4 mr-2" />
                          Procedi all'Acquisto
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Riepilogo Saldo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg text-center">
                        <div className="text-3xl font-bold text-blue-600">{iqCodesBalance}</div>
                        <div className="text-sm text-blue-700">IQCode Disponibili</div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Saldo attuale:</span>
                          <span className="font-semibold">{iqCodesBalance} codici</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Dopo acquisto:</span>
                          <span className="font-semibold text-green-600">
                            {iqCodesBalance + selectedPackageSize} codici
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* TAB 2: Mini Gestionale */}
            <TabsContent value="accounting">
              <AdvancedAccounting 
                structureCode={structureCode}
                hasAccess={gestionaleAccess.hasAccess || iqCodesBalance > 0}
                onBackToDashboard={() => setActiveTab('purchase')}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Terms and Conditions Modal */}
      <TermsAndConditionsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={handleTermsAccepted}
        userType="structure"
        packageSize={selectedPackageSize}
        packagePrice={`€${PACKAGE_PRICES[selectedPackageSize as keyof typeof PACKAGE_PRICES]}`}
      />
    </Layout>
  );
}