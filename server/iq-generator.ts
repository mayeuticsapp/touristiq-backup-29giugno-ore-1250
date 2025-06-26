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

// Professional IQ Codes: TIQ-VV-PRT/STT-0001
export function generateProfessionalIQCode(province: string, type: 'PRT' | 'STT'): string {
  // Validate province format (2-3 uppercase letters)
  const validProvince = province.toUpperCase().match(/^[A-Z]{2,3}$/);
  if (!validProvince) {
    throw new Error('Provincia deve essere 2-3 lettere maiuscole (es: VV, RC, CS)');
  }
  
  const counter = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  return `TIQ-${province.toUpperCase()}-${type}-${counter}`;
}

export const ITALIAN_PROVINCES = [
  { code: "AG", name: "Agrigento", region: "Sicilia" },
  { code: "AL", name: "Alessandria", region: "Piemonte" },
  { code: "AN", name: "Ancona", region: "Marche" },
  { code: "AO", name: "Aosta", region: "Valle d'Aosta" },
  { code: "AR", name: "Arezzo", region: "Toscana" },
  { code: "AP", name: "Ascoli Piceno", region: "Marche" },
  { code: "AT", name: "Asti", region: "Piemonte" },
  { code: "AV", name: "Avellino", region: "Campania" },
  { code: "BA", name: "Bari", region: "Puglia" },
  { code: "BT", name: "Barletta-Andria-Trani", region: "Puglia" },
  { code: "BL", name: "Belluno", region: "Veneto" },
  { code: "BN", name: "Benevento", region: "Campania" },
  { code: "BG", name: "Bergamo", region: "Lombardia" },
  { code: "BI", name: "Biella", region: "Piemonte" },
  { code: "BO", name: "Bologna", region: "Emilia-Romagna" },
  { code: "BZ", name: "Bolzano", region: "Trentino-Alto Adige" },
  { code: "BS", name: "Brescia", region: "Lombardia" },
  { code: "BR", name: "Brindisi", region: "Puglia" },
  { code: "CA", name: "Cagliari", region: "Sardegna" },
  { code: "CL", name: "Caltanissetta", region: "Sicilia" },
  { code: "CB", name: "Campobasso", region: "Molise" },
  { code: "CE", name: "Caserta", region: "Campania" },
  { code: "CT", name: "Catania", region: "Sicilia" },
  { code: "CZ", name: "Catanzaro", region: "Calabria" },
  { code: "CH", name: "Chieti", region: "Abruzzo" },
  { code: "CO", name: "Como", region: "Lombardia" },
  { code: "CS", name: "Cosenza", region: "Calabria" },
  { code: "CR", name: "Cremona", region: "Lombardia" },
  { code: "KR", name: "Crotone", region: "Calabria" },
  { code: "CN", name: "Cuneo", region: "Piemonte" },
  { code: "EN", name: "Enna", region: "Sicilia" },
  { code: "FM", name: "Fermo", region: "Marche" },
  { code: "FE", name: "Ferrara", region: "Emilia-Romagna" },
  { code: "FI", name: "Firenze", region: "Toscana" },
  { code: "FG", name: "Foggia", region: "Puglia" },
  { code: "FC", name: "Forlì-Cesena", region: "Emilia-Romagna" },
  { code: "FR", name: "Frosinone", region: "Lazio" },
  { code: "GE", name: "Genova", region: "Liguria" },
  { code: "GO", name: "Gorizia", region: "Friuli-Venezia Giulia" },
  { code: "GR", name: "Grosseto", region: "Toscana" },
  { code: "IM", name: "Imperia", region: "Liguria" },
  { code: "IS", name: "Isernia", region: "Molise" },
  { code: "SP", name: "La Spezia", region: "Liguria" },
  { code: "AQ", name: "L'Aquila", region: "Abruzzo" },
  { code: "LT", name: "Latina", region: "Lazio" },
  { code: "LE", name: "Lecce", region: "Puglia" },
  { code: "LC", name: "Lecco", region: "Lombardia" },
  { code: "LI", name: "Livorno", region: "Toscana" },
  { code: "LO", name: "Lodi", region: "Lombardia" },
  { code: "LU", name: "Lucca", region: "Toscana" },
  { code: "MC", name: "Macerata", region: "Marche" },
  { code: "MN", name: "Mantova", region: "Lombardia" },
  { code: "MS", name: "Massa-Carrara", region: "Toscana" },
  { code: "MT", name: "Matera", region: "Basilicata" },
  { code: "ME", name: "Messina", region: "Sicilia" },
  { code: "MI", name: "Milano", region: "Lombardia" },
  { code: "MO", name: "Modena", region: "Emilia-Romagna" },
  { code: "MB", name: "Monza e Brianza", region: "Lombardia" },
  { code: "NA", name: "Napoli", region: "Campania" },
  { code: "NO", name: "Novara", region: "Piemonte" },
  { code: "NU", name: "Nuoro", region: "Sardegna" },
  { code: "OR", name: "Oristano", region: "Sardegna" },
  { code: "PD", name: "Padova", region: "Veneto" },
  { code: "PA", name: "Palermo", region: "Sicilia" },
  { code: "PR", name: "Parma", region: "Emilia-Romagna" },
  { code: "PV", name: "Pavia", region: "Lombardia" },
  { code: "PG", name: "Perugia", region: "Umbria" },
  { code: "PU", name: "Pesaro e Urbino", region: "Marche" },
  { code: "PE", name: "Pescara", region: "Abruzzo" },
  { code: "PC", name: "Piacenza", region: "Emilia-Romagna" },
  { code: "PI", name: "Pisa", region: "Toscana" },
  { code: "PT", name: "Pistoia", region: "Toscana" },
  { code: "PN", name: "Pordenone", region: "Friuli-Venezia Giulia" },
  { code: "PZ", name: "Potenza", region: "Basilicata" },
  { code: "PO", name: "Prato", region: "Toscana" },
  { code: "RG", name: "Ragusa", region: "Sicilia" },
  { code: "RA", name: "Ravenna", region: "Emilia-Romagna" },
  { code: "RC", name: "Reggio Calabria", region: "Calabria" },
  { code: "RE", name: "Reggio Emilia", region: "Emilia-Romagna" },
  { code: "RI", name: "Rieti", region: "Lazio" },
  { code: "RN", name: "Rimini", region: "Emilia-Romagna" },
  { code: "RM", name: "Roma", region: "Lazio" },
  { code: "RO", name: "Rovigo", region: "Veneto" },
  { code: "SA", name: "Salerno", region: "Campania" },
  { code: "SS", name: "Sassari", region: "Sardegna" },
  { code: "SV", name: "Savona", region: "Liguria" },
  { code: "SI", name: "Siena", region: "Toscana" },
  { code: "SR", name: "Siracusa", region: "Sicilia" },
  { code: "SO", name: "Sondrio", region: "Lombardia" },
  { code: "SU", name: "Sud Sardegna", region: "Sardegna" },
  { code: "TA", name: "Taranto", region: "Puglia" },
  { code: "TE", name: "Teramo", region: "Abruzzo" },
  { code: "TR", name: "Terni", region: "Umbria" },
  { code: "TO", name: "Torino", region: "Piemonte" },
  { code: "TP", name: "Trapani", region: "Sicilia" },
  { code: "TN", name: "Trento", region: "Trentino-Alto Adige" },
  { code: "TV", name: "Treviso", region: "Veneto" },
  { code: "TS", name: "Trieste", region: "Friuli-Venezia Giulia" },
  { code: "UD", name: "Udine", region: "Friuli-Venezia Giulia" },
  { code: "VA", name: "Varese", region: "Lombardia" },
  { code: "VE", name: "Venezia", region: "Veneto" },
  { code: "VB", name: "Verbano-Cusio-Ossola", region: "Piemonte" },
  { code: "VC", name: "Vercelli", region: "Piemonte" },
  { code: "VR", name: "Verona", region: "Veneto" },
  { code: "VV", name: "Vibo Valentia", region: "Calabria" },
  { code: "VI", name: "Vicenza", region: "Veneto" },
  { code: "VT", name: "Viterbo", region: "Lazio" }
];