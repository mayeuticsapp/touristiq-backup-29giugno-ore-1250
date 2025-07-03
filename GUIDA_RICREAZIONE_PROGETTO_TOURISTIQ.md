# Guida Completa per Ricreare TouristIQ da Zero

## Panoramica del Progetto
TouristIQ è una piattaforma di gestione turismo con sistema di validazione IQCode centrale. Include dashboard separate per Admin, Turisti, Strutture e Partner con autenticazione basata su codici IQ univoci.

## Stack Tecnologico
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL con Drizzle ORM
- **Styling**: Tailwind CSS + shadcn/ui
- **Routing**: Wouter
- **State Management**: TanStack Query

## Passaggi per Importare da Git Repository

### 1. Creare Repository Git (se necessario)
```bash
# Sul computer locale
git init
git add .
git commit -m "Initial commit TouristIQ"
git remote add origin https://github.com/TUO_USERNAME/touristiq.git
git push -u origin main
```

### 2. Importare su Replit
1. Vai su [replit.com](https://replit.com)
2. Clicca "Create Repl"
3. Seleziona "Import from GitHub"
4. Inserisci URL del repository: `https://github.com/TUO_USERNAME/touristiq`
5. Clicca "Import from GitHub"

### 3. Configurazione Ambiente Replit
1. Assicurati che il linguaggio sia impostato su "Node.js"
2. Aggiungi il modulo PostgreSQL:
   - Vai su "Tools" → "Database"
   - Seleziona "PostgreSQL"
   - Clicca "Add Database"

### 4. Configurazione Variabili Ambiente
Crea file `.env` nella root:
```env
DATABASE_URL=postgresql://[username]:[password]@[host]:[port]/[database]
OPENAI_API_KEY=sk-...
NODE_ENV=development
```

### 5. Installazione Dipendenze
Il progetto utilizza npm, le dipendenze verranno installate automaticamente da `package.json`.

## Struttura Completa del Progetto

### File di Configurazione

#### package.json
```json
{
  "name": "rest-express",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build",
    "build:server": "esbuild server/index.ts --bundle --platform=node --outfile=dist/server.js --external:pg-native",
    "start": "node dist/server.js",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.9.1",
    "@neondatabase/serverless": "^0.10.6",
    "@radix-ui/react-accordion": "^1.2.2",
    "@radix-ui/react-alert-dialog": "^1.1.4",
    "@radix-ui/react-aspect-ratio": "^1.1.1",
    "@radix-ui/react-avatar": "^1.1.1",
    "@radix-ui/react-checkbox": "^1.1.3",
    "@radix-ui/react-collapsible": "^1.1.1",
    "@radix-ui/react-context-menu": "^2.2.4",
    "@radix-ui/react-dialog": "^1.1.4",
    "@radix-ui/react-dropdown-menu": "^2.1.4",
    "@radix-ui/react-hover-card": "^1.1.4",
    "@radix-ui/react-label": "^2.1.1",
    "@radix-ui/react-menubar": "^1.1.4",
    "@radix-ui/react-navigation-menu": "^1.2.2",
    "@radix-ui/react-popover": "^1.1.4",
    "@radix-ui/react-progress": "^1.1.1",
    "@radix-ui/react-radio-group": "^1.2.2",
    "@radix-ui/react-scroll-area": "^1.2.1",
    "@radix-ui/react-select": "^2.1.4",
    "@radix-ui/react-separator": "^1.1.1",
    "@radix-ui/react-slider": "^1.2.1",
    "@radix-ui/react-slot": "^1.1.1",
    "@radix-ui/react-switch": "^1.1.1",
    "@radix-ui/react-tabs": "^1.1.1",
    "@radix-ui/react-toast": "^1.2.4",
    "@radix-ui/react-toggle": "^1.1.1",
    "@radix-ui/react-toggle-group": "^1.1.1",
    "@radix-ui/react-tooltip": "^1.1.6",
    "@tanstack/react-query": "^5.62.3",
    "@tailwindcss/typography": "^0.5.15",
    "@tailwindcss/vite": "^4.0.10",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "cmdk": "1.0.0",
    "connect-pg-simple": "^10.0.0",
    "cookie-parser": "^1.4.7",
    "date-fns": "^4.1.0",
    "drizzle-orm": "^0.36.4",
    "drizzle-zod": "^0.5.1",
    "embla-carousel-react": "^8.5.1",
    "express": "^4.21.1",
    "express-session": "^1.18.1",
    "framer-motion": "^11.15.0",
    "input-otp": "^1.4.1",
    "jspdf": "^2.5.2",
    "lucide-react": "^0.468.0",
    "memorystore": "^1.6.7",
    "next-themes": "^0.4.4",
    "openai": "^4.73.1",
    "passport": "^0.7.0",
    "passport-local": "^1.0.0",
    "pdfkit": "^0.15.0",
    "pg": "^8.13.1",
    "react": "^18.3.1",
    "react-day-picker": "9.2.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.54.0",
    "react-icons": "^5.4.0",
    "react-resizable-panels": "^2.1.8",
    "recharts": "^2.13.3",
    "tailwind-merge": "^2.5.5",
    "tailwindcss": "^3.4.17",
    "tailwindcss-animate": "^1.0.7",
    "tw-animate-css": "^1.0.1",
    "vaul": "^1.1.2",
    "wouter": "^3.3.6",
    "ws": "^8.18.0",
    "zod": "^3.23.8",
    "zod-validation-error": "^3.4.0"
  },
  "devDependencies": {
    "@jridgewell/trace-mapping": "^0.3.25",
    "@replit/vite-plugin-cartographer": "^2.0.1",
    "@replit/vite-plugin-runtime-error-modal": "^1.0.0",
    "@types/connect-pg-simple": "^7.0.3",
    "@types/express": "^5.0.0",
    "@types/express-session": "^1.18.0",
    "@types/node": "^22.10.2",
    "@types/passport": "^1.0.16",
    "@types/passport-local": "^1.0.38",
    "@types/pdfkit": "^0.13.5",
    "@types/pg": "^8.11.10",
    "@types/react": "^18.3.17",
    "@types/react-dom": "^18.3.5",
    "@types/ws": "^8.5.13",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "drizzle-kit": "^0.28.1",
    "esbuild": "^0.24.2",
    "postcss": "^8.5.8",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "vite": "^6.0.3"
  }
}
```

#### vite.config.ts
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@assets': path.resolve(__dirname, './attached_assets'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist/client',
  },
});
```

#### tailwind.config.ts
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./client/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

#### drizzle.config.ts
```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './shared/schema.ts',
  out: './migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

#### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./client/src/*"],
      "@assets/*": ["./attached_assets/*"]
    }
  },
  "include": [
    "client/src",
    "server",
    "shared"
  ],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### Schema Database (shared/schema.ts)
```typescript
import { pgTable, serial, text, timestamp, integer, boolean, varchar } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';

export const iqCodes = pgTable('iq_codes', {
  id: serial('id').primaryKey(),
  code: text('code').notNull().unique(),
  role: text('role').notNull(), // 'admin', 'tourist', 'structure', 'partner'
  createdAt: timestamp('created_at').defaultNow().notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  guestName: text('guest_name'),
  structureAssigned: text('structure_assigned'),
  internalNote: text('internal_note'),
});

export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  sessionToken: text('session_token').notNull().unique(),
  iqCode: text('iq_code').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const packageAssignments = pgTable('package_assignments', {
  id: serial('id').primaryKey(),
  recipientIqCode: text('recipient_iq_code').notNull(),
  packageSize: integer('package_size').notNull(),
  assignedBy: text('assigned_by').notNull(),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  status: text('status').default('active').notNull(),
  creditsRemaining: integer('credits_remaining').notNull(),
  creditsUsed: integer('credits_used').default(0).notNull(),
});

export const iqcodeValidations = pgTable('iqcode_validations', {
  id: serial('id').primaryKey(),
  touristIqCode: text('tourist_iq_code').notNull(),
  partnerCode: text('partner_code').notNull(),
  partnerName: text('partner_name').notNull(),
  status: text('status').default('pending').notNull(), // 'pending', 'accepted', 'rejected'
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  respondedAt: timestamp('responded_at'),
  usesRemaining: integer('uses_remaining').default(10).notNull(),
  usesTotal: integer('uses_total').default(10).notNull(),
});

export const iqcodeRecharges = pgTable('iqcode_recharges', {
  id: serial('id').primaryKey(),
  validationId: integer('validation_id').notNull(),
  touristIqCode: text('tourist_iq_code').notNull(),
  status: text('status').default('pending').notNull(),
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  activatedAt: timestamp('activated_at'),
  activatedBy: text('activated_by'),
});

export const partnerOffers = pgTable('partner_offers', {
  id: serial('id').primaryKey(),
  partnerCode: text('partner_code').notNull(),
  partnerName: text('partner_name').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  discountPercentage: integer('discount_percentage').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const accountingMovements = pgTable('accounting_movements', {
  id: serial('id').primaryKey(),
  iqCode: text('iq_code').notNull(),
  date: text('date').notNull(),
  description: text('description').notNull(),
  type: text('type').notNull(), // 'income' or 'expense'
  amount: integer('amount').notNull(), // In cents
  category: text('category').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Zod schemas
export const insertIqCodeSchema = createInsertSchema(iqCodes).omit({
  id: true,
  createdAt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

export const insertPackageAssignmentSchema = createInsertSchema(packageAssignments).omit({
  id: true,
  assignedAt: true,
});

export const insertIqcodeValidationSchema = createInsertSchema(iqcodeValidations).omit({
  id: true,
  requestedAt: true,
});

export const insertPartnerOfferSchema = createInsertSchema(partnerOffers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAccountingMovementSchema = createInsertSchema(accountingMovements).omit({
  id: true,
  createdAt: true,
});

// Types
export type IqCode = typeof iqCodes.$inferSelect;
export type InsertIqCode = z.infer<typeof insertIqCodeSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type PackageAssignment = typeof packageAssignments.$inferSelect;
export type InsertPackageAssignment = z.infer<typeof insertPackageAssignmentSchema>;
export type IqcodeValidation = typeof iqcodeValidations.$inferSelect;
export type InsertIqcodeValidation = z.infer<typeof insertIqcodeValidationSchema>;
export type PartnerOffer = typeof partnerOffers.$inferSelect;
export type InsertPartnerOffer = z.infer<typeof insertPartnerOfferSchema>;
export type AccountingMovement = typeof accountingMovements.$inferSelect;
export type InsertAccountingMovement = z.infer<typeof insertAccountingMovementSchema>;

export type UserRole = 'admin' | 'tourist' | 'structure' | 'partner';
```

## Dati di Test Iniziali

Dopo aver configurato il database, inserire questi dati di test:

### Admin di Default
```sql
INSERT INTO iq_codes (code, role, is_active, internal_note) 
VALUES ('TIQ-IT-ADMIN', 'admin', true, '{"credits_remaining": 1000, "credits_used": 0}');
```

### Strutture di Test
```sql
INSERT INTO iq_codes (code, role, is_active, internal_note) 
VALUES 
('TIQ-VV-STT-9576', 'structure', true, '{"businessName": "Resort Capo Vaticano", "approved": true}'),
('TIQ-RC-STT-4334', 'structure', true, '{"businessName": "Grand Hotel Reggio", "approved": true}');
```

### Partner di Test
```sql
INSERT INTO iq_codes (code, role, is_active, internal_note) 
VALUES 
('TIQ-VV-PRT-2250', 'partner', true, '{"businessName": "Ristorante Il Borgo", "completed": true}'),
('TIQ-RC-PRT-5842', 'partner', true, '{"businessName": "Boutique Calabria", "completed": true}');
```

### Turisti di Test
```sql
INSERT INTO iq_codes (code, role, is_active, guest_name) 
VALUES 
('TIQ-IT-MARE', 'tourist', true, 'Mario Rossi'),
('TIQ-IT-SOLE', 'tourist', true, 'Anna Bianchi');
```

### Offerte Partner di Test
```sql
INSERT INTO partner_offers (partner_code, partner_name, title, description, discount_percentage) 
VALUES 
('TIQ-VV-PRT-2250', 'Ristorante Il Borgo', 'Menu Degustazione', 'Menu tipico calabrese con prodotti locali', 15),
('TIQ-RC-PRT-5842', 'Boutique Calabria', 'Abbigliamento Estivo', 'Collezione primavera/estate moda calabrese', 20);
```

## Comando di Avvio

Dopo aver configurato tutto:

1. Installa dipendenze: `npm install`
2. Configura database: `npm run db:push`
3. Inserisci dati di test (SQL sopra)
4. Avvia applicazione: `npm run dev`

## Note Importanti

- **DATABASE_URL**: Assicurati che sia configurato correttamente
- **OPENAI_API_KEY**: Necessario per la funzionalità TIQai Chat
- **Workflow Replit**: Il progetto usa il workflow "Start application" che esegue `npm run dev`
- **Porte**: Il server gira sulla porta 5000, Vite su 3000
- **Build Production**: Usa `npm run build` per creare il build di produzione

## Struttura Cartelle Finale

```
touristiq/
├── client/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── lib/
│       └── App.tsx
├── server/
│   ├── index.ts
│   ├── routes.ts
│   └── storage.ts
├── shared/
│   └── schema.ts
├── migrations/
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── drizzle.config.ts
├── tsconfig.json
└── .env
```

Questa guida ti permetterà di ricreare completamente il progetto TouristIQ su qualsiasi nuovo account Replit con tutte le funzionalità operative.