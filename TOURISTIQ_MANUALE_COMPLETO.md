# TOURISTIQ - Manuale Operativo Completo
*Versione 1.0 - 11 Luglio 2025*

## INDICE
1. [Panoramica Sistema](#panoramica-sistema)
2. [Pannello Admin](#pannello-admin)
3. [Pannello Turista](#pannello-turista)
4. [Pannello Partner](#pannello-partner)
5. [Pannello Struttura](#pannello-struttura)
6. [Sistema TIQ-OTC](#sistema-tiq-otc)
7. [Sistema TIQai](#sistema-tiqai)
8. [Procedura Autenticazione](#procedura-autenticazione)
9. [Troubleshooting](#troubleshooting)

---

## PANORAMICA SISTEMA

### Architettura Generale
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + PostgreSQL
- **Autenticazione**: Session-based con IQ codes
- **Database**: PostgreSQL con Drizzle ORM
- **Internazionalizzazione**: i18next (solo pannello turista)

### Ruoli Utente
- **Admin**: Gestione sistema completa
- **Tourist**: Accesso sconti e validazioni
- **Partner**: Gestione offerte e validazioni
- **Structure**: Gestione ospiti e codici

---

## PANNELLO ADMIN

### Accesso
- **IQ Code**: TIQ-IT-ADMIN
- **URL**: `/admin`

### Sezioni Principali

#### 1. Dashboard Principale
- **Statistiche generali** del sistema
- **Utenti attivi** per tipologia
- **Metriche operative** in tempo reale

#### 2. Gestione Utenti (`/admin/users`)
- **Visualizzazione** tutti gli utenti registrati
- **Filtri** per ruolo (Tourist/Partner/Structure)
- **Azioni**: Approvazione/Rigetto strutture e partner

#### 3. Gestione Utenti Avanzata (`/admin/user-management`)
- **Informazioni strategiche** per ogni utente
- **Metriche partner**: offerte attive, sconto medio
- **Metriche strutture**: crediti totali/utilizzati
- **Metriche turisti**: ultima attività, stato

#### 4. Codici IQ (`/admin/iqcodes`)
- **Visualizzazione** codici generati
- **Filtri** per tipologia e stato
- **Statistiche** utilizzo

#### 5. Assegnazione Pacchetti (`/admin/assign-iqcodes`)
- **Selezione destinatario** (Partner/Struttura)
- **Pacchetti disponibili**: 25/50/75/100 crediti
- **Assegnazione diretta** con conferma

#### 6. Generazione Diretta (`/admin/generate-direct`)
- **Codici emozionali**: TIQ-IT-[PAROLA] (scala crediti)
- **Codici professionali**: TIQ-[PROV]-[TIPO]-[NUM] (illimitati)
- **Controllo crediti** RobS disponibili

#### 7. Gestione Ricariche (`/admin/recharge-management`)
- **Richieste ricarica** TIQ-OTC
- **Approvazione/Rigetto** ricariche SumUp
- **Statistiche** utilizzi e pagamenti

#### 8. Statistiche (`/admin/stats`)
- **Metriche sistema** complete
- **Grafici** utilizzo temporale
- **Report** performance

#### 9. Impostazioni (`/admin/settings`)
- **Configurazioni** sistema
- **Parametri** operativi
- **Backup** e manutenzione

---

## PANNELLO TURISTA

### Accesso
- **IQ Code**: TIQ-IT-[PAROLA] o TIQ-FR-[NUM]-[PAROLA]
- **URL**: `/tourist`

### Funzionalità Principali

#### 1. Dashboard Principale
- **Saluto personalizzato** con nome turista
- **Codice IQ** principale visibile
- **Statistiche** utilizzi rimanenti

#### 2. I Miei Sconti
- **Visualizzazione** offerte partner disponibili
- **Filtri** per città e tipologia
- **Dettagli** sconto e condizioni

#### 3. TIQai Chat
- **Assistente AI** multilingue
- **Raccomandazioni** personalizzate
- **Informazioni** partner e attrazioni locali

#### 4. Sistema TIQ-OTC
- **Codici monouso** per privacy
- **Cronologia** utilizzi (solo post-validazione)
- **Generazione** nuovi codici
- **Tracking risparmi** in tempo reale

#### 5. Validazione IQCode
- **Richieste** validazione da partner
- **Accettazione/Rifiuto** richieste
- **Controllo** utilizzi rimanenti

#### 6. Custode del Codice
- **Attivazione** sistema recupero
- **Gestione** dati sicurezza
- **Recupero** autonomo IQ Code

#### 7. Internazionalizzazione
- **Selezione lingua**: IT/EN/ES/DE
- **Traduzione** interfaccia completa
- **Persistenza** preferenze

---

## PANNELLO PARTNER

### Accesso
- **IQ Code**: TIQ-[PROV]-PRT-[NUM]
- **URL**: `/partner`

### Funzionalità Principali

#### 1. Dashboard Principale
- **Saluto** con nome commerciale
- **Statistiche** validazioni giornaliere
- **Riepilogo** offerte attive

#### 2. Gestione Offerte
- **Creazione** nuove offerte
- **Modifica** offerte esistenti
- **Eliminazione** offerte scadute
- **Visualizzazione** pubblica per turisti

#### 3. Validazione IQCode
- **Inserimento** codice turista
- **Richiesta** validazione
- **Conferma** utilizzo sconto
- **Tracking** utilizzi

#### 4. Sistema TIQ-OTC
- **Validazione** codici monouso
- **Autenticazione** turisti
- **Applicazione** sconti
- **Cronologia** validazioni

#### 5. Custode del Codice
- **Attivazione** sistema recupero
- **Gestione** sicurezza account

#### 6. Mini-gestionale
- **Contabilità** movimenti
- **Esportazione** PDF
- **Gestione** ricavi/spese

#### 7. Onboarding Obbligatorio
- **Compilazione** dati business
- **Sezioni**: Accessibilità, Allergie, Famiglia, Specialità
- **Controllo** qualità TIQai

---

## PANNELLO STRUTTURA

### Accesso
- **IQ Code**: TIQ-[PROV]-STT-[NUM]
- **URL**: `/structure`

### Funzionalità Principali

#### 1. Dashboard Principale
- **Visualizzazione** pacchetti ricevuti
- **Crediti** disponibili/utilizzati
- **Statistiche** assegnazioni

#### 2. Gestione Ospiti
- **Registrazione** nuovi ospiti
- **Assegnazione** IQ codes
- **Visualizzazione** ospiti attivi
- **Cronologia** assegnazioni

#### 3. Generazione Codici
- **Creazione** codici turistici
- **Scala** crediti disponibili
- **Formato**: TIQ-IT-[PAROLA]
- **Controllo** duplicati

#### 4. Mini-gestionale
- **Contabilità** completa
- **Movimenti** entrate/uscite
- **Esportazione** PDF
- **Calendario** prenotazioni

#### 5. Custode del Codice
- **Attivazione** sistema recupero
- **Gestione** sicurezza account

#### 6. Assegnazione WhatsApp
- **Collegamento** ospiti
- **Invio** automatico codici
- **Template** messaggi

---

## SISTEMA TIQ-OTC

### Funzionamento Generale
1. **Turista** riceve 10 utilizzi automatici
2. **Turista** genera codice TIQ-OTC-[5cifre]
3. **Partner** valida codice con 5 cifre
4. **Sistema** autentica e applica sconto
5. **Tracking** automatico risparmi

### Caratteristiche Tecniche
- **Formato**: TIQ-OTC-[10000-99999]
- **Validazione**: Solo 5 cifre numeriche
- **Privacy**: Zero esposizione IQ code principale
- **Cronologia**: Solo post-utilizzo
- **Anti-duplicazione**: Controllo automatico

### Endpoint API
- `POST /api/tiq-otc/generate`: Genera nuovo codice
- `POST /api/tiq-otc/validate`: Valida codice partner
- `GET /api/tourist/one-time-codes`: Cronologia turista
- `GET /api/tourist/savings`: Statistiche risparmi

---

## SISTEMA TIQai

### Caratteristiche
- **AI**: OpenAI GPT-4 integrato
- **Personalità**: Genius Loci d'Italia
- **Multilingue**: IT/EN/ES/DE
- **Contesto**: Database partner reale

### Funzionalità
- **Raccomandazioni** personalizzate
- **Informazioni** partner locali
- **Assistenza** utilizzo piattaforma
- **Chat** conversazionale

### Endpoint API
- `POST /api/tiqai/chat`: Conversazione AI
- `GET /api/tiqai/context`: Contesto partner

---

## PROCEDURA AUTENTICAZIONE

### Flusso Login
1. **Inserimento** IQ Code
2. **Validazione** database
3. **Creazione** sessione
4. **Redirect** dashboard ruolo
5. **Controllo** persistenza

### Tipi IQ Code
- **Admin**: TIQ-IT-ADMIN
- **Turista**: TIQ-IT-[PAROLA] / TIQ-FR-[NUM]-[PAROLA]
- **Partner**: TIQ-[PROV]-PRT-[NUM]
- **Struttura**: TIQ-[PROV]-STT-[NUM]

### Sicurezza
- **Sessioni**: HTTP-only cookies
- **Scadenza**: 24 ore
- **Validazione**: Ogni richiesta
- **Rate limiting**: 5 tentativi/15min

---

## TROUBLESHOOTING

### Problemi Comuni

#### 1. Login Fallito
- **Verifica** formato IQ Code
- **Controllo** database presenza
- **Reset** cache browser
- **Verifica** sessione attiva

#### 2. Cache Frontend
- **Auto-refresh**: 30 secondi
- **Bottone manuale**: "Aggiorna"
- **Invalidazione**: Post-mutazioni
- **Sincronizzazione**: Backend-frontend

#### 3. Validazione TIQ-OTC
- **Formato**: Solo 5 cifre numeriche
- **Controllo**: Codice esistente
- **Verifica**: Ruolo corretto
- **Stato**: Non già utilizzato

#### 4. Problemi Database
- **Connessione**: DATABASE_URL
- **Migrazione**: `npm run db:push`
- **Backup**: Export automatico
- **Restore**: Import completo

---

## CHANGELOG MODIFICHE

### 11 Luglio 2025
- **Creazione**: Manuale operativo completo
- **Integrazione**: Sistema TIQ-OTC completato
- **Riattivazione**: Protocollo C24-SWEEP
- **Aggiornamento**: Tracking risparmi frontend

---

*Documento aggiornato automaticamente dopo ogni risoluzione confermata con "c24 tutto risolto"*