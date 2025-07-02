import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock, Users, RefreshCw } from 'lucide-react';

interface ValidationRequest {
  id: number;
  touristIqCode: string;
  partnerName: string;
  status: 'pending' | 'accepted' | 'rejected';
  requestedAt: string;
  respondedAt?: string;
  usesRemaining: number;
  usesTotal: number;
}

interface IQCodeValidationProps {
  userRole: 'partner' | 'tourist';
}

export function IQCodeValidation({ userRole }: IQCodeValidationProps) {
  const [touristCode, setTouristCode] = useState('');
  const [validations, setValidations] = useState<ValidationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const loadValidations = async () => {
    try {
      setRefreshing(true);
      const endpoint = userRole === 'partner' 
        ? '/api/iqcode/validation-status' 
        : '/api/iqcode/validation-requests';
      
      const response = await fetch(endpoint, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setValidations(data);
      } else {
        // Log error for debugging but don't show toast for expected role restrictions
        const errorData = await response.json();
        console.error('Errore caricamento validazioni:', errorData.message);
        setValidations([]);
      }
    } catch (error) {
      console.error('Errore caricamento validazioni:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadValidations();
  }, [userRole]);

  const handleValidationRequest = async () => {
    if (!touristCode.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci un codice IQ turista",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/iqcode/validate-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ touristIqCode: touristCode })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Richiesta Inviata!",
          description: data.message
        });
        setTouristCode('');
        loadValidations();
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
      setLoading(false);
    }
  };

  const handleValidationResponse = async (validationId: number, status: 'accepted' | 'rejected') => {
    try {
      const response = await fetch('/api/iqcode/validate-response', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ validationId, status })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: status === 'accepted' ? "IQCode Confermato" : "IQCode Rifiutato",
          description: data.message
        });
        loadValidations();
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
    }
  };

  const handleUseValidatedCode = async (validationId: number) => {
    try {
      const response = await fetch('/api/iqcode/use-validated', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ validationId })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "IQCode Utilizzato",
          description: `${data.message}. Utilizzi rimanenti: ${data.usesRemaining}`
        });
        loadValidations();
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
    }
  };

  const handleRechargeRequest = async (validationId: number) => {
    // Apri il link SumUp per il pagamento
    window.open('https://pay.sumup.com/b2c/QKDFS8FD', '_blank');
    
    toast({
      title: "Ricarica Richiesta",
      description: "Dopo il pagamento, l'admin attiverà i tuoi nuovi utilizzi. Controlla periodicamente lo stato."
    });

    // Crea richiesta di ricarica nel database
    try {
      await fetch('/api/iqcode/request-recharge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ validationId })
      });
    } catch (error) {
      console.error('Errore creazione richiesta ricarica:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />In Attesa</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Accettato</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Rifiutato</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (userRole === 'partner') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Validazione IQCode Turista
            </CardTitle>
            <CardDescription>
              Inserisci il codice IQ del turista per richiedere la validazione prima dell'utilizzo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Es: TIQ-IT-ROMA123"
                value={touristCode}
                onChange={(e) => setTouristCode(e.target.value.toUpperCase())}
                className="flex-1"
                maxLength={100}
              />
              <Button 
                onClick={handleValidationRequest}
                disabled={loading || !touristCode.trim()}
              >
                {loading ? "Invio..." : "Richiedi Validazione"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Richieste di Validazione</CardTitle>
              <CardDescription>
                Stato delle tue richieste di validazione IQCode
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadValidations} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent>
            {validations.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nessuna richiesta di validazione</p>
            ) : (
              <div className="space-y-3">
                {validations.map((validation) => (
                  <div key={validation.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">Codice: {validation.touristIqCode}</div>
                      {getStatusBadge(validation.status)}
                    </div>
                    <div className="text-sm text-gray-600 mb-3">
                      Richiesta: {new Date(validation.requestedAt).toLocaleDateString('it-IT')}
                      {validation.respondedAt && (
                        <> • Risposta: {new Date(validation.respondedAt).toLocaleDateString('it-IT')}</>
                      )}
                    </div>
                    {validation.status === 'accepted' && (
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="font-medium">{validation.usesRemaining} utilizzi rimanenti</span> (su {validation.usesTotal} totali)
                        </div>
                        {validation.usesRemaining > 0 ? (
                          <Button 
                            size="sm" 
                            onClick={() => handleUseValidatedCode(validation.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Utilizza IQCode
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            onClick={() => handleRechargeRequest(validation.id)}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            Ricarica 10 Utilizzi
                          </Button>
                        )}
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

  // Vista per i turisti
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Richieste di Validazione
            </CardTitle>
            <CardDescription>
              I partner richiedono di validare il tuo IQCode prima dell'utilizzo
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadValidations} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {validations.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Nessuna richiesta di validazione</p>
          ) : (
            <div className="space-y-3">
              {validations.map((validation) => (
                <div key={validation.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{validation.partnerName}</div>
                    {getStatusBadge(validation.status)}
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    Richiesta: {new Date(validation.requestedAt).toLocaleDateString('it-IT')}
                  </div>
                  {validation.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleValidationResponse(validation.id, 'accepted')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Accetta
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleValidationResponse(validation.id, 'rejected')}
                        className="border-red-200 text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Rifiuta
                      </Button>
                    </div>
                  )}
                  {validation.status === 'accepted' && (
                    <div className="text-sm text-green-700 bg-green-50 p-2 rounded">
                      ✓ IQCode accettato presso {validation.partnerName} • <span className="font-medium">{validation.usesRemaining} utilizzi rimanenti</span> (su {validation.usesTotal} totali)
                    </div>
                  )}
                  {validation.status === 'rejected' && (
                    <div className="text-sm text-red-700 bg-red-50 p-2 rounded">
                      ✗ IQCode rifiutato
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