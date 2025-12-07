import { storage } from "./storage";
import { generateEmotionalIQCode, generateProfessionalIQCode, COUNTRY_EMOTIONAL_WORDS } from "./iq-generator";
import type { UserRole } from "../shared/schema";

export async function createIQCode(
  codeType: "emotional" | "professional",
  role: UserRole,
  location: string, // country for emotional, province for professional
  assignedTo = "",
  email?: string // Email opzionale per evitare duplicati
) {
  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    let newCode: string;
    
    if (codeType === "emotional") {
      const upperCountry = location.toUpperCase();
      if (!COUNTRY_EMOTIONAL_WORDS[upperCountry]) {
        throw new Error(`Paese ${location} non supportato`);
      }
      newCode = generateEmotionalIQCode(upperCountry);
    } else {
      // Professional code
      const businessType = role === "partner" ? "PRT" : role === "structure" ? "STT" : "ADM";
      newCode = generateProfessionalIQCode(location, businessType as 'PRT' | 'STT');
    }

    // Verifica se il codice esiste già
    const exists = await storage.getIqCodeByCode(newCode);
    if (!exists) {
      const data = await storage.createIqCode({
        code: newCode,
        role,
        isActive: true,
        assignedTo,
        location,
        codeType,
        email: email || undefined // Salva email se presente
      });

      return {
        ...data,
        codeType,
        location,
        assignedTo,
        createdAt: new Date().toISOString()
      };
    }

    attempts++;
  }

  throw new Error("Non è stato possibile generare un codice unico. Ritenta.");
}