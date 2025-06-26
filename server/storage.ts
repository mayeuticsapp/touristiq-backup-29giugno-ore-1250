import { iqCodes, sessions, type IqCode, type InsertIqCode, type Session, type InsertSession, type UserRole } from "@shared/schema";

export interface IStorage {
  // IQ Code methods
  getIqCodeByCode(code: string): Promise<IqCode | undefined>;
  createIqCode(iqCode: InsertIqCode): Promise<IqCode>;
  getAllIqCodes(): Promise<IqCode[]>;

  // Session methods
  createSession(session: InsertSession): Promise<Session>;
  getSessionByToken(token: string): Promise<Session | undefined>;
  deleteSession(token: string): Promise<void>;
  cleanExpiredSessions(): Promise<void>;
}

export class MemStorage implements IStorage {
  private iqCodes: Map<number, IqCode>;
  private sessions: Map<number, Session>;
  private currentIqCodeId: number;
  private currentSessionId: number;

  constructor() {
    this.iqCodes = new Map();
    this.sessions = new Map();
    this.currentIqCodeId = 1;
    this.currentSessionId = 1;

    // Initialize with default IQ codes
    this.initializeDefaultCodes();
  }

  private async initializeDefaultCodes() {
    // New international emotional IQ codes format: TIQ-[COUNTRY]-[EMOTIONAL_WORD]
    const defaultCodes = [
      { code: 'TIQ-IT-ADMIN', role: 'admin' as UserRole, isActive: true },
      { code: 'TIQ-IT-LEONARDO', role: 'tourist' as UserRole, isActive: true },
      { code: 'TIQ-IT-COLOSSEO', role: 'tourist' as UserRole, isActive: true },
      { code: 'TIQ-IT-MICHELANGELO', role: 'tourist' as UserRole, isActive: true },
      { code: 'TIQ-IT-VENEZIA', role: 'structure' as UserRole, isActive: true },
      { code: 'TIQ-IT-DUOMO', role: 'structure' as UserRole, isActive: true },
      { code: 'TIQ-IT-TIRAMISU', role: 'partner' as UserRole, isActive: true },
      { code: 'TIQ-IT-GELATO', role: 'partner' as UserRole, isActive: true },
    ];

    for (const codeData of defaultCodes) {
      await this.createIqCode(codeData);
    }
  }

  async getIqCodeByCode(code: string): Promise<IqCode | undefined> {
    return Array.from(this.iqCodes.values()).find(
      (iqCode) => iqCode.code === code && iqCode.isActive
    );
  }

  async createIqCode(insertIqCode: InsertIqCode): Promise<IqCode> {
    const id = this.currentIqCodeId++;
    const iqCode: IqCode = {
      id,
      code: insertIqCode.code,
      role: insertIqCode.role,
      isActive: insertIqCode.isActive ?? true,
      createdAt: new Date(),
    };
    this.iqCodes.set(id, iqCode);
    return iqCode;
  }

  async getAllIqCodes(): Promise<IqCode[]> {
    return Array.from(this.iqCodes.values());
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = this.currentSessionId++;
    const session: Session = {
      ...insertSession,
      id,
      createdAt: new Date(),
    };
    this.sessions.set(id, session);
    return session;
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    const session = Array.from(this.sessions.values()).find(
      (s) => s.sessionToken === token
    );
    
    if (session && session.expiresAt > new Date()) {
      return session;
    }
    
    if (session) {
      this.sessions.delete(session.id);
    }
    
    return undefined;
  }

  async deleteSession(token: string): Promise<void> {
    const session = Array.from(this.sessions.values()).find(
      (s) => s.sessionToken === token
    );
    if (session) {
      this.sessions.delete(session.id);
    }
  }

  async cleanExpiredSessions(): Promise<void> {
    const now = new Date();
    const expiredSessions: number[] = [];
    
    for (const [id, session] of Array.from(this.sessions.entries())) {
      if (session.expiresAt <= now) {
        expiredSessions.push(id);
      }
    }
    
    expiredSessions.forEach(id => {
      this.sessions.delete(id);
    });
  }
}

export const storage = new MemStorage();
