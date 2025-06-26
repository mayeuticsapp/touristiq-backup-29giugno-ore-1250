// TouristIQ Emotional Code Generator
// Format: TIQ-[COUNTRY]-[EMOTIONAL_WORD]

interface CountryWords {
  [key: string]: {
    name: string;
    flag: string;
    words: string[];
  };
}

export const COUNTRY_EMOTIONAL_WORDS: CountryWords = {
  IT: {
    name: "Italia",
    flag: "🇮🇹",
    words: [
      // Arte e Cultura
      "LEONARDO", "MICHELANGELO", "RAFFAELLO", "BERNINI", "BOTTICELLI",
      "CARAVAGGIO", "GIOTTO", "DONATELLO", "DANTE", "PETRARCA",
      
      // Luoghi Iconici
      "COLOSSEO", "VENEZIA", "DUOMO", "PANTHEON", "POMPEI",
      "CAPRI", "AMALFI", "PORTOFINO", "BELLAGIO", "TAORMINA",
      
      // Cucina
      "TIRAMISU", "GELATO", "CANNOLI", "RISOTTO", "GNOCCHI",
      "CARBONARA", "AMATRICIANA", "MARGHERITA", "PARMIGIANO", "PROSCIUTTO",
      
      // Bellezza
      "BELLEZZA", "SPLENDORE", "MERAVIGLIA", "MAGNIFICO", "INCANTEVOLE",
      "STUPENDO", "FANTASTICO", "ELEGANZA", "GRAZIA", "ARMONIA",
      
      // Natura
      "SOLE", "MARE", "CIELO", "STELLA", "AURORA",
      "TRAMONTO", "ALBA", "BREZZA", "ROSA", "GIRASOLE"
    ]
  },
  
  ES: {
    name: "España",
    flag: "🇪🇸",
    words: [
      "GAUDI", "ALHAMBRA", "SAGRADA", "FLAMENCO", "PAELLA",
      "GUERNICA", "PICASSO", "DALI", "SEVILLA", "BARCELONA",
      "MADRID", "VALENCIA", "TOLEDO", "CORDOBA", "GRANADA",
      "TAPAS", "SANGRIA", "JAMÓN", "GAZPACHO", "CHURROS"
    ]
  },
  
  FR: {
    name: "France",
    flag: "🇫🇷",
    words: [
      "LUMIÈRE", "EIFFEL", "LOUVRE", "MONET", "RENOIR",
      "VERSAILLES", "CHAMPAGNE", "CROISSANT", "MACARON", "BAGUETTE",
      "PROVENCE", "BORDEAUX", "NORMANDIE", "RIVIERA", "CHÂTEAU"
    ]
  },
  
  JP: {
    name: "日本",
    flag: "🇯🇵", 
    words: [
      "SAKURA", "FUJI", "KYOTO", "TOKYO", "SUSHI",
      "RAMEN", "TEMPURA", "GEISHA", "SAMURAI", "ZEN",
      "IKEBANA", "ORIGAMI", "HAIKU", "MANGA", "ANIME"
    ]
  }
};

export function generateEmotionalIQCode(countryCode: string): string {
  const country = COUNTRY_EMOTIONAL_WORDS[countryCode.toUpperCase()];
  if (!country) {
    throw new Error(`Country code ${countryCode} not supported`);
  }
  
  const randomWord = country.words[Math.floor(Math.random() * country.words.length)];
  return `TIQ-${countryCode.toUpperCase()}-${randomWord}`;
}

export function getAvailableCountries(): Array<{code: string, name: string, flag: string}> {
  return Object.entries(COUNTRY_EMOTIONAL_WORDS).map(([code, data]) => ({
    code,
    name: data.name,
    flag: data.flag
  }));
}

export function validateIQCodeFormat(code: string): boolean {
  const pattern = /^TIQ-[A-Z]{2}-[A-Z]+$/;
  return pattern.test(code);
}

export function parseIQCode(code: string): {country: string, word: string} | null {
  if (!validateIQCodeFormat(code)) return null;
  
  const parts = code.split('-');
  return {
    country: parts[1],
    word: parts[2]
  };
}