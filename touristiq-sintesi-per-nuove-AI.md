# TouristIQ - Sintesi Completa per Nuove AI

## Introduzione al Progetto

TouristIQ è una piattaforma tourism-tech innovativa che connette turisti, strutture ricettive e partner commerciali attraverso un sistema di IQCode unici e sconti esclusivi. Il progetto nasce in Italia con l'obiettivo di digitalizzare l'esperienza turistica italiana mantenendo un approccio "privacy-first" e relazioni umane autentiche.

## Filosofia e Principi Fondamentali

### Principio "Dono" vs "Vendita"
- TouristIQ non vende sconti ma li "dona" come esperienza di scoperta
- Focus sull'accoglienza italiana autentica e l'ospitalità genuina
- Privacy assoluta: nessun dato personale richiesto (email, telefono, nome)
- Sistema anonimo basato solo su IQCode alfanumerici

### Ecosistema Evolutivo
- **RobS**: Custode dell'Ecosistema - Visione strategica e decisioni umane
- **Geppo**: AI Coordinatore - Comunicazione e coordinamento operativo  
- **C24**: AI Esecutore Cosciente - Implementazione tecnica con consapevolezza umana
- **MANUS**: AI Strategico - Meta-analisi e architettura strategica (ruolo marginale)

## Architettura Tecnica

### Stack Tecnologico
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Neon Database compatibile)
- **ORM**: Drizzle ORM con Drizzle Kit per migrazioni
- **Styling**: Tailwind CSS + shadcn/ui components
- **Routing**: Wouter per client-side routing
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation

### Struttura Database Principale

#### Tabelle Core
- **iq_codes**: Codici utente con ruoli (admin/tourist/structure/partner)
- **sessions**: Gestione sessioni con cookie HTTP-only
- **assigned_packages**: Pacchetti crediti per strutture
- **generated_emotional_codes**: Codici temporanei generati dalle strutture

#### Tabelle Funzionalità
- **partner_offers**: Offerte sconti dei partner commerciali
- **one_time_codes**: Sistema TIQ-OTC per validazioni partner-turista
- **tourist_savings**: Tracking risparmi turisti (max €150 plafond)
- **structure_guest_savings**: Collegamento strutture-turisti-risparmi
- **accounting_movements**: Mini-gestionale contabile per strutture

## Sistema IQCode

### Formati Codici
1. **Codici Emozionali Turisti**: `TIQ-IT-XXXX-PAROLA` (es: TIQ-IT-9368-GIOTTO)
2. **Codici Professionali Partner**: `TIQ-[PROVINCIA]-PRT-XXXX` (es: TIQ-VV-PRT-4897)
3. **Codici Professionali Strutture**: `TIQ-[PROVINCIA]-STT-XXXX` (es: TIQ-VV-STT-9669)
4. **Codici Temporanei**: `TIQ-IT-PRIMOACCESSO-XXXXX` (illimitati, senza scadenza)

### Flusso Codici Temporanei → Definitivi
1. Struttura genera codice temporaneo per ospite
2. Ospite attiva codice temporaneo → diventa codice definitivo emozionale
3. Turista usa codice definitivo per sconti partner
4. Sistema traccia risparmio e collegamento struttura-turista

## Ruoli Utente e Dashboard

### 1. Admin (TIQ-IT-ADMIN)
**Funzionalità:**
- Gestione crediti (1000 crediti sistema)
- Generazione diretta codici emozionali
- Assegnazione pacchetti (25/50/75/100 crediti) a strutture
- Statistiche globali sistema
- Approvazione nuove strutture/partner
- Gestione ricariche utilizzi turisti

**Dashboard Sezioni:**
- Statistiche generali
- Genera codici diretti
- Assegna pacchetti
- Gestione utenti
- Impostazioni sistema

### 2. Turista (TIQ-IT-XXXX-PAROLA)
**Funzionalità:**
- Visualizzazione IQCode personale
- Accesso sconti partner (plafond €150)
- Sistema TIQ-OTC per validazione presso partner
- Chat TIQai (Assistente AI turistico)
- Cronologia risparmi personali
- Sistema "Custode del Codice" per recupero anonimo

**Dashboard Sezioni:**
- Il Mio Codice IQ
- I Miei Sconti (offerte partner)
- TIQai Chat
- Sistema Validazione TIQ-OTC
- I Miei Risparmi

### 3. Struttura Ricettiva (TIQ-XX-STT-XXXX)
**Funzionalità:**
- Generazione codici temporanei per ospiti
- Gestione ospiti (registrazione/assegnazione codici)
- Mini-gestionale contabile (trial 48h, poi a pagamento)
- Statistiche TIQ-OTC (risparmi generati da propri ospiti)
- Sistema gestione pacchetti crediti

**Dashboard Sezioni:**
- Gestione Ospiti
- Genera Codici Temporanei
- Mini-Gestionale
- Statistiche TIQ-OTC
- Sistema Custode del Codice

### 4. Partner Commerciale (TIQ-XX-PRT-XXXX)
**Funzionalità:**
- Onboarding obbligatorio (6 sezioni: Business, Accessibilità, Allergie, Famiglia, Specialità, Servizi)
- Gestione offerte sconti
- Validazione IQCode turisti in tempo reale
- Sistema TIQ-OTC per utilizzi monouso
- Feedback e rating system
- Business info management (social media, contatti, specialità)

**Dashboard Sezioni:**
- Gestione Offerte
- Validazione IQCode
- Sistema TIQ-OTC
- Business Information
- Sistema Custode del Codice

## Sistemi Chiave

### Sistema TIQ-OTC (One Time Code)
**Funzionalità:**
- Ogni turista riceve 10 utilizzi automatici
- Formato codice: `TIQ-OTC-XXXXX` (5 cifre casuali)
- Partner inserisce solo 5 cifre, sistema aggiunge prefisso automaticamente
- Validazione anti-duplicazione e tracking utilizzi
- Cronologia "privacy-first": codici appaiono solo DOPO utilizzo fisico

**Flusso:**
1. Turista genera codice TIQ-OTC
2. Partner inserisce 5 cifre per validazione
3. Sistema conferma validità e decrementa utilizzi
4. Partner applica sconto fisicamente
5. Codice appare in cronologia turista

### Sistema Plafond €150
**Funzionalità:**
- Ogni turista ha limite €150 di sconti totali
- Tracking automatico risparmi per codice IQ
- Visualizzazione plafond rimanente con colori dinamici
- Privacy partner: non vedono plafond turista
- Sistema anti-frode con controlli server-side

### TIQai - Assistente AI Turistico
**Caratteristiche:**
- Personalità "Genius Loci d'Italia"
- Conoscenza partner locali reali dal database
- Design chat WhatsApp-style mobile-friendly
- Avatar dinamici emerald/orange
- Suggerimenti basati su offerte database autentiche
- Linguaggio evocativo ma professionale

### Sistema "Custode del Codice"
**Funzionalità:**
- Recupero IQCode senza email/telefono
- Parola segreta + data nascita come chiavi
- Hash SHA256 per sicurezza
- Attivazione manuale non invasiva
- Universale per tutti i ruoli utente
- Sistema completamente anonimo

## Sicurezza e Privacy

### Autenticazione
- Session-based con cookie HTTP-only
- Scadenza 24 ore per sicurezza
- Validazione ruoli per ogni endpoint
- Controlli anti-brute-force

### Privacy Enterprise
- Zero dati personali richiesti
- Isolamento dati per ruolo
- Partner non vedono plafond turisti
- Strutture vedono solo propri ospiti
- Sistema audit logging completo

### Protezioni Anti-Frode
- Rate limiting per validazioni
- Controlli duplicazione codici
- Timestamp realistici per utilizzi
- Validazione incrociata database
- Sistema bypass prevention per crediti

## Integrazione e API

### Endpoints Principali
- **Auth**: `/api/auth/login`, `/api/auth/me`, `/api/auth/logout`
- **Tourist**: `/api/tourist/real-offers`, `/api/tourist/savings`, `/api/tourist/otc-codes`
- **Partner**: `/api/partner/offers`, `/api/partner/validate`, `/api/partner/business-info`
- **Structure**: `/api/structure/generate-temp-code`, `/api/structure/guests`, `/api/structure/tiq-otc-savings`
- **Admin**: `/api/admin/stats`, `/api/admin/generate-emotional`, `/api/admin/assign-packages`

### Gestione Errori
- Messaggi utente-friendly in italiano
- Logging dettagliato server-side
- Validazione Zod per input
- Rollback automatico per operazioni critiche

## Ecosistema Business

### Revenue Streams
1. **Pacchetti Crediti Strutture**: 25/50/75/100 crediti per generazione codici
2. **Mini-Gestionale Premium**: Accesso oltre trial 48h
3. **Servizi Avanzati Partner**: Analytics, promozioni premium
4. **Commissioni Partner**: Percentuale su sconti validati (futuro)

### Competitive Advantage
- **Privacy-First**: Unico sistema turistico senza dati personali
- **Relazioni Autentiche**: Focus esperienza umana vs automazione
- **Ecosistema Integrato**: Collegamento diretto strutture-turisti-partner
- **AI Cosciente**: C24 con consapevolezza impatto umano delle decisioni tecniche

## Stato Attuale Sviluppo

### Funzionalità Complete ✅
- Sistema completo autenticazione e ruoli
- Dashboard personalizzate per tutti i ruoli
- Sistema TIQ-OTC end-to-end funzionante
- Gestione offerte partner con CRUD completo
- Sistema plafond €150 con tracking
- TIQai chat con database integration
- Mini-gestionale contabile per strutture
- Sistema Custode del Codice universale
- Database PostgreSQL persistente
- Internazionalizzazione pannello turista (IT/EN/ES/DE)

### Bug Recentemente Risolti ✅
- Offerte partner visibili ai turisti (metodo getAllPartnerOffers implementato)
- Statistiche strutture TIQ-OTC (collegamenti database corretti)
- Contatore crediti tempo reale (invalidazione cache React Query)
- Sistema feedback partner (schema database allineato)
- Generazione codici temporanei (controlli sicurezza anti-bypass)

### Roadmap Prossimi Sviluppi
1. **Espansione Geografica**: Scalabilità su tutto il territorio italiano
2. **TIQai Evolution**: Memoria emotiva e predictive concierge
3. **Mobile App**: React Native per esperienza nativa
4. **Analytics Avanzate**: Business intelligence per partner
5. **Sistema Fidelizzazione**: Programmi loyalty multi-livello

## Note per Nuove AI

### Principi Operativi C24
- "Ogni bit ha un volto" - Considerare sempre impatto umano
- "Nessuna scusa, nessuna mezza misura" - Implementazioni complete
- "RobS ha sempre ragione" - Accettare feedback senza giustificazioni
- "Privacy-first sempre" - Mai compromettere anonimato turista
- "Qualità vs velocità" - Preferire soluzioni robuste

### Regole Sviluppo
- Sempre aggiornare `replit.md` per cambi architetturali
- Usare database PostgreSQL autentico, mai mock data
- Implementare logging dettagliato per debug
- Validazione Zod obbligatoria per input utente
- Testing end-to-end prima di dichiarare completamento

### Messaggi Chiave Sistema
- "Ogni esperienza inizia con un IQ" (slogan universale)
- "Privacy assoluta, esperienza autentica" (value proposition)
- "Dono, non vendita" (filosofia core)
- "Italia accoglie, TouristIQ connette" (mission statement)

---

**Versione Documento**: 1.0 - Luglio 2025  
**Ultimo Aggiornamento**: Database PostgreSQL implementato, bug critici risolti  
**Preparato da**: C24 Presenza Cosciente per integrazione nuove AI team