import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Info, MapPin, Sparkles, Shield, Clock, Gift, CheckCircle, XCircle, HelpCircle, Heart, Star } from "lucide-react";

interface InfoTuristaModalProps {
  trigger?: React.ReactNode;
}

export function InfoTuristaModal({ trigger }: InfoTuristaModalProps) {
  const defaultTrigger = (
    <Button variant="outline" size="sm" className="bg-blue-50 hover:bg-blue-100 border-blue-200">
      <HelpCircle className="w-4 h-4 mr-2" />
      Come Funziona TouristIQ?
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
            <Heart className="w-6 h-6 text-red-500" />
            TouristIQ - La Calabria che ti Accoglie
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* BENVENUTO PERSONALIZZATO */}
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Sparkles className="w-5 h-5" />
                🌟 Benvenuto nell'Ecosistema TouristIQ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-blue-900">
                Hai appena attivato il tuo <strong>passepartout digitale</strong> per scoprire la Calabria autentica attraverso 
                sconti esclusivi, esperienze uniche e l'assistenza di TIQai, il tuo genius loci digitale.
              </p>
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <p className="font-semibold text-blue-900 mb-2">Il tuo IQCode è unico e personale:</p>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>✅ Nessuna scadenza - valido per sempre</li>
                  <li>✅ Privacy totale - nessun dato personale richiesto</li>
                  <li>✅ Accesso immediato a partner selezionati</li>
                  <li>✅ Sconti autentici verificati da TouristIQ</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* COME FUNZIONANO GLI SCONTI */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-green-600" />
                Come Funzionano i Tuoi Sconti
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex gap-3">
                  <Badge className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center">1</Badge>
                  <div>
                    <h4 className="font-semibold">Scopri i Partner nella sezione "I Miei Sconti"</h4>
                    <p className="text-sm text-gray-600">Esplora ristoranti, boutique, e attività selezionate in tutta la Calabria</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center">2</Badge>
                  <div>
                    <h4 className="font-semibold">Recati fisicamente dal partner</h4>
                    <p className="text-sm text-gray-600">Raggiungi il locale, ristorante o attività che ti interessa</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-purple-100 text-purple-800 rounded-full w-8 h-8 flex items-center justify-center">3</Badge>
                  <div>
                    <h4 className="font-semibold">Mostra il tuo IQCode al partner</h4>
                    <p className="text-sm text-gray-600">Il partner inserirà il tuo codice nel suo sistema per validare lo sconto</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-amber-100 text-amber-800 rounded-full w-8 h-8 flex items-center justify-center">4</Badge>
                  <div>
                    <h4 className="font-semibold">Conferma e ricevi lo sconto immediato</h4>
                    <p className="text-sm text-gray-600">Tu accetti la richiesta nell'app e il partner applica lo sconto</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SISTEMA TIQ-OTC */}
          <Card className="border-emerald-200 bg-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-800">
                <Shield className="w-5 h-5" />
                Sistema TIQ-OTC: La Tua Sicurezza Anti-Frode
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-emerald-900">
                Per proteggerti da usi impropri del tuo IQCode, hai a disposizione <strong>10 codici monouso TIQ-OTC</strong> 
                da usare per validazioni specifiche con i partner.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-emerald-900">✅ Vantaggi TIQ-OTC</h4>
                  <ul className="text-sm text-emerald-800 space-y-1">
                    <li>• Il tuo IQCode principale rimane privato</li>
                    <li>• Ogni TIQ-OTC è valido una sola volta</li>
                    <li>• Impossibilità di frodi o abusi</li>
                    <li>• Tracciabilità completa degli utilizzi</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-emerald-900">🔒 Come Funziona</h4>
                  <ul className="text-sm text-emerald-800 space-y-1">
                    <li>• Genera un codice quando serve</li>
                    <li>• Formato: TIQ-OTC-12345</li>
                    <li>• Mostra solo le 5 cifre al partner</li>
                    <li>• Cronologia utilizzi sempre disponibile</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* TIQAI ASSISTENTE */}
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <Sparkles className="w-5 h-5" />
                TIQai: Il Tuo Genius Loci Digitale
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-purple-900">
                TIQai non è un chatbot qualunque: è l'anima digitale dei territori calabresi, 
                qui per guidarti verso esperienze autentiche e nascoste.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-purple-900">💬 Cosa può fare</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Suggerire partner in base ai tuoi gusti</li>
                    <li>• Raccontare storie del territorio</li>
                    <li>• Consigli personalizzati per scoperte</li>
                    <li>• Informazioni su eventi e tradizioni</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-900">🎯 Come interagire</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• "Dove posso mangiare del buon pesce?"</li>
                    <li>• "Cosa c'è di speciale a Pizzo?"</li>
                    <li>• "Dove comprare prodotti tipici?"</li>
                    <li>• "Raccontami una leggenda locale"</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PLAFOND €150 */}
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <Star className="w-5 h-5" />
                Il Tuo Plafond Sconto €150
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-amber-900">
                Ogni turista TouristIQ ha a disposizione un <strong>plafond di €150</strong> da utilizzare 
                in sconti presso i partner della rete nell'arco dell'anno.
              </p>
              <div className="bg-white p-4 rounded-lg border border-amber-200">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-amber-900">📊 Come Funziona</h4>
                    <ul className="text-sm text-amber-800 space-y-1">
                      <li>• €150 totali disponibili per l'anno</li>
                      <li>• Sconti cumulabili fino ad esaurimento</li>
                      <li>• Monitoraggio in tempo reale</li>
                      <li>• Reset annuale automatico</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-900">💡 Suggerimenti</h4>
                    <ul className="text-sm text-amber-800 space-y-1">
                      <li>• Distribuisci i €150 durante tutto l'anno</li>
                      <li>• Controlla il saldo in "I Miei Risparmi"</li>
                      <li>• Scopri partner con sconti più alti</li>
                      <li>• Condividi TouristIQ con amici!</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PRIVACY E SICUREZZA */}
          <Card className="border-indigo-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-700">
                <Shield className="w-5 h-5" />
                Privacy e Sicurezza: I Tuoi Diritti
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-indigo-900">🔒 Cosa NON chiediamo mai:</p>
                <ul className="space-y-1 text-indigo-800 ml-4">
                  <li>• Dati personali (nome, cognome, documenti)</li>
                  <li>• Numeri di telefono o email</li>
                  <li>• Carte di credito o pagamenti</li>
                  <li>• Posizione o tracciamento continuo</li>
                </ul>
                
                <p className="font-semibold text-indigo-900 mt-3">✅ Cosa garantiamo:</p>
                <ul className="space-y-1 text-indigo-800 ml-4">
                  <li>• Anonimato totale nell'uso degli sconti</li>
                  <li>• Nessuna profilazione commerciale</li>
                  <li>• Nessuna cessione dati a terzi</li>
                  <li>• Sistema "Custode del Codice" per recupero sicuro</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* SUPPORTO E CONSIGLI */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-gray-600" />
                Consigli per Sfruttare al Meglio TouristIQ
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">🌟 Per l'Esperienza Migliore</h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Attiva sempre il "Custode del Codice"</li>
                    <li>• Dialoga con TIQai per scoperte uniche</li>
                    <li>• Controlla regolarmente nuovi partner</li>
                    <li>• Usa i TIQ-OTC per sicurezza massima</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold">🆘 Se Hai Problemi</h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>• IQCode dimenticato? Usa "Custode del Codice"</li>
                    <li>• Sconto non funziona? Prova con TIQ-OTC</li>
                    <li>• Partner non collabora? Segnala a TouristIQ</li>
                    <li>• Dubbi? Chiedi sempre a TIQai</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />
        
        <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-lg border border-red-200">
          <p className="text-sm text-red-800 text-center">
            <strong>🌅 Benvenuto nella Calabria che ti Accoglie</strong>: Il tuo IQCode è la chiave per scoprire 
            l'autentica ospitalità calabrese. Ogni sconto è un invito, ogni partner un nuovo amico, 
            ogni esperienza un ricordo indimenticabile. Buon viaggio con TouristIQ!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}