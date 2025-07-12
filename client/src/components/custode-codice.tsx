import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Check, Edit, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CustodeCodiceDashboardProps {
  roleType: "structure" | "partner";
  iqCode?: string;
  className?: string;
}

export function CustodeCodiceDashboard({ roleType, iqCode, className = "" }: CustodeCodiceDashboardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCustodeDialog, setShowCustodeDialog] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [secretWord, setSecretWord] = useState("");
  const [birthDate, setBirthDate] = useState("");

  // Verifica stato Custode del Codice
  const { data: custodeStatus } = useQuery({
    queryKey: ['/api/check-custode-status'],
    enabled: !!iqCode
  });

  // Mutation per attivare il Custode del Codice
  const activateCustode = useMutation({
    mutationFn: async () => {
      if (!secretWord.trim() || !birthDate) {
        throw new Error("Compila tutti i campi obbligatori");
      }

      const response = await fetch('/api/activate-custode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          secretWord: secretWord.trim(),
          birthDate: birthDate
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Errore durante l\'attivazione');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Custode del Codice Attivato!",
        description: "I tuoi dati di recupero sono stati salvati in modo sicuro e anonimo.",
      });
      setShowCustodeDialog(false);
      setSecretWord("");
      setBirthDate("");
      queryClient.invalidateQueries({ queryKey: ['/api/check-custode-status'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Errore Attivazione",
        description: error.message || "Si è verificato un errore durante l'attivazione.",
      });
    }
  });

  // Mutation per aggiornare i dati del Custode del Codice
  const updateCustode = useMutation({
    mutationFn: async () => {
      if (!secretWord.trim() || !birthDate) {
        throw new Error("Compila tutti i campi obbligatori");
      }

      const response = await fetch('/api/update-custode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          secretWord: secretWord.trim(),
          birthDate: birthDate
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Errore durante l\'aggiornamento');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Custode del Codice Aggiornato!",
        description: "Dati aggiornati correttamente. Ricorda che non possiamo recuperare queste informazioni: custodiscile bene!",
      });
      setShowUpdateDialog(false);
      setSecretWord("");
      setBirthDate("");
      queryClient.invalidateQueries({ queryKey: ['/api/check-custode-status'] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Errore Aggiornamento",
        description: error.message || "Si è verificato un errore durante l'aggiornamento.",
      });
    }
  });

  const handleActivateCustode = () => {
    activateCustode.mutate();
  };

  const handleUpdateCustode = () => {
    updateCustode.mutate();
  };

  const formatActivationDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('it-IT');
    } catch {
      return dateString;
    }
  };



  return (
    <>
      <Card className={`border-blue-200 bg-blue-50 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Custode del Codice</h3>
                <p className="text-sm text-gray-600">
                  Proteggi il tuo accesso con un sistema di recupero sicuro
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(custodeStatus as any)?.hasRecoveryData ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">Custode già attivato</span>
                  </div>
                  <Button
                    onClick={() => setShowUpdateDialog(true)}
                    variant="outline"
                    size="sm"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Gestisci Custode del Codice
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setShowCustodeDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Attiva il Custode del Codice
                </Button>
              )}
            </div>
          </div>

          {(custodeStatus as any)?.hasRecoveryData && (custodeStatus as any)?.activatedAt && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Custode attivato il:</strong> {formatActivationDate((custodeStatus as any).activatedAt)}
              </p>
              <p className="text-xs text-green-700 mt-1">
                Potrai recuperare il tuo IQCode inserendo la parola segreta e la data dalla pagina di login.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Attivazione Custode del Codice */}
      <Dialog open={showCustodeDialog} onOpenChange={setShowCustodeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Attiva il Custode del Codice
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">🛡️ Cos'è il Custode del Codice?</h4>
              <p className="text-sm text-blue-800 mb-3">
                <strong>Il Custode del Codice è la nostra innovazione per la tua sicurezza.</strong> 
                Un sistema di recupero completamente anonimo che protegge il tuo accesso senza compromettere la privacy.
              </p>
              
              <h5 className="font-semibold text-blue-900 mb-2">🔧 Come funziona:</h5>
              <ul className="text-sm text-blue-800 space-y-1.5">
                <li>• <strong>Scegli una parola segreta</strong> che ricorderai facilmente</li>
                <li>• <strong>Inserisci una data di nascita</strong> (anche inventata, basta che la ricordi)</li>
                <li>• <strong>I dati vengono criptati</strong> e salvati in modo completamente anonimo</li>
                <li>• <strong>Potrai recuperare il tuo IQCode</strong> dalla pagina di login quando serve</li>
                <li>• <strong>Nessun dato personale richiesto:</strong> no email, no telefono, no documenti</li>
              </ul>
              
              <div className="mt-3 p-2 bg-blue-100 rounded border border-blue-300">
                <p className="text-xs text-blue-900">
                  <strong>⚠️ Importante:</strong> I dati vengono criptati con hash irreversibile. 
                  Non possiamo recuperarli per te - custodiscili bene!
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="secretWord">Parola Segreta *</Label>
                <Input
                  id="secretWord"
                  type="text"
                  value={secretWord}
                  onChange={(e) => setSecretWord(e.target.value)}
                  placeholder="Es: vacanze2024, famiglia, libertà..."
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Scegli una parola che ricorderai sempre
                </p>
              </div>

              <div>
                <Label htmlFor="birthDate">Data di Nascita *</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Anche una data simbolica va bene
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                <strong>Importante:</strong> Ricorda questi dati! Non li salviamo in chiaro 
                e non possiamo recuperarli per te.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCustodeDialog(false);
                  setSecretWord("");
                  setBirthDate("");
                }}
                className="flex-1"
              >
                Annulla
              </Button>
              <Button
                onClick={handleActivateCustode}
                disabled={!secretWord.trim() || !birthDate || activateCustode.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {activateCustode.isPending ? "Attivazione..." : "Attiva Custode"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifica Custode del Codice */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              Modifica Custode del Codice
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-gray-600 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <strong>Attenzione:</strong> Modificando questi dati, i vecchi dati di recupero non funzioneranno più. 
              Ricorda che non possiamo recuperare queste informazioni: custodiscile bene!
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="update-secret-word" className="text-sm font-medium">
                  Nuova Parola Segreta *
                </Label>
                <Input
                  id="update-secret-word"
                  type="text"
                  placeholder="Inserisci una nuova parola segreta"
                  value={secretWord}
                  onChange={(e) => setSecretWord(e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="update-birth-date" className="text-sm font-medium">
                  Nuova Data di Nascita *
                </Label>
                <Input
                  id="update-birth-date"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowUpdateDialog(false);
                  setSecretWord("");
                  setBirthDate("");
                }}
                className="flex-1"
              >
                Annulla
              </Button>
              <Button
                onClick={handleUpdateCustode}
                disabled={!secretWord.trim() || !birthDate || updateCustode.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {updateCustode.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Aggiornamento...
                  </>
                ) : (
                  "Aggiorna Custode"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}