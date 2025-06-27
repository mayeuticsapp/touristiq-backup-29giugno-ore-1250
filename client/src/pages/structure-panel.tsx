import { useState, useEffect } from 'react';
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
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Layout } from '@/components/layout';
import { useToast } from '@/hooks/use-toast';

interface StructurePanelProps {
  structureCode: string;
  structureName: string;
}

// Prezzi dei pacchetti IQCode
const PACKAGE_PRICES = {
  10: "49.90",
  25: "99.90", 
  50: "179.90",
  100: "299.90"
};

export default function StructurePanel({ structureCode, structureName }: StructurePanelProps) {
  const [iqCodesBalance, setIqCodesBalance] = useState(0);
  const [selectedTourist, setSelectedTourist] = useState('');
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
  const { toast } = useToast();

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
      setAvailableCodes(['TIQ-IT-MARE', 'TIQ-IT-SOLE', 'TIQ-IT-LUNA']);
      
      // Carico movimenti contabili esistenti
      const savedMovements = localStorage.getItem(`movements_${structureCode}`);
      if (savedMovements) {
        setMovements(JSON.parse(savedMovements));
      }
    } catch (error) {
      console.error('Errore caricamento dati struttura:', error);
    }
  };

  const handlePurchasePackage = async (packageSize: number) => {
    const price = PACKAGE_PRICES[packageSize as keyof typeof PACKAGE_PRICES];
    
    // Simulazione acquisto con SumUp (da implementare)
    const confirmed = window.confirm(
      `Confermi l'acquisto di ${packageSize} IQCode per €${price}?\n\n` +
      `Verrai reindirizzato a SumUp per il pagamento.`
    );
    
    if (confirmed) {
      // Qui andrà l'integrazione SumUp reale
      toast({
        title: "Acquisto simulato",
        description: `${packageSize} IQCode aggiunti al tuo saldo. Integrazione SumUp in arrivo.`,
      });
      
      setIqCodesBalance(prev => prev + packageSize);
      
      // Genera nuovi codici disponibili
      const newCodes = Array.from({ length: packageSize }, (_, i) => 
        `TIQ-IT-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
      );
      setAvailableCodes(prev => [...prev, ...newCodes]);
    }
  };

  const handleSendWhatsApp = () => {
    if (!selectedCode || !selectedTourist.trim()) {
      toast({
        title: "Campi mancanti",
        description: "Seleziona un codice e inserisci il nome del turista",
        variant: "destructive"
      });
      return;
    }

    const message = `Benvenuto ${selectedTourist}! Il tuo codice TouristIQ è: ${selectedCode}. Usa questo codice per accedere a sconti esclusivi nella zona!`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    
    // Rimuovi il codice dalla lista disponibili
    setAvailableCodes(prev => prev.filter(code => code !== selectedCode));
    setIqCodesBalance(prev => prev - 1);
    setSelectedCode('');
    setSelectedTourist('');
    
    toast({
      title: "Codice assegnato",
      description: "WhatsApp aperto per l'invio. Codice rimosso dal saldo.",
    });
  };

  const handleCopyCode = () => {
    if (!selectedCode) return;
    
    navigator.clipboard.writeText(selectedCode);
    toast({
      title: "Codice copiato",
      description: "Il codice è stato copiato negli appunti",
    });
  };

  const addMovement = () => {
    if (!newMovement.description || !newMovement.amount) {
      toast({
        title: "Campi obbligatori",
        description: "Inserisci descrizione e importo",
        variant: "destructive"
      });
      return;
    }

    const movement = {
      id: Date.now(),
      ...newMovement,
      amount: parseFloat(newMovement.amount)
    };

    const updatedMovements = [...movements, movement];
    setMovements(updatedMovements);
    
    // Salva in localStorage
    localStorage.setItem(`movements_${structureCode}`, JSON.stringify(updatedMovements));
    
    setNewMovement({
      type: 'income',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0]
    });

    toast({
      title: "Movimento aggiunto",
      description: "Il movimento è stato registrato con successo",
    });
  };

  const calculateSummary = () => {
    const income = movements.filter(m => m.type === 'income').reduce((sum, m) => sum + m.amount, 0);
    const expenses = movements.filter(m => m.type === 'expense').reduce((sum, m) => sum + m.amount, 0);
    return { income, expenses, balance: income - expenses };
  };

  const { income, expenses, balance } = calculateSummary();

  return (
    <Layout
      title={`Pannello Struttura - ${structureName}`}
      role="structure"
      iqCode={structureCode}
      navigation={navigation}
      sidebarColor="bg-purple-600"
    >
      <div className="space-y-6">
        {/* Header con saldo IQCode */}
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">IQCode Disponibili</h2>
                <p className="text-purple-100">Saldo attuale per distribuzione turisti</p>
              </div>
              <div className="text-4xl font-bold">
                {iqCodesBalance}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="packages" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="packages">🎟 Acquista Pacchetti</TabsTrigger>
            <TabsTrigger value="assign">📲 Assegna Codici</TabsTrigger>
            <TabsTrigger value="accounting">📊 Mini Gestionale</TabsTrigger>
          </TabsList>

          {/* TAB 1: ACQUISTO PACCHETTI */}
          <TabsContent value="packages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package size={20} />
                  Pacchetti IQCode Disponibili
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Acquista pacchetti di IQCode da distribuire ai tuoi ospiti
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(PACKAGE_PRICES).map(([size, price]) => (
                    <Card key={size} className="border-2 hover:border-purple-500 transition-colors">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600 mb-2">
                          {size} IQCode
                        </div>
                        <div className="text-xl font-semibold mb-4">
                          €{price}
                        </div>
                        <Button 
                          onClick={() => handlePurchasePackage(parseInt(size))}
                          className="w-full"
                          variant="outline"
                        >
                          <ShoppingCart size={16} className="mr-2" />
                          Acquista Ora
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">💳 Pagamento Sicuro con SumUp</h4>
                  <p className="text-sm text-blue-700">
                    I pagamenti sono gestiti tramite SumUp. Accettiamo tutte le principali carte di credito e debito.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: ASSEGNAZIONE CODICI */}
          <TabsContent value="assign" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle size={20} />
                  Assegna e Invia IQCode
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Assegna un codice IQ al turista e invialo via WhatsApp
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tourist">Nome Turista</Label>
                    <Input
                      id="tourist"
                      value={selectedTourist}
                      onChange={(e) => setSelectedTourist(e.target.value)}
                      placeholder="Es: Mario Rossi"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="code">Codice IQ Disponibile</Label>
                    <Select value={selectedCode} onValueChange={setSelectedCode}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona un codice" />
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
                </div>

                <Separator />

                <div className="flex gap-3">
                  <Button 
                    onClick={handleSendWhatsApp}
                    className="flex-1"
                    disabled={!selectedCode || !selectedTourist.trim()}
                  >
                    <MessageCircle size={16} className="mr-2" />
                    Invia su WhatsApp
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={handleCopyCode}
                    disabled={!selectedCode}
                  >
                    <Copy size={16} className="mr-2" />
                    Copia Codice
                  </Button>
                </div>

                <div className="mt-4 p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">📱 Come Funziona</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Seleziona un codice dalla lista dei disponibili</li>
                    <li>• Inserisci il nome del turista (opzionale)</li>
                    <li>• Clicca "Invia su WhatsApp" per aprire il messaggio precompilato</li>
                    <li>• Il codice verrà automaticamente rimosso dal tuo saldo</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: MINI GESTIONALE */}
          <TabsContent value="accounting" className="space-y-6">
            {!gestionaleAccess.hasAccess ? (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="mx-auto mb-4 text-orange-500" size={48} />
                  <h3 className="text-xl font-semibold text-orange-800 mb-2">
                    Gestionale Bloccato
                  </h3>
                  <p className="text-orange-700 mb-4">
                    Il mini gestionale si blocca dopo 48 ore senza acquisto di pacchetti IQCode.
                    Acquista un pacchetto per sbloccarlo.
                  </p>
                  <Button onClick={() => setGestionaleAccess({ hasAccess: true, hoursRemaining: 48 })}>
                    Vai ai Pacchetti
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Avviso tempo rimanente */}
                {gestionaleAccess.hoursRemaining! < 48 && (
                  <Card className="border-yellow-200 bg-yellow-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="text-yellow-600" size={20} />
                        <span className="text-yellow-800">
                          Il gestionale si bloccherà tra {gestionaleAccess.hoursRemaining} ore senza acquisto pacchetti
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Riepilogo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-green-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-green-600">Entrate</p>
                          <p className="text-2xl font-bold text-green-800">€{income.toFixed(2)}</p>
                        </div>
                        <Plus className="text-green-600" size={24} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-red-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-red-600">Uscite</p>
                          <p className="text-2xl font-bold text-red-800">€{expenses.toFixed(2)}</p>
                        </div>
                        <Minus className="text-red-600" size={24} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={balance >= 0 ? "bg-blue-50" : "bg-orange-50"}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Saldo</p>
                          <p className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                            €{balance.toFixed(2)}
                          </p>
                        </div>
                        <Euro className="text-gray-600" size={24} />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Form Nuovo Movimento */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus size={20} />
                      Aggiungi Movimento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="type">Tipo</Label>
                        <Select value={newMovement.type} onValueChange={(value) => setNewMovement({...newMovement, type: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="income">Entrata</SelectItem>
                            <SelectItem value="expense">Uscita</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="description">Descrizione</Label>
                        <Input
                          id="description"
                          value={newMovement.description}
                          onChange={(e) => setNewMovement({...newMovement, description: e.target.value})}
                          placeholder="Es: Prenotazione camera"
                        />
                      </div>

                      <div>
                        <Label htmlFor="amount">Importo (€)</Label>
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          value={newMovement.amount}
                          onChange={(e) => setNewMovement({...newMovement, amount: e.target.value})}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="flex items-end">
                        <Button onClick={addMovement} className="w-full">
                          Aggiungi
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabella Movimenti */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText size={20} />
                      Elenco Movimenti
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
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
                        {movements.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-gray-500">
                              Nessun movimento registrato
                            </TableCell>
                          </TableRow>
                        ) : (
                          movements.map((movement) => (
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
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}