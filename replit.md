# TouristIQ Platform

## Overview
TouristIQ is a role-based authentication platform designed for the tourism industry, offering distinct dashboards and functionalities for Admin, Tourist, Structure (accommodation), and Partner (local businesses). Users authenticate using unique IQ codes, which dictate their access level and interface. The platform's ambition is to evolve into the "Operating System of Italian Tourism" by 2026, transforming from a discount platform to a "Territorial Nervous System" that fosters authentic human connections and enriches the tourist experience across Italy.

## User Preferences
Preferred communication style: Simple, everyday language.
Language: Italian only - all interface text, comments, and communication in Italian.

## System Architecture
### Frontend
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **Styling**: Tailwind CSS with shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Build Tool**: Vite
- **UI/UX**: Emphasis on warm, inviting Italian-inspired aesthetics (gradients, micro-animations, evocative microcopy), accessible design, and intuitive navigation. Educational pop-ups guide users through features.

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Session Management**: Cookie-based with custom storage
- **API Structure**: RESTful endpoints under `/api`

### Database
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (configured for Neon Database)
- **Schema Management**: Drizzle Kit
- **Data Validation**: Zod schemas
- **Key Tables**: `iq_codes` (authentication), `sessions` (user sessions), `system_settings`, `iqcode_recovery_keys`, `iqcode_validations`, `partner_offers`, `structure_guest_savings`.

### Core Features
- **IQ Code Authentication**: Unique alphanumeric codes for login and role-based access.
- **Role-Based Dashboards**:
    - **Admin**: System management, user oversight, statistics, recharge management.
    - **Tourist**: Discount discovery, IQ code management ("Custode del Codice"), TIQai AI assistant, savings tracking.
    - **Structure**: Accommodation management, guest IQ code generation, accounting mini-management.
    - **Partner**: Discount offer management, customer feedback, accounting mini-management, onboarding process.
- **TIQai (AI Assistant)**: An AI tourist assistant providing personalized recommendations, partner information, and managing special dietary needs.
- **IQ Code Recovery System ("Custode del Codice")**: Anonymous, secure recovery of IQ codes without email/phone, using a secret word and birthdate.
- **TIQ-OTC (One-Time Code) System**: Secure, single-use discount codes for tourists, validated by partners.
- **Internationalization**: Multi-language support for tourist-facing interfaces (Italian, English, Spanish, German).
- **Security**: Role-based access control, HTTP-only cookies, anti-bruteforce measures, data isolation for partners, anonymized IQ code display.

## External Dependencies
- **Database**: Neon Database (PostgreSQL)
- **AI**: Perplexity AI (for TIQai)
- **UI Components**: Radix UI primitives (via shadcn/ui)
- **Form Handling**: React Hook Form with Zod
- **Build Tools**: Vite, ESBuild
- **Type Checking**: TypeScript
- **Code Quality**: ESLint, Prettier
- **Deployment**: Replit (Node.js 20, PostgreSQL 16 module)
```