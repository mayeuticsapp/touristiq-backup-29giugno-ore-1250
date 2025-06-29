import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, RefreshCw, CreditCard, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface RechargeRequest {
  id: number;
  validationId: number;
  touristIqCode: string;
  status: 'payment_pending' | 'paid_confirmed' | 'activated';
  requestedAt: string;
  confirmedAt?: string;
  activatedAt?: string;
  adminNote?: string;
}

export function AdminRechargeManagement() {
  const [recharges, setRecharges] = useState<RechargeRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activatingIds, setActivatingIds] = useState<Set<number>>(new Set());
  const [adminNotes, setAdminNotes] = useState<{ [key: number]: string }>({});
  
  // Filtri e ricerca
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  // Paginazione
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 10;
  
  // Statistiche
  const [stats, setStats] = useState({
    pending: 0,
    confirmed: 0,
    activated: 0,
    total: 0
  });
  
  const { toast } = useToast();

  const loadRecharges = async () => {
    try {
      setRefreshing(true);
      
      // Costruisci query parameters per filtri
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        status: statusFilter === 'all' ? '' : statusFilter,
        sort: sortOrder
      });

      const response = await fetch(`/api/admin/recharge-requests?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setRecharges(data.recharges || []);
        setTotalCount(data.total || 0);
        setStats(data.stats || { pending: 0, confirmed: 0, activated: 0, total: 0 });
      } else {
        toast({
          title: "Errore",
          description: "Errore nel caricamento richieste ricarica",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Errore caricamento ricariche:', error);
      toast({
        title: "Errore",
        description: "Errore di connessione",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Effetto per ricaricare quando cambiano i filtri
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset alla prima pagina quando si filtra
      loadRecharges();
    }, 300); // Debounce di 300ms

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, sortOrder]);

  // Effetto per ricaricare quando cambia pagina
  useEffect(() => {
    loadRecharges();
  }, [currentPage]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const handleActivateRecharge = async (rechargeId: number) => {
    try {
      setActivatingIds(prev => new Set(prev).add(rechargeId));
      
      const response = await fetch('/api/admin/activate-recharge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          rechargeId,
          adminNote: adminNotes[rechargeId] || 'Ricarica approvata dall\'admin'
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Ricarica Attivata",
          description: "Utilizzi ripristinati a 10 per il turista"
        });
        loadRecharges();
        setAdminNotes(prev => {
          const newNotes = { ...prev };
          delete newNotes[rechargeId];
          return newNotes;
        });
      } else {
        toast({
          title: "Errore",
          description: data.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore di connessione",
        variant: "destructive"
      });
    } finally {
      setActivatingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(rechargeId);
        return newSet;
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'payment_pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />In Attesa Pagamento</Badge>;
      case 'paid_confirmed':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><CreditCard className="w-3 h-3 mr-1" />Pagamento Confermato</Badge>;
      case 'activated':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Attivata</Badge>;
      default:
        return <Badge variant="outline">Sconosciuto</Badge>;
    }
  };

  useEffect(() => {
    loadRecharges();
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Dashboard Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Attesa</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Confermate</p>
                <p className="text-2xl font-bold text-blue-600">{stats.confirmed}</p>
              </div>
              <CreditCard className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Attivate</p>
                <p className="text-2xl font-bold text-green-600">{stats.activated}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Totale</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <RefreshCw className="w-8 h-8 text-gray-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controlli Filtri e Ricerca */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Gestione Ricariche IQCode</CardTitle>
              <CardDescription>
                Sistema avanzato per gestire migliaia di richieste ricarica
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadRecharges} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Aggiorna
            </Button>
          </div>
          
          {/* Barra Ricerca e Filtri */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cerca per codice turista..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtra per stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                <SelectItem value="payment_pending">In Attesa Pagamento</SelectItem>
                <SelectItem value="paid_confirmed">Pagamento Confermato</SelectItem>
                <SelectItem value="activated">Attivate</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortOrder} onValueChange={(value: 'newest' | 'oldest') => setSortOrder(value)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Ordina per data" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Più Recenti</SelectItem>
                <SelectItem value="oldest">Più Vecchie</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {refreshing ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 mx-auto text-gray-400 mb-4 animate-spin" />
              <p className="text-gray-500">Caricamento richieste...</p>
            </div>
          ) : recharges.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Nessuna richiesta trovata con i filtri applicati' 
                  : 'Nessuna richiesta di ricarica'
                }
              </p>
              {(searchTerm || statusFilter !== 'all') && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                >
                  Rimuovi Filtri
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Risultati e Conteggi */}
              <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
                <div>
                  Risultati {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, totalCount)} di {totalCount}
                </div>
                <div>
                  Pagina {currentPage} di {totalPages}
                </div>
              </div>

              {/* Lista Richieste */}
              <div className="space-y-4">
                {recharges.map((recharge) => (
                  <div key={recharge.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="font-medium">Turista: {recharge.touristIqCode}</div>
                        <div className="text-sm text-gray-600">
                          Richiesta: {new Date(recharge.requestedAt).toLocaleDateString('it-IT', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                      {getStatusBadge(recharge.status)}
                    </div>

                    {recharge.status === 'payment_pending' && (
                      <div className="space-y-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="text-sm text-blue-800">
                            <strong>Azione richiesta:</strong> Verifica che il turista abbia completato il pagamento tramite SumUp
                            <br />
                            <strong>Link pagamento:</strong> https://pay.sumup.com/b2c/QKDFS8FD
                          </div>
                        </div>
                        
                        <Textarea
                          placeholder="Note admin (opzionale)"
                          value={adminNotes[recharge.id] || ''}
                          onChange={(e) => setAdminNotes(prev => ({
                            ...prev,
                            [recharge.id]: e.target.value
                          }))}
                          className="min-h-[60px]"
                        />
                        
                        <Button 
                          onClick={() => handleActivateRecharge(recharge.id)}
                          disabled={activatingIds.has(recharge.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {activatingIds.has(recharge.id) ? (
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          Conferma Pagamento e Attiva 10 Utilizzi
                        </Button>
                      </div>
                    )}

                    {recharge.status === 'activated' && recharge.adminNote && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="text-sm text-green-800">
                          <strong>Note admin:</strong> {recharge.adminNote}
                          <br />
                          <strong>Attivata il:</strong> {recharge.activatedAt ? new Date(recharge.activatedAt).toLocaleDateString('it-IT', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : 'N/A'}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Controlli Paginazione */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      Prima
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center space-x-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="min-w-[40px]"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      Ultima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}