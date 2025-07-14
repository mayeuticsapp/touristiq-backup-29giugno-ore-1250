import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Info, Users, Shield, Clock, CreditCard, CheckCircle, XCircle, HelpCircle } from "lucide-react";

interface InfoCodiciTemporaneiModalProps {
  trigger?: React.ReactNode;
}

export function InfoCodiciTemporaneiModal({ trigger }: InfoCodiciTemporaneiModalProps) {
  const defaultTrigger = (
    <Button variant="outline" size="sm" className="bg-blue-50 hover:bg-blue-100 border-blue-200">
      <HelpCircle className="w-4 h-4 mr-2" />
      Come Funziona?
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="w-6 h-6 text-blue-600" />
            Sistema Codici Temporanei TouristIQ - Guida Completa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* AVVERTENZA PRINCIPALE */}
          <Card className="border-2 border-red-200 bg-red-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="w-5 h-5" />
                ⚠️ ATTENZIONE: OPERAZIONE IRREVERSIBILE
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-white p-4 rounded-lg border border-red-200">
                <p className="font-semibold text-red-900 mb-2">
                  Ogni generazione di codice temporaneo è DEFINITIVA e NON RIMBORSABILE:
                </p>
                <ul className="space-y-1 text-sm text-red-800">
                  <li>✗ I crediti vengono scalati immediatamente dal tuo pacchetto</li>
                  <li>✗ Non è possibile annullare o recuperare crediti utilizzati</li>
                  <li>✗ Anche se l'ospite non usa il codice, il credito rimane consumato</li>
                  <li>✗ Non esistono rimborsi per errori di generazione</li>
                </ul>
              </div>
              <p className="text-sm text-red-700 font-medium">
                💡 <strong>Regola d'oro</strong>: Genera il codice solo quando l'ospite è fisicamente presente e ha confermato di voler creare un account TouristIQ.
              </p>
            </CardContent>
          </Card>

          {/* PROCESSO PASSO-PASSO */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Come Funziona il Sistema Privacy-First
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex gap-3">
                  <Badge className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center">1</Badge>
                  <div>
                    <h4 className="font-semibold">Ospite richiede accesso TouristIQ</h4>
                    <p className="text-sm text-gray-600">L'ospite manifesta interesse per il sistema sconti turistici della Calabria</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center">2</Badge>
                  <div>
                    <h4 className="font-semibold">Tu generi il codice temporaneo</h4>
                    <p className="text-sm text-gray-600">Inserisci nome ospite → Click "Genera" → <strong>Credito scalato immediatamente</strong></p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-purple-100 text-purple-800 rounded-full w-8 h-8 flex items-center justify-center">3</Badge>
                  <div>
                    <h4 className="font-semibold">Ospite riceve codice IQCODE-PRIMOACCESSO-XXXXX</h4>
                    <p className="text-sm text-gray-600">Codice senza scadenza che l'ospite può usare quando vuole</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-amber-100 text-amber-800 rounded-full w-8 h-8 flex items-center justify-center">4</Badge>
                  <div>
                    <h4 className="font-semibold">Ospite attiva il suo account personale</h4>
                    <p className="text-sm text-gray-600">Crea il suo IQCode definitivo (es: TIQ-IT-9876-MARE) e inizia a risparmiare</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* VANTAGGI DEL SISTEMA */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  Vantaggi per la Struttura
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>• <strong>Privacy totale</strong>: Nessun IQCode reale viene mai esposto</p>
                <p>• <strong>Controllo qualità</strong>: Solo ospiti verificati accedono al sistema</p>
                <p>• <strong>Tracciabilità</strong>: Ogni codice è collegato alla tua struttura</p>
                <p>• <strong>Fidelizzazione</strong>: Ospiti soddisfatti tornano e consigliano</p>
              </CardContent>
            </Card>

            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Shield className="w-5 h-5" />
                  Vantaggi per l'Ospite
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>• <strong>Sconti esclusivi</strong>: Accesso a partner selezionati in Calabria</p>
                <p>• <strong>TIQai assistente</strong>: AI guida personalizzata per scoperte</p>
                <p>• <strong>Privacy garantita</strong>: Nessun dato personale richiesto</p>
                <p>• <strong>Validità perpetua</strong>: IQCode senza scadenza</p>
              </CardContent>
            </Card>
          </div>

          {/* COSTI E GESTIONE */}
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <CreditCard className="w-5 h-5" />
                Gestione Crediti e Costi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-amber-900">📦 Pacchetti Disponibili</h4>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• Pacchetto 25 crediti</li>
                    <li>• Pacchetto 50 crediti</li>
                    <li>• Pacchetto 75 crediti</li>
                    <li>• Pacchetto 100 crediti</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-amber-900">💳 Consumo Crediti</h4>
                  <ul className="text-sm text-amber-800 space-y-1">
                    <li>• 1 credito = 1 codice temporaneo</li>
                    <li>• Scalato immediatamente alla generazione</li>
                    <li>• Crediti finiti = nessuna generazione possibile</li>
                    <li>• Ricarica tramite admin TouristIQ</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MIGLIORI PRATICHE */}
          <Card className="border-indigo-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-700">
                <Info className="w-5 h-5" />
                Migliori Pratiche Operative
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-indigo-900">✅ FAI SEMPRE:</p>
                <ul className="space-y-1 text-indigo-800 ml-4">
                  <li>• Spiega i vantaggi TouristIQ all'ospite prima di generare</li>
                  <li>• Conferma che l'ospite vuole davvero un account</li>
                  <li>• Inserisci il nome corretto (sarà visibile nell'account)</li>
                  <li>• Consegna immediatamente il codice generato</li>
                </ul>
                
                <p className="font-semibold text-indigo-900 mt-3">❌ NON FARE MAI:</p>
                <ul className="space-y-1 text-indigo-800 ml-4">
                  <li>• Generare codici "per test" o "per prova"</li>
                  <li>• Creare codici senza conferma ospite</li>
                  <li>• Generare per ospiti non fisicamente presenti</li>
                  <li>• Aspettarsi rimborsi per errori</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* SUPPORTO */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-600" />
                Supporto e Contatti
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>• <strong>Problemi tecnici</strong>: Contatta amministratore TouristIQ</p>
              <p>• <strong>Ricarica crediti</strong>: Richiesta tramite pannello admin</p>
              <p>• <strong>Formazione staff</strong>: Guida completa disponibile nel menu laterale</p>
              <p>• <strong>Emergenze</strong>: Sistema di backup sempre attivo</p>
            </CardContent>
          </Card>
        </div>

        <Separator />
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-green-800 text-center">
            <strong>🌟 Ricorda</strong>: Ogni codice temporaneo che generi è un nuovo turista che scoprirà le bellezze della Calabria attraverso la tua struttura. 
            Usa questo potere con saggezza e responsabilità!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}