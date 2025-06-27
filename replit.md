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