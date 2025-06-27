import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Download, 
  Filter, 
  Calendar, 
  TrendingUp, 
  Euro, 
  Users, 
  BarChart3,
  FileText,
  CreditCard
} from 'lucide-react';

// Categorie predefinite settore turistico
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

interface Movement {
  id: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  date: string;
  paymentMethod: string;
  clientsServed?: number;
  iqcodesUsed?: number;
  notes?: string;
}

interface AdvancedAccountingProps {
  structureCode: string;
  hasAccess: boolean;
}

export function AdvancedAccounting({ structureCode, hasAccess }: AdvancedAccountingProps) {
  const { toast } = useToast();
  
  // Dati demo per testing - in produzione da API
  const [movements, setMovements] = useState<Movement[]>([
    { 
      id: 1, 
      type: 'income', 
      category: 'rooms',
      description: 'Camera doppia superior', 
      amount: 150.00, 
      date: '2025-06-27',
      paymentMethod: 'card',
      clientsServed: 2,
      iqcodesUsed: 1,
      notes: 'Check-in anticipato'
    },
    { 
      id: 2, 
      type: 'expense', 
      category: 'ota_commissions',
      description: 'Commissione Booking.com', 
      amount: 18.75, 
      date: '2025-06-27',
      paymentMethod: 'bank_transfer',
      notes: 'Commissione 12.5%'
    },
    { 
      id: 3, 
      type: 'income', 
      category: 'breakfast',
      description: 'Colazione continentale x2', 
      amount: 25.00, 
      date: '2025-06-26',
      paymentMethod: 'cash',
      clientsServed: 2
    },
    { 
      id: 4, 
      type: 'expense', 
      category: 'cleaning',
      description: 'Servizio pulizie settimanale', 
      amount: 120.00, 
      date: '2025-06-25',
      paymentMethod: 'bank_transfer'
    }
  ]);

  // Stati per filtri
  const [dateFilter, setDateFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form nuovo movimento
  const [newMovement, setNewMovement] = useState({
    type: 'income' as 'income' | 'expense',
    category: 'rooms',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    clientsServed: '',
    iqcodesUsed: '',
    notes: ''
  });

  // Filtri applicati
  const filteredMovements = useMemo(() => {
    return movements.filter(movement => {
      // Filtro tipo
      if (typeFilter !== 'all' && movement.type !== typeFilter) return false;
      
      // Filtro categoria
      if (categoryFilter !== 'all' && movement.category !== categoryFilter) return false;
      
      // Filtro data
      if (dateFilter !== 'all') {
        const movementDate = new Date(movement.date);
        const today = new Date();
        
        switch (dateFilter) {
          case 'today':
            if (movementDate.toDateString() !== today.toDateString()) return false;
            break;
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (movementDate < weekAgo) return false;
            break;
          case 'month':
            const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
            if (movementDate < monthAgo) return false;
            break;
        }
      }
      
      return true;
    });
  }, [movements, dateFilter, categoryFilter, typeFilter]);

  // Calcoli KPI
  const totalIncome = filteredMovements.filter(m => m.type === 'income').reduce((sum, m) => sum + m.amount, 0);
  const totalExpenses = filteredMovements.filter(m => m.type === 'expense').reduce((sum, m) => sum + m.amount, 0);
  const balance = totalIncome - totalExpenses;
  const totalClients = filteredMovements.filter(m => m.clientsServed).reduce((sum, m) => sum + (m.clientsServed || 0), 0);
  const totalIQCodes = filteredMovements.filter(m => m.iqcodesUsed).reduce((sum, m) => sum + (m.iqcodesUsed || 0), 0);
  const averageSpending = totalClients > 0 ? totalIncome / totalClients : 0;

  const handleAddMovement = () => {
    if (!newMovement.description || !newMovement.amount) {
      toast({
        title: "Errore",
        description: "Compila tutti i campi obbligatori",
        variant: "destructive"
      });
      return;
    }

    const movement: Movement = {
      id: movements.length + 1,
      type: newMovement.type,
      category: newMovement.category,
      description: newMovement.description,
      amount: parseFloat(newMovement.amount),
      date: newMovement.date,
      paymentMethod: newMovement.paymentMethod,
      clientsServed: newMovement.clientsServed ? parseInt(newMovement.clientsServed) : undefined,
      iqcodesUsed: newMovement.iqcodesUsed ? parseInt(newMovement.iqcodesUsed) : undefined,
      notes: newMovement.notes || undefined
    };
    
    setMovements([movement, ...movements]);
    setNewMovement({
      type: 'income',
      category: 'rooms',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      clientsServed: '',
      iqcodesUsed: '',
      notes: ''
    });
    setShowAddForm(false);
    
    toast({
      title: "Movimento aggiunto",
      description: "Movimento contabile registrato con successo",
    });
  };

  const getCategoryLabel = (categoryId: string, type: 'income' | 'expense') => {
    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const category = categories.find(cat => cat.id === categoryId);
    return category ? `${category.icon} ${category.label}` : categoryId;
  };

  const getPaymentMethodLabel = (methodId: string) => {
    const method = PAYMENT_METHODS.find(m => m.id === methodId);
    return method ? `${method.icon} ${method.label}` : methodId;
  };

  const exportToCSV = () => {
    const csvData = filteredMovements.map(m => ({
      Data: m.date,
      Tipo: m.type === 'income' ? 'Entrata' : 'Uscita',
      Categoria: getCategoryLabel(m.category, m.type),
      Descrizione: m.description,
      Importo: m.amount,
      Pagamento: getPaymentMethodLabel(m.paymentMethod),
      Clienti: m.clientsServed || '',
      IQCode: m.iqcodesUsed || '',
      Note: m.notes || ''
    }));
    
    const csvString = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gestionale-${structureCode}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export completato",
      description: "Dati esportati in formato CSV",
    });
  };

  if (!hasAccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Mini Gestionale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <BarChart3 className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-gray-600 mb-4">
              Il mini gestionale si attiva automaticamente dopo l'acquisto del primo pacchetto IQCode
            </p>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Funzione sbloccata con primo acquisto
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Entrate Totali</p>
                <p className="text-2xl font-bold text-green-600">€{totalIncome.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Spese Totali</p>
                <p className="text-2xl font-bold text-red-600">€{totalExpenses.toFixed(2)}</p>
              </div>
              <Euro className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Saldo</p>
                <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  €{balance.toFixed(2)}
                </p>
              </div>
              <BarChart3 className={`h-8 w-8 ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clienti Serviti</p>
                <p className="text-2xl font-bold text-blue-600">{totalClients}</p>
                <p className="text-xs text-gray-500">Media: €{averageSpending.toFixed(2)}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtri e Controlli */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtri e Controlli
            </CardTitle>
            <div className="flex gap-2">
              <Button onClick={exportToCSV} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Esporta CSV
              </Button>
              <Button onClick={() => setShowAddForm(!showAddForm)} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nuovo Movimento
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Periodo</Label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i periodi</SelectItem>
                  <SelectItem value="today">Oggi</SelectItem>
                  <SelectItem value="week">Ultima settimana</SelectItem>
                  <SelectItem value="month">Ultimo mese</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipo</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  <SelectItem value="income">Solo Entrate</SelectItem>
                  <SelectItem value="expense">Solo Spese</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Categoria</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le categorie</SelectItem>
                  {INCOME_CATEGORIES.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                  {EXPENSE_CATEGORIES.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Nuovo Movimento */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nuovo Movimento Contabile</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Tipo *</Label>
                <Select value={newMovement.type} onValueChange={(value: 'income' | 'expense') => 
                  setNewMovement({...newMovement, type: value, category: value === 'income' ? 'rooms' : 'ota_commissions'})
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">💰 Entrata</SelectItem>
                    <SelectItem value="expense">💸 Spesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Categoria *</Label>
                <Select value={newMovement.category} onValueChange={(value) => 
                  setNewMovement({...newMovement, category: value})
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(newMovement.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Descrizione *</Label>
                <Input 
                  value={newMovement.description}
                  onChange={(e) => setNewMovement({...newMovement, description: e.target.value})}
                  placeholder="Descrizione del movimento"
                />
              </div>

              <div>
                <Label>Importo (€) *</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={newMovement.amount}
                  onChange={(e) => setNewMovement({...newMovement, amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label>Data *</Label>
                <Input 
                  type="date"
                  value={newMovement.date}
                  onChange={(e) => setNewMovement({...newMovement, date: e.target.value})}
                />
              </div>

              <div>
                <Label>Metodo Pagamento</Label>
                <Select value={newMovement.paymentMethod} onValueChange={(value) => 
                  setNewMovement({...newMovement, paymentMethod: value})
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(method => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.icon} {method.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Clienti Serviti</Label>
                <Input 
                  type="number"
                  value={newMovement.clientsServed}
                  onChange={(e) => setNewMovement({...newMovement, clientsServed: e.target.value})}
                  placeholder="Numero clienti (opzionale)"
                />
              </div>

              <div>
                <Label>IQCode Utilizzati</Label>
                <Input 
                  type="number"
                  value={newMovement.iqcodesUsed}
                  onChange={(e) => setNewMovement({...newMovement, iqcodesUsed: e.target.value})}
                  placeholder="Codici utilizzati (opzionale)"
                />
              </div>

              <div className="md:col-span-2">
                <Label>Note</Label>
                <Textarea 
                  value={newMovement.notes}
                  onChange={(e) => setNewMovement({...newMovement, notes: e.target.value})}
                  placeholder="Note aggiuntive (opzionale)"
                  rows={3}
                />
              </div>

              <div className="md:col-span-2 flex gap-2">
                <Button onClick={handleAddMovement}>
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi Movimento
                </Button>
                <Button variant="outline" onClick={() => setShowAddForm(false)}>
                  Annulla
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabella Movimenti */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Registro Movimenti ({filteredMovements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Descrizione</TableHead>
                <TableHead>Importo</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Clienti</TableHead>
                <TableHead>IQCode</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>{movement.date}</TableCell>
                  <TableCell>
                    <Badge variant={movement.type === 'income' ? 'default' : 'destructive'}>
                      {movement.type === 'income' ? '💰 Entrata' : '💸 Spesa'}
                    </Badge>
                  </TableCell>
                  <TableCell>{getCategoryLabel(movement.category, movement.type)}</TableCell>
                  <TableCell>{movement.description}</TableCell>
                  <TableCell className={movement.type === 'income' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                    €{movement.amount.toFixed(2)}
                  </TableCell>
                  <TableCell>{getPaymentMethodLabel(movement.paymentMethod)}</TableCell>
                  <TableCell>{movement.clientsServed || '-'}</TableCell>
                  <TableCell>{movement.iqcodesUsed || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}