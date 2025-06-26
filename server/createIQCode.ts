import { storage } from "./storage";
import { generateEmotionalIQCode, COUNTRY_EMOTIONAL_WORDS } from "./iq-generator";
import type { UserRole } from "../shared/schema";

export async function createIQCode(country: string, role: UserRole, assignedTo = "") {
  const upperCountry = country.toUpperCase();

  if (!COUNTRY_EMOTIONAL_WORDS[upperCountry]) {
    throw new Error(`Paese ${country} non supportato`);
  }

  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    const newCode = generateEmotionalIQCode(upperCountry);

    // Verifica se il codice esiste già
    const exists = await storage.getIqCodeByCode(newCode);
    if (!exists) {
      const data = await storage.createIqCode({
        code: newCode,
        role,
        isActive: true
      });

      return {
        ...data,
        country: upperCountry,
        assignedTo,
        createdAt: new Date().toISOString()
      };
    }

    attempts++;
  }

  throw new Error("Non è stato possibile generare un codice unico. Ritenta.");
}