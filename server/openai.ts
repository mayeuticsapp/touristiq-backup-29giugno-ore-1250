
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
            // Prima cerca offerte specifiche per città
            let cityPartners = await storage.getRealOffersByCity(targetCity);
            
            // Se non trova partner per la città specifica, cerca nelle città vicine
            if (cityPartners.length === 0) {
              console.log(`🔄 TIQai DB: Ricerca estesa per zone limitrofe a ${targetCity}`);
              const nearbySearches = [];
              
              // Logica di ricerca nelle città vicine per zone specifiche
              if (targetCity === "Pizzo") {
                nearbySearches.push("Tropea", "Vibo Valentia", "Briatico");
              } else if (targetCity === "Tropea") {
                nearbySearches.push("Pizzo", "Briatico", "Vibo Valentia");
              } else if (targetCity === "Briatico") {
                nearbySearches.push("Tropea", "Pizzo", "Vibo Valentia");
              }
              
              for (const nearbyCity of nearbySearches) {
                const nearbyPartners = await storage.getRealOffersByCity(nearbyCity);
                cityPartners = cityPartners.concat(nearbyPartners);
              }
            }
            
            if (cityPartners.length > 0) {
              hasSpecificPartnerData = true;
              touristIQData = `\n\n🏆 PARTNER CERTIFICATI TOURISTIQ - ${targetCity.toUpperCase()}:\n`;
              
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
                  if (partner.phone) touristIQData += `  📞 ${partner.phone}\n`;
                  touristIQData += `\n`;
                });
              });
              
              touristIQData += `⚠️ PRIORITÀ ASSOLUTA: Suggerisci ESCLUSIVAMENTE questi partner verificati.\n`;
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
           detectedLanguage === 'english' ? 'SEMPRE INGLESE' :
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
