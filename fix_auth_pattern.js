const fs = require('fs');

// Leggi il file routes.ts
let content = fs.readFileSync('server/routes.ts', 'utf8');

// Pattern da sostituire: controllo ruolo via database invece che sessione
const oldPattern = /const userIqCode = await storage\.getIqCodeByCode\(session\.iqCode\);\s*if \(!userIqCode \|\| userIqCode\.role !== 'admin'\) {\s*return res\.status\(403\)\.json\(\{ message: "Accesso negato - solo admin" \}\);\s*}/g;

const newPattern = `if (session.role !== 'admin') {
        return res.status(403).json({ message: "Accesso negato - solo admin" });
      }`;

// Sostituisci tutte le occorrenze
content = content.replace(oldPattern, newPattern);

// Scrivi il file aggiornato
fs.writeFileSync('server/routes.ts', content);

console.log('✅ Pattern auth admin corretto!');