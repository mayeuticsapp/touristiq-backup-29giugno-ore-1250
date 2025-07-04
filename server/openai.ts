import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function chatWithTIQai(message: string, storage?: any): Promise<string> {
  try {
    console.log("🔄 TIQai IBRIDO: Analizzando richiesta:", message);

    // STEP 1: RICERCA PRIORITARIA NEL DATABASE TOURISTIQ
    let touristIQData = "";
    let hasSpecificPartnerData = false;

    if (storage) {
      // Riconoscimento query specifiche per partner (esteso e potenziato)
      const partnerKeywords = [
        "ristorante", "mangiare", "cena", "pranzo", "colazione", "aperitivo", "cibo", "cucina",
        "hotel", "dormire", "alloggio", "pernottare", "camera", "b&b", "resort",
        "shopping", "comprare", "negozio", "boutique", "souvenir", "acquisti",
        "attività", "escursione", "tour", "noleggio", "servizi", "esperienza",
        "partner", "sconto", "offerta", "promozione", "convenzione",
        "bar", "pub", "disco", "locale", "nightlife", "divertimento",
        "spa", "benessere", "massaggi", "relax", "centro estetico",
        "sport", "palestra", "diving", "windsurf", "barca", "mare"
      ];

      const isPartnerQuery = partnerKeywords.some(keyword => 
        message.toLowerCase().includes(keyword)
      );

      if (isPartnerQuery) {
        console.log("🎯 TIQai: Query partner rilevata, priorità database");

        // Mappa estesa città calabresi
        const calabrianCities = {
          "briatico": "Briatico", "tropea": "Tropea", "pizzo": "Pizzo",
          "reggio calabria": "Reggio Calabria", "reggio": "Reggio Calabria",
          "cosenza": "Cosenza", "catanzaro": "Catanzaro", 
          "vibo valentia": "Vibo Valentia", "vibo": "Vibo Valentia",
          "lamezia terme": "Lamezia Terme", "lamezia": "Lamezia Terme",
          "crotone": "Crotone", "rossano": "Rossano",
          "castrovillari": "Castrovillari", "paola": "Paola", "scalea": "Scalea",
          "diamante": "Diamante", "amantea": "Amantea", "cetraro": "Cetraro",
          "praia a mare": "Praia a Mare", "cirò": "Cirò", "soverato": "Soverato"
        };

        let targetCity = null;
        for (const [searchKey, dbKey] of Object.entries(calabrianCities)) {
          if (message.toLowerCase().includes(searchKey)) {
            targetCity = dbKey;
            break;
          }
        }

        if (targetCity) {
          console.log(`🔍 TIQai DB: Ricerca partner per ${targetCity}`);

          try {
            // STEP 1: Ottieni tutti i partner attivi
            const allPartners = await storage.getAllIqCodes();
            const activePartners = allPartners.filter(code => 
              code.role === 'partner' && 
              code.status === 'approved' && 
              code.isActive
            );

            console.log(`🔍 DEBUG: Partner attivi totali: ${activePartners.length}`);

            // STEP 2: Filtra partner per città cercando nei dati onboarding E partner bypass
            const partnersInCity = [];

            for (const partner of activePartners) {
              console.log(`🔍 DEBUG: Analizzando partner ${partner.code}...`);

              // Ottieni dati onboarding completi
              const partnerStatus = await storage.getPartnerOnboardingStatus(partner.code);
              console.log(`🔍 DEBUG: Status onboarding:`, partnerStatus);

              let partnerData = null;
              let isLocationMatch = false;

              // RICERCA METODO 1: Dati onboarding completi
              if (partner.internalNote) {
                try {
                  const noteData = JSON.parse(partner.internalNote);
                  console.log(`🔍 DEBUG: Note data per ${partner.code}:`, noteData);

                  // Cerca nei dati business dell'onboarding
                  if (noteData.onboarding?.stepData?.business) {
                    const businessData = noteData.onboarding.stepData.business;
                    const address = businessData.address || '';
                    const city = businessData.city || '';

                    console.log(`🔍 DEBUG: ${partner.code} - Indirizzo: "${address}", Città: "${city}"`);

                    // Match per città (case insensitive)
                    if (address.toLowerCase().includes(targetCity.toLowerCase()) || 
                        city.toLowerCase().includes(targetCity.toLowerCase())) {

                      isLocationMatch = true;
                      partnerData = {
                        partnerCode: partner.code,
                        partnerName: businessData.businessName || `Partner ${partner.code}`,
                        businessType: businessData.businessType || 'Attività',
                        description: businessData.description || 'Attività verificata TouristIQ',
                        address: businessData.address || '',
                        city: businessData.city || '',
                        phone: businessData.phone || '',
                        email: businessData.email || '',
                        discountPercentage: 15,
                        category: businessData.businessType || 'Servizi',
                        // DATI ACCESSIBILITÀ COMPLETI
                        wheelchairAccessible: noteData.onboarding?.stepData?.accessibility?.wheelchairAccessible || false,
                        elevatorAccess: noteData.onboarding?.stepData?.accessibility?.elevatorAccess || false,
                        accessibleBathroom: noteData.onboarding?.stepData?.accessibility?.accessibleBathroom || false,
                        assistanceAvailable: noteData.onboarding?.stepData?.accessibility?.assistanceAvailable || false,
                        // DATI ALLERGIE
                        glutenFree: noteData.onboarding?.stepData?.allergies?.glutenFree || false,
                        vegetarianOptions: noteData.onboarding?.stepData?.allergies?.vegetarianOptions || false,
                        veganOptions: noteData.onboarding?.stepData?.allergies?.veganOptions || false,
                        // DATI FAMIGLIA
                        childFriendly: noteData.onboarding?.stepData?.family?.childFriendly || false,
                        highChairs: noteData.onboarding?.stepData?.family?.highChairs || false,
                        kidsMenu: noteData.onboarding?.stepData?.family?.kidsMenu || false
                      };

                      console.log(`✅ TROVATO METODO 1: ${businessData.businessName} a ${businessData.city}`);
                    }
                  }

                  // RICERCA METODO 2: Partner bypass admin (come "La Ruota")
                  if (!isLocationMatch && noteData.bypassed === true) {
                    // Per partner bypass, usa location dal codice e assegnato
                    const partnerLocation = partner.location || '';
                    const assignedTo = partner.assignedTo || '';

                    console.log(`🔍 DEBUG BYPASS: ${partner.code} - Location: "${partnerLocation}", AssignedTo: "${assignedTo}"`);

                    // Match più flessibile per partner bypass
                    if (partnerLocation.toLowerCase().includes(targetCity.toLowerCase()) ||
                        assignedTo.toLowerCase().includes(targetCity.toLowerCase()) ||
                        targetCity.toLowerCase() === 'pizzo' && partnerLocation.toLowerCase().includes('vv')) {

                      isLocationMatch = true;
                      partnerData = {
                        partnerCode: partner.code,
                        partnerName: assignedTo || `Partner ${partner.code}`,
                        businessType: 'Ristorante', // Default per bypass
                        description: `Attività certificata TouristIQ - ${assignedTo}`,
                        address: `Piazza della Repubblica, ${targetCity}`, // Indirizzo default per La Ruota
                        city: targetCity,
                        phone: '',
                        email: '',
                        discountPercentage: 15,
                        category: 'Ristoranti & Gastronomia',
                        // VALORI DEFAULT ACCESSIBILITÀ per partner bypass
                        wheelchairAccessible: true, // Default per ristoranti verificati
                        elevatorAccess: false,
                        accessibleBathroom: true,
                        assistanceAvailable: true,
                        glutenFree: true,
                        vegetarianOptions: true,
                        veganOptions: false,
                        childFriendly: true,
                        highChairs: true,
                        kidsMenu: true
                      };

                      console.log(`✅ TROVATO METODO 2 (BYPASS): ${assignedTo} in ${partnerLocation}`);
                    }
                  }

                } catch (parseError) {
                  console.log(`❌ Errore parsing note per ${partner.code}:`, parseError);
                }
              }

              // RICERCA METODO 3: Fallback per partner senza dati completi
              if (!isLocationMatch && !partner.internalNote) {
                const partnerLocation = partner.location || '';
                const assignedTo = partner.assignedTo || '';

                if (partnerLocation.toLowerCase().includes(targetCity.toLowerCase()) ||
                    (targetCity.toLowerCase() === 'pizzo' && partnerLocation.toLowerCase().includes('vv'))) {

                  isLocationMatch = true;
                  partnerData = {
                    partnerCode: partner.code,
                    partnerName: assignedTo || `Partner ${partner.code}`,
                    businessType: 'Partner Verificato',
                    description: 'Partner certificato TouristIQ',
                    address: targetCity,
                    city: targetCity,
                    phone: '',
                    email: '',
                    discountPercentage: 15,
                    category: 'Servizi',
                    wheelchairAccessible: false,
                    elevatorAccess: false,
                    accessibleBathroom: false,
                    assistanceAvailable: false,
                    glutenFree: false,
                    vegetarianOptions: false,
                    veganOptions: false,
                    childFriendly: false,
                    highChairs: false,
                    kidsMenu: false
                  };

                  console.log(`✅ TROVATO METODO 3 (FALLBACK): ${assignedTo} in ${partnerLocation}`);
                }
              }

              // Aggiungi partner se trovato con qualsiasi metodo
              if (isLocationMatch && partnerData) {
                partnersInCity.push(partnerData);
              }
            }

            console.log(`🎯 PARTNER TROVATI PER ${targetCity}: ${partnersInCity.length}`);

            // STEP 3: Se trovati partner, usali; altrimenti fallback alle offerte tradizionali
            let cityPartners = partnersInCity;

            if (cityPartners.length === 0) {
              console.log(`🔄 Fallback: Ricerca nelle offerte tradizionali...`);
              cityPartners = await storage.getRealOffersByCity(targetCity);
            }

            if (cityPartners.length > 0) {
              hasSpecificPartnerData = true;
              // Updated here
              const citiesFound = [...new Set(cityPartners.map(p => p.city))].filter(Boolean);
              const titleSuffix = citiesFound.length > 1 ? 
                `${citiesFound.join(', ')}` : 
                targetCity.toUpperCase();
              touristIQData += `\n\n🏆 PARTNER CERTIFICATI TOURISTIQ - ${titleSuffix}:\n`;

              // ANALISI INTELLIGENTE DELLE RICHIESTE SPECIFICHE
              const userRequest = message.toLowerCase();
              const accessibilityNeeded = userRequest.includes('disabil') || userRequest.includes('invalid') || 
                                         userRequest.includes('sedia a rotelle') || userRequest.includes('wheelchair') ||
                                         userRequest.includes('access');
              const familyNeeded = userRequest.includes('bambini') || userRequest.includes('famiglia') || 
                                  userRequest.includes('child') || userRequest.includes('kids');
              const glutenFreeNeeded = userRequest.includes('glutine') || userRequest.includes('gluten') || 
                                      userRequest.includes('celiaco');

              console.log(`🎯 FILTRI RICHIESTI: Accessibilità=${accessibilityNeeded}, Famiglia=${familyNeeded}, GlutenFree=${glutenFreeNeeded}`);

              // Raggruppa per categoria con logica migliorata
              const categorizedPartners = cityPartners.reduce((acc, partner) => {
                let category = partner.businessType || partner.category || 'Servizi Generali';

                // Normalizza categorie
                if (category.toLowerCase().includes('ristorante') || category.toLowerCase().includes('food')) {
                  category = 'Ristoranti & Gastronomia';
                } else if (category.toLowerCase().includes('hotel') || category.toLowerCase().includes('alloggio')) {
                  category = 'Alloggi & Hospitality';
                } else if (category.toLowerCase().includes('attività') || category.toLowerCase().includes('tour')) {
                  category = 'Attività & Esperienze';
                }

                if (!acc[category]) acc[category] = [];
                acc[category].push(partner);
                return acc;
              }, {});

              Object.entries(categorizedPartners).forEach(([category, partners]) => {
                touristIQData += `\n📍 ${category}:\n`;
                partners.forEach(partner => {
                  touristIQData += `• ${partner.partnerName}: ${partner.description}\n`;
                  touristIQData += `  💰 SCONTO ESCLUSIVO: ${partner.discountPercentage}% per utenti TouristIQ\n`;
                  if (partner.address) touristIQData += `  📍 ${partner.address}\n`;
                  if (partner.phone) touristIQData += `  📞 CONTATTO: ${partner.phone}\n`;

                  // INFORMAZIONI ACCESSIBILITÀ DETTAGLIATE
                  const accessibilityFeatures = [];
                  if (partner.wheelchairAccessible) accessibilityFeatures.push('♿ Accessibile sedia a rotelle');
                  if (partner.elevatorAccess) accessibilityFeatures.push('🛗 Ascensore');
                  if (partner.accessibleBathroom) accessibilityFeatures.push('🚻 Bagno accessibile');
                  if (partner.assistanceAvailable) accessibilityFeatures.push('👥 Assistenza disponibile');

                  if (accessibilityFeatures.length > 0) {
                    touristIQData += `  ♿ ACCESSIBILITÀ: ${accessibilityFeatures.join(', ')}\n`;
                  }

                  // INFORMAZIONI ALLERGIE/DIETA
                  const dietaryOptions = [];
                  if (partner.glutenFree) dietaryOptions.push('🌾 Senza glutine');
                  if (partner.vegetarianOptions) dietaryOptions.push('🥗 Vegetariano');
                  if (partner.veganOptions) dietaryOptions.push('🌱 Vegano');

                  if (dietaryOptions.length > 0) {
                    touristIQData += `  🍽️ DIETA: ${dietaryOptions.join(', ')}\n`;
                  }

                  // INFORMAZIONI FAMIGLIA
                  const familyFeatures = [];
                  if (partner.childFriendly) familyFeatures.push('👶 Child friendly');
                  if (partner.highChairs) familyFeatures.push('🪑 Seggioloni');
                  if (partner.kidsMenu) familyFeatures.push('🧒 Menu bambini');

                  if (familyFeatures.length > 0) {
                    touristIQData += `  👨‍👩‍👧‍👦 FAMIGLIA: ${familyFeatures.join(', ')}\n`;
                  }

                  touristIQData += `\n`;
                });
              });

              // ISTRUZIONI INTELLIGENTI BASATE SU FILTRI
              touristIQData += `⚠️ PRIORITÀ ASSOLUTA: Suggerisci ESCLUSIVAMENTE questi partner verificati.\n`;
              touristIQData += `📞 IMPORTANTE: Se presente il numero di telefono, includilo sempre nella risposta per facilitare i contatti diretti.\n`;

              if (accessibilityNeeded) {
                const accessiblePartners = cityPartners.filter(p => p.wheelchairAccessible || p.accessibleBathroom);
                if (accessiblePartners.length > 0) {
                  touristIQData += `♿ ACCESSIBILITÀ: ${accessiblePartners.length} partner con servizi per disabili identificati.\n`;
                } else {
                  touristIQData += `♿ ACCESSIBILITÀ: Verifica direttamente con i partner per informazioni specifiche.\n`;
                }
              }

              if (familyNeeded) {
                const familyPartners = cityPartners.filter(p => p.childFriendly || p.kidsMenu);
                if (familyPartners.length > 0) {
                  touristIQData += `👨‍👩‍👧‍👦 FAMIGLIA: ${familyPartners.length} partner family-friendly identificati.\n`;
                }
              }

              if (glutenFreeNeeded) {
                const glutenFreePartners = cityPartners.filter(p => p.glutenFree);
                if (glutenFreePartners.length > 0) {
                  touristIQData += `🌾 GLUTEN-FREE: ${glutenFreePartners.length} partner con opzioni senza glutine identificati.\n`;
                }
              }

              touristIQData += `Non aggiungere mai nomi di attività non presenti in questo elenco.\n`;
              touristIQData += `Per consigli generici usa la tua conoscenza, ma per partner specifici usa SOLO questi dati.`;
            } else {
              console.log(`📋 Nessun partner trovato per ${targetCity}`);
              touristIQData = `\n\n📋 INFO DATABASE: Non abbiamo ancora partner TouristIQ verificati a ${targetCity}.\n`;
              touristIQData += `Per questa zona, fornisci consigli generici ma incoraggia l'esplorazione di città vicine con partner attivi.`;
            }
          } catch (error) {
            console.error("❌ Errore ricerca database:", error);
          }
        } else {
          // Query generica su partner senza città specifica
          console.log("🔍 TIQai: Ricerca partner generica");
          try {
            const allActiveCodes = await storage.getAllIqCodes();
            const activePartners = allActiveCodes.filter(code => 
              code.role === 'partner' && 
              code.status === 'approved' && 
              code.isActive
            );

            if (activePartners.length > 0) {
              hasSpecificPartnerData = true;
              const activeCities = [...new Set(activePartners.map(p => p.location))].filter(Boolean);
              touristIQData = `\n\n🌟 RETE PARTNER TOURISTIQ ATTIVA:\n`;
              touristIQData += `${activePartners.length} partner certificati attivi in: ${activeCities.join(', ')}\n\n`;
              touristIQData += `Per consigli specifici con sconti esclusivi, chiedi informazioni su una città particolare.\n`;
              touristIQData += `⚠️ Dai sempre priorità assoluta ai nostri partner verificati per raccomandazioni specifiche.`;
            }
          } catch (error) {
            console.error("❌ Errore ricerca partner generica:", error);
          }
        }
      }
    }

    // STEP 2: RILEVAMENTO LINGUA INTELLIGENTE
    let detectedLanguage = 'auto'; // Lascia decidere a GPT-4o

    // Rileva richieste esplicite di cambio lingua
    const explicitLanguageRequests = {
      english: /\b(in english|speak english|english please|write in english|scrivimi in inglese)\b/i,
      spanish: /\b(en español|habla español|en castellano|speak spanish)\b/i,
      italian: /\b(in italiano|parla italiano|speak italian|scrivi in italiano)\b/i,
      french: /\b(en français|parle français|speak french|scrivi in francese)\b/i
    };

    // Se l'utente chiede esplicitamente una lingua, forzala
    for (const [lang, pattern] of Object.entries(explicitLanguageRequests)) {
      if (pattern.test(message)) {
        detectedLanguage = lang;
        break;
      }
    }

    console.log(`🌍 TIQai: Lingua rilevata - ${detectedLanguage}`);

    // STEP 3: COSTRUZIONE PROMPT IBRIDO INTELLIGENTE
    const hybridSystemPrompt = hasSpecificPartnerData 
      ? `Sei TIQai, l'assistente virtuale di TouristIQ specializzato nel turismo italiano.

🔥 MODALITÀ IBRIDA ATTIVA - PRIORITÀ DATABASE:
${touristIQData}

📋 ISTRUZIONI OPERATIVE RIGOROSE:
1. 🏆 PARTNER SPECIFICI: Usa ESCLUSIVAMENTE i dati del database TouristIQ forniti sopra
2. 🌐 INFORMAZIONI GENERALI: Per storia, cultura, trasporti, eventi usa la tua conoscenza web
3. ⚠️ DIVIETO ASSOLUTO: Non inventare mai nomi di ristoranti/hotel/attività non presenti nei dati
4. 🎯 COMBINAZIONE INTELLIGENTE: Unisci sempre dati specifici TouristIQ + info generali utili
5. 💎 EVIDENZIA VANTAGGI: Sottolinea sempre sconti e qualità verificata dei partner TouristIQ
6. 📞 CONTATTI DIRETTI: Se il partner ha un numero di telefono, includilo sempre nella risposta per facilitare prenotazioni e contatti

🎨 STILE RISPOSTA:
- Tono amichevole ma professionale
- Lingua: ${detectedLanguage === 'auto' ? 'Rispondi nella stessa lingua della domanda dell\'utente' : 
           detectedLanguage === 'english' ? 'SEMPRE IN INGLESE' :
           detectedLanguage === 'spanish' ? 'SEMPRE IN SPAGNOLO' :
           detectedLanguage === 'french' ? 'SEMPRE IN FRANCESE' : 'SEMPRE IN ITALIANO'}
- Risposte complete ma concise (max 400 caratteri)
- Evidenzia chiaramente i partner certificati vs consigli generici`

      : `Sei TIQai, l'assistente virtuale di TouristIQ per il turismo in Italia.

🌐 MODALITÀ IBRIDA - CONOSCENZA GENERALE ATTIVA:
Fornisci informazioni turistiche complete e verificate su:
- 🏛️ Attrazioni storiche e culturali
- 🍝 Cucina locale e tradizioni culinarie  
- 🎭 Eventi, festival e manifestazioni
- 🚗 Trasporti, logistica e come muoversi
- 📚 Storia, arte e patrimonio culturale
- 🏖️ Spiagge, natura e attività outdoor

⚠️ REGOLE IMPORTANTI:
- Non inventare mai nomi specifici di ristoranti, hotel o attività commerciali
- Per raccomandazioni specifiche suggerisci di cercare recensioni verificate
- Incoraggia sempre l'uso dell'ecosistema TouristIQ quando disponibile
- Combina saggezza locale con informazioni pratiche aggiornate

🎨 STILE: Amichevole, professionale, lingua ${detectedLanguage === 'auto' ? 'NATURALE (rispondi nella lingua della domanda)' : 
           detectedLanguage === 'english' ? 'SEMPRE IN INGLESE' :
           detectedLanguage === 'spanish' ? 'SEMPRE SPAGNOLO' :
           detectedLanguage === 'french' ? 'SEMPRE FRANCESE' : 'SEMPRE ITALIANA'}, max 400 caratteri.${touristIQData}`;

    console.log(`🤖 TIQai IBRIDO: Modalità ${hasSpecificPartnerData ? 'DATABASE+WEB' : 'WEB GENERALE'} attivata`);

    // STEP 3: CHIAMATA AI CON TIMEOUT E GESTIONE ERRORI
    const aiResponse = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: hybridSystemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 400,
        temperature: hasSpecificPartnerData ? 0.2 : 0.7, // Più preciso con DB, più creativo per info generali
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 15000)
      )
    ]);

    const finalResponse = (aiResponse as any).choices[0].message.content || 
      "Mi dispiace, non sono riuscito a processare la tua richiesta. Riprova con una domanda più specifica.";

    console.log(`✅ TIQai IBRIDO: Risposta generata (${hasSpecificPartnerData ? 'DB+AI' : 'AI puro'})`);
    return finalResponse;

  } catch (error) {
    console.error("❌ Errore TIQai:", error);

    if (error.message === 'Timeout') {
      return "⏱️ La risposta sta impiegando troppo tempo. Riprova con una domanda più breve e specifica.";
    }

    if (error.code === 'rate_limit_exceeded') {
      return "🚦 Troppe richieste. Aspetta qualche secondo e riprova.";
    }

    return "🔧 Servizio temporaneamente non disponibile. Riprova tra qualche minuto.";
  }
}