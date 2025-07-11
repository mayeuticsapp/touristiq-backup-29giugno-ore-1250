#!/usr/bin/env node

/**
 * Sistema di Traduzione Automatica TouristIQ
 * Rileva stringhe hardcoded e genera traduzioni automatiche
 * Supporta DeepL API con privacy garantita
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione
const CONFIG = {
  sourceLanguage: 'it',
  targetLanguages: ['en', 'es', 'de'],
  deepLApiKey: process.env.DEEPL_API_KEY || '',
  localesDir: './client/src/i18n/locales',
  componentDirs: [
    './client/src/components',
    './client/src/pages',
    './client/src/lib'
  ],
  dryRun: false
};

// Patterns per rilevare stringhe hardcoded
const HARDCODED_PATTERNS = [
  // Testi in componenti React
  />\s*["']([^"']+)["']\s*</g,
  // Attributi placeholder, title, aria-label
  /(?:placeholder|title|aria-label)=["']([^"']+)["']/g,
  // Stringhe in JavaScript
  /(?:alert|confirm|prompt)\s*\(\s*["']([^"']+)["']\s*\)/g,
  // Toast messages
  /toast\s*\(\s*["']([^"']+)["']\s*\)/g,
  // Console.log messages (per debug)
  /console\.(?:log|warn|error)\s*\(\s*["']([^"']+)["']\s*\)/g
];

// Esclusioni (non tradurre)
const EXCLUDE_PATTERNS = [
  /^[A-Z_]+$/, // Costanti
  /^\d+$/, // Solo numeri
  /^[a-zA-Z0-9\-_]+$/, // IDs, classi CSS
  /^https?:\/\//, // URLs
  /^\/[a-zA-Z0-9\-_\/]+$/, // Percorsi
  /^[a-zA-Z0-9\-_]+\.[a-zA-Z]+$/ // File extensions
];

class AutoTranslator {
  constructor() {
    this.detectedStrings = new Set();
    this.existingKeys = new Map();
    this.loadExistingTranslations();
  }

  /**
   * Carica traduzioni esistenti
   */
  loadExistingTranslations() {
    const itPath = path.join(CONFIG.localesDir, 'it.json');
    if (fs.existsSync(itPath)) {
      const itContent = JSON.parse(fs.readFileSync(itPath, 'utf8'));
      this.flattenObject(itContent, '', this.existingKeys);
    }
  }

  /**
   * Appiattisce oggetto JSON per ricerca chiavi
   */
  flattenObject(obj, prefix, result) {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && value !== null) {
        this.flattenObject(value, fullKey, result);
      } else {
        result.set(fullKey, value);
      }
    }
  }

  /**
   * Scansiona file per stringhe hardcoded
   */
  scanForHardcodedStrings() {
    console.log('🔍 Scansione stringhe hardcoded in corso...');
    
    for (const dir of CONFIG.componentDirs) {
      if (fs.existsSync(dir)) {
        this.scanDirectory(dir);
      }
    }

    console.log(`📊 Trovate ${this.detectedStrings.size} stringhe candidate`);
  }

  /**
   * Scansiona directory ricorsivamente
   */
  scanDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);
    
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        this.scanDirectory(filePath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        this.scanFile(filePath);
      }
    }
  }

  /**
   * Scansiona singolo file
   */
  scanFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    for (const pattern of HARDCODED_PATTERNS) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const text = match[1];
        if (this.shouldTranslate(text)) {
          this.detectedStrings.add(text);
        }
      }
    }
  }

  /**
   * Determina se una stringa deve essere tradotta
   */
  shouldTranslate(text) {
    // Esclusioni
    for (const pattern of EXCLUDE_PATTERNS) {
      if (pattern.test(text)) return false;
    }
    
    // Troppo corta
    if (text.length < 3) return false;
    
    // Già tradotta
    if (Array.from(this.existingKeys.values()).includes(text)) return false;
    
    // Solo caratteri italiani/europei
    if (!/[a-zA-ZàèéìîíòóùúÀÈÉÌÎÍÒÓÙÚäöüÄÖÜñÑçÇ\s]/.test(text)) return false;
    
    return true;
  }

  /**
   * Genera chiave da testo
   */
  generateKey(text) {
    return text
      .toLowerCase()
      .replace(/[àèéìîíòóùú]/g, (match) => {
        const map = { 'à': 'a', 'è': 'e', 'é': 'e', 'ì': 'i', 'î': 'i', 'í': 'i', 'ò': 'o', 'ó': 'o', 'ù': 'u', 'ú': 'u' };
        return map[match] || match;
      })
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 20);
  }

  /**
   * Chiama DeepL API per traduzione
   */
  async translateText(text, targetLanguage) {
    if (!CONFIG.deepLApiKey) {
      console.log('⚠️  DEEPL_API_KEY non trovata, simulazione traduzione');
      return `[${targetLanguage.toUpperCase()}] ${text}`;
    }

    const data = new URLSearchParams({
      auth_key: CONFIG.deepLApiKey,
      text: text,
      source_lang: CONFIG.sourceLanguage.toUpperCase(),
      target_lang: targetLanguage.toUpperCase()
    });

    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api-free.deepl.com',
        port: 443,
        path: '/v2/translate',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': data.toString().length
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => responseData += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(responseData);
            if (response.translations && response.translations[0]) {
              resolve(response.translations[0].text);
            } else {
              reject(new Error('Traduzione non disponibile'));
            }
          } catch (error) {
            reject(error);
          }
        });
      });

      req.on('error', reject);
      req.write(data.toString());
      req.end();
    });
  }

  /**
   * Genera traduzioni per tutte le lingue
   */
  async generateTranslations() {
    console.log('🌍 Generazione traduzioni automatiche...');
    
    const newTranslations = {
      it: {},
      en: {},
      es: {},
      de: {}
    };

    // Carica traduzioni esistenti
    for (const lang of ['it', 'en', 'es', 'de']) {
      const filePath = path.join(CONFIG.localesDir, `${lang}.json`);
      if (fs.existsSync(filePath)) {
        newTranslations[lang] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    }

    // Aggiungi nuove stringhe
    for (const text of this.detectedStrings) {
      const key = this.generateKey(text);
      const categoryKey = this.categorizeString(text);
      
      // Aggiungi a italiano (source)
      if (!newTranslations.it[categoryKey]) {
        newTranslations.it[categoryKey] = {};
      }
      newTranslations.it[categoryKey][key] = text;

      // Traduci per altre lingue
      for (const lang of CONFIG.targetLanguages) {
        if (!newTranslations[lang][categoryKey]) {
          newTranslations[lang][categoryKey] = {};
        }
        
        try {
          const translated = await this.translateText(text, lang);
          newTranslations[lang][categoryKey][key] = translated;
          console.log(`✅ ${text} → [${lang}] ${translated}`);
          
          // Delay per rispettare rate limit
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.log(`❌ Errore traduzione [${lang}]: ${error.message}`);
          newTranslations[lang][categoryKey][key] = `[${lang.toUpperCase()}] ${text}`;
        }
      }
    }

    // Salva file aggiornati
    if (!CONFIG.dryRun) {
      for (const lang of ['it', 'en', 'es', 'de']) {
        const filePath = path.join(CONFIG.localesDir, `${lang}.json`);
        fs.writeFileSync(filePath, JSON.stringify(newTranslations[lang], null, 2), 'utf8');
        console.log(`💾 Aggiornato: ${filePath}`);
      }
    }
  }

  /**
   * Categorizza stringa per organizzazione
   */
  categorizeString(text) {
    if (text.includes('errore') || text.includes('error')) return 'errors';
    if (text.includes('successo') || text.includes('completato')) return 'success';
    if (text.includes('salva') || text.includes('conferma')) return 'actions';
    if (text.includes('carica') || text.includes('attendi')) return 'loading';
    return 'common';
  }

  /**
   * Genera report di stringhe rilevate
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      detectedStrings: Array.from(this.detectedStrings),
      existingKeys: Array.from(this.existingKeys.entries()),
      summary: {
        totalDetected: this.detectedStrings.size,
        totalExisting: this.existingKeys.size,
        newStrings: this.detectedStrings.size
      }
    };

    fs.writeFileSync('./auto-translate-report.json', JSON.stringify(report, null, 2));
    console.log('📊 Report generato: auto-translate-report.json');
  }

  /**
   * Esegue processo completo
   */
  async run() {
    console.log('🚀 Avvio Sistema di Traduzione Automatica TouristIQ\n');
    
    try {
      this.scanForHardcodedStrings();
      this.generateReport();
      
      if (this.detectedStrings.size > 0) {
        await this.generateTranslations();
        console.log('\n✅ Traduzione automatica completata!');
      } else {
        console.log('\n✅ Nessuna nuova stringa da tradurre trovata');
      }
    } catch (error) {
      console.error('❌ Errore durante la traduzione:', error.message);
      process.exit(1);
    }
  }
}

// Esecuzione
if (import.meta.url === `file://${process.argv[1]}`) {
  const translator = new AutoTranslator();
  translator.run();
}

export default AutoTranslator;