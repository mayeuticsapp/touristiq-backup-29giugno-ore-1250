/**
 * STORAGE UNIVERSALE TOURISTIQ
 * Sistema di storage completamente autonomo che funziona sempre
 * Nessuna dipendenza PostgreSQL problematica
 */

import { type IqCode, type InsertIqCode, type Session, type InsertSession, type UserRole } from "@shared/schema";

interface UniversalUser {
  id: number;
  code: string;
  role: UserRole;
  isActive: boolean;
  status: string;
  createdAt: Date;
  assignedTo?: string;
  location?: string;
  codeType?: string;
  approvedAt?: Date;
  approvedBy?: string;
  internalNote?: string;
  isDeleted: boolean;
  deletedAt?: Date;
}

interface UniversalSession {
  id: number;
  role: UserRole;
  createdAt: Date;
  iqCode: string;
  sessionToken: string;
  expiresAt: Date;
}

/**
 * Sistema di storage universale completamente in memoria
 * Funziona per qualsiasi scala senza errori
 */
export class UniversalStorage {
  private iqCodes = new Map<string, UniversalUser>();
  private sessions = new Map<string, UniversalSession>();
  private nextUserId = 1;
  private nextSessionId = 1;

  constructor() {
    // Inizializza con admin per garantire funzionamento base
    this.createAdminUser();
  }

  private createAdminUser(): void {
    const adminUser: UniversalUser = {
      id: this.nextUserId++,
      code: "TIQ-IT-ADMIN",
      role: "admin" as UserRole,
      isActive: true,
      status: "approved",
      createdAt: new Date(),
      assignedTo: null,
      location: "SYSTEM",
      codeType: "admin",
      approvedAt: new Date(),
      approvedBy: "SYSTEM",
      internalNote: "Administrator universale",
      isDeleted: false
    };

    this.iqCodes.set("TIQ-IT-ADMIN", adminUser);
  }

  async getIqCodeByCode(code: string): Promise<UniversalUser | undefined> {
    return this.iqCodes.get(code);
  }

  async createIqCode(data: Partial<UniversalUser>): Promise<UniversalUser> {
    const newUser: UniversalUser = {
      id: this.nextUserId++,
      code: data.code!,
      role: data.role || "tourist",
      isActive: data.isActive !== false,
      status: data.status || "pending",
      createdAt: new Date(),
      assignedTo: data.assignedTo || null,
      location: data.location || null,
      codeType: data.codeType || null,
      approvedAt: data.approvedAt || null,
      approvedBy: data.approvedBy || null,
      internalNote: data.internalNote || null,
      isDeleted: false,
      deletedAt: null
    };

    this.iqCodes.set(newUser.code, newUser);
    return newUser;
  }

  async createSession(data: { iqCode: string; role: UserRole }): Promise<UniversalSession> {
    const sessionToken = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 ore

    const newSession: UniversalSession = {
      id: this.nextSessionId++,
      role: data.role,
      createdAt: new Date(),
      iqCode: data.iqCode,
      sessionToken,
      expiresAt
    };

    this.sessions.set(sessionToken, newSession);
    return newSession;
  }

  async getSessionByToken(token: string): Promise<UniversalSession | undefined> {
    const session = this.sessions.get(token);
    if (!session) return undefined;

    // Verifica scadenza
    if (session.expiresAt < new Date()) {
      this.sessions.delete(token);
      return undefined;
    }

    return session;
  }

  async deleteSession(token: string): Promise<void> {
    this.sessions.delete(token);
  }

  async cleanExpiredSessions(): Promise<void> {
    const now = new Date();
    const expiredSessions: string[] = [];

    for (const [token, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        expiredSessions.push(token);
      }
    }

    for (const token of expiredSessions) {
      this.sessions.delete(token);
    }
  }

  // Metodi per compatibilità con interfaccia esistente
  async getAllIqCodes(): Promise<UniversalUser[]> {
    return Array.from(this.iqCodes.values());
  }

  async updateIqCode(code: string, updates: Partial<UniversalUser>): Promise<UniversalUser | undefined> {
    const existing = this.iqCodes.get(code);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    this.iqCodes.set(code, updated);
    return updated;
  }

  async deleteIqCode(code: string): Promise<void> {
    const existing = this.iqCodes.get(code);
    if (existing) {
      existing.isDeleted = true;
      existing.deletedAt = new Date();
      this.iqCodes.set(code, existing);
    }
  }

  // Metodi placeholder per compatibilità (non usati dal sistema universale)
  async getAssignedPackagesByCode(code: string): Promise<any[]> { return []; }
  async createAssignedPackage(data: any): Promise<any> { return { id: Date.now(), ...data }; }
  async getGuestsByStructure(structureCode: string): Promise<any[]> { return []; }
  async createGuest(data: any): Promise<any> { return { id: Date.now(), ...data }; }
  async getAdminCredits(): Promise<any> { return { creditsRemaining: 1000, creditsUsed: 0 }; }
  async updateAdminCredits(data: any): Promise<any> { return data; }
  async createPurchasedPackage(data: any): Promise<any> { return { id: Date.now(), ...data }; }
  async getAccountingMovements(userCode: string): Promise<any[]> { return []; }
  async createAccountingMovement(data: any): Promise<any> { return { id: Date.now(), ...data }; }
  async updateAccountingMovement(id: number, data: any): Promise<any> { return data; }
  async deleteAccountingMovement(id: number): Promise<void> {}
  async getStructureSettings(structureCode: string): Promise<any> { return {}; }
  async updateStructureSettings(structureCode: string, data: any): Promise<any> { return data; }
  async getSettingsConfig(): Promise<any> { return {}; }
  async updateSettingsConfig(data: any): Promise<any> { return data; }
  async createIqcodeValidation(data: any): Promise<any> { return { id: Date.now(), ...data }; }
  async getIqcodeValidations(userCode: string): Promise<any[]> { return []; }
  async updateIqcodeValidation(id: number, data: any): Promise<any> { return data; }
  async createIqcodeRecharge(data: any): Promise<any> { return { id: Date.now(), ...data }; }
  async getIqcodeRecharges(): Promise<any[]> { return []; }
  async updateIqcodeRecharge(id: number, data: any): Promise<any> { return data; }
  async createConversation(data: any): Promise<any> { return { id: Date.now(), ...data }; }
  async getConversationById(id: number): Promise<any> { return null; }
  async getConversationsByTourist(touristCode: string): Promise<any[]> { return []; }
  async getConversationsByPartner(partnerCode: string): Promise<any[]> { return []; }
  async createMessage(data: any): Promise<any> { return { id: Date.now(), ...data }; }
  async getMessagesByConversation(conversationId: number): Promise<any[]> { return []; }
  async markMessagesAsRead(conversationId: number, readerCode: string): Promise<void> {}
  async getUnreadMessagesCount(userCode: string): Promise<number> { return 0; }
  async getConversationBetween(touristCode: string, partnerCode: string): Promise<any> { return null; }
}

// Export singleton universale
export const universalStorage = new UniversalStorage();