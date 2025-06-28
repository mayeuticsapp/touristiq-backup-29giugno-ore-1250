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
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { 
  ShoppingCart, 
  MessageCircle, 
  Copy, 
  Download, 
  Plus, 
  Minus, 
  BarChart3,
  Package,
  Euro,
  AlertTriangle,
  CheckCircle,
  Filter,
  Calendar,
  FileText,
  TrendingUp,
  Users,
  CreditCard
} from 'lucide-react';
import { Layout } from '@/components/layout';
import { useToast } from '@/hooks/use-toast';
import { AdvancedAccounting } from '@/components/advanced-accounting';

// Import categorie settore turistico
const INCOME_CATEGORIES = [
  { id: 'rooms', label: 'Camere', icon: '🏨' },
  { id: 'breakfast', label: 'Colazioni', icon: '☕' },
  { id: 'extra_services', label: 'Extra Servizi', icon: '🛎️' },
  { id: 'iqcodes_sold', label: 'IQCode Venduti', icon: '🎫' },
  { id: 'parking', label: 'Parcheggio', icon: '🚗' },
  { id: 'restaurant', label: 'Ristorazione', icon: '🍽️' },
  { id: 'wellness', label: 'Wellness/SPA', icon: '💆' },
  { id: 'tours', label: 'Tour/Escursioni', icon: '🗺️' },
  { id: 'other_income', label: 'Altre Entrate', icon: '💰' }
];

const EXPENSE_CATEGORIES = [
  { id: 'ota_commissions', label: 'Commissioni OTA', icon: '💳' },
  { id: 'iqcodes_cost', label: 'Costo IQCode', icon: '🎫' },
  { id: 'supplies', label: 'Forniture', icon: '📦' },
  { id: 'cleaning', label: 'Pulizie', icon: '🧹' },
  { id: 'laundry', label: 'Lavanderia', icon: '👕' },
  { id: 'maintenance', label: 'Manutenzioni', icon: '🔧' },
  { id: 'utilities', label: 'Utenze', icon: '⚡' },
  { id: 'marketing', label: 'Marketing', icon: '📢' },
  { id: 'staff', label: 'Personale', icon: '👥' },
  { id: 'other_expense', label: 'Altre Spese', icon: '💸' }
];

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Contanti', icon: '💵' },
  { id: 'card', label: 'Carta', icon: '💳' },
  { id: 'bank_transfer', label: 'Bonifico', icon: '🏦' },
  { id: 'paypal', label: 'PayPal', icon: '📱' },
  { id: 'sumup', label: 'SumUp', icon: '📲' },
  { id: 'other', label: 'Altro', icon: '❓' }
];

// Prezzi dei pacchetti IQCode
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
  
  // Query per ottenere i dati della struttura
  const { data: structureData } = useQuery({
    queryKey: ['/api/structure', structureId],
    enabled: !!structureId
  });
  
  const structureCode = (structureData as any)?.iqCode || `TIQ-VV-STT-${structureId}`;
  const structureName = (structureData as any)?.name || `Struttura ${structureId}`;
  
  const [iqCodesBalance, setIqCodesBalance] = useState(0);
  const [selectedPackageSize, setSelectedPackageSize] = useState(25);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [selectedCode, setSelectedCode] = useState('');
  const [availableCodes, setAvailableCodes] = useState<string[]>([]);
  const [gestionaleAccess, setGestionaleAccess] = useState({ hasAccess: true, hoursRemaining: 48 });
  const [movements, setMovements] = useState<any[]>([]);
  const [newMovement, setNewMovement] = useState({
    type: 'income',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0]
  });

  const navigation = [
    { icon: <ShoppingCart size={20} />, label: "Acquista Pacchetti", href: "#", onClick: () => {} },
    { icon: <BarChart3 size={20} />, label: "Mini Gestionale", href: "#", onClick: () => {} }
  ];

  useEffect(() => {
    loadStructureData();
  }, [structureCode]);

  const loadStructureData = async () => {
    try {
      // Simulo caricamento dati struttura
      setIqCodesBalance(18);
      setAvailableCodes(['TIQ-IT-MARE', 'TIQ-IT-SOLE', 'TIQ-IT-VACANZA']);
      
      // Movimento contabile di esempio
      setMovements([
        { id: 1, type: 'income', description: 'Vendita pacchetto 25 IQCode', amount: 99.90, date: '2025-06-27' },
        { id: 2, type: 'expense', description: 'Commissione SumUp', amount: 2.50, date: '2025-06-27' }
      ]);
    } catch (error) {
      console.error('Errore caricamento dati:', error);
    }
  };

  const handlePurchasePackage = async () => {
    try {
      setPaymentStatus('processing');
      
      // Simulo processo di pagamento SumUp
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Aggiorno il saldo IQCode
      const newBalance = iqCodesBalance + selectedPackageSize;
      setIqCodesBalance(newBalance);
      
      // Aggiungo movimento contabile
      const newMovementEntry = {
        id: movements.length + 1,
        type: 'income',
        description: `Acquisto pacchetto ${selectedPackageSize} IQCode`,
        amount: parseFloat(PACKAGE_PRICES[selectedPackageSize as keyof typeof PACKAGE_PRICES]),
        date: new Date().toISOString().split('T')[0]
      };
      setMovements([...movements, newMovementEntry]);
      
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

  const handleAssignCodeWhatsApp = async (phoneNumber: string) => {
    if (!selectedCode) {
      toast({
        title: "Errore",
        description: "Seleziona un codice IQ da assegnare",
        variant: "destructive"
      });
      return;
    }

    try {
      // Simulo assegnazione codice
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=🎟 Il tuo codice TouristIQ: ${selectedCode}%0A%0AUsa questo codice per accedere agli sconti esclusivi della zona!`;
      window.open(whatsappUrl, '_blank');
      
      // Riduco il saldo
      setIqCodesBalance(prev => Math.max(0, prev - 1));
      
      toast({
        title: "Codice assegnato!",
        description: `Codice ${selectedCode} inviato via WhatsApp`,
      });
    } catch (error) {
      toast({
        title: "Errore invio",
        description: "Errore durante l'invio del codice",
        variant: "destructive"
      });
    }
  };

  const handleAddMovement = () => {
    if (!newMovement.description || !newMovement.amount) {
      toast({
        title: "Errore",
        description: "Compila tutti i campi obbligatori",
        variant: "destructive"
      });
      return;
    }

    const movement = {
      id: movements.length + 1,
      ...newMovement,
      amount: parseFloat(newMovement.amount)
    };
    
    setMovements([...movements, movement]);
    setNewMovement({
      type: 'income',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0]
    });
    
    toast({
      title: "Movimento aggiunto",
      description: "Movimento contabile registrato con successo",
    });
  };

  const calculateBalance = () => {
    const income = movements.filter(m => m.type === 'income').reduce((sum, m) => sum + m.amount, 0);
    const expenses = movements.filter(m => m.type === 'expense').reduce((sum, m) => sum + m.amount, 0);
    return income - expenses;
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
        {/* Header del Pannello */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">🎟 Pannello Struttura Completo</h1>
                  <p className="text-gray-600 mt-1">{structureName} • {structureCode}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge variant="outline" className="px-3 py-1">
                    <Package className="w-4 h-4 mr-2" />
                    Saldo: {iqCodesBalance} IQCode
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenuto Principale */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="purchase" className="space-y-6">
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
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      size="lg"
                    >
                      {paymentStatus === 'processing' ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Elaborazione SumUp...
                        </>
                      ) : (
                        <>
                          <Euro className="w-4 h-4 mr-2" />
                          Acquista con SumUp
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
                    <div className="text-center space-y-4">
                      <div>
                        <div className="text-3xl font-bold text-blue-600">{iqCodesBalance}</div>
                        <div className="text-gray-600">IQCode Disponibili</div>
                      </div>
                      
                      {paymentStatus === 'completed' && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center justify-center text-green-700">
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Acquisto completato con successo!
                          </div>
                        </div>
                      )}
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
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}