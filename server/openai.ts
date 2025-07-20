// Perplexity AI configuration
const perplexityApiKey = process.env.PERPLEXITY_API_KEY;

export async function chatWithTIQai(message: string, storage?: any, language: string = "it"): Promise<string> {
  try {
    if (!perplexityApiKey) {
      return "Mi dispiace, il sistema TIQai non è attualmente disponibile. Per favore contatta l'amministratore per configurare il servizio.";
    }
    
    console.log("Invio richiesta a Perplexity AI per:", message);
    
    // Cerca informazioni sui partner nel database se richieste
    let contextData = "";
    if (storage && (message.toLowerCase().includes("ristorante") || 
                   message.toLowerCase().includes("partner") || 
                   message.toLowerCase().includes("mangiare") ||
                   message.toLowerCase().includes("cena") ||
                   message.toLowerCase().includes("pranzo"))) {
      
      // Estrai città dal messaggio (case-sensitive per match database)
      const citiesMap = {
        "briatico": "Briatico",
        "tropea": "Tropea", 
        "pizzo": "Pizzo",
        "reggio calabria": "Reggio Calabria",
        "reggio": "Reggio Calabria"
      };
      
      let mentionedCity = null;
      for (const [searchKey, dbKey] of Object.entries(citiesMap)) {
        if (message.toLowerCase().includes(searchKey)) {
          mentionedCity = dbKey;
          break;
        }
      }
      
      if (mentionedCity) {
        console.log(`TIQai: ricerca partner per ${mentionedCity}`);
        try {
          const partners = await storage.getPartnerOffersByCity(mentionedCity);
          console.log(`TIQai: trovate ${partners.length} offerte per ${mentionedCity}`);
          
          if (partners.length > 0) {
            contextData = `\n\nIMPORTANTE: Nella zona di ${mentionedCity} abbiamo questi partner TouristIQ autentici:\n`;
            partners.forEach((p: any) => {
              contextData += `- ${p.partnerName}: ${p.title} - ${p.description} (${p.discountPercentage}% di sconto)\n`;
            });
            contextData += "\nSuggerisci SOLO questi partner reali, non inventare nomi.";
          } else {
            contextData = `\n\nINFORMAZIONE: Non abbiamo ancora partner TouristIQ attivi a ${mentionedCity}. Suggerisci di esplorare le città vicine o di cercare direttamente nella zona.`;
          }
        } catch (error) {
          console.log("Errore ricerca partner:", error);
        }
      }
    }
    
    // Definisce le lingue supportate e i prompt multilingue
    const languageInstructions = {
      it: "Rispondi sempre in italiano.",
      en: "Always respond in English.",
      es: "Siempre responde en español.",
      de: "Antworte immer auf Deutsch.", 
      fr: "Réponds toujours en français."
    };

    const languageInstruction = languageInstructions[language as keyof typeof languageInstructions] || languageInstructions.it;
    
    const response = await Promise.race([
      fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${perplexityApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "sonar",
          messages: [
            {
              role: "system",
              content: `Sei TIQai, l'assistente virtuale di TouristIQ specializzato nel turismo autentico italiano. 
              ${languageInstruction}
              
              Fornisci informazioni utili su:
              - Attrazioni turistiche e luoghi da visitare
              - Ristoranti e cucina locale
              - Eventi e attività
              - Trasporti e logistica
              - Consigli di viaggio
              - Storia e cultura italiana
              
              REGOLA CRITICA: Se hai informazioni sui partner TouristIQ reali, usa SOLO quelli.
              Non inventare mai nomi di ristoranti o attività che non esistono nei dati forniti.
              Mantieni un tono amichevole e professionale.
              
              NOTA: TouristIQ copre tutto il territorio italiano con focus su autenticità e tradizioni locali.
              Adatta le risposte al territorio richiesto mantenendo autenticità locale.${contextData}`
            },
            {
              role: "user",
              content: message,
            },
          ],
          max_tokens: 300,
          temperature: 0.2,
          top_p: 0.9,
          stream: false,
          presence_penalty: 0,
          frequency_penalty: 1,
          search_mode: "web",
          search_recency_filter: "month",
          return_related_questions: false,
          return_images: false,
          web_search_options: {
            search_context_size: "medium",
            user_location: {
              country: "IT"
            }
          }
        })
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 15000)
      )
    ]);

    console.log("Risposta ricevuta da Perplexity AI");
    
    if (!(response instanceof Response)) {
      throw new Error('Timeout');
    }
    
    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      return data.choices[0].message.content;
    } else {
      console.error("Struttura risposta Perplexity non valida:", data);
      return "Mi dispiace, non sono riuscito a processare la tua richiesta.";
    }
  } catch (error) {
    console.error("Errore Perplexity AI:", error);
    if (error instanceof Error && error.message === 'Timeout') {
      return "Mi dispiace, la risposta sta impiegando troppo tempo. Riprova con una domanda più breve.";
    }
    return "Mi dispiace, al momento non riesco a rispondere. Riprova più tardi.";
  }
}