import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function chatWithTIQai(message: string, storage?: any): Promise<string> {
  try {
    console.log("TIQai IBRIDO: Analizzando richiesta:", message);
    
    // STEP 1: RICERCA PRIORITARIA NEL DATABASE TOURISTIQ
    let touristIQData = "";
    let hasRelevantData = false;
    
    if (storage) {
      // Estendi il riconoscimento delle query specifiche per partner
      const partnerQueries = [
        "ristorante", "mangiare", "cena", "pranzo", "colazione", "aperitivo",
        "hotel", "dormire", "alloggio", "pernottare", "camera",
        "shopping", "comprare", "negozio", "boutique", "souvenir",
        "attività", "escursione", "tour", "noleggio", "servizi",
        "partner", "sconto", "offerta", "promozione"
      ];
      
      const isPartnerQuery = partnerQueries.some(query => 
        message.toLowerCase().includes(query)
      );
      
      if (isPartnerQuery) {
        // Mappa città estesa per la Calabria
        const calabrianCities = {
          "briatico": "Briatico", "tropea": "Tropea", "pizzo": "Pizzo",
          "reggio calabria": "Reggio Calabria", "reggio": "Reggio Calabria",
          "cosenza": "Cosenza", "catanzaro": "Catanzaro", "vibo valentia": "Vibo Valentia",
          "lamezia": "Lamezia Terme", "crotone": "Crotone", "rossano": "Rossano",
          "castrovillari": "Castrovillari", "paola": "Paola", "scalea": "Scalea"
        };
        
        let detectedCity = null;
        for (const [searchKey, dbKey] of Object.entries(calabrianCities)) {
          if (message.toLowerCase().includes(searchKey)) {
            detectedCity = dbKey;
            break;
          }
        }
        
        if (detectedCity) {
          console.log(`🔍 TIQai DB: Ricerca partner per ${detectedCity}`);
          try {
            // Recupera TUTTI i partner della città, non solo ristoranti
            const allPartners = await storage.getRealOffersByCity(detectedCity);
            
            if (allPartners.length > 0) {
              hasRelevantData = true;
              touristIQData = `\n\n🏆 PARTNER CERTIFICATI TOURISTIQ a ${detectedCity}:\n`;
              
              // Raggruppa per categoria
              const byCategory = allPartners.reduce((acc, partner) => {
                const cat = partner.businessType || partner.category || 'partner';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(partner);
                return acc;
              }, {});
              
              Object.entries(byCategory).forEach(([category, partners]) => {
                touristIQData += `\n📍 ${category.toUpperCase()}:\n`;
                partners.forEach(p => {
                  touristIQData += `• ${p.partnerName}: ${p.description} (SCONTO ${p.discountPercentage}%)\n`;
                  if (p.address) touristIQData += `  📍 ${p.address}\n`;
                  if (p.phone) touristIQData += `  📞 ${p.phone}\n`;
                });
              });
              
              touristIQData += `\n⚠️ PRIORITÀ ASSOLUTA: Suggerisci SOLO questi partner verificati. Non aggiungere altri nomi.`;
            } else {
              touristIQData = `\n\n📋 INFO DB: Non abbiamo ancora partner TouristIQ verificati a ${detectedCity}. Per questa zona, fornisci consigli generici ma incoraggia l'esplorazione di città vicine con partner attivi.`;
            }
          } catch (error) {
            console.log("❌ Errore ricerca DB:", error);
          }
        } else {
          // Query generica su partner senza città specifica
          console.log("🔍 TIQai DB: Ricerca partner generica");
          try {
            const allCodes = await storage.getAllIqCodes();
            const activePartners = allCodes.filter(code => 
              code.role === 'partner' && code.status === 'approved' && code.isActive
            );
            
            if (activePartners.length > 0) {
              hasRelevantData = true;
              const cities = [...new Set(activePartners.map(p => p.location))].filter(Boolean);
              touristIQData = `\n\n🌟 RETE PARTNER TOURISTIQ ATTIVA:\n`;
              touristIQData += `Abbiamo ${activePartners.length} partner certificati in: ${cities.join(', ')}\n`;
              touristIQData += `Per consigli specifici, chiedi informazioni su una città particolare.\n`;
              touristIQData += `⚠️ Dai sempre priorità ai nostri partner verificati.`;
            }
          } catch (error) {
            console.log("❌ Errore ricerca partner generica:", error);
          }
        }
      }
    }
    
    // STEP 2: PREPARAZIONE PROMPT IBRIDO
    const systemPrompt = hasRelevantData 
      ? `Sei TIQai, l'assistente virtuale di TouristIQ per il turismo in Italia.

🔥 MODALITÀ DATABASE PRIORITARIA ATTIVA:
${touristIQData}

ISTRUZIONI OPERATIVE:
1. Se hai dati TouristIQ specifici, usa ESCLUSIVAMENTE quelli
2. Non aggiungere mai nomi di ristoranti/hotel/attività non presenti nei dati forniti
3. Per informazioni generiche (storia, cultura, trasporti) usa la tua conoscenza
4. Combina sempre: dati specifici TouristIQ + informazioni generali utili
5. Evidenzia sempre i vantaggi dei partner TouristIQ (sconti, qualità verificata)

Mantieni tono amichevole e professionale. Rispondi sempre in italiano.`
      
      : `Sei TIQai, l'assistente virtuale di TouristIQ per il turismo in Italia.

🌐 MODALITÀ CONOSCENZA GENERALE ATTIVA:
Fornisci informazioni turistiche generali su:
- Attrazioni e luoghi da visitare  
- Cucina locale e tradizioni
- Eventi e attività
- Trasporti e logistica
- Storia e cultura italiana

⚠️ Non inventare nomi specifici di ristoranti o hotel.
Suggerisci invece di cercare localmente o utilizzare recensioni verificate.
Incoraggia sempre l'uso dell'ecosistema TouristIQ quando disponibile.

Mantieni tono amichevole e professionale. Rispondi sempre in italiano.${touristIQData}`;

    console.log(`🤖 TIQai: Modalità ${hasRelevantData ? 'DATABASE' : 'GENERALE'} attivata`);

    const response = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: message,
          },
        ],
        max_tokens: 400,
        temperature: hasRelevantData ? 0.3 : 0.7, // Più preciso con dati DB, più creativo per info generali
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 15000)
      )
    ]);

    const aiResponse = (response as any).choices[0].message.content || "Mi dispiace, non sono riuscito a processare la tua richiesta.";
    
    console.log(`✅ TIQai IBRIDO: Risposta generata (${hasRelevantData ? 'DB+AI' : 'AI generale'})`);
    return aiResponse;
  } catch (error) {
    console.error("Errore OpenAI:", error);
    if (error.message === 'Timeout') {
      return "Mi dispiace, la risposta sta impiegando troppo tempo. Riprova con una domanda più breve.";
    }
    return "Mi dispiace, al momento non riesco a rispondere. Riprova più tardi.";
  }
}