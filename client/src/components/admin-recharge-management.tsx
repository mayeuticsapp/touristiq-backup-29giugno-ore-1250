import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Clock, RefreshCw, CreditCard } from 'lucide-react';

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
  const { toast } = useToast();

  const loadRecharges = async () => {
    try {
      setRefreshing(true);
      const response = await fetch('/api/admin/recharge-requests', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setRecharges(data);
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
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Gestione Ricariche IQCode</CardTitle>
            <CardDescription>
              Approva le richieste di ricarica dei turisti dopo conferma pagamento SumUp
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadRecharges} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {recharges.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nessuna richiesta di ricarica</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recharges.map((recharge) => (
                <div key={recharge.id} className="border rounded-lg p-4">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}