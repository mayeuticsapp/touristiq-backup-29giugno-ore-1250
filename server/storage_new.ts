import { eq, desc, and, sql, or } from "drizzle-orm";
import { db } from "./db";
import { iqCodes, sessions, assignedPackages, guests, adminCredits, purchasedPackages, accountingMovements, structureSettings, settingsConfig, iqcodeValidations, iqcodeRecharges, partnerOffers, generatedEmotionalCodes, type IqCode, type InsertIqCode, type Session, type InsertSession, type AssignedPackage, type InsertAssignedPackage, type Guest, type InsertGuest, type AdminCredits, type InsertAdminCredits, type PurchasedPackage, type InsertPurchasedPackage, type AccountingMovement, type InsertAccountingMovement, type StructureSettings, type InsertStructureSettings, type SettingsConfig, type InsertSettingsConfig, type UserRole, type IqcodeValidation, type InsertIqcodeValidation, type IqcodeRecharge, type InsertIqcodeRecharge, type PartnerOffer, type InsertPartnerOffer } from "@shared/schema";

export interface IStorage {
  // User management methods
  createUser(user: { username: string; role: UserRole }): Promise<IqCode>;
  getUserByUsername(username: string): Promise<IqCode | undefined>;
  getAllUsers(): Promise<IqCode[]>;
  updateUser(code: string, updates: Partial<InsertIqCode>): Promise<IqCode>;
  deleteUser(code: string): Promise<void>;

  // Session management methods  
  getAllSessions(): Promise<Session[]>;
  createSession(session: InsertSession): Promise<Session>;
  getSessionByToken(token: string): Promise<Session | undefined>;
  deleteSession(token: string): Promise<void>;
  deleteSessionsByUser(userCode: string): Promise<void>;

  // Package management methods
  getActivePackages(recipientCode: string): Promise<AssignedPackage[]>;
  addAssignedPackage(pkg: InsertAssignedPackage): Promise<AssignedPackage>;
  updatePackageCredits(id: number, creditsUsed: number): Promise<AssignedPackage>;

  // Guest management methods
  createGuest(guest: InsertGuest): Promise<Guest>;
  getGuestsByStructure(structureCode: string): Promise<Guest[]>;
  getGuestById(id: number): Promise<Guest | undefined>;
  updateGuest(id: number, updates: Partial<InsertGuest>): Promise<Guest>;
  deleteGuest(id: number): Promise<void>;

  // IQ Code management methods
  createIqCode(iqCode: InsertIqCode): Promise<IqCode>;
  getIqCodeByCode(code: string): Promise<IqCode | undefined>;
  getAllIqCodes(): Promise<IqCode[]>;
  updateIqCode(code: string, updates: Partial<InsertIqCode>): Promise<IqCode>;
  deleteIqCode(code: string): Promise<void>;
  getAssignedCodesByGuest(guestId: number): Promise<any[]>;
  assignCodeToGuest(code: string, guestId: number, guestName: string): Promise<void>;
  removeCodeFromGuest(code: string, guestId: number, reason: string): Promise<void>;
  assignAvailableCodeToGuest(code: string, guestId: number, guestName: string): Promise<void>;
  getTotalIQCodesRemaining(): Promise<number>;
  useIQCodeFromPackage(): Promise<boolean>;

  // Accounting methods
  createAccountingMovement(movement: InsertAccountingMovement): Promise<AccountingMovement>;

  // Validation methods for partner system
  createIqcodeValidation(data: any): Promise<any>;
  getValidationsByPartner(partnerCode: string): Promise<any[]>;
  getValidationsByTourist?(touristCode: string): Promise<any[]>;
  getValidationById?(id: number): Promise<any>;
  updateValidationStatus?(id: number, status: string): Promise<any>;
  decrementValidationUses?(id: number): Promise<any>;
  
  // Partner offer methods
  createPartnerOffer?(offer: any): Promise<any>;
  getPartnerOffers?(partnerCode: string): Promise<any[]>;
  
  // Recharge methods
  createIqcodeRecharge?(recharge: any): Promise<any>;
  getRechargesWithFilters?(): Promise<any[]>;
  activateRecharge?(id: number): Promise<any>;
  
  // Other methods
  createSpecialClient?(client: any): Promise<any>;
  createTouristLinkRequest?(partnerCode: string, touristCode: string): Promise<void>;
  getRealOffersByCity?(city: string): Promise<any[]>;
  getRealOffersNearby?(location: string): Promise<any[]>;
  getAllValidations?(): Promise<any[]>;
}

// MemStorage implementation with basic functionality
class MemStorage implements IStorage {
  private users: Map<string, IqCode> = new Map();
  private sessions: Map<string, Session> = new Map();
  private packages: Map<number, AssignedPackage> = new Map();
  private guests: Map<number, Guest> = new Map();
  private codes: Map<string, IqCode> = new Map();
  private accountingMovements: Map<number, AccountingMovement> = new Map();
  
  private currentUserId = 1;
  private currentSessionId = 1;
  private currentPackageId = 1;
  private currentGuestId = 1;
  private currentAccountingMovementId = 1;

  async createUser(user: { username: string; role: UserRole }): Promise<IqCode> {
    const newUser: IqCode = {
      id: this.currentUserId++,
      code: user.username,
      role: user.role,
      isActive: true,
      status: 'approved',
      createdAt: new Date(),
      updatedAt: new Date(),
      assignedTo: null,
      assignedBy: null,
      location: null,
      codeType: null
    };
    this.users.set(user.username, newUser);
    return newUser;
  }

  async getUserByUsername(username: string): Promise<IqCode | undefined> {
    return this.users.get(username);
  }

  async getAllUsers(): Promise<IqCode[]> {
    return Array.from(this.users.values());
  }

  async updateUser(code: string, updates: Partial<InsertIqCode>): Promise<IqCode> {
    const user = this.users.get(code);
    if (!user) throw new Error("User not found");
    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(code, updatedUser);
    return updatedUser;
  }

  async deleteUser(code: string): Promise<void> {
    this.users.delete(code);
  }

  async getAllSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values());
  }

  async createSession(session: InsertSession): Promise<Session> {
    const newSession: Session = {
      id: this.currentSessionId++,
      ...session,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.sessions.set(session.token, newSession);
    return newSession;
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    return this.sessions.get(token);
  }

  async deleteSession(token: string): Promise<void> {
    this.sessions.delete(token);
  }

  async deleteSessionsByUser(userCode: string): Promise<void> {
    for (const [token, session] of this.sessions.entries()) {
      if (session.userCode === userCode) {
        this.sessions.delete(token);
      }
    }
  }

  async getActivePackages(recipientCode: string): Promise<AssignedPackage[]> {
    return Array.from(this.packages.values()).filter(
      pkg => pkg.recipientIqCode === recipientCode && pkg.status === 'active'
    );
  }

  async addAssignedPackage(pkg: InsertAssignedPackage): Promise<AssignedPackage> {
    const newPackage: AssignedPackage = {
      id: this.currentPackageId++,
      ...pkg,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.packages.set(newPackage.id, newPackage);
    return newPackage;
  }

  async updatePackageCredits(id: number, creditsUsed: number): Promise<AssignedPackage> {
    const pkg = this.packages.get(id);
    if (!pkg) throw new Error("Package not found");
    const updatedPackage = { 
      ...pkg, 
      creditsUsed, 
      creditsRemaining: pkg.packageSize - creditsUsed,
      updatedAt: new Date() 
    };
    this.packages.set(id, updatedPackage);
    return updatedPackage;
  }

  async createGuest(guest: InsertGuest): Promise<Guest> {
    const newGuest: Guest = {
      id: this.currentGuestId++,
      ...guest,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.guests.set(newGuest.id, newGuest);
    return newGuest;
  }

  async getGuestsByStructure(structureCode: string): Promise<Guest[]> {
    return Array.from(this.guests.values()).filter(
      guest => guest.structureCode === structureCode && guest.isActive
    );
  }

  async getGuestById(id: number): Promise<Guest | undefined> {
    return this.guests.get(id);
  }

  async updateGuest(id: number, updates: Partial<InsertGuest>): Promise<Guest> {
    const existingGuest = this.guests.get(id);
    if (!existingGuest) {
      throw new Error("Guest with id " + id + " not found");
    }

    const updatedGuest: Guest = {
      ...existingGuest,
      ...updates,
      updatedAt: new Date()
    };

    this.guests.set(id, updatedGuest);
    return updatedGuest;
  }

  async deleteGuest(id: number): Promise<void> {
    const guest = this.guests.get(id);
    if (guest) {
      guest.isActive = false;
      guest.updatedAt = new Date();
      this.guests.set(id, guest);
    }
  }

  async createIqCode(iqCode: InsertIqCode): Promise<IqCode> {
    const newCode: IqCode = {
      id: this.currentUserId++,
      ...iqCode,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.codes.set(iqCode.code, newCode);
    return newCode;
  }

  async getIqCodeByCode(code: string): Promise<IqCode | undefined> {
    return this.codes.get(code);
  }

  async getAllIqCodes(): Promise<IqCode[]> {
    return Array.from(this.codes.values());
  }

  async updateIqCode(code: string, updates: Partial<InsertIqCode>): Promise<IqCode> {
    const iqCode = this.codes.get(code);
    if (!iqCode) throw new Error("IQ Code not found");
    const updatedCode = { ...iqCode, ...updates, updatedAt: new Date() };
    this.codes.set(code, updatedCode);
    return updatedCode;
  }

  async deleteIqCode(code: string): Promise<void> {
    this.codes.delete(code);
  }

  async getAssignedCodesByGuest(guestId: number): Promise<any[]> {
    return [];
  }

  async assignCodeToGuest(code: string, guestId: number, guestName: string): Promise<void> {
    // Implementation stub
  }

  async removeCodeFromGuest(code: string, guestId: number, reason: string): Promise<void> {
    // Implementation stub
  }

  async assignAvailableCodeToGuest(code: string, guestId: number, guestName: string): Promise<void> {
    // Implementation stub
  }

  async getTotalIQCodesRemaining(): Promise<number> { 
    return 0; 
  }

  async useIQCodeFromPackage(): Promise<boolean> { 
    return false; 
  }

  async createAccountingMovement(movement: InsertAccountingMovement): Promise<AccountingMovement> {
    const newMovement: AccountingMovement = {
      id: this.currentAccountingMovementId++,
      structureCode: movement.structureCode,
      description: movement.description,
      amount: movement.amount,
      type: movement.type,
      category: movement.category,
      notes: movement.notes,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.accountingMovements.set(newMovement.id, newMovement);
    return newMovement;
  }

  async createIqcodeValidation(data: any): Promise<any> {
    return {
      id: Date.now(),
      ...data,
      createdAt: new Date()
    };
  }

  async getValidationsByPartner(partnerCode: string): Promise<any[]> {
    return [];
  }
}

// PostgreSQL storage implementation  
class PostgreStorage implements IStorage {
  private db = db;

  async createUser(user: { username: string; role: UserRole }): Promise<IqCode> {
    const [created] = await this.db.insert(iqCodes).values({
      code: user.username,
      role: user.role,
      isActive: true,
      status: 'approved'
    }).returning();
    return created;
  }

  async getUserByUsername(username: string): Promise<IqCode | undefined> {
    const [user] = await this.db.select().from(iqCodes).where(eq(iqCodes.code, username));
    return user || undefined;
  }

  async getAllUsers(): Promise<IqCode[]> {
    return await this.db.select().from(iqCodes);
  }

  async updateUser(code: string, updates: Partial<InsertIqCode>): Promise<IqCode> {
    const [updated] = await this.db.update(iqCodes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(iqCodes.code, code))
      .returning();
    return updated;
  }

  async deleteUser(code: string): Promise<void> {
    await this.db.delete(iqCodes).where(eq(iqCodes.code, code));
  }

  async getAllSessions(): Promise<Session[]> {
    return await this.db.select().from(sessions);
  }

  async createSession(session: InsertSession): Promise<Session> {
    const [created] = await this.db.insert(sessions).values(session).returning();
    return created;
  }

  async getSessionByToken(token: string): Promise<Session | undefined> {
    const [session] = await this.db.select().from(sessions).where(eq(sessions.token, token));
    return session || undefined;
  }

  async deleteSession(token: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.token, token));
  }

  async deleteSessionsByUser(userCode: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.userCode, userCode));
  }

  async getActivePackages(recipientCode: string): Promise<AssignedPackage[]> {
    return await this.db.select().from(assignedPackages)
      .where(and(
        eq(assignedPackages.recipientIqCode, recipientCode),
        eq(assignedPackages.status, 'active')
      ));
  }

  async addAssignedPackage(pkg: InsertAssignedPackage): Promise<AssignedPackage> {
    const [created] = await this.db.insert(assignedPackages).values(pkg).returning();
    return created;
  }

  async updatePackageCredits(id: number, creditsUsed: number): Promise<AssignedPackage> {
    const [updated] = await this.db.update(assignedPackages)
      .set({ 
        creditsUsed, 
        creditsRemaining: sql`package_size - ${creditsUsed}`,
        updatedAt: new Date() 
      })
      .where(eq(assignedPackages.id, id))
      .returning();
    return updated;
  }

  async createGuest(guest: InsertGuest): Promise<Guest> {
    const [created] = await this.db.insert(guests).values(guest).returning();
    return created;
  }

  async getGuestsByStructure(structureCode: string): Promise<Guest[]> {
    return await this.db.select().from(guests)
      .where(and(
        eq(guests.structureCode, structureCode),
        eq(guests.isActive, true)
      ));
  }

  async getGuestById(id: number): Promise<Guest | undefined> {
    const [guest] = await this.db.select().from(guests).where(eq(guests.id, id));
    return guest || undefined;
  }

  async updateGuest(id: number, updates: Partial<InsertGuest>): Promise<Guest> {
    const [updated] = await this.db.update(guests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(guests.id, id))
      .returning();
    return updated;
  }

  async deleteGuest(id: number): Promise<void> {
    await this.db.delete(guests).where(eq(guests.id, id));
  }

  async createIqCode(iqCode: InsertIqCode): Promise<IqCode> {
    const [created] = await this.db.insert(iqCodes).values(iqCode).returning();
    return created;
  }

  async getIqCodeByCode(code: string): Promise<IqCode | undefined> {
    const [iqCode] = await this.db.select().from(iqCodes).where(eq(iqCodes.code, code));
    return iqCode || undefined;
  }

  async getAllIqCodes(): Promise<IqCode[]> {
    return await this.db.select().from(iqCodes);
  }

  async updateIqCode(code: string, updates: Partial<InsertIqCode>): Promise<IqCode> {
    const [updated] = await this.db.update(iqCodes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(iqCodes.code, code))
      .returning();
    return updated;
  }

  async deleteIqCode(code: string): Promise<void> {
    await this.db.delete(iqCodes).where(eq(iqCodes.code, code));
  }

  async getAssignedCodesByGuest(guestId: number): Promise<any[]> {
    return [];
  }

  async assignCodeToGuest(code: string, guestId: number, guestName: string): Promise<void> {
    // Implementation stub
  }

  async removeCodeFromGuest(code: string, guestId: number, reason: string): Promise<void> {
    // Implementation stub
  }

  async assignAvailableCodeToGuest(code: string, guestId: number, guestName: string): Promise<void> {
    // Implementation stub
  }

  async getTotalIQCodesRemaining(): Promise<number> { 
    return 0; 
  }

  async useIQCodeFromPackage(): Promise<boolean> { 
    return false; 
  }

  async createAccountingMovement(movement: InsertAccountingMovement): Promise<AccountingMovement> {
    const [created] = await this.db.insert(accountingMovements).values(movement).returning();
    return created;
  }

  async createIqcodeValidation(data: any): Promise<any> {
    const [created] = await this.db
      .insert(iqcodeValidations)
      .values(data)
      .returning();
    return created;
  }

  async getValidationsByPartner(partnerCode: string): Promise<any[]> {
    return await this.db
      .select()
      .from(iqcodeValidations)
      .where(eq(iqcodeValidations.partnerCode, partnerCode));
  }
}

// Extended MemStorage with additional methods for missing functionality
class ExtendedMemStorage extends MemStorage {
  private settingsConfigMap: Map<string, SettingsConfig> = new Map();
  private partnerOffers: any[] = [];

  async getSettingsConfig(structureCode: string): Promise<SettingsConfig | null> {
    return this.settingsConfigMap.get(structureCode) || null;
  }

  async saveSettingsConfig(structureCode: string, settings: Partial<SettingsConfig>): Promise<SettingsConfig> {
    const existingConfig = this.settingsConfigMap.get(structureCode);
    const updatedConfig = {
      id: existingConfig?.id || Date.now(),
      structureCode,
      ...existingConfig,
      ...settings,
      updatedAt: new Date()
    } as SettingsConfig;
    
    this.settingsConfigMap.set(structureCode, updatedConfig);
    return updatedConfig;
  }

  async createPartnerOffer(offer: any): Promise<any> {
    const newOffer = {
      id: Date.now(),
      ...offer,
      createdAt: new Date()
    };
    this.partnerOffers.push(newOffer);
    return newOffer;
  }

  async getPartnerOffers(partnerCode: string): Promise<any[]> {
    return this.partnerOffers.filter(offer => offer.partnerCode === partnerCode);
  }

  async createSpecialClient(client: any): Promise<any> {
    return {
      id: Date.now(),
      ...client,
      createdAt: new Date()
    };
  }

  async createTouristLinkRequest(partnerCode: string, touristCode: string): Promise<void> {
    console.log("Richiesta collegamento da " + partnerCode + " a " + touristCode);
  }

  async getRealOffersByCity(city: string): Promise<any[]> {
    return [];
  }

  async getRealOffersNearby(location: string): Promise<any[]> {
    return [];
  }

  async getValidationsByTourist(touristCode: string): Promise<any[]> {
    return [];
  }

  async getValidationById(id: number): Promise<any> {
    return null;
  }

  async updateValidationStatus(id: number, status: string): Promise<any> {
    return null;
  }

  async decrementValidationUses(id: number): Promise<any> {
    return null;
  }

  async createIqcodeRecharge(recharge: any): Promise<any> {
    return {
      id: Date.now(),
      ...recharge,
      createdAt: new Date()
    };
  }

  async getRechargesWithFilters(): Promise<any[]> {
    return [];
  }

  async activateRecharge(id: number): Promise<any> {
    return null;
  }

  async getAllValidations(): Promise<any[]> {
    return [];
  }
}

// Use PostgreSQL storage if DATABASE_URL exists, otherwise fallback to memory
export const storage = process.env.DATABASE_URL ? new PostgreStorage() : new ExtendedMemStorage();