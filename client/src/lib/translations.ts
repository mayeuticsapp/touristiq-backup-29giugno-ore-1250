// Sistema di traduzioni per TouristIQ - Solo per Turisti
// Strutture e Partner restano in italiano

export interface Translation {
  // Login page
  loginTitle: string;
  loginSubtitle: string;
  iqCodeLabel: string;
  iqCodePlaceholder: string;
  loginButton: string;
  forgotCode: string;
  recoverWithCustode: string;
  
  // Tourist dashboard
  welcomeMessage: string;
  magicPassepartout: string;
  yourCode: string;
  exclusiveDiscoveries: string;
  myDiscounts: string;
  tiqaiChat: string;
  iqcodeValidation: string;
  custodeCode: string;
  
  // Welcome popup
  welcomePopupTitle: string;
  welcomePopupBenefit1: string;
  welcomePopupBenefit2: string;
  welcomePopupBenefit3: string;
  welcomePopupCTA: string;
  dontShowAgain: string;
  
  // TIQai chat
  tiqaiWelcome: string;
  tiqaiPlaceholder: string;
  sendMessage: string;
  
  // Custode del Codice
  custodeTitle: string;
  custodeDescription: string;
  activateCustode: string;
  manageCustode: string;
  custodeTooltip: string;
  
  // Validation
  validation: string;
  validationDescription: string;
  acceptRequest: string;
  rejectRequest: string;
  
  // Offers
  validUntil: string;
  discount: string;
  category: string;
  partnerName: string;
  
  // General
  close: string;
  cancel: string;
  confirm: string;
  save: string;
  loading: string;
  error: string;
  success: string;
}

export const translations: Record<string, Translation> = {
  it: {
    // Login page
    loginTitle: "Accedi a TouristIQ",
    loginSubtitle: "Inserisci il tuo codice IQ per accedere",
    iqCodeLabel: "Codice IQ",
    iqCodePlaceholder: "Inserisci il tuo codice IQ",
    loginButton: "Accedi",
    forgotCode: "Hai dimenticato il codice?",
    recoverWithCustode: "Recuperalo con il Custode del Codice",
    
    // Tourist dashboard
    welcomeMessage: "Benvenuto nel tuo spazio turistico",
    magicPassepartout: "Il tuo Passepartout Magico",
    yourCode: "Il tuo codice",
    exclusiveDiscoveries: "Le Tue Scoperte Esclusive",
    myDiscounts: "I Miei Sconti",
    tiqaiChat: "TIQai Chat",
    iqcodeValidation: "Validazione IQCode",
    custodeCode: "Custode del Codice",
    
    // Welcome popup
    welcomePopupTitle: "Benvenuto in TouristIQ!",
    welcomePopupBenefit1: "Sconti esclusivi presso partner selezionati",
    welcomePopupBenefit2: "TIQai, la tua guida AI personalizzata",
    welcomePopupBenefit3: "Privacy totale: i tuoi dati sono protetti",
    welcomePopupCTA: "Inizia a scoprire",
    dontShowAgain: "Non mostrare più",
    
    // TIQai chat
    tiqaiWelcome: "Sussurrami i tuoi desideri di scoperta, ti guiderò verso tesori nascosti...",
    tiqaiPlaceholder: "Chiedi informazioni sui luoghi, sconti disponibili...",
    sendMessage: "Invia",
    
    // Custode del Codice
    custodeTitle: "Custode del Codice",
    custodeDescription: "Sistema anonimo per recuperare il tuo IQCode",
    activateCustode: "Attiva il Custode del Codice",
    manageCustode: "Gestisci Custode del Codice",
    custodeTooltip: "Sistema di recupero sicuro e anonimo senza email o telefono",
    
    // Validation
    validation: "Validazione",
    validationDescription: "Richieste di validazione del tuo IQCode",
    acceptRequest: "Accetta",
    rejectRequest: "Rifiuta",
    
    // Offers
    validUntil: "Valido fino al",
    discount: "Sconto",
    category: "Categoria",
    partnerName: "Partner",
    
    // General
    close: "Chiudi",
    cancel: "Annulla",
    confirm: "Conferma",
    save: "Salva",
    loading: "Caricamento...",
    error: "Errore",
    success: "Successo"
  },
  
  en: {
    // Login page
    loginTitle: "Access TouristIQ",
    loginSubtitle: "Enter your IQ code to access",
    iqCodeLabel: "IQ Code",
    iqCodePlaceholder: "Enter your IQ code",
    loginButton: "Login",
    forgotCode: "Forgot your code?",
    recoverWithCustode: "Recover it with Code Guardian",
    
    // Tourist dashboard
    welcomeMessage: "Welcome to your tourist space",
    magicPassepartout: "Your Magic Passepartout",
    yourCode: "Your code",
    exclusiveDiscoveries: "Your Exclusive Discoveries",
    myDiscounts: "My Discounts",
    tiqaiChat: "TIQai Chat",
    iqcodeValidation: "IQCode Validation",
    custodeCode: "Code Guardian",
    
    // Welcome popup
    welcomePopupTitle: "Welcome to TouristIQ!",
    welcomePopupBenefit1: "Exclusive discounts at selected partners",
    welcomePopupBenefit2: "TIQai, your personalized AI guide",
    welcomePopupBenefit3: "Total privacy: your data is protected",
    welcomePopupCTA: "Start discovering",
    dontShowAgain: "Don't show again",
    
    // TIQai chat
    tiqaiWelcome: "Whisper your discovery desires to me, I'll guide you to hidden treasures...",
    tiqaiPlaceholder: "Ask about places, available discounts...",
    sendMessage: "Send",
    
    // Custode del Codice
    custodeTitle: "Code Guardian",
    custodeDescription: "Anonymous system to recover your IQCode",
    activateCustode: "Activate Code Guardian",
    manageCustode: "Manage Code Guardian",
    custodeTooltip: "Secure and anonymous recovery system without email or phone",
    
    // Validation
    validation: "Validation",
    validationDescription: "IQCode validation requests",
    acceptRequest: "Accept",
    rejectRequest: "Reject",
    
    // Offers
    validUntil: "Valid until",
    discount: "Discount",
    category: "Category",
    partnerName: "Partner",
    
    // General
    close: "Close",
    cancel: "Cancel",
    confirm: "Confirm",
    save: "Save",
    loading: "Loading...",
    error: "Error",
    success: "Success"
  }
};

// Hook per utilizzare le traduzioni
export function useTranslation() {
  const currentLanguage = localStorage.getItem('touristiq_language') || 'it';
  
  const t = (key: keyof Translation): string => {
    return translations[currentLanguage]?.[key] || translations.it[key] || key;
  };
  
  const setLanguage = (language: string) => {
    localStorage.setItem('touristiq_language', language);
    window.location.reload(); // Ricarica per applicare la nuova lingua
  };
  
  return { t, setLanguage, currentLanguage };
}