# Sistema di Traduzione Automatica TouristIQ

## Panoramica
Sistema completo per la gestione automatica delle traduzioni multilingue con DeepL API e supporto per aggiunta dinamica di nuove lingue.

## Componenti

### 1. Script di Traduzione Automatica (`scripts/auto-translate.js`)
- **Rilevamento automatico** stringhe hardcoded nei componenti React
- **Traduzione via DeepL API** con privacy garantita
- **Generazione automatica** chiavi di traduzione
- **Aggiornamento** file di localizzazione esistenti
- **Report dettagliato** delle stringhe rilevate

### 2. Gestore Lingue (`scripts/add-languages.js`)
- **Aggiunta dinamica** di nuove lingue
- **Supporto 30+ lingue** tramite DeepL API
- **Aggiornamento automatico** configurazioni
- **Menu interattivo** per gestione facile

## Utilizzo

### Comando Rapido
```bash
# Rileva e traduce nuove stringhe
node scripts/auto-translate.js

# Aggiungi nuove lingue
node scripts/add-languages.js fr pt ru
```

### Configurazione DeepL API
```bash
# Imposta chiave API (opzionale per testing)
export DEEPL_API_KEY=your_api_key_here
```

### Esempi di Utilizzo

#### Traduzione Automatica
```bash
# Scansiona tutti i componenti e traduce stringhe nuove
node scripts/auto-translate.js

# Modalità dry-run (solo report)
CONFIG_DRY_RUN=true node scripts/auto-translate.js
```

#### Aggiunta Lingue
```bash
# Menu interattivo
node scripts/add-languages.js

# Lingue specifiche
node scripts/add-languages.js fr pt ru zh

# Lingue popolari (FR, PT, RU, ZH, JA, AR)
node scripts/add-languages.js popular

# Lingue europee (20+ lingue)
node scripts/add-languages.js european
```

## Lingue Supportate

### Attualmente Attive
- 🇮🇹 **Italiano** (IT) - Lingua base
- 🇬🇧 **Inglese** (EN) 
- 🇪🇸 **Spagnolo** (ES)
- 🇩🇪 **Tedesco** (DE)

### Disponibili per Aggiunta
- 🇫🇷 **Francese** (FR)
- 🇵🇹 **Portoghese** (PT)
- 🇷🇺 **Russo** (RU)
- 🇨🇳 **Cinese** (ZH)
- 🇯🇵 **Giapponese** (JA)
- 🇸🇦 **Arabo** (AR)
- 🇳🇱 **Olandese** (NL)
- 🇵🇱 **Polacco** (PL)
- 🇸🇪 **Svedese** (SV)
- 🇩🇰 **Danese** (DA)
- 🇳🇴 **Norvegese** (NO)
- 🇫🇮 **Finlandese** (FI)
- 🇹🇷 **Turco** (TR)
- 🇰🇷 **Coreano** (KO)
- 🇮🇳 **Hindi** (HI)
- 🇹🇭 **Tailandese** (TH)
- 🇻🇳 **Vietnamita** (VI)
- 🇺🇦 **Ucraino** (UK)
- **... e molte altre**

## Flusso di Lavoro

### Sviluppo Nuove Funzionalità
1. **Sviluppa** componente con testi in italiano
2. **Esegui** `node scripts/auto-translate.js`
3. **Verifica** traduzioni generate
4. **Testa** cambio lingua nel frontend

### Aggiunta Nuove Lingue
1. **Esegui** `node scripts/add-languages.js`
2. **Seleziona** lingue desiderate
3. **Attendi** traduzione automatica
4. **Riavvia** server per applicare modifiche

## Struttura File

```
client/src/i18n/locales/
├── it.json          # Lingua base (italiano)
├── en.json          # Inglese
├── es.json          # Spagnolo
├── de.json          # Tedesco
├── fr.json          # Francese (se aggiunta)
└── [new_lang].json  # Nuove lingue
```

## Categorizzazione Automatica
Il sistema organizza automaticamente le stringhe in categorie:
- **common**: Stringhe generiche
- **actions**: Bottoni e azioni
- **errors**: Messaggi di errore
- **success**: Messaggi di successo
- **loading**: Stati di caricamento

## Privacy e Sicurezza
- **Zero dati sensibili**: Solo testi interfaccia standard
- **DeepL API**: Nessuna memorizzazione permanente
- **Crittografia**: Dati criptati in transito
- **Conformità GDPR**: Privacy europea garantita

## Costi
- **Tier gratuito**: 500.000 caratteri/mese
- **TouristIQ stimato**: ~45.000 caratteri totali
- **Costo reale**: €0 (sempre sotto il limite gratuito)

## Monitoraggio
Il sistema genera automaticamente:
- **Report traduzioni** (`auto-translate-report.json`)
- **Log attività** con timestamp
- **Statistiche utilizzo** API
- **Errori e warning** dettagliati

## Requisiti Tecnici
- **Node.js** 18+
- **DeepL API Key** (opzionale per testing)
- **Accesso filesystem** per aggiornamenti
- **Connessione internet** per traduzioni

## Troubleshooting

### Errori Comuni
```bash
# Errore: DeepL API key non trovata
export DEEPL_API_KEY=your_key_here

# Errore: File di traduzione non trovato
npm run translate

# Errore: Lingua non supportata
node scripts/add-languages.js list
```

### Modalità Debug
```bash
# Verbose output
DEBUG=true node scripts/auto-translate.js

# Solo report senza modifiche
DRY_RUN=true node scripts/auto-translate.js
```

## Estensioni Future
- **Traduzione in tempo reale** per contenuti dinamici
- **Validazione qualità** traduzioni automatiche
- **Gestione varianti regionali** (es: pt-BR vs pt-PT)
- **Ottimizzazione cache** per performance
- **Integrazione CI/CD** per automazione completa

---

*Sistema progettato per scalabilità e semplicità d'uso*
*Supporta crescita da 4 a 30+ lingue senza refactoring*