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
  CheckCircle
} from 'lucide-react';
import { Layout } from '@/components/layout';
import { useToast } from '@/hooks/use-toast';

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
  
  const structureCode = structureData?.iqCode || `TIQ-VV-STT-${structureId}`;
  const structureName = structureData?.name || `Struttura ${structureId}`;
  
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
    { icon: <MessageCircle size={20} />, label: "Assegna Codici", href: "#", onClick: () => {} },
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
    <Layout>
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
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="purchase" className="flex items-center gap-2">
                <ShoppingCart size={16} />
                Acquista Pacchetti
              </TabsTrigger>
              <TabsTrigger value="assign" className="flex items-center gap-2">
                <MessageCircle size={16} />
                Assegna WhatsApp
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

            {/* TAB 2: Assegnazione WhatsApp */}
            <TabsContent value="assign">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Assegna Codice via WhatsApp
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="selectCode">Seleziona Codice IQ</Label>
                      <Select value={selectedCode} onValueChange={setSelectedCode}>
                        <SelectTrigger>
                          <SelectValue placeholder="Scegli un codice..." />
                        </SelectTrigger>
                        <SelectContent>
                          {availableCodes.map((code) => (
                            <SelectItem key={code} value={code}>
                              {code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="whatsappNumber">Numero WhatsApp</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="whatsappNumber"
                          placeholder="es. 3331234567"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const input = e.target as HTMLInputElement;
                              handleAssignCodeWhatsApp(input.value);
                            }
                          }}
                        />
                        <Button 
                          onClick={(e) => {
                            const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement;
                            if (input) handleAssignCodeWhatsApp(input.value);
                          }}
                          disabled={!selectedCode}
                        >
                          Invia
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mr-2 mt-0.5" />
                      <div className="text-sm text-amber-800">
                        <strong>IMPORTANTE:</strong> Per policy aziendale, NON raccogliamo mai indirizzi email. 
                        Tutti i codici vengono inviati esclusivamente via WhatsApp per garantire privacy e immediatezza.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: Mini Gestionale */}
            <TabsContent value="accounting">
              <div className="space-y-6">
                {gestionaleAccess.hasAccess ? (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" />
                            Aggiungi Movimento
                          </span>
                          <Badge variant="outline">
                            Accesso: {gestionaleAccess.hoursRemaining}h rimaste
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <Select value={newMovement.type} onValueChange={(value) => setNewMovement({...newMovement, type: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="income">Entrata</SelectItem>
                              <SelectItem value="expense">Uscita</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Input
                            placeholder="Descrizione"
                            value={newMovement.description}
                            onChange={(e) => setNewMovement({...newMovement, description: e.target.value})}
                          />
                          
                          <Input
                            type="number"
                            placeholder="Importo"
                            value={newMovement.amount}
                            onChange={(e) => setNewMovement({...newMovement, amount: e.target.value})}
                          />
                          
                          <Button onClick={handleAddMovement}>
                            <Plus className="w-4 h-4 mr-2" />
                            Aggiungi
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Riepilogo Contabile</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-3 bg-green-50 rounded-lg">
                              <div className="text-2xl font-bold text-green-600">
                                €{movements.filter(m => m.type === 'income').reduce((sum, m) => sum + m.amount, 0).toFixed(2)}
                              </div>
                              <div className="text-sm text-green-700">Entrate</div>
                            </div>
                            <div className="p-3 bg-red-50 rounded-lg">
                              <div className="text-2xl font-bold text-red-600">
                                €{movements.filter(m => m.type === 'expense').reduce((sum, m) => sum + m.amount, 0).toFixed(2)}
                              </div>
                              <div className="text-sm text-red-700">Uscite</div>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <div className="text-2xl font-bold text-blue-600">
                                €{calculateBalance().toFixed(2)}
                              </div>
                              <div className="text-sm text-blue-700">Saldo</div>
                            </div>
                          </div>
                          
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Descrizione</TableHead>
                                <TableHead className="text-right">Importo</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {movements.map((movement) => (
                                <TableRow key={movement.id}>
                                  <TableCell>{movement.date}</TableCell>
                                  <TableCell>
                                    <Badge variant={movement.type === 'income' ? 'default' : 'destructive'}>
                                      {movement.type === 'income' ? 'Entrata' : 'Uscita'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{movement.description}</TableCell>
                                  <TableCell className="text-right">
                                    <span className={movement.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                                      {movement.type === 'income' ? '+' : '-'}€{movement.amount.toFixed(2)}
                                    </span>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-2">Accesso Gestionale Scaduto</h3>
                      <p className="text-gray-600 mb-4">
                        Il periodo di prova di 48 ore è terminato. Acquista un pacchetto per continuare ad utilizzare il mini gestionale.
                      </p>
                      <Button onClick={() => setGestionaleAccess({hasAccess: true, hoursRemaining: 48})}>
                        Acquista Accesso Gestionale
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}