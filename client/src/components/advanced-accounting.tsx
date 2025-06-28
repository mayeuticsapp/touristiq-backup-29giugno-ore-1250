import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
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
  CreditCard,
  Edit,
  Trash2
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
  const queryClient = useQueryClient();
  
  // Fetch movements from database
  const { data: movements = [], isLoading } = useQuery<Movement[]>({
    queryKey: ['/api/accounting/movements'],
    enabled: hasAccess
  });

  // States for form and editing
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showNewMovementForm, setShowNewMovementForm] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    type: 'income' as 'income' | 'expense',
    category: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    clientsServed: '',
    iqcodesUsed: '',
    notes: ''
  });

  // Create movement mutation
  const createMovementMutation = useMutation({
    mutationFn: async (movementData: any) => {
      const response = await fetch('/api/accounting/movements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: movementData.type,
          category: movementData.category,
          description: movementData.description,
          amount: parseFloat(movementData.amount),
          movementDate: movementData.date,
          paymentMethod: movementData.paymentMethod,
          clientsServed: movementData.clientsServed ? parseInt(movementData.clientsServed) : null,
          iqcodesUsed: movementData.iqcodesUsed ? parseInt(movementData.iqcodesUsed) : null,
          notes: movementData.notes
        })
      });
      
      if (!response.ok) {
        throw new Error('Errore durante la creazione del movimento');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/movements'] });
      resetForm();
      setShowNewMovementForm(false);
      toast({
        title: "Movimento creato!",
        description: "Il movimento contabile è stato salvato nel database.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante la creazione del movimento.",
        variant: "destructive"
      });
    }
  });

  // Update movement mutation
  const updateMovementMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const response = await fetch(`/api/accounting/movements/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: data.type,
          category: data.category,
          description: data.description,
          amount: parseFloat(data.amount),
          movementDate: data.date,
          paymentMethod: data.paymentMethod,
          clientsServed: data.clientsServed ? parseInt(data.clientsServed) : null,
          iqcodesUsed: data.iqcodesUsed ? parseInt(data.iqcodesUsed) : null,
          notes: data.notes
        })
      });
      
      if (!response.ok) {
        throw new Error('Errore durante l\'aggiornamento del movimento');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/movements'] });
      setIsEditDialogOpen(false);
      setEditingMovement(null);
      toast({
        title: "Movimento aggiornato!",
        description: "Le modifiche sono state salvate nel database.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'aggiornamento del movimento.",
        variant: "destructive"
      });
    }
  });

  // Delete movement mutation
  const deleteMovementMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/accounting/movements/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Errore durante l\'eliminazione del movimento');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/accounting/movements'] });
      toast({
        title: "Movimento eliminato!",
        description: "Il movimento è stato rimosso dal database.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'eliminazione del movimento.",
        variant: "destructive"
      });
    }
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      type: 'income',
      category: '',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
      clientsServed: '',
      iqcodesUsed: '',
      notes: ''
    });
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category || !formData.description || !formData.amount) {
      toast({
        title: "Campi mancanti",
        description: "Compila tutti i campi obbligatori.",
        variant: "destructive"
      });
      return;
    }
    createMovementMutation.mutate(formData);
  };

  // Handle edit movement
  const handleEditMovement = (movement: Movement) => {
    setEditingMovement(movement);
    setFormData({
      type: movement.type,
      category: movement.category,
      description: movement.description,
      amount: movement.amount.toString(),
      date: movement.date,
      paymentMethod: movement.paymentMethod,
      clientsServed: movement.clientsServed?.toString() || '',
      iqcodesUsed: movement.iqcodesUsed?.toString() || '',
      notes: movement.notes || ''
    });
    setIsEditDialogOpen(true);
  };

  // Handle update movement
  const handleUpdateMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMovement) return;
    
    updateMovementMutation.mutate({
      id: editingMovement.id,
      data: formData
    });
  };

  // Calculate totals
  const summary = useMemo(() => {
    const income = movements
      .filter((m: Movement) => m.type === 'income')
      .reduce((sum: number, m: Movement) => sum + parseFloat(m.amount.toString()), 0);
    
    const expenses = movements
      .filter((m: Movement) => m.type === 'expense')
      .reduce((sum: number, m: Movement) => sum + parseFloat(m.amount.toString()), 0);
    
    const clientsServed = movements
      .reduce((sum: number, m: Movement) => sum + (m.clientsServed || 0), 0);
    
    return {
      income,
      expenses,
      balance: income - expenses,
      clientsServed
    };
  }, [movements]);

  if (!hasAccess) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Accesso Limitato</h3>
          <p className="text-gray-600">Acquista più IQCode per accedere al mini gestionale.</p>
        </CardContent>
      </Card>
    );
  }

  const currentCategories = formData.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Entrate Totali</p>
                <p className="text-2xl font-bold text-green-600">€{summary.income.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Euro className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Spese Totali</p>
                <p className="text-2xl font-bold text-red-600">€{summary.expenses.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Saldo</p>
                <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  €{summary.balance.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Clienti Serviti</p>
                <p className="text-2xl font-bold text-purple-600">{summary.clientsServed}</p>
                <p className="text-xs text-gray-500">Media: €{summary.clientsServed > 0 ? (summary.income / summary.clientsServed).toFixed(2) : '0.00'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtri e Controlli
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Esporta CSV
          </Button>
        </div>
        <Button onClick={() => setShowNewMovementForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Movimento
        </Button>
      </div>

      {/* New Movement Form */}
      {showNewMovementForm && (
        <Card>
          <CardHeader>
            <CardTitle>Nuovo Movimento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Tipo *</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value as 'income' | 'expense', category: ''})}>
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
                  <Label htmlFor="category">Categoria *</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {currentCategories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.icon} {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="description">Descrizione *</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Descrizione movimento"
                  />
                </div>

                <div>
                  <Label htmlFor="amount">Importo *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="date">Data</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>

                <div>
                  <Label htmlFor="paymentMethod">Metodo Pagamento</Label>
                  <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({...formData, paymentMethod: value})}>
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
                  <Label htmlFor="clientsServed">Clienti Serviti</Label>
                  <Input
                    type="number"
                    value={formData.clientsServed}
                    onChange={(e) => setFormData({...formData, clientsServed: e.target.value})}
                    placeholder="Numero clienti"
                  />
                </div>

                <div>
                  <Label htmlFor="iqcodesUsed">IQCode Utilizzati</Label>
                  <Input
                    type="number"
                    value={formData.iqcodesUsed}
                    onChange={(e) => setFormData({...formData, iqcodesUsed: e.target.value})}
                    placeholder="Numero codici"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Note</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Note aggiuntive..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createMovementMutation.isPending}>
                  {createMovementMutation.isPending ? 'Salvando...' : 'Salva Movimento'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowNewMovementForm(false)}>
                  Annulla
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Movements Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Registro Movimenti ({movements.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Caricamento movimenti...</div>
          ) : movements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nessun movimento registrato. Aggiungi il primo movimento.
            </div>
          ) : (
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
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.map((movement: any) => (
                  <TableRow key={movement.id}>
                    <TableCell>{new Date(movement.movementDate).toLocaleDateString('it-IT')}</TableCell>
                    <TableCell>
                      <Badge variant={movement.type === 'income' ? 'default' : 'destructive'}>
                        {movement.type === 'income' ? '💰 Entrata' : '💸 Spesa'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {currentCategories.find(cat => cat.id === movement.category)?.icon} {currentCategories.find(cat => cat.id === movement.category)?.label}
                    </TableCell>
                    <TableCell>{movement.description}</TableCell>
                    <TableCell className={movement.type === 'income' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      €{parseFloat(movement.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {PAYMENT_METHODS.find(method => method.id === movement.paymentMethod)?.icon} {PAYMENT_METHODS.find(method => method.id === movement.paymentMethod)?.label}
                    </TableCell>
                    <TableCell>{movement.clientsServed || '-'}</TableCell>
                    <TableCell>{movement.iqcodesUsed || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => handleEditMovement(movement)}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => deleteMovementMutation.mutate(movement.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifica Movimento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateMovement} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Tipo *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value as 'income' | 'expense', category: ''})}>
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
                <Label htmlFor="category">Categoria *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Descrizione *</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descrizione movimento"
                />
              </div>

              <div>
                <Label htmlFor="amount">Importo *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="date">Data</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="paymentMethod">Metodo Pagamento</Label>
                <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({...formData, paymentMethod: value})}>
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
                <Label htmlFor="clientsServed">Clienti Serviti</Label>
                <Input
                  type="number"
                  value={formData.clientsServed}
                  onChange={(e) => setFormData({...formData, clientsServed: e.target.value})}
                  placeholder="Numero clienti"
                />
              </div>

              <div>
                <Label htmlFor="iqcodesUsed">IQCode Utilizzati</Label>
                <Input
                  type="number"
                  value={formData.iqcodesUsed}
                  onChange={(e) => setFormData({...formData, iqcodesUsed: e.target.value})}
                  placeholder="Numero codici"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Note</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Note aggiuntive..."
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={updateMovementMutation.isPending}>
                {updateMovementMutation.isPending ? 'Salvando...' : 'Salva Modifiche'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Annulla
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}