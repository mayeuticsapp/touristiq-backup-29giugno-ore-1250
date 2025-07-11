#!/usr/bin/env node

/**
 * Script per aggiungere nuove lingue al sistema TouristIQ
 * Crea automaticamente file di traduzione e aggiorna configurazioni
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione lingue disponibili
const AVAILABLE_LANGUAGES = {
  'fr': { name: 'Français', flag: '🇫🇷', deepLCode: 'FR' },
  'pt': { name: 'Português', flag: '🇵🇹', deepLCode: 'PT' },
  'ru': { name: 'Русский', flag: '🇷🇺', deepLCode: 'RU' },
  'zh': { name: '中文', flag: '🇨🇳', deepLCode: 'ZH' },
  'ja': { name: '日本語', flag: '🇯🇵', deepLCode: 'JA' },
  'ar': { name: 'العربية', flag: '🇸🇦', deepLCode: 'AR' },
  'nl': { name: 'Nederlands', flag: '🇳🇱', deepLCode: 'NL' },
  'pl': { name: 'Polski', flag: '🇵🇱', deepLCode: 'PL' },
  'sv': { name: 'Svenska', flag: '🇸🇪', deepLCode: 'SV' },
  'da': { name: 'Dansk', flag: '🇩🇰', deepLCode: 'DA' },
  'no': { name: 'Norsk', flag: '🇳🇴', deepLCode: 'NB' },
  'fi': { name: 'Suomi', flag: '🇫🇮', deepLCode: 'FI' },
  'tr': { name: 'Türkçe', flag: '🇹🇷', deepLCode: 'TR' },
  'ko': { name: '한국어', flag: '🇰🇷', deepLCode: 'KO' },
  'hi': { name: 'हिन्दी', flag: '🇮🇳', deepLCode: 'HI' },
  'th': { name: 'ไทย', flag: '🇹🇭', deepLCode: 'TH' },
  'vi': { name: 'Tiếng Việt', flag: '🇻🇳', deepLCode: 'VI' },
  'uk': { name: 'Українська', flag: '🇺🇦', deepLCode: 'UK' },
  'cs': { name: 'Čeština', flag: '🇨🇿', deepLCode: 'CS' },
  'hu': { name: 'Magyar', flag: '🇭🇺', deepLCode: 'HU' },
  'ro': { name: 'Română', flag: '🇷🇴', deepLCode: 'RO' },
  'bg': { name: 'Български', flag: '🇧🇬', deepLCode: 'BG' },
  'hr': { name: 'Hrvatski', flag: '🇭🇷', deepLCode: 'HR' },
  'sk': { name: 'Slovenčina', flag: '🇸🇰', deepLCode: 'SK' },
  'sl': { name: 'Slovenščina', flag: '🇸🇮', deepLCode: 'SL' },
  'et': { name: 'Eesti', flag: '🇪🇪', deepLCode: 'ET' },
  'lv': { name: 'Latviešu', flag: '🇱🇻', deepLCode: 'LV' },
  'lt': { name: 'Lietuvių', flag: '🇱🇹', deepLCode: 'LT' },
  'mt': { name: 'Malti', flag: '🇲🇹', deepLCode: 'MT' },
  'ga': { name: 'Gaeilge', flag: '🇮🇪', deepLCode: 'GA' },
  'cy': { name: 'Cymraeg', flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿', deepLCode: 'CY' },
  'is': { name: 'Íslenska', flag: '🇮🇸', deepLCode: 'IS' },
  'mk': { name: 'Македонски', flag: '🇲🇰', deepLCode: 'MK' },
  'sq': { name: 'Shqip', flag: '🇦🇱', deepLCode: 'SQ' },
  'sr': { name: 'Српски', flag: '🇷🇸', deepLCode: 'SR' },
  'bs': { name: 'Bosanski', flag: '🇧🇦', deepLCode: 'BS' },
  'me': { name: 'Crnogorski', flag: '🇲🇪', deepLCode: 'ME' }
};

class LanguageManager {
  constructor() {
    this.localesDir = './client/src/i18n/locales';
    this.configFiles = [
      './client/src/components/language-selector.tsx',
      './client/src/lib/translations.ts'
    ];
  }

  /**
   * Lista lingue disponibili per aggiunta
   */
  listAvailableLanguages() {
    const existing = this.getExistingLanguages();
    const available = Object.entries(AVAILABLE_LANGUAGES)
      .filter(([code]) => !existing.includes(code))
      .map(([code, info]) => ({ code, ...info }));

    console.log('\n🌍 Lingue disponibili per aggiunta:\n');
    available.forEach(lang => {
      console.log(`  ${lang.flag} ${lang.code} - ${lang.name}`);
    });
    
    return available;
  }

  /**
   * Ottieni lingue esistenti
   */
  getExistingLanguages() {
    if (!fs.existsSync(this.localesDir)) return [];
    
    return fs.readdirSync(this.localesDir)
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
  }

  /**
   * Traduce testo con DeepL
   */
  async translateText(text, targetLanguage) {
    const deepLCode = AVAILABLE_LANGUAGES[targetLanguage]?.deepLCode;
    if (!deepLCode) {
      throw new Error(`Lingua ${targetLanguage} non supportata da DeepL`);
    }

    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey) {
      console.log(`⚠️  DEEPL_API_KEY non trovata, simulazione per ${targetLanguage}`);
      return `[${targetLanguage.toUpperCase()}] ${text}`;
    }

    const data = new URLSearchParams({
      auth_key: apiKey,
      text: text,
      source_lang: 'IT',
      target_lang: deepLCode
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
   * Crea file di traduzione per nuova lingua
   */
  async createLanguageFile(languageCode) {
    const langInfo = AVAILABLE_LANGUAGES[languageCode];
    if (!langInfo) {
      throw new Error(`Lingua ${languageCode} non supportata`);
    }

    // Carica template italiano
    const itPath = path.join(this.localesDir, 'it.json');
    if (!fs.existsSync(itPath)) {
      throw new Error('File it.json non trovato');
    }

    const itContent = JSON.parse(fs.readFileSync(itPath, 'utf8'));
    const newContent = {};

    console.log(`🔄 Creazione file ${languageCode}.json...`);
    
    // Traduce ricorsivamente
    await this.translateObject(itContent, newContent, languageCode);
    
    // Salva file
    const newPath = path.join(this.localesDir, `${languageCode}.json`);
    fs.writeFileSync(newPath, JSON.stringify(newContent, null, 2), 'utf8');
    
    console.log(`✅ File creato: ${newPath}`);
  }

  /**
   * Traduce oggetto ricorsivamente
   */
  async translateObject(source, target, languageCode) {
    for (const [key, value] of Object.entries(source)) {
      if (typeof value === 'object' && value !== null) {
        target[key] = {};
        await this.translateObject(value, target[key], languageCode);
      } else if (typeof value === 'string') {
        try {
          target[key] = await this.translateText(value, languageCode);
          console.log(`  ✅ ${key}: ${value} → ${target[key]}`);
          
          // Delay per rate limit
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.log(`  ❌ ${key}: ${error.message}`);
          target[key] = `[${languageCode.toUpperCase()}] ${value}`;
        }
      }
    }
  }

  /**
   * Aggiorna language selector
   */
  updateLanguageSelector(newLanguages) {
    const selectorPath = './client/src/components/language-selector.tsx';
    if (!fs.existsSync(selectorPath)) return;

    let content = fs.readFileSync(selectorPath, 'utf8');
    
    // Trova array languages
    const languagesRegex = /const languages = \[\s*([\s\S]*?)\s*\];/;
    const match = content.match(languagesRegex);
    
    if (match) {
      const existing = this.getExistingLanguages();
      const allLanguages = [...existing, ...newLanguages];
      
      const languageEntries = allLanguages.map(code => {
        const info = AVAILABLE_LANGUAGES[code] || { name: code, flag: '🌍' };
        return `    { code: '${code}', name: '${info.name}', flag: '${info.flag}' }`;
      }).join(',\n');
      
      const newLanguagesArray = `const languages = [\n${languageEntries}\n  ];`;
      content = content.replace(languagesRegex, newLanguagesArray);
      
      fs.writeFileSync(selectorPath, content, 'utf8');
      console.log(`✅ Aggiornato: ${selectorPath}`);
    }
  }

  /**
   * Aggiunge lingue specifiche
   */
  async addLanguages(languageCodes) {
    const existing = this.getExistingLanguages();
    const toAdd = languageCodes.filter(code => !existing.includes(code));
    
    if (toAdd.length === 0) {
      console.log('✅ Tutte le lingue sono già presenti');
      return;
    }

    console.log(`🌍 Aggiunta lingue: ${toAdd.join(', ')}`);
    
    for (const code of toAdd) {
      await this.createLanguageFile(code);
    }
    
    this.updateLanguageSelector(toAdd);
    
    console.log('\n✅ Lingue aggiunte con successo!');
    console.log('🔄 Riavvia il server per applicare le modifiche');
  }

  /**
   * Aggiunge lingue più popolari
   */
  async addPopularLanguages() {
    const popular = ['fr', 'pt', 'ru', 'zh', 'ja', 'ar'];
    await this.addLanguages(popular);
  }

  /**
   * Aggiunge lingue europee
   */
  async addEuropeanLanguages() {
    const european = ['fr', 'pt', 'ru', 'nl', 'pl', 'sv', 'da', 'no', 'fi', 'tr', 'uk', 'cs', 'hu', 'ro', 'bg', 'hr', 'sk', 'sl', 'et', 'lv', 'lt'];
    await this.addLanguages(european);
  }

  /**
   * Menu interattivo
   */
  async interactiveMenu() {
    console.log('\n🌍 TouristIQ Language Manager\n');
    console.log('1. Lista lingue disponibili');
    console.log('2. Aggiungi lingue specifiche');
    console.log('3. Aggiungi lingue popolari (FR, PT, RU, ZH, JA, AR)');
    console.log('4. Aggiungi lingue europee');
    console.log('5. Esci\n');
    
    const { createInterface } = await import('readline');
    const readline = createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question('Seleziona opzione: ', async (choice) => {
      try {
        switch (choice) {
          case '1':
            this.listAvailableLanguages();
            break;
          case '2':
            readline.question('Inserisci codici lingua (separati da virgola): ', async (codes) => {
              const languageCodes = codes.split(',').map(s => s.trim());
              await this.addLanguages(languageCodes);
              readline.close();
            });
            return;
          case '3':
            await this.addPopularLanguages();
            break;
          case '4':
            await this.addEuropeanLanguages();
            break;
          case '5':
            console.log('👋 Arrivederci!');
            break;
          default:
            console.log('❌ Opzione non valida');
        }
      } catch (error) {
        console.error('❌ Errore:', error.message);
      }
      readline.close();
    });
  }
}

// Esecuzione
if (import.meta.url === `file://${process.argv[1]}`) {
  const manager = new LanguageManager();
  
  // Controlla argomenti comando
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    manager.interactiveMenu();
  } else if (args[0] === 'list') {
    manager.listAvailableLanguages();
  } else if (args[0] === 'popular') {
    manager.addPopularLanguages();
  } else if (args[0] === 'european') {
    manager.addEuropeanLanguages();
  } else {
    manager.addLanguages(args);
  }
}

export default LanguageManager;