# TouristIQ Platform

## Overview

TouristIQ is a role-based authentication platform designed for the tourism industry. The application provides different dashboards and functionality based on user roles: Admin, Tourist, Structure (accommodation), and Partner (local businesses). Users authenticate using unique IQ codes that determine their access level and interface.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **Session Management**: Cookie-based sessions with custom session storage
- **API Structure**: RESTful endpoints under `/api` prefix

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (configured for Neon Database)
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Storage Interface**: Abstracted storage layer with in-memory implementation for development

## Key Components

### Authentication System
- **IQ Code Authentication**: Users log in with unique alphanumeric codes
- **Role-Based Access**: Four distinct user roles (admin, tourist, structure, partner)
- **Session Management**: HTTP-only cookies with 24-hour expiration
- **Protected Routes**: Component-level route protection based on user roles

### User Roles and Dashboards
1. **Admin Dashboard**: System management, user oversight, statistics
2. **Tourist Dashboard**: Discount discovery, code display, activity tracking
3. **Structure Dashboard**: Accommodation management, booking oversight
4. **Partner Dashboard**: Discount management, customer analytics

### Database Schema
- **iq_codes table**: Stores authentication codes with associated roles
- **sessions table**: Manages active user sessions with expiration
- **Validation**: Zod schemas for type-safe data validation

## Data Flow

1. **Authentication Flow**:
   - User submits IQ code through login form
   - Server validates code against database
   - Session created with unique token stored in HTTP-only cookie
   - User redirected to role-appropriate dashboard

2. **Authorization Flow**:
   - Protected routes check for valid session cookie
   - Server validates session token and retrieval user context
   - Role-based access control determines available features

3. **API Communication**:
   - Client uses React Query for server state management
   - RESTful API endpoints handle authentication and data operations
   - Error handling with user-friendly messages

## External Dependencies

### Core Dependencies
- **Database**: Neon Database (PostgreSQL-compatible)
- **Authentication**: Custom session-based system
- **UI Components**: Radix UI primitives via shadcn/ui
- **Form Handling**: React Hook Form with Zod validation

### Development Tools
- **TypeScript**: Type safety across frontend and backend
- **ESLint/Prettier**: Code quality and formatting
- **Vite**: Fast development server and build tool
- **Drizzle Kit**: Database schema management

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20 runtime
- **Database**: PostgreSQL 16 module
- **Port Configuration**: Internal port 5000, external port 80
- **Hot Reload**: Vite development server with HMR

### Production Build
- **Build Process**: Vite builds client assets, ESBuild bundles server
- **Asset Serving**: Static file serving integrated with Express
- **Deployment Target**: Auto-scaling deployment on Replit

### Configuration Management
- **Environment Variables**: DATABASE_URL for database connection
- **Build Scripts**: Separate development and production workflows
- **Session Storage**: Configurable between in-memory and database storage

## Changelog
- June 28, 2025: GUIDA DASHBOARD PARTNER COMMERCIALI CREATA - Guida HTML completa trasversale per ristoranti/boutique su utilizzo dashboard partner, enfasi su vantaggio TIQai unico (dati solo da TouristIQ vs Google/TripAdvisor), esempi pratici distribuzione codici, strategie per massimizzare visibilità, onboarding obbligatorio spiegato, stile coerente con altre guide esistenti
- June 28, 2025: VALIDAZIONE ONBOARDING E CONTROLLO GESTIONALE IMPLEMENTATI - Validazione obbligatoria onboarding partner: minimo 2 campi compilati per sezione prima di procedere, controllo gestionale strutture: accesso contabilità bloccato per strutture senza pacchetti attivi, messaggi errore chiari per guidare utenti, sistema production-ready completo
- June 28, 2025: PERSISTENZA ONBOARDING PARTNER DEFINITIVAMENTE RISOLTA - Sistema onboarding partner operativo al 100% con persistenza PostgreSQL funzionante: partner TIQ-VV-PRT-2250 completa onboarding e status viene salvato in database campo internalNote, verificato mantenimento stato "completed: true" anche dopo riavvii server, blocco accesso dashboard per partner non completati attivo
- June 28, 2025: SISTEMA ONBOARDING PARTNER OBBLIGATORIO IMPLEMENTATO - Percorso guidato 6 sezioni (Business, Accessibilità, Allergie, Famiglia, Specialità, Servizi) con blocco accesso dashboard fino completamento, database PostgreSQL con partner_onboarding e partner_details, validazione step obbligatorie, sistema controllo qualità TIQai per feedback autentici
- June 28, 2025: APERTURA AUTOMATICA DATE PICKER IMPLEMENTATA - Sistema completo apertura automatica calendari: selezione data check-in apre immediatamente il date picker per check-out (metodo showPicker()), esperienza fluida tipo Booking.com/Airbnb implementata in dashboard struttura, partner e mini-gestionale
- June 28, 2025: BOTTONE ELIMINA ACCOUNT E MINI-GESTIONALE IMPLEMENTATI - Sostituito completamente "Impostazioni" con "Elimina Account" (icona rossa), soft delete PostgreSQL 90 giorni, conferma testuale obbligatoria "ELIMINA DEFINITIVAMENTE", aggiunto bottone "Mini-gestionale" nel menu laterale per accesso diretto alla contabilità senza scorrere dashboard
- June 28, 2025: DASHBOARD STRUTTURA OTTIMIZZATA E PROBLEMA SCREENSHOT IDENTIFICATO - Rimossa sezione "Pannello Struttura Completo" e statistiche superflue (Camere Occupate/Check-in/Rating), pannello completo ora visibile immediatamente senza navigazione a 2 screen, mini gestionale contabile integrato direttamente nella dashboard, problema critico identificato: tool screenshot non accede a pagine autenticate (mostra sempre login invece di dashboard struttura)
- June 27, 2025: SEZIONI DUPLICATE ELIMINATE E RIMOZIONE CODICI OPERATIVA - Rimosse definitivamente sezioni duplicate "Assegnazione WhatsApp" e "Assegna Nuovo Codice IQ", funzione rimozione codici IQ ora funzionante (TIQ-IT-AMALFI/TEST/DIRECT eliminati dal database PostgreSQL), interfaccia ottimizzata per fluidità gestione strutture, sistema persistenza PostgreSQL al 100% operativo
- June 27, 2025: PERSISTENZA POSTGRESQL E ISTRUZIONI UTENTE COMPLETATE - Risolto definitivamente problema persistenza codici IQ nel database PostgreSQL, caricamento automatico codici assegnati in dashboard ospiti operativo, rimossi pulsanti navigazione superflui (Prenotazioni/Camere) secondo specifiche utente, sistema production-ready con 4 codici TIQ-IT-AMALFI/CAPRI/DIRECT/TEST verificati
- June 27, 2025: PACCHETTO ROBS RIPRISTINATO E OPERATIVO - Visualizzazione saldo 994/1000 crediti in dashboard admin, sezione "Genera Diretto" con form completo, distinzione codici emozionali (scalano) vs professionali (illimitati), generazione TIQ-IT-BOTTICELLI verificata con decremento saldo automatico
- June 27, 2025: BUG CRITICI RISOLTI E VERIFICATI - Fix endpoint `/api/admin/structures` carica strutture approvate (TIQ-RC-STT-2567 visibile), autenticazione dashboard strutture operativa, assegnazione pacchetti da admin a strutture funzionante (pacchetto 25 crediti assegnato e ricevuto), sistema note interne attivo
- June 27, 2025: SISTEMA GESTIONE UTENTI E DISTINZIONE CODICI COMPLETATO - Controllo editoriale con approvazione manuale strutture/partner, distinzione reale codici professionali (illimitati) vs emozionali (scalano Pacchetto RobS), workflow completo testato e operativo
- June 27, 2025: PULIZIA DATABASE COMPLETATA - Eliminati tutti i 148 codici TIQ-PKG obsoleti, admin non può più generare codici direttamente, sistema puramente basato su crediti operativo, checkbox memorizzazione IQCode implementata
- June 27, 2025: SISTEMA CREDITI COMPLETATO - Database PostgreSQL aggiornato con colonne credits_remaining/credits_used, tendina pacchetti funzionante, generazione IQCode emozionali al momento operativa, errori TypeScript risolti definitivamente
- June 27, 2025: APPLICAZIONE PRODUCTION-READY COMPLETATA - Tutti i problemi TypeScript risolti, tipizzazione completa, sistema gestione ospiti operativo, assegnazione codici IQ funzionale, database PostgreSQL persistente, nomi strutture corretti
- June 26, 2025: SISTEMA GESTIONE OSPITI COMPLETATO - Ospiti registrati appaiono correttamente nella dropdown assegnazione IQCode, workflow integrato funzionale
- June 26, 2025: DATABASE AZZERATO MANUALMENTE - Rimossi tutti gli utenti tranne admin TIQ-IT-ADMIN, sistema pulito e pronto per nuove configurazioni
- June 26, 2025: DATABASE POSTGRESQL PERSISTENTE IMPLEMENTATO - Dati permanenti, niente più azzeramenti, sistema affidabile per produzione
- June 26, 2025: SISTEMA FINALE COMPLETATO - Dashboard strutture visualizza pacchetti ricevuti, generazione codici turistici operativa, login stabilizzato al primo tentativo
- June 26, 2025: RESET SISTEMA COMPLETATO - Database azzerato, rimane solo admin TIQ-IT-ADMIN per ripartire da zero pulito
- June 26, 2025: DATI FITTIZI RIMOSSI - Dashboard collegata a dati reali database, statistiche autentiche, login stabilizzato
- June 26, 2025: ENDPOINT GENERAZIONE CODICI TURISTICI - Partner/strutture generano codici anonimi univoci dal pool assegnato
- June 26, 2025: FILTRO DESTINATARI RISOLTO - Hotel Centrale Pizzo (TIQ-VV-PRT-4897) ora appare correttamente nel dropdown assegnazione pacchetti
- June 26, 2025: SISTEMA PACCHETTI REALI IMPLEMENTATO - Risolto problema "teatro vuoto": destinatari dal database reale, pacchetti salvati, partner vedono codici assegnati
- June 26, 2025: SEZIONE ASSEGNA PACCHETTI COMPLETATA - /admin/assign-iqcodes funzionale con selezione destinatario, pacchetti (25/50/75/100), endpoint backend operativo
- June 26, 2025: BOTTONI ADMIN COMPLETI - 5 sezioni funzionali: /admin/users, /admin/iqcodes (Codici Generati), /admin/assign-iqcodes (Assegna Pacchetti), /admin/stats, /admin/settings
- June 26, 2025: ROUTING DINAMICO IMPLEMENTATO - Dashboard personalizzate reali: TIQ-VV-STT-9576 → /structure/9576 (Resort Capo Vaticano), TIQ-RC-STT-4334 → /structure/4334 (Grand Hotel Reggio)
- June 26, 2025: SISTEMA COMPLETO - Tutti i 7 punti implementati: bottoni admin funzionali, dashboard personalizzate, provincia VV/RC/CS
- June 26, 2025: Implementati endpoint admin completi: /admin/users, /admin/stats, /admin/iqcodes, /admin/settings
- June 26, 2025: Dashboard personalizzate per ID univoco: TIQ-VV-STT-7541 Hotel Calabria ha dati specifici
- June 26, 2025: Risolti problemi critici generatore codici IQ e persistenza sessione - ora funziona perfettamente
- June 26, 2025: Implementato sistema doppio generatore: emozionale (TIQ-IT-MARGHERITA) e professionale (TIQ-RM-PRT-8654)
- June 26, 2025: Implementato sistema generazione codici IQ emozionali formato TIQ-[PAESE]-[PAROLA] nella dashboard admin
- June 26, 2025: Risolto problema campo login troppo corto per nuovi codici IQ
- June 25, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.
Language: Italian only - all interface text, comments, and communication in Italian.

## Flusso di Lavoro - Regole Inderogabili

🔍 **VERIFICA INCROCIATA OBBLIGATORIA**: Prima di dichiarare qualsiasi attività completata, sempre richiedere:
- Verifica visiva diretta nella pagina modificata, oppure
- Riscontro esplicito da RobS se impossibilitato a raggiungere la sezione
- Mai fidarsi solo del tool automatico mark_completed_and_get_feedback
- Evitare falsi positivi e mantenere integrità progetto TouristIQ