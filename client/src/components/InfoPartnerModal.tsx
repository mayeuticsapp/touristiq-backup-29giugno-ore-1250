import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Info, Store, Handshake, Shield, TrendingUp, CreditCard, CheckCircle, XCircle, HelpCircle, Heart, Users } from "lucide-react";

interface InfoPartnerModalProps {
  trigger?: React.ReactNode;
}

export function InfoPartnerModal({ trigger }: InfoPartnerModalProps) {
  const defaultTrigger = (
    <Button variant="outline" size="sm" className="bg-blue-50 hover:bg-blue-100 border-blue-200">
      <HelpCircle className="w-4 h-4 mr-2" />
      Come Funziona per Partner?
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
            <Store className="w-6 h-6 text-green-600" />
            TouristIQ Partner - Guida Operativa Completa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* MISSIONE PARTNER */}
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Handshake className="w-5 h-5" />
                🤝 La Tua Missione nell'Ecosistema TouristIQ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-green-900">
                Come Partner TouristIQ, sei un <strong>ambasciatore dell'ospitalità calabrese</strong>. 
                Il tuo ruolo va oltre offrire sconti: crei esperienze autentiche e 
                contribuisci a far innamorare i turisti della nostra terra.
              </p>
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <p className="font-semibold text-green-900 mb-2">I tuoi vantaggi come Partner:</p>
                <ul className="space-y-1 text-sm text-green-800">
                  <li>✅ Flusso costante di turisti verificati e motivati</li>
                  <li>✅ Sistema anti-frode TIQ-OTC integrato</li>
                  <li>✅ Privacy totale - nessun dato sensibile esposto</li>
                  <li>✅ Promozione automatica tramite TIQai AI</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* PROCESSO VALIDAZIONE SCONTI */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Come Validare gli Sconti Turista
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-blue-900 font-semibold">⚠️ ATTENZIONE: Ogni validazione è IRREVERSIBILE</p>
                <p className="text-sm text-blue-800">Ogni volta che validi uno sconto, il turista consuma definitivamente uno dei suoi utilizzi disponibili. Non esistono annullamenti.</p>
              </div>
              
              <div className="grid gap-4">
                <div className="flex gap-3">
                  <Badge className="bg-green-100 text-green-800 rounded-full w-8 h-8 flex items-center justify-center">1</Badge>
                  <div>
                    <h4 className="font-semibold">Turista presenta il suo IQCode</h4>
                    <p className="text-sm text-gray-600">Il turista ti mostra il suo codice principale (es: TIQ-IT-9876-MARE) o un TIQ-OTC</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center">2</Badge>
                  <div>
                    <h4 className="font-semibold">Tu inserisci il codice nel sistema "Validazione IQCode"</h4>
                    <p className="text-sm text-gray-600">Usa la sezione dedicata nel tuo pannello partner</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-purple-100 text-purple-800 rounded-full w-8 h-8 flex items-center justify-center">3</Badge>
                  <div>
                    <h4 className="font-semibold">Turista conferma la richiesta</h4>
                    <p className="text-sm text-gray-600">Il turista riceve notifica nell'app e accetta lo sconto</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Badge className="bg-amber-100 text-amber-800 rounded-full w-8 h-8 flex items-center justify-center">4</Badge>
                  <div>
                    <h4 className="font-semibold">Applichi lo sconto fisicamente</h4>
                    <p className="text-sm text-gray-600">Procedi con l'applicazione dello sconto concordato nel servizio/prodotto</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SISTEMA TIQ-OTC PER PARTNER */}
          <Card className="border-emerald-200 bg-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-800">
                <Shield className="w-5 h-5" />
                Sistema TIQ-OTC: Sicurezza Anti-Frode
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-emerald-900">
                Il sistema TIQ-OTC protegge sia te che il turista da possibili frodi o abusi. 
                Ogni turista ha <strong>10 codici monouso</strong> per validazioni sicure.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-emerald-900">✅ Come Riconoscere un TIQ-OTC</h4>
                  <ul className="text-sm text-emerald-800 space-y-1">
                    <li>• Formato: TIQ-OTC-12345</li>
                    <li>• Turista ti dice solo le 5 cifre finali</li>
                    <li>• Sistema aggiunge automaticamente il prefisso</li>
                    <li>• Validazione identica agli IQCode normali</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-emerald-900">🔒 Vantaggi per Te</h4>
                  <ul className="text-sm text-emerald-800 space-y-1">
                    <li>• Impossibilità di frodi con codici falsi</li>
                    <li>• Turista protetto da abusi del codice</li>
                    <li>• Tracciabilità completa ogni transazione</li>
                    <li>• Sistema segnala codici già utilizzati</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GESTIONE OFFERTE */}
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700">
                <TrendingUp className="w-5 h-5" />
                Gestione delle Tue Offerte
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <p className="text-purple-900 font-semibold">💡 Le tue offerte sono visibili a TUTTI i turisti TouristIQ</p>
                <p className="text-sm text-purple-800">Ogni offerta che crei viene immediatamente mostrata nella sezione "I Miei Sconti" di tutti i turisti calabresi.</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-purple-900">📝 Crea Offerte Efficaci</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Descrizioni chiare e accattivanti</li>
                    <li>• Percentuali sconto competitive</li>
                    <li>• Condizioni d'uso specifiche</li>
                    <li>• Aggiorna regolarmente le proposte</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-900">🎯 Strategie di Successo</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Offerte stagionali per attrarre turisti</li>
                    <li>• Prodotti/servizi tipici calabresi</li>
                    <li>• Esperienze uniche del territorio</li>
                    <li>• Collaborazioni con altri partner</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PRIVACY E LIMITAZIONI */}
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <Shield className="w-5 h-5" />
                Privacy e Limitazioni del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-amber-900">🔒 Cosa NON puoi vedere:</p>
                <ul className="space-y-1 text-amber-800 ml-4">
                  <li>• Dati personali dei turisti (nome, telefono, email)</li>
                  <li>• Quanto plafond €150 ha ancora disponibile</li>
                  <li>• Storico utilizzi con altri partner</li>
                  <li>• Informazioni di geolocalizzazione</li>
                </ul>
                
                <p className="font-semibold text-amber-900 mt-3">✅ Cosa puoi vedere:</p>
                <ul className="space-y-1 text-amber-800 ml-4">
                  <li>• Se il codice è valido o meno</li>
                  <li>• Quanti utilizzi rimanenti ha il turista</li>
                  <li>• Cronologia validazioni nel tuo locale</li>
                  <li>• Statistiche aggregate anonime</li>
                </ul>
                
                <div className="bg-white p-3 rounded-lg border border-amber-200 mt-3">
                  <p className="font-semibold text-amber-900">⚠️ Cosa NON devi mai fare:</p>
                  <ul className="space-y-1 text-amber-800 ml-4">
                    <li>• Chiedere documenti o dati personali</li>
                    <li>• Copiare o memorizzare IQCode turisti</li>
                    <li>• Validare codici senza effettivo acquisto</li>
                    <li>• Condividere codici con terzi</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FEEDBACK SYSTEM */}
          <Card className="border-indigo-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-700">
                <Users className="w-5 h-5" />
                Sistema Feedback e Reputazione
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-indigo-900">
                I turisti possono lasciare feedback anonimi sulla loro esperienza con te. 
                Questo sistema ti aiuta a migliorare il servizio e attirare più clienti.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-indigo-900">⭐ Cosa Vedrai</h4>
                  <ul className="text-sm text-indigo-800 space-y-1">
                    <li>• Rating medio aggregato (stelle)</li>
                    <li>• Numero totale feedback ricevuti</li>
                    <li>• Trend miglioramento/peggioramento</li>
                    <li>• Level di allarme (basso/medio/alto)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-indigo-900">🎯 Come Migliorare</h4>
                  <ul className="text-sm text-indigo-800 space-y-1">
                    <li>• Accoglienza calorosa e professionale</li>
                    <li>• Spiegazione chiara degli sconti</li>
                    <li>• Valorizzazione prodotti calabresi</li>
                    <li>• Follow-up post esperienza</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SUPPORTO TECNICO */}
          <Card className="border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-gray-600" />
                Supporto e Risoluzione Problemi
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold">🆘 Problemi Comuni</h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Codice non valido → Verifica formato corretto</li>
                    <li>• Turista non conferma → Riprova dopo qualche minuto</li>
                    <li>• Utilizzi esauriti → Turista deve ricaricare</li>
                    <li>• Errore sistema → Riavvia il browser</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold">📞 Contatti di Emergenza</h4>
                  <ul className="space-y-1 text-gray-700">
                    <li>• Admin TouristIQ per problemi tecnici</li>
                    <li>• Supporto partners per formazione</li>
                    <li>• Sistema di backup sempre attivo</li>
                    <li>• Documentazione aggiornata nel pannello</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />
        
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-green-800 text-center">
            <strong>🌟 Grazie per essere Partner TouristIQ</strong>: Ogni sconto che offri è un seme di ospitalità calabrese 
            che fiorisce nel cuore dei turisti. La tua professionalità e accoglienza rendono ogni visita 
            un'esperienza indimenticabile. Insieme costruiamo il futuro del turismo in Calabria!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}