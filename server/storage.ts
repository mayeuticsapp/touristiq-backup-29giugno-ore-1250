import { iqCodes, sessions, assignedPackages, type IqCode, type InsertIqCode, type Session, type InsertSession, type AssignedPackage, type InsertAssignedPackage, type UserRole } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, lt } from "drizzle-orm";

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

  // Package assignment methods
  createAssignedPackage(assignedPackage: InsertAssignedPackage): Promise<AssignedPackage>;
  getPackagesByRecipient(recipientIqCode: string): Promise<AssignedPackage[]>;
  getAllAssignedPackages(): Promise<AssignedPackage[]>;
}

export class MemStorage implements IStorage {
  private iqCodes: Map<number, IqCode>;
  private sessions: Map<number, Session>;
  private assignedPackages: Map<number, AssignedPackage>;
  private currentIqCodeId: number;
  private currentSessionId: number;
  private currentPackageId: number;

  constructor() {
    this.iqCodes = new Map();
    this.sessions = new Map();
    this.assignedPackages = new Map();
    this.currentIqCodeId = 1;
    this.currentSessionId = 1;
    this.currentPackageId = 1;

    // Initialize with default IQ codes
    this.initializeDefaultCodes();
  }

  private async initializeDefaultCodes() {
    // Fresh start - only admin user
    const defaultCodes = [
      { code: 'TIQ-IT-ADMIN', role: 'admin' as UserRole, isActive: true },
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
      assignedTo: insertIqCode.assignedTo || null,
      location: insertIqCode.location || null,
      codeType: insertIqCode.codeType || null,
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

  // Package assignment methods
  async createAssignedPackage(insertAssignedPackage: InsertAssignedPackage): Promise<AssignedPackage> {
    const id = this.currentPackageId++;
    const assignedPackage: AssignedPackage = {
      id,
      recipientIqCode: insertAssignedPackage.recipientIqCode,
      packageSize: insertAssignedPackage.packageSize,
      status: insertAssignedPackage.status || "available",
      assignedBy: insertAssignedPackage.assignedBy,
      codesGenerated: insertAssignedPackage.codesGenerated || null,
      codesUsed: insertAssignedPackage.codesUsed || 0,
      assignedAt: new Date()
    };
    
    this.assignedPackages.set(id, assignedPackage);
    return assignedPackage;
  }

  async getPackagesByRecipient(recipientIqCode: string): Promise<AssignedPackage[]> {
    return Array.from(this.assignedPackages.values()).filter(
      pkg => pkg.recipientIqCode === recipientIqCode
    );
  }

  async getAllAssignedPackages(): Promise<AssignedPackage[]> {
    return Array.from(this.assignedPackages.values());
  }
}

// PostgreSQL Storage Class
export class PostgreStorage implements IStorage {
  private db: any;

  constructor() {
    const sql = neon(process.env.DATABASE_URL!);
    this.db = drizzle(sql, { schema: { iqCodes, sessions, assignedPackages } });
    this.initializeDefaultCodes();
  }

  private async initializeDefaultCodes() {
    try {
      // Check if admin already exists
      const existingAdmin = await this.db.select().from(iqCodes).where(eq(iqCodes.code, 'TIQ-IT-ADMIN')).limit(1);
      
      if (existingAdmin.length === 0) {
        await this.db.insert(iqCodes).values({
          code: 'TIQ-IT-ADMIN',
          role: 'admin',
          isActive: true,
          createdAt: new Date()
        });
        console.log('Admin user TIQ-IT-ADMIN created in PostgreSQL');
      }
    } catch (error) {
      console.log('Error initializing admin user:', error);
    }
  }

  async getIqCodeByCode(code: string): Promise<IqCode | undefined> {
    const result = await this.db.select().from(iqCodes).where(eq(iqCodes.code, code)).limit(1);
    return result[0];
  }

  async createIqCode(insertIqCode: InsertIqCode): Promise<IqCode> {
    const result = await this.db.insert(iqCodes).values({
      ...insertIqCode,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async getAllIqCodes(): Promise<IqCode[]> {
    return await this.db.select().from(iqCodes);
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const result = await this.db.insert(sessions).values({
      iqCode: insertSession.iqCode,
      role: insertSession.role,
      sessionToken: insertSession.sessionToken,
      expiresAt: insertSession.expiresAt,
      createdAt: new Date()
    }).returning();
    return result[0];
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    const result = await this.db.select().from(sessions).where(eq(sessions.sessionToken, token)).limit(1);
    return result[0];
  }

  async deleteSession(token: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.sessionToken, token));
  }

  async cleanExpiredSessions(): Promise<void> {
    const now = new Date();
    try {
      await this.db.delete(sessions).where(lt(sessions.expiresAt, now));
    } catch (error) {
      console.log('Error cleaning expired sessions:', error);
    }
  }

  async createAssignedPackage(insertAssignedPackage: InsertAssignedPackage): Promise<AssignedPackage> {
    const result = await this.db.insert(assignedPackages).values({
      ...insertAssignedPackage,
      assignedAt: new Date()
    }).returning();
    return result[0];
  }

  async getPackagesByRecipient(recipientIqCode: string): Promise<AssignedPackage[]> {
    return await this.db.select().from(assignedPackages).where(eq(assignedPackages.recipientIqCode, recipientIqCode));
  }

  async getAllAssignedPackages(): Promise<AssignedPackage[]> {
    return await this.db.select().from(assignedPackages);
  }
}

// Use PostgreSQL storage if DATABASE_URL exists, otherwise fallback to memory
export const storage = process.env.DATABASE_URL ? new PostgreStorage() : new MemStorage();
