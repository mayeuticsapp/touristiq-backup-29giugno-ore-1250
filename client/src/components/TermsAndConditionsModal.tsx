import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, AlertTriangle } from 'lucide-react';

interface TermsAndConditionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  userType: 'structure' | 'partner';
  packageSize?: number;
  packagePrice?: string;
}

const STRUCTURE_TERMS_CONTENT = `🛡️ Condizioni Generali di Utilizzo dei Pacchetti IQCode – Strutture Ricettive
Ultimo aggiornamento: 30 giugno 2025

TouristIQ è la prima piattaforma turistica privacy-first al mondo, progettata per offrire esperienze autentiche e sostenibili nel rispetto assoluto della privacy degli utenti. L'acquisto e l'utilizzo dei pacchetti IQCode da parte di una Struttura Ricettiva implica l'accettazione delle seguenti condizioni.

1. Definizioni

TouristIQ: Piattaforma etica per la distribuzione e validazione di IQCode anonimi.
Struttura Ricettiva: Soggetto autorizzato all'acquisto e utilizzo dei pacchetti IQCode (es. hotel, B&B, residence, agriturismi).
IQCode: Codice alfanumerico anonimo che consente al turista di accedere ai vantaggi della rete TouristIQ.
Turista: Utente finale che riceve un IQCode da una struttura o un partner.

2. Oggetto del Contratto

Il presente documento regola i termini di acquisto, utilizzo e gestione dei pacchetti IQCode da parte della Struttura. Acquistando un pacchetto, la Struttura:

• Accetta integralmente le regole di funzionamento della piattaforma.
• Si impegna al rispetto del Manifesto Etico di TouristIQ.
• Usufruisce dei servizi riservati nella dashboard struttura, progettata per semplificare la gestione degli ospiti e promuovere esperienze autentiche.

3. Acquisto, Attivazione e Onboarding

3.1 Acquisto e Attivazione

• I pacchetti IQCode sono acquistabili online tramite link ufficiali forniti da TouristIQ (es. circuito SumUp).
• Il costo di ogni IQCode varia tra 1,60€ e 2,00€, in base al volume del pacchetto acquistato.
• L'attivazione è manuale da parte dell'Admin entro 24 ore dalla conferma di pagamento.
• I pacchetti non hanno scadenza.

3.2 Requisiti di Onboarding

• La Struttura deve completare un processo di onboarding, fornendo informazioni su servizi offerti, accessibilità, specialità e conformità al Manifesto Etico.
• TouristIQ si riserva di approvare o rifiutare la candidatura in base alla qualità e all'allineamento con i valori della piattaforma.

4. Obblighi della Struttura

La Struttura si impegna a:

• Non raccogliere dati sensibili del turista (es. email, documento), salvo il numero WhatsApp per l'invio automatico del codice, che sarà cancellato immediatamente dopo l'invio.
• Non archiviare, vendere o riutilizzare i codici IQ una volta assegnati.
• Utilizzare gli IQCode solo per finalità di assegnazione a ospiti reali, evitando assegnazioni fittizie o automatizzate.
• Non forzare o influenzare il turista nella validazione post-esperienza, rispettando la libertà di feedback.

5. Diritti della Struttura

La Struttura, in regola con l'acquisto dei pacchetti, ha diritto a:

• Dashboard gestionale completa: Gestione ospiti, invio WhatsApp automatizzato, storico IQCode.
• Mini-gestionale contabile gratuito: Tracciamento di entrate, spese e utilizzi IQCode, con export in PDF/CSV (attivo solo con pacchetti validi).
• Materiale promozionale: Accesso a strumenti ufficiali (es. logo "Siamo partner TouristIQ") per valorizzare l'appartenenza al network.
• Supporto clienti: Assistenza via email (supporto@touristiq.it) e chat nei giorni lavorativi.
• Fidelizzazione tramite IQCode: Gli IQCode rappresentano un regalo esclusivo per gli ospiti, progettato per migliorare l'esperienza turistica, incentivare il ritorno e promuovere il passaparola.

6. Validità e Gestione dei Codici IQ

6.1 Validità

• Ogni IQCode ha 10 utilizzi, ricaricabili su richiesta tramite SumUp.
• Le ricariche vengono approvate manualmente da TouristIQ entro 24 ore.

6.2 Responsabilità della Struttura

• È responsabilità della Struttura fornire al turista istruzioni chiare sull'utilizzo del codice, utilizzando i materiali forniti da TouristIQ.

6.3 Gestione delle Dispute

• In caso di rifiuto di validazione da parte del turista, la Struttura può contattare il supporto di TouristIQ per una mediazione, fornendo dettagli sull'esperienza.
• TouristIQ si riserva di valutare il caso e proporre una soluzione entro 48 ore.

7. Sospensione o Revoca dell'Accesso

TouristIQ si riserva il diritto di sospendere o disattivare l'accesso alla dashboard in caso di:

• Utilizzo improprio dei codici (es. spam, frodi, assegnazioni false).
• Violazione del Manifesto Etico.
• Comportamento scorretto o lesivo dell'immagine del progetto.

La Struttura sarà notificata via email e avrà 7 giorni per presentare chiarimenti.

8. Limitazioni di Responsabilità

TouristIQ non è responsabile per:

• L'effettiva esperienza vissuta dal turista nella struttura.
• Ritardi o malfunzionamenti causati da terze parti (es. servizi WhatsApp, hosting).
• Uso improprio dei codici da parte del turista.

9. Privacy e Protezione Dati

• TouristIQ non raccoglie alcun dato personale del turista, garantendo conformità alla filosofia zero-data.
• La Struttura si impegna a non utilizzare strumenti di profilazione, raccolta email o remarketing collegati agli IQCode, rispettando il principio di privacy by design.

10. Legge Applicabile e Foro Competente

• Il presente accordo è regolato dalla legge italiana.
• Per ogni controversia sarà competente in via esclusiva il Foro di Roma.

Per assistenza: supporto@touristiq.it`;

const PARTNER_TERMS_CONTENT = `🛡️ Condizioni Generali di Utilizzo dei Pacchetti IQCode – Partner Commerciali
Ultimo aggiornamento: 30 giugno 2025

TouristIQ è la prima piattaforma turistica privacy-first al mondo, progettata per offrire esperienze autentiche e sostenibili nel rispetto assoluto della privacy degli utenti. L'acquisto e l'utilizzo dei pacchetti IQCode da parte di un Partner Commerciale implica l'accettazione delle seguenti condizioni.

1. Definizioni

TouristIQ: Piattaforma etica per la distribuzione e validazione di IQCode anonimi.
Partner Commerciale: Soggetto autorizzato all'acquisto e utilizzo dei pacchetti IQCode (es. ristoranti, boutique, tour operator, attività commerciali).
IQCode: Codice alfanumerico anonimo che consente al turista di accedere ai vantaggi della rete TouristIQ.
Turista: Utente finale che presenta un IQCode per ottenere sconti o servizi speciali.

2. Oggetto del Contratto

Il presente documento regola i termini di acquisto, utilizzo e gestione dei pacchetti IQCode da parte del Partner. Acquistando un pacchetto, il Partner:

• Accetta integralmente le regole di funzionamento della piattaforma.
• Si impegna al rispetto del Manifesto Etico di TouristIQ.
• Usufruisce dei servizi riservati nella dashboard partner, progettata per validare codici turistici e offrire esperienze autentiche.

3. Acquisto, Attivazione e Onboarding

3.1 Acquisto e Attivazione

• I pacchetti IQCode sono acquistabili online tramite link ufficiali forniti da TouristIQ (es. circuito SumUp).
• Il costo di ogni IQCode varia tra 1,60€ e 2,00€, in base al volume del pacchetto acquistato.
• L'attivazione è manuale da parte dell'Admin entro 24 ore dalla conferma di pagamento.
• I pacchetti non hanno scadenza.

3.2 Requisiti di Onboarding Obbligatorio

• Il Partner deve completare obbligatoriamente un processo di onboarding in 6 sezioni: Business, Accessibilità, Allergie, Famiglia, Specialità, Servizi.
• È richiesto un minimo di 2 informazioni compilate per ogni sezione prima di accedere alla dashboard.
• Solo i partner con onboarding completato sono visibili su TIQai per i consigli ai turisti.
• TouristIQ si riserva di approvare o rifiutare la candidatura in base alla qualità e all'allineamento con i valori della piattaforma.

4. Obblighi del Partner

Il Partner si impegna a:

• Non raccogliere dati sensibili del turista oltre al codice IQ presentato per la validazione.
• Utilizzare il sistema di validazione codici solo per turisti che hanno effettivamente usufruito di un servizio o sconto.
• Rispettare la decisione del turista in caso di rifiuto della validazione, senza pressioni o condizionamenti.
• Fornire servizi di qualità coerenti con quanto dichiarato nell'onboarding.
• Accettare feedback privati dai turisti per migliorare continuamente l'offerta.

5. Diritti del Partner

Il Partner, in regola con l'acquisto dei pacchetti e onboarding completato, ha diritto a:

• Dashboard validazione completa: Sistema per validare codici IQ presentati dai turisti.
• Visibilità su TIQai: I turisti possono ricevere consigli personalizzati sulla vostra attività.
• Sistema feedback: Ricezione di suggerimenti privati dai turisti per migliorare l'offerta.
• Mini-gestionale opzionale: Tracciamento sconti applicati e statistiche clienti.
• Materiale promozionale: Accesso a strumenti ufficiali per valorizzare l'appartenenza al network TouristIQ.
• Supporto clienti: Assistenza via email (supporto@touristiq.it) e chat nei giorni lavorativi.

6. Sistema Validazione Codici IQ

6.1 Processo di Validazione

• Il Partner inserisce il codice IQ del turista nella propria dashboard.
• Il turista riceve una notifica per accettare o rifiutare la validazione.
• Solo con l'accettazione del turista il codice viene validato e gli utilizzi diminuiscono.
• Il Partner vede immediatamente l'esito della richiesta di validazione.

6.2 Responsabilità del Partner

• Applicare sconti o servizi solo dopo conferma di validazione positiva.
• Rispettare gli utilizzi rimanenti mostrati dal sistema.
• Non forzare validazioni o pressare i turisti per ottenere accettazioni.

6.3 Gestione delle Dispute

• In caso di rifiuto di validazione, il Partner può contattare il supporto per chiarimenti.
• TouristIQ si riserva di valutare il caso e proporre una mediazione entro 48 ore.
• Partner con elevate percentuali di rifiuti possono essere esclusi dalla rete.

7. Sospensione o Revoca dell'Accesso

TouristIQ si riserva il diritto di sospendere o disattivare l'accesso alla dashboard in caso di:

• Uso improprio del sistema di validazione (es. validazioni false, pressioni sui turisti).
• Violazione del Manifesto Etico o standard di qualità dichiarati.
• Comportamento scorretto o lesivo dell'immagine del progetto.
• Mancato rispetto degli obblighi di onboarding o aggiornamento informazioni.

Il Partner sarà notificato via email e avrà 7 giorni per presentare chiarimenti.

8. Limitazioni di Responsabilità

TouristIQ non è responsabile per:

• Dispute commerciali dirette tra Partner e turisti.
• Ritardi o malfunzionamenti causati da terze parti.
• Decisioni autonome dei turisti di non validare codici.
• Perdite economiche derivanti da mancate validazioni.

9. Privacy e Protezione Dati

• TouristIQ non raccoglie alcun dato personale del turista, garantendo conformità alla filosofia zero-data.
• Il Partner si impegna a non richiedere o memorizzare dati personali aggiuntivi oltre al codice IQ.
• È vietato utilizzare strumenti di profilazione o remarketing collegati alle validazioni IQCode.

10. Eco-Sistema Qualità

• Il Partner diventa parte di una rete selezionata di attività verificate in Calabria.
• L'obiettivo è valorizzare l'autenticità e la qualità dell'offerta turistica locale.
• Partner che non rispettano gli standard possono essere esclusi per tutelare l'integrità del network.

11. Legge Applicabile e Foro Competente

• Il presente accordo è regolato dalla legge italiana.
• Per ogni controversia sarà competente in via esclusiva il Foro di Roma.

Per assistenza: supporto@touristiq.it`;

export default function TermsAndConditionsModal({ 
  isOpen, 
  onClose, 
  onAccept, 
  userType, 
  packageSize, 
  packagePrice 
}: TermsAndConditionsModalProps) {
  const [hasReadCompletely, setHasReadCompletely] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight - target.clientHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 100;
    
    setScrollProgress(progress);
    
    // Considera il documento letto completamente quando si raggiunge il 95%
    if (progress >= 95) {
      setHasReadCompletely(true);
    }
  };

  const handleAccept = () => {
    if (hasReadCompletely && hasAcceptedTerms) {
      onAccept();
      onClose();
      // Reset states for next time
      setHasReadCompletely(false);
      setHasAcceptedTerms(false);
      setScrollProgress(0);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset states
    setHasReadCompletely(false);
    setHasAcceptedTerms(false);
    setScrollProgress(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Condizioni Generali di Utilizzo - Pacchetti IQCode
          </DialogTitle>
          <DialogDescription>
            {userType === 'structure' ? 'Strutture Ricettive' : 'Partner Commerciali'}
            {packageSize && packagePrice && (
              <span className="block mt-2 font-semibold text-blue-600">
                Pacchetto selezionato: {packageSize} IQCode - {packagePrice}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${scrollProgress}%` }}
          />
          <p className="text-xs text-gray-600 mt-1">
            Progresso lettura: {Math.round(scrollProgress)}%
            {!hasReadCompletely && " - Scorri fino alla fine per continuare"}
          </p>
        </div>

        {/* Terms Content */}
        <div 
          onScroll={handleScroll}
          className="flex-1 h-[400px] w-full border rounded-md p-4 overflow-y-auto bg-white"
        >
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {userType === 'structure' ? STRUCTURE_TERMS_CONTENT : PARTNER_TERMS_CONTENT}
          </div>
        </div>

        {/* Reading Alert */}
        {!hasReadCompletely && (
          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              È necessario leggere completamente il documento scorrendo fino alla fine prima di poter procedere.
            </AlertDescription>
          </Alert>
        )}

        {/* Acceptance Checkbox */}
        {hasReadCompletely && (
          <div className="flex items-start space-x-2 mt-4 p-4 bg-blue-50 rounded-lg">
            <Checkbox 
              id="accept-terms"
              checked={hasAcceptedTerms}
              onCheckedChange={(checked) => setHasAcceptedTerms(checked === true)}
            />
            <label 
              htmlFor="accept-terms" 
              className="text-sm font-medium leading-relaxed cursor-pointer"
            >
              Confermo di aver letto, compreso e accettato integralmente le presenti Condizioni Generali di Utilizzo, 
              l'Informativa Privacy, la Politica dei Cookie e il Manifesto Etico di TouristIQ. 
              Comprendo che l'acquisto di questo pacchetto IQCode implica l'accettazione di tutti i termini sopra descritti.
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t">
          <div className="text-xs text-gray-500">
            Per assistenza: supporto@touristiq.it
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleClose}
            >
              Annulla
            </Button>
            <Button 
              onClick={handleAccept}
              disabled={!hasReadCompletely || !hasAcceptedTerms}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Accetta e Continua
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}