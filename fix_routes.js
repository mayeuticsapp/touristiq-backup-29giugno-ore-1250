// Script per risolvere errori TypeScript nel sistema crediti
const fs = require('fs');

// Leggi il file routes.ts
let content = fs.readFileSync('./server/routes.ts', 'utf8');

// Sostituisci tutti i riferimenti obsoleti a codesGenerated
content = content.replace(/codesGenerated: pkg\.codesGenerated,\s*availableCodes: pkg\.codesGenerated\?\.length \|\| 0/g, 
  'creditsRemaining: pkg.creditsRemaining,\n          creditsUsed: pkg.creditsUsed,\n          availableCodes: pkg.creditsRemaining');

// Sostituisci tutti i riferimenti a codesUsed (che non esiste)
content = content.replace(/codesUsed: pkg\.codesUsed/g, 'creditsUsed: pkg.creditsUsed');

// Scrivi il file aggiornato
fs.writeFileSync('./server/routes.ts', content);
console.log('File routes.ts aggiornato con sistema crediti');