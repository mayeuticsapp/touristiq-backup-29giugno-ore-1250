import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function chatWithTIQai(message: string): Promise<string> {
  try {
    console.log("Invio richiesta a OpenAI per:", message);
    
    const response = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `Sei TIQai, l'assistente virtuale di TouristIQ specializzato nel turismo italiano. 
            Rispondi sempre in italiano e fornisci informazioni utili su:
            - Attrazioni turistiche e luoghi da visitare
            - Ristoranti e cucina locale
            - Eventi e attività
            - Trasporti e logistica
            - Consigli di viaggio
            - Storia e cultura italiana
            
            Mantieni un tono amichevole e professionale. Se non conosci informazioni specifiche, 
            suggerisci di contattare l'ufficio turistico locale o di cercare informazioni aggiornate online.`
          },
          {
            role: "user",
            content: message,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 15000)
      )
    ]);

    console.log("Risposta ricevuta da OpenAI");
    return (response as any).choices[0].message.content || "Mi dispiace, non sono riuscito a processare la tua richiesta.";
  } catch (error) {
    console.error("Errore OpenAI:", error);
    if (error.message === 'Timeout') {
      return "Mi dispiace, la risposta sta impiegando troppo tempo. Riprova con una domanda più breve.";
    }
    return "Mi dispiace, al momento non riesco a rispondere. Riprova più tardi.";
  }
}