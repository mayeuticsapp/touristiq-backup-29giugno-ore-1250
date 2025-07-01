import { iqCodes, sessions, assignedPackages, guests, adminCredits, purchasedPackages, accountingMovements, structureSettings, settingsConfig, iqcodeValidations, iqcodeRecharges, conversations, messages, type IqCode, type InsertIqCode, type Session, type InsertSession, type AssignedPackage, type InsertAssignedPackage, type Guest, type InsertGuest, type AdminCredits, type InsertAdminCredits, type PurchasedPackage, type InsertPurchasedPackage, type AccountingMovement, type InsertAccountingMovement, type StructureSettings, type InsertStructureSettings, type SettingsConfig, type InsertSettingsConfig, type UserRole, type IqcodeValidation, type InsertIqcodeValidation, type IqcodeRecharge, type InsertIqcodeRecharge, type Conversation, type InsertConversation, type Message, type InsertMessage } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, lt, desc, like, sql, inArray, ilike, asc, gte, lte, count, sum } from "drizzle-orm";
import { pool } from "./db";

// Memoria globale condivisa per onboarding partner
const globalPartnerOnboardingData = new Map<string, any>();

export interface IStorage {
  // IQ Code methods
  getIqCodeByCode(code: string): Promise<IqCode | undefined>;
  createIqCode(iqCode: InsertIqCode): Promise<IqCode>;
  getAllIqCodes(): Promise<IqCode[]>;
  updateIqCodeStatus(id: number, status: string, approvedBy?: string): Promise<IqCode>;
  deleteIqCode(id: number): Promise<void>;
  updateIqCodeNote(id: number, note: string): Promise<IqCode>;
  softDeleteIqCode(id: number, deletedBy: string): Promise<IqCode>;
  getDeletedIqCodes(): Promise<IqCode[]>;
  restoreIqCode(id: number): Promise<IqCode>;
  cleanupExpiredDeleted(): Promise<void>;

  // Session methods
  createSession(session: InsertSession): Promise<Session>;
  getSessionByToken(token: string): Promise<Session | undefined>;
  deleteSession(token: string): Promise<void>;
  cleanExpiredSessions(): Promise<void>;

  // Package assignment methods
  createAssignedPackage(assignedPackage: InsertAssignedPackage): Promise<AssignedPackage>;
  getPackagesByRecipient(recipientIqCode: string): Promise<AssignedPackage[]>;
  getAllAssignedPackages(): Promise<AssignedPackage[]>;

  // Guest management methods
  createGuest(guest: InsertGuest): Promise<Guest>;
  getGuestsByStructure(structureCode: string): Promise<Guest[]>;
  getGuestById(id: number): Promise<Guest | undefined>;
  updateGuest(id: number, updates: Partial<InsertGuest>): Promise<Guest>;
  deleteGuest(id: number): Promise<void>;

  // Emotional IQCode generation methods
  generateEmotionalIQCode(structureCode: string, packageId: number, guestName: string, guestId?: number): Promise<{ code: string; remainingCredits: number }>;
  decrementPackageCredits(packageId: number): Promise<void>;

  // IQCode management methods - Rimozione e riassegnazione
  getAssignedCodesByGuest(guestId: number): Promise<any[]>;
  removeCodeFromGuest(code: string, guestId: number, reason: string): Promise<void>;
  getAvailableCodesForStructure(structureCode: string): Promise<any[]>;
  assignAvailableCodeToGuest(code: string, guestId: number, guestName: string): Promise<void>;

  // IQCode validation methods - Sistema validazione Partner-Turista
  createIqcodeValidation(validation: any): Promise<any>;
  getValidationsByTourist(touristCode: string): Promise<any[]>;
  getValidationsByPartner(partnerCode: string): Promise<any[]>;
  updateValidationStatus(id: number, status: string, respondedAt?: Date): Promise<any>;
  getValidationById(id: number): Promise<any | undefined>;
  decrementValidationUses(id: number): Promise<any>;

  // Admin credits methods - Pacchetto RobS
  getAdminCredits(adminCode: string): Promise<AdminCredits | undefined>;
  createAdminCredits(adminCredits: InsertAdminCredits): Promise<AdminCredits>;
  decrementAdminCredits(adminCode: string): Promise<AdminCredits>;
  getAdminGenerationLog(adminCode: string): Promise<IqCode[]>;

  // Structure packages methods
  createPurchasedPackage(purchasedPackage: InsertPurchasedPackage): Promise<PurchasedPackage>;
  getPurchasedPackagesByStructure(structureCode: string): Promise<PurchasedPackage[]>;
  getTotalIQCodesRemaining(structureCode: string): Promise<number>;
  useIQCodeFromPackage(structureCode: string): Promise<boolean>;

  // Accounting movements methods
  createAccountingMovement(movement: InsertAccountingMovement): Promise<AccountingMovement>;
  getAccountingMovements(structureCode: string): Promise<AccountingMovement[]>;
  updateAccountingMovement(id: number, updates: Partial<InsertAccountingMovement>): Promise<AccountingMovement>;
  deleteAccountingMovement(id: number): Promise<void>;
  getMonthlyAccountingSummary(structureCode: string, month: string): Promise<{income: number, expenses: number, balance: number}>;

  // Structure settings methods
  getStructureSettings(structureCode: string): Promise<StructureSettings | undefined>;
  createStructureSettings(settings: InsertStructureSettings): Promise<StructureSettings>;
  updateStructureSettings(structureCode: string, settings: Partial<InsertStructureSettings>): Promise<StructureSettings>;
  checkGestionaleAccess(structureCode: string): Promise<{hasAccess: boolean, hoursRemaining?: number}>;

  // Settings config methods - Impostazioni generali persistenti
  getSettingsConfig(structureCode: string): Promise<any>;
  updateSettingsConfig(structureCode: string, settings: any): Promise<any>;

  // Partner methods
  createTouristLinkRequest(partnerCode: string, touristCode: string): Promise<void>;
  
  // Validazione IQCode methods
  createIqcodeValidation(data: {partnerCode: string, touristCode: string, requestedAt: Date, status: string, usesRemaining: number, usesTotal: number}): Promise<any>;
  getValidationsByTourist(touristCode: string): Promise<any[]>;
  getValidationsByPartner(partnerCode: string): Promise<any[]>;
  getValidationById(id: number): Promise<any | null>;
  updateValidationStatus(id: number, status: string, respondedAt?: Date): Promise<any>;
  decrementValidationUses(validationId: number): Promise<any>;
  
  // Ricariche IQCode methods
  createIqcodeRecharge(data: {touristCode: string, amount: number, status: string, requestedAt: Date}): Promise<any>;
  getRechargesWithFilters(filters: any): Promise<{recharges: any[], total: number}>;
  activateRecharge(rechargeId: number, adminCode: string): Promise<any>;
  createPartnerOffer(offer: {partnerCode: string, title: string, description?: string, discount: number, validUntil?: string}): Promise<any>;
  createSpecialClient(client: {partnerCode: string, name: string, notes: string}): Promise<any>;

  // Partner onboarding methods
  getPartnerOnboardingStatus(partnerCode: string): Promise<{completed: boolean, currentStep?: string, completedSteps?: string[]} | undefined>;
  savePartnerOnboardingStep(partnerCode: string, step: string, data: any): Promise<void>;
  completePartnerOnboarding(partnerCode: string): Promise<void>;
  
  // IQCode validation methods
  createIqcodeValidation(data: {partnerCode: string, touristIqCode: string}): Promise<any>;
  getValidationsByTourist(touristCode: string): Promise<any[]>;
  getValidationsByPartner(partnerCode: string): Promise<any[]>;
  getValidationById(id: number): Promise<any>;
  updateValidationStatus(id: number, status: string): Promise<any>;
  decrementValidationUses(id: number): Promise<any>;
  
  // IQCode recharge methods
  createIqcodeRecharge(validationId: number, touristCode: string): Promise<any>;
  getPendingRecharges(): Promise<any[]>;
  activateRecharge(rechargeId: number, adminNote?: string): Promise<any>;
  getRechargesWithFilters(filters: {page: number, limit: number, search: string, status: string, sort: string}): Promise<{recharges: any[], total: number, stats: any}>;
  
  // Metodi per offerte reali
  getAcceptedPartnersByTourist(touristCode: string): Promise<any[]>;
  getRealOffersByPartners(partnerCodes: string[]): Promise<any[]>;
  getRealOffersByCity(cityName: string): Promise<any[]>;
  getRealOffersNearby(latitude: number, longitude: number, radius: number): Promise<any[]>;
  
  // Metodi per messaggeria interna
  createConversation(data: {touristCode: string, partnerCode: string, touristName?: string, partnerName: string}): Promise<any>;
  getConversationsByTourist(touristCode: string): Promise<any[]>;
  getConversationsByPartner(partnerCode: string): Promise<any[]>;
  getConversationById(conversationId: number): Promise<any | null>;
  createMessage(data: {conversationId: number, senderCode: string, senderType: string, senderName?: string, content: string}): Promise<any>;
  getMessagesByConversation(conversationId: number): Promise<any[]>;
  markMessagesAsRead(conversationId: number, readerCode: string): Promise<void>;
  getUnreadMessagesCount(userCode: string): Promise<number>;
}

export class MemStorage implements IStorage {
  private iqCodes: Map<number, IqCode>;
  private sessions: Map<number, Session>;
  private assignedPackages: Map<number, AssignedPackage>;
  private guests: Map<number, Guest>;
  private adminCredits: Map<string, AdminCredits>;
  private purchasedPackages: Map<number, PurchasedPackage>;
  private accountingMovements: Map<number, AccountingMovement>;
  private structureSettings: Map<string, StructureSettings>;
  private generatedCodes: Map<number, any>; // Generated emotional codes
  private availableCodes: Map<number, any>; // Available codes for reassignment
  private currentIqCodeId: number;
  private currentSessionId: number;
  private currentPackageId: number;
  private currentGuestId: number;
  private currentAdminCreditsId: number;
  private currentPurchasedPackageId: number;
  private currentAccountingMovementId: number;
  private currentStructureSettingsId: number;
  private currentGeneratedCodeId: number;
  private currentAvailableCodeId: number;

  constructor() {
    this.iqCodes = new Map();
    this.sessions = new Map();
    this.assignedPackages = new Map();
    this.guests = new Map();
    this.adminCredits = new Map();
    this.purchasedPackages = new Map();
    this.accountingMovements = new Map();
    this.structureSettings = new Map();
    this.generatedCodes = new Map();
    this.availableCodes = new Map();
    this.currentIqCodeId = 1;
    this.currentSessionId = 1;
    this.currentPackageId = 1;
    this.currentGuestId = 1;
    this.currentAdminCreditsId = 1;
    this.currentPurchasedPackageId = 1;
    this.currentAccountingMovementId = 1;
    this.currentStructureSettingsId = 1;
    this.currentGeneratedCodeId = 1;
    this.currentAvailableCodeId = 1;

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
      status: insertIqCode.status ?? "pending",
      createdAt: new Date(),
      assignedTo: insertIqCode.assignedTo || null,
      location: insertIqCode.location || null,
      codeType: insertIqCode.codeType || null,
      approvedAt: null,
      approvedBy: null,
      internalNote: null,
      isDeleted: false,
      deletedAt: null,
    };
    this.iqCodes.set(id, iqCode);
    return iqCode;
  }

  async getAllIqCodes(): Promise<IqCode[]> {
    return Array.from(this.iqCodes.values());
  }

  async updateIqCodeStatus(id: number, status: string, approvedBy?: string): Promise<IqCode> {
    const iqCode = this.iqCodes.get(id);
    if (!iqCode) {
      throw new Error("Codice IQ non trovato");
    }

    const updatedIqCode: IqCode = {
      ...iqCode,
      status,
      approvedAt: status === 'approved' ? new Date() : iqCode.approvedAt,
      approvedBy: status === 'approved' ? (approvedBy || null) : iqCode.approvedBy
    };

    this.iqCodes.set(id, updatedIqCode);
    return updatedIqCode;
  }

  async deleteIqCode(id: number): Promise<void> {
    this.iqCodes.delete(id);
  }

  async updateIqCodeNote(id: number, note: string): Promise<IqCode> {
    const iqCode = this.iqCodes.get(id);
    if (!iqCode) {
      throw new Error("Codice IQ non trovato");
    }

    const updatedIqCode: IqCode = {
      ...iqCode,
      internalNote: note
    };

    this.iqCodes.set(id, updatedIqCode);
    return updatedIqCode;
  }

  async softDeleteIqCode(id: number, deletedBy: string): Promise<IqCode> {
    const iqCode = this.iqCodes.get(id);
    if (!iqCode) {
      throw new Error("Codice IQ non trovato");
    }

    const updatedIqCode: IqCode = {
      ...iqCode,
      isDeleted: true,
      deletedAt: new Date()
    };

    this.iqCodes.set(id, updatedIqCode);
    return updatedIqCode;
  }

  async getDeletedIqCodes(): Promise<IqCode[]> {
    return Array.from(this.iqCodes.values()).filter(iqCode => iqCode.isDeleted);
  }

  async restoreIqCode(id: number): Promise<IqCode> {
    const iqCode = this.iqCodes.get(id);
    if (!iqCode) {
      throw new Error("Codice IQ non trovato");
    }

    const updatedIqCode: IqCode = {
      ...iqCode,
      isDeleted: false,
      deletedAt: null
    };

    this.iqCodes.set(id, updatedIqCode);
    return updatedIqCode;
  }

  async cleanupExpiredDeleted(): Promise<void> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const expiredIds: number[] = [];

    for (const [id, iqCode] of Array.from(this.iqCodes.entries())) {
      if (iqCode.isDeleted && iqCode.deletedAt && iqCode.deletedAt < twentyFourHoursAgo) {
        expiredIds.push(id);
      }
    }

    expiredIds.forEach(id => this.iqCodes.delete(id));
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
      creditsRemaining: insertAssignedPackage.packageSize, // Crediti iniziali = packageSize
      creditsUsed: 0,
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

  // Guest management methods
  async createGuest(insertGuest: InsertGuest): Promise<Guest> {
    const id = this.currentGuestId++;
    const guest: Guest = {
      id,
      structureCode: insertGuest.structureCode,
      firstName: insertGuest.firstName,
      lastName: insertGuest.lastName,
      email: insertGuest.email || null,
      phone: insertGuest.phone || null,
      roomNumber: insertGuest.roomNumber || null,
      checkinDate: insertGuest.checkinDate || null,
      checkoutDate: insertGuest.checkoutDate || null,
      notes: insertGuest.notes || null,
      assignedCodes: insertGuest.assignedCodes || 0,
      isActive: insertGuest.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.guests.set(id, guest);
    return guest;
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
      throw new Error(`Guest with id ${id} not found`);
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

  // Emotional IQCode generation methods
  async generateEmotionalIQCode(structureCode: string, packageId: number, guestName: string, guestId?: number): Promise<{ code: string; remainingCredits: number }> {
    // Get package and verify credits
    const targetPackage = this.assignedPackages.get(packageId);
    if (!targetPackage || targetPackage.creditsRemaining <= 0) {
      throw new Error("Nessun credito disponibile nel pacchetto");
    }

    // Import emotional words for code generation
    const { generateEmotionalIQCode, parseIQCode } = await import('./iq-generator');
    
    // Generate unique emotional code (TIQ-IT-ROSA format)
    let uniqueCode: string;
    let attempts = 0;
    do {
      uniqueCode = generateEmotionalIQCode('IT'); // Default Italy for now
      attempts++;
    } while (this.isCodeExists(uniqueCode) && attempts < 50);

    if (attempts >= 50) {
      throw new Error("Impossibile generare codice univoco");
    }

    // Parse the generated code to extract country and word
    const parsedCode = parseIQCode(uniqueCode);
    
    // Save generated code for tracking
    const generatedCode = {
      id: this.currentGeneratedCodeId++,
      code: uniqueCode,
      generatedBy: structureCode,
      packageId: packageId,
      assignedTo: guestName,
      guestId: guestId || null,
      country: parsedCode?.country || 'IT',
      emotionalWord: parsedCode?.word || 'UNKNOWN',
      status: 'assigned',
      generatedAt: new Date(),
      assignedAt: new Date()
    };
    
    this.generatedCodes.set(generatedCode.id, generatedCode);
    console.log(`DEBUG: Salvato codice ${uniqueCode} con ID ${generatedCode.id} per ospite ${guestId}. Totale codici: ${this.generatedCodes.size}`);

    // Save to PostgreSQL database using neon connection (sync with existing project setup)
    try {
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      const result = await sql`
        INSERT INTO generated_iq_codes (code, generated_by, package_id, assigned_to, guest_id, country, emotional_word, status, assigned_at)
        VALUES (${uniqueCode}, ${structureCode}, ${packageId}, ${guestName}, ${guestId}, ${parsedCode?.country || 'IT'}, ${parsedCode?.word || 'UNKNOWN'}, 'assigned', NOW())
        RETURNING id, code
      `;
      
      console.log(`✅ PERSISTENZA OK: Codice ${uniqueCode} salvato con ID ${result[0].id}`);
    } catch (dbError) {
      console.error(`❌ ERRORE NEON: Salvataggio ${uniqueCode} fallito:`, dbError);
    }

    // Decrement credits
    targetPackage.creditsRemaining--;
    targetPackage.creditsUsed++;

    return {
      code: uniqueCode,
      remainingCredits: targetPackage.creditsRemaining
    };
  }

  private isCodeExists(code: string): boolean {
    // Check in existing IQ codes
    return Array.from(this.iqCodes.values()).some(iq => iq.code === code);
  }

  async decrementPackageCredits(packageId: number): Promise<void> {
    const targetPackage = this.assignedPackages.get(packageId);
    if (targetPackage && targetPackage.creditsRemaining > 0) {
      targetPackage.creditsRemaining--;
      targetPackage.creditsUsed++;
    }
  }

  // Admin credits methods - Pacchetto RobS
  async getAdminCredits(adminCode: string): Promise<AdminCredits | undefined> {
    return this.adminCredits.get(adminCode);
  }

  async createAdminCredits(insertAdminCredits: InsertAdminCredits): Promise<AdminCredits> {
    const adminCreditsRecord: AdminCredits = {
      id: this.currentAdminCreditsId++,
      adminCode: insertAdminCredits.adminCode,
      creditsRemaining: insertAdminCredits.creditsRemaining || 1000,
      creditsUsed: insertAdminCredits.creditsUsed || 0,
      lastGeneratedAt: insertAdminCredits.lastGeneratedAt || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.adminCredits.set(adminCreditsRecord.adminCode, adminCreditsRecord);
    return adminCreditsRecord;
  }

  async decrementAdminCredits(adminCode: string): Promise<AdminCredits> {
    let adminCreditsRecord = this.adminCredits.get(adminCode);
    
    if (!adminCreditsRecord) {
      adminCreditsRecord = await this.createAdminCredits({
        adminCode: adminCode,
        creditsRemaining: 1000,
        creditsUsed: 0
      });
    }

    adminCreditsRecord.creditsUsed += 1;
    adminCreditsRecord.creditsRemaining -= 1;
    adminCreditsRecord.lastGeneratedAt = new Date();
    adminCreditsRecord.updatedAt = new Date();

    this.adminCredits.set(adminCode, adminCreditsRecord);
    return adminCreditsRecord;
  }

  async getAdminGenerationLog(adminCode: string): Promise<IqCode[]> {
    return Array.from(this.iqCodes.values()).filter(
      (code) => code.role === 'tourist' && code.assignedTo?.includes(adminCode)
    );
  }

  // Metodi gestione IQCode ospiti - implementazione corretta e funzionale
  async getAssignedCodesByGuest(guestId: number): Promise<any[]> {
    console.log(`DEBUG: Cercando codici per ospite ${guestId} nel database PostgreSQL`);
    
    try {
      const { neon } = await import('@neondatabase/serverless');
      const sql = neon(process.env.DATABASE_URL!);
      
      const result = await sql`
        SELECT code, assigned_to, assigned_at, emotional_word, country
        FROM generated_iq_codes 
        WHERE guest_id = ${guestId} AND status = 'assigned'
        ORDER BY assigned_at DESC
      `;
      
      const codes = result.map((row: any) => ({
        code: row.code,
        assignedTo: row.assigned_to,
        assignedAt: row.assigned_at,
        emotionalWord: row.emotional_word,
        country: row.country
      }));
      
      console.log(`✅ RECUPERO OK: Trovati ${codes.length} codici per ospite ${guestId}`);
      return codes;
    } catch (dbError) {
      console.error(`❌ ERRORE RECUPERO: Impossibile ottenere codici per ospite ${guestId}`);
      // Fallback to memory storage
      const codes = Array.from(this.generatedCodes.values()).filter(code => 
        code.guestId === guestId && code.status === 'assigned'
      );
      console.log(`DEBUG: Fallback memoria - trovati ${codes.length} codici per ospite ${guestId}`);
      return codes;
    }
  }

  async getAvailableCodesForStructure(structureCode: string): Promise<any[]> {
    return Array.from(this.availableCodes.values()).filter(code => 
      code.structureCode === structureCode
    );
  }

  async removeCodeFromGuest(code: string, guestId: number, reason: string): Promise<void> {
    const generatedCode = Array.from(this.generatedCodes.values()).find(gc => 
      gc.code === code && gc.guestId === guestId
    );
    
    if (!generatedCode) {
      throw new Error("Codice non trovato per questo ospite");
    }

    generatedCode.status = 'available';
    generatedCode.guestId = null;
    
    const availableCode = {
      id: this.currentAvailableCodeId++,
      code: code,
      structureCode: generatedCode.generatedBy,
      originalGuestId: guestId,
      originalGuestName: generatedCode.assignedTo || '',
      packageId: generatedCode.packageId,
      reason: reason,
      madeAvailableAt: new Date()
    };
    
    this.availableCodes.set(availableCode.id, availableCode);

    const guest = this.guests.get(guestId);
    if (guest && (guest.assignedCodes || 0) > 0) {
      guest.assignedCodes = (guest.assignedCodes || 0) - 1;
      this.guests.set(guestId, guest);
    }
  }

  async assignAvailableCodeToGuest(code: string, guestId: number, guestName: string): Promise<void> {
    const availableCode = Array.from(this.availableCodes.values()).find(ac => ac.code === code);
    
    if (!availableCode) {
      throw new Error("Codice disponibile non trovato");
    }

    const availableCodeId = Array.from(this.availableCodes.entries())
      .find(([_, ac]) => ac.code === code)?.[0];
    
    if (availableCodeId) {
      this.availableCodes.delete(availableCodeId);
    }

    const generatedCode = Array.from(this.generatedCodes.values()).find(gc => gc.code === code);
    if (generatedCode) {
      generatedCode.status = 'assigned';
      generatedCode.guestId = guestId;
      generatedCode.assignedTo = guestName;
      generatedCode.assignedAt = new Date();
    }

    const guest = this.guests.get(guestId);
    if (guest) {
      guest.assignedCodes = (guest.assignedCodes || 0) + 1;
      this.guests.set(guestId, guest);
    }
  }

  // Partner methods implementation
  async createTouristLinkRequest(partnerCode: string, touristCode: string): Promise<void> {
    // Mock implementation - in real app would create notification
    console.log(`Partner ${partnerCode} requested link with tourist ${touristCode}`);
  }

  async createPartnerOffer(offer: {partnerCode: string, title: string, description?: string, discount: number, validUntil?: string}): Promise<any> {
    const newOffer = {
      id: Date.now(),
      ...offer,
      createdAt: new Date(),
      isActive: true
    };
    return newOffer;
  }

  async createSpecialClient(client: {partnerCode: string, name: string, notes: string}): Promise<any> {
    const newClient = {
      id: Date.now(),
      ...client,
      createdAt: new Date(),
      visits: 0,
      rewards: 0
    };
    return newClient;
  }

  async getSettingsConfig(structureCode: string): Promise<any> {
    return {};
  }

  async updateSettingsConfig(structureCode: string, settings: any): Promise<any> {
    return {};
  }

  // Metodi placeholder per compatibilità con interfaccia
  async createPurchasedPackage(): Promise<PurchasedPackage> { throw new Error("Not implemented"); }
  async getPurchasedPackagesByStructure(): Promise<PurchasedPackage[]> { return []; }
  async getTotalIQCodesRemaining(): Promise<number> { return 0; }
  async useIQCodeFromPackage(): Promise<boolean> { return false; }
  async createAccountingMovement(movement: InsertAccountingMovement): Promise<AccountingMovement> {
    const newMovement: AccountingMovement = {
      id: this.currentAccountingMovementId++,
      structureCode: movement.structureCode,
      type: movement.type,
      category: movement.category,
      description: movement.description,
      amount: movement.amount,
      movementDate: movement.movementDate,
      paymentMethod: movement.paymentMethod,
      clientsServed: movement.clientsServed || null,
      iqcodesUsed: movement.iqcodesUsed || null,
      notes: movement.notes || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.accountingMovements.set(newMovement.id, newMovement);
    return newMovement;
  }

  async getAccountingMovements(structureCode: string): Promise<AccountingMovement[]> {
    return Array.from(this.accountingMovements.values())
      .filter(movement => movement.structureCode === structureCode)
      .sort((a, b) => new Date(b.movementDate).getTime() - new Date(a.movementDate).getTime());
  }

  async updateAccountingMovement(id: number, updates: Partial<InsertAccountingMovement>): Promise<AccountingMovement> {
    const existingMovement = this.accountingMovements.get(id);
    if (!existingMovement) {
      throw new Error("Movimento non trovato");
    }
    
    const updatedMovement: AccountingMovement = {
      ...existingMovement,
      ...updates,
      updatedAt: new Date()
    };
    
    this.accountingMovements.set(id, updatedMovement);
    return updatedMovement;
  }

  async deleteAccountingMovement(id: number): Promise<void> {
    this.accountingMovements.delete(id);
  }

  async getMonthlyAccountingSummary(structureCode: string, month: string): Promise<{income: number, expenses: number, balance: number}> {
    const movements = Array.from(this.accountingMovements.values())
      .filter(movement => 
        movement.structureCode === structureCode && 
        movement.movementDate.startsWith(month)
      );

    const income = movements
      .filter(m => m.type === 'income')
      .reduce((sum, m) => sum + parseFloat(m.amount), 0);

    const expenses = movements
      .filter(m => m.type === 'expense')
      .reduce((sum, m) => sum + parseFloat(m.amount), 0);

    return {
      income,
      expenses,
      balance: income - expenses
    };
  }
  async getStructureSettings(): Promise<StructureSettings | undefined> { return undefined; }
  async createStructureSettings(): Promise<StructureSettings> { throw new Error("Not implemented"); }
  async updateStructureSettings(): Promise<StructureSettings> { throw new Error("Not implemented"); }
  async checkGestionaleAccess(): Promise<{hasAccess: boolean, hoursRemaining?: number}> { return { hasAccess: false }; }

  // Settings config methods
  async getSettingsConfig(structureCode: string): Promise<any> { return {}; }
  async updateSettingsConfig(structureCode: string, settings: any): Promise<any> { return settings; }

  // Partner methods
  async createTouristLinkRequest(partnerCode: string, touristCode: string): Promise<void> { return; }
  async createPartnerOffer(offer: any): Promise<any> { return offer; }
  async createSpecialClient(client: any): Promise<any> { return client; }

  // Partner onboarding methods - IMPLEMENTAZIONE BASE
  async getPartnerOnboardingStatus(partnerCode: string): Promise<{completed: boolean, currentStep?: string, completedSteps?: string[]} | undefined> {
    // Tutti i partner esistenti devono completare l'onboarding
    return { completed: false, currentStep: 'business', completedSteps: [] };
  }

  async savePartnerOnboardingStep(partnerCode: string, step: string, data: any): Promise<void> {
    // Implementazione base - in memoria
    return;
  }

  async completePartnerOnboarding(partnerCode: string): Promise<void> {
    // Implementazione base - in memoria
    return;
  }

  // Implementazioni stub per offerte reali
  async getAcceptedPartnersByTourist(touristCode: string): Promise<any[]> {
    return [];
  }

  async getRealOffersByPartners(partnerCodes: string[]): Promise<any[]> {
    return [];
  }

  async getRealOffersByCity(cityName: string): Promise<any[]> {
    return [];
  }

  async getRealOffersNearby(latitude: number, longitude: number, radius: number): Promise<any[]> {
    return [];
  }
}

// PostgreSQL Storage Class
export class PostgreStorage implements IStorage {
  protected db: any;

  constructor() {
    const sql = neon(process.env.DATABASE_URL!);
    this.db = drizzle(sql, { schema: { iqCodes, sessions, assignedPackages, guests } });
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

      // Crea strutture di esempio se non esistono
      const existingStructures = await this.db.select().from(iqCodes).where(eq(iqCodes.role, 'structure')).limit(1);
      
      if (existingStructures.length === 0) {
        const structures = [
          { code: 'TIQ-VV-STT-9576', role: 'structure' as const },
          { code: 'TIQ-RC-STT-4334', role: 'structure' as const },
          { code: 'TIQ-CS-STT-7541', role: 'structure' as const },
          { code: 'TIQ-VV-STT-0700', role: 'structure' as const }
        ];

        for (const struct of structures) {
          await this.db.insert(iqCodes).values({
            code: struct.code,
            role: struct.role,
            isActive: true,
            createdAt: new Date()
          });
        }
        console.log('Strutture di esempio create in PostgreSQL');

        // Assegna pacchetti alle strutture
        const packages = [
          { recipientIqCode: 'TIQ-VV-STT-9576', packageSize: 25, assignedBy: 'TIQ-IT-ADMIN', availableCodes: 25 },
          { recipientIqCode: 'TIQ-VV-STT-0700', packageSize: 50, assignedBy: 'TIQ-IT-ADMIN', availableCodes: 50 },
          { recipientIqCode: 'TIQ-RC-STT-4334', packageSize: 75, assignedBy: 'TIQ-IT-ADMIN', availableCodes: 75 }
        ];

        for (const pkg of packages) {
          await this.db.insert(assignedPackages).values({
            recipientIqCode: pkg.recipientIqCode,
            packageSize: pkg.packageSize,
            availableCodes: pkg.availableCodes,
            assignedBy: pkg.assignedBy,
            codesUsed: 0,
            assignedAt: new Date()
          });
        }
        console.log('Pacchetti di esempio assegnati in PostgreSQL');
      }

      // Crea partner di esempio se non esistono
      const existingPartners = await this.db.select().from(iqCodes).where(eq(iqCodes.role, 'partner')).limit(1);
      
      if (existingPartners.length === 0) {
        const partners = [
          { code: 'TIQ-VV-PRT-4897', role: 'partner' as const },
          { code: 'TIQ-RC-PRT-8654', role: 'partner' as const }
        ];

        for (const partner of partners) {
          await this.db.insert(iqCodes).values({
            code: partner.code,
            role: partner.role,
            isActive: true,
            createdAt: new Date()
          });
        }
        console.log('Partner di esempio creati in PostgreSQL');
      }

    } catch (error) {
      console.log('Error initializing default data:', error);
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

  async updateIqCodeStatus(id: number, status: string, approvedBy?: string): Promise<IqCode> {
    const updateData: any = { status };
    if (status === 'approved') {
      updateData.approvedAt = new Date();
      updateData.approvedBy = approvedBy;
    }

    const result = await this.db
      .update(iqCodes)
      .set(updateData)
      .where(eq(iqCodes.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Codice IQ non trovato");
    }

    return result[0];
  }

  async deleteIqCode(id: number): Promise<void> {
    await this.db.delete(iqCodes).where(eq(iqCodes.id, id));
  }

  async updateIqCodeNote(id: number, note: string): Promise<IqCode> {
    const result = await this.db
      .update(iqCodes)
      .set({ internalNote: note })
      .where(eq(iqCodes.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Codice IQ non trovato");
    }

    return result[0];
  }

  async softDeleteIqCode(id: number, deletedBy: string): Promise<IqCode> {
    const result = await this.db
      .update(iqCodes)
      .set({ 
        isDeleted: true, 
        deletedAt: new Date() 
      })
      .where(eq(iqCodes.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Codice IQ non trovato");
    }

    return result[0];
  }

  async getDeletedIqCodes(): Promise<IqCode[]> {
    return await this.db.select().from(iqCodes).where(eq(iqCodes.isDeleted, true));
  }

  async restoreIqCode(id: number): Promise<IqCode> {
    const result = await this.db
      .update(iqCodes)
      .set({ 
        isDeleted: false, 
        deletedAt: null 
      })
      .where(eq(iqCodes.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error("Codice IQ non trovato");
    }

    return result[0];
  }

  async cleanupExpiredDeleted(): Promise<void> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await this.db
      .delete(iqCodes)
      .where(and(
        eq(iqCodes.isDeleted, true),
        lt(iqCodes.deletedAt, twentyFourHoursAgo)
      ));
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
      creditsRemaining: insertAssignedPackage.packageSize, // Crediti iniziali
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

  // Guest management methods
  async createGuest(insertGuest: InsertGuest): Promise<Guest> {
    const result = await this.db.insert(guests).values({
      ...insertGuest,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async getGuestsByStructure(structureCode: string): Promise<Guest[]> {
    return await this.db.select().from(guests).where(eq(guests.structureCode, structureCode));
  }

  async getGuestById(id: number): Promise<Guest | undefined> {
    const result = await this.db.select().from(guests).where(eq(guests.id, id)).limit(1);
    return result[0];
  }

  async updateGuest(id: number, updates: Partial<InsertGuest>): Promise<Guest> {
    const result = await this.db.update(guests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(guests.id, id))
      .returning();
    return result[0];
  }

  async deleteGuest(id: number): Promise<void> {
    await this.db.delete(guests).where(eq(guests.id, id));
  }

  // Emotional IQCode generation methods
  async generateEmotionalIQCode(structureCode: string, packageId: number, guestName: string, guestId?: number): Promise<{ code: string; remainingCredits: number }> {
    // Get package and verify credits
    const packages = await this.db.select().from(assignedPackages).where(eq(assignedPackages.id, packageId));
    const targetPackage = packages[0];
    
    if (!targetPackage || targetPackage.creditsRemaining <= 0) {
      throw new Error("Nessun credito disponibile nel pacchetto");
    }

    // Import emotional words for code generation
    const { generateEmotionalIQCode } = await import('./iq-generator');
    
    // Generate unique emotional code (TIQ-IT-ROSA format)
    let uniqueCode: string;
    let attempts = 0;
    do {
      uniqueCode = generateEmotionalIQCode('IT'); // Default Italy for now
      attempts++;
      
      // Check if code exists in database
      const existing = await this.db.select().from(iqCodes).where(eq(iqCodes.code, uniqueCode)).limit(1);
      if (existing.length === 0) break;
    } while (attempts < 50);

    if (attempts >= 50) {
      throw new Error("Impossibile generare codice univoco");
    }

    // Decrement credits
    await this.db.update(assignedPackages)
      .set({ 
        creditsRemaining: targetPackage.creditsRemaining - 1,
        creditsUsed: targetPackage.creditsUsed + 1
      })
      .where(eq(assignedPackages.id, packageId));

    return {
      code: uniqueCode,
      remainingCredits: targetPackage.creditsRemaining - 1
    };
  }

  async decrementPackageCredits(packageId: number): Promise<void> {
    const packages = await this.db.select().from(assignedPackages).where(eq(assignedPackages.id, packageId));
    const targetPackage = packages[0];
    
    if (targetPackage && targetPackage.creditsRemaining > 0) {
      await this.db.update(assignedPackages)
        .set({
          creditsRemaining: targetPackage.creditsRemaining - 1,
          creditsUsed: targetPackage.creditsUsed + 1
        })
        .where(eq(assignedPackages.id, packageId));
    }
  }

  // Admin credits methods - Pacchetto RobS
  async getAdminCredits(adminCode: string): Promise<AdminCredits | undefined> {
    const result = await this.db.select().from(adminCredits).where(eq(adminCredits.adminCode, adminCode)).limit(1);
    return result[0];
  }

  async createAdminCredits(insertAdminCredits: InsertAdminCredits): Promise<AdminCredits> {
    const result = await this.db.insert(adminCredits).values({
      ...insertAdminCredits,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async decrementAdminCredits(adminCode: string): Promise<AdminCredits> {
    let adminCreditsRecord = await this.getAdminCredits(adminCode);
    
    if (!adminCreditsRecord) {
      adminCreditsRecord = await this.createAdminCredits({
        adminCode: adminCode,
        creditsRemaining: 1000,
        creditsUsed: 0
      });
    }

    const result = await this.db.update(adminCredits)
      .set({
        creditsUsed: adminCreditsRecord.creditsUsed + 1,
        creditsRemaining: adminCreditsRecord.creditsRemaining - 1,
        lastGeneratedAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(adminCredits.adminCode, adminCode))
      .returning();

    return result[0];
  }

  async getAdminGenerationLog(adminCode: string): Promise<IqCode[]> {
    return await this.db.select().from(iqCodes)
      .where(and(eq(iqCodes.role, 'tourist'), eq(iqCodes.assignedTo, adminCode)));
  }

  // IQCode management methods - Rimozione e riassegnazione per PostgreStorage
  async getAssignedCodesByGuest(guestId: number): Promise<any[]> {
    // Return empty for now - would need generatedEmotionalCodes table query
    return [];
  }

  async removeCodeFromGuest(code: string, guestId: number, reason: string): Promise<void> {
    // Implementation placeholder - would need generatedEmotionalCodes table updates
    console.log(`Rimozione codice ${code} da ospite ${guestId}: ${reason}`);
  }

  async getAvailableCodesForStructure(structureCode: string): Promise<any[]> {
    // Return empty for now - would need availableIqCodes table query
    return [];
  }

  async assignAvailableCodeToGuest(code: string, guestId: number, guestName: string): Promise<void> {
    // Implementation placeholder - would need availableIqCodes table updates
    console.log(`Assegnazione codice ${code} a ospite ${guestId}: ${guestName}`);
  }

  // Metodi placeholder per compatibilità con interfaccia PostgreStorage
  async createPurchasedPackage(): Promise<PurchasedPackage> { throw new Error("Not implemented"); }
  async getPurchasedPackagesByStructure(): Promise<PurchasedPackage[]> { return []; }
  async getTotalIQCodesRemaining(): Promise<number> { return 0; }
  async useIQCodeFromPackage(): Promise<boolean> { return false; }

  // ACCOUNTING MOVEMENTS - Implementazione reale PostgreSQL
  async createAccountingMovement(movement: InsertAccountingMovement): Promise<AccountingMovement> {
    const [newMovement] = await this.db
      .insert(accountingMovements)
      .values(movement)
      .returning();
    return newMovement;
  }

  async getAccountingMovements(structureCode: string): Promise<AccountingMovement[]> {
    return await this.db
      .select()
      .from(accountingMovements)
      .where(eq(accountingMovements.structureCode, structureCode))
      .orderBy(desc(accountingMovements.movementDate));
  }

  async updateAccountingMovement(id: number, updates: Partial<InsertAccountingMovement>): Promise<AccountingMovement> {
    const [updatedMovement] = await this.db
      .update(accountingMovements)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(accountingMovements.id, id))
      .returning();
    return updatedMovement;
  }

  async deleteAccountingMovement(id: number): Promise<void> {
    await this.db
      .delete(accountingMovements)
      .where(eq(accountingMovements.id, id));
  }

  async getMonthlyAccountingSummary(structureCode: string, month: string): Promise<{income: number, expenses: number, balance: number}> {
    const movements = await this.db
      .select()
      .from(accountingMovements)
      .where(
        and(
          eq(accountingMovements.structureCode, structureCode),
          like(accountingMovements.movementDate, `${month}%`)
        )
      );

    const income = movements
      .filter(m => m.type === 'income')
      .reduce((sum, m) => sum + parseFloat(m.amount), 0);

    const expenses = movements
      .filter(m => m.type === 'expense')
      .reduce((sum, m) => sum + parseFloat(m.amount), 0);

    return {
      income,
      expenses,
      balance: income - expenses
    };
  }
  async getStructureSettings(): Promise<StructureSettings | undefined> { return undefined; }
  async createStructureSettings(): Promise<StructureSettings> { throw new Error("Not implemented"); }
  async updateStructureSettings(): Promise<StructureSettings> { throw new Error("Not implemented"); }
  async checkGestionaleAccess(): Promise<{hasAccess: boolean, hoursRemaining?: number}> { return { hasAccess: false }; }
}

// Extend PostgreStorage con metodi impostazioni
class ExtendedPostgreStorage extends PostgreStorage {
  private partnerOnboardingData: Map<string, any> = new Map();
  async getSettingsConfig(structureCode: string): Promise<SettingsConfig | null> {
    const result = await this.db
      .select()
      .from(settingsConfig)
      .where(eq(settingsConfig.structureCode, structureCode))
      .limit(1);
    
    if (result.length === 0) {
      // Crea impostazioni default se non esistono
      const defaultSettings = {
        structureCode,
        structureName: `Struttura ${structureCode.split('-').pop()}`,
        ownerName: "",
        contactEmail: "",
        contactPhone: "",
        address: "",
        city: "",
        province: structureCode.split('-')[1] || "VV",
        postalCode: "",
        businessType: "hotel",
        checkinTime: "15:00",
        checkoutTime: "11:00",
        maxGuestsPerRoom: 4,
        welcomeMessage: "Benvenuto nella nostra struttura!",
        additionalServices: "",
        wifiPassword: "",
        emergencyContact: "",
        taxRate: "3.00",
        defaultCurrency: "EUR",
        languagePreference: "it",
        notificationPreferences: "{}",
        backupFrequency: "daily",
        autoLogoutMinutes: 30,
        enableGuestPortal: true,
        enableWhatsappIntegration: false
      };
      
      const [created] = await this.db
        .insert(settingsConfig)
        .values(defaultSettings)
        .returning();
      
      return created;
    }
    
    return result[0];
  }

  async updateSettingsConfig(structureCode: string, settings: Partial<InsertSettingsConfig>): Promise<SettingsConfig> {
    // Prima verifica se esistono già impostazioni
    const existing = await this.getSettingsConfig(structureCode);
    
    if (!existing) {
      // Crea nuove impostazioni
      const [created] = await this.db
        .insert(settingsConfig)
        .values({ structureCode, ...settings })
        .returning();
      return created;
    }
    
    // Aggiorna esistenti
    const [updated] = await this.db
      .update(settingsConfig)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(settingsConfig.structureCode, structureCode))
      .returning();
    
    return updated;
  }

  // Partner methods implementation
  async createTouristLinkRequest(partnerCode: string, touristCode: string): Promise<void> {
    try {
      // Verifica duplicati usando drizzle
      const existing = await this.db.select()
        .from(iqcodeValidations)
        .where(and(
          eq(iqcodeValidations.partnerCode, partnerCode),
          eq(iqcodeValidations.touristIqCode, touristCode),
          eq(iqcodeValidations.status, 'pending')
        ));

      if (existing.length > 0) {
        throw new Error('Richiesta già inviata e in attesa di conferma');
      }

      // Recupera nome partner
      const partnerData = await this.db.select()
        .from(iqCodes)
        .where(eq(iqCodes.code, partnerCode));

      const partnerName = partnerData[0]?.assignedTo || 'Partner';

      // Inserisce la validazione
      await this.db.insert(iqcodeValidations).values({
        touristIqCode: touristCode,
        partnerCode: partnerCode,
        partnerName: partnerName,
        status: 'pending',
        requestedAt: new Date(),
        usesRemaining: 10,
        usesTotal: 10
      });
      
      console.log(`Richiesta validazione creata: ${partnerCode} → ${touristCode}`);
    } catch (error) {
      console.error('Errore creazione richiesta validazione:', error);
      throw error;
    }
  }

  async createPartnerOffer(offer: {partnerCode: string, title: string, description?: string, discount: number, validUntil?: string}): Promise<any> {
    const newOffer = {
      id: Date.now(),
      ...offer,
      createdAt: new Date(),
      isActive: true
    };
    return newOffer;
  }

  async createSpecialClient(client: {partnerCode: string, name: string, notes: string}): Promise<any> {
    const newClient = {
      id: Date.now(),
      ...client,
      createdAt: new Date(),
      visits: 0,
      rewards: 0
    };
    return newClient;
  }

  // IQCode validation methods implementation
  async createIqcodeValidation(validation: any): Promise<any> {
    const [created] = await this.db
      .insert(iqcodeValidations)
      .values(validation)
      .returning();
    return created;
  }

  async getValidationsByTourist(touristCode: string): Promise<any[]> {
    return await this.db
      .select()
      .from(iqcodeValidations)
      .where(eq(iqcodeValidations.touristIqCode, touristCode))
      .orderBy(desc(iqcodeValidations.requestedAt));
  }

  async getValidationsByPartner(partnerCode: string): Promise<any[]> {
    return await this.db
      .select()
      .from(iqcodeValidations)
      .where(eq(iqcodeValidations.partnerCode, partnerCode))
      .orderBy(desc(iqcodeValidations.requestedAt));
  }

  async updateValidationStatus(id: number, status: string, respondedAt?: Date): Promise<any> {
    const [updated] = await this.db
      .update(iqcodeValidations)
      .set({ 
        status, 
        respondedAt: respondedAt || new Date(),
        updatedAt: new Date()
      })
      .where(eq(iqcodeValidations.id, id))
      .returning();
    return updated;
  }

  async getValidationById(id: number): Promise<any | undefined> {
    const [validation] = await this.db
      .select()
      .from(iqcodeValidations)
      .where(eq(iqcodeValidations.id, id));
    return validation;
  }

  async decrementValidationUses(id: number): Promise<any> {
    const [updated] = await this.db
      .update(iqcodeValidations)
      .set({ 
        usesRemaining: sql`uses_remaining - 1`,
        updatedAt: new Date()
      })
      .where(eq(iqcodeValidations.id, id))
      .returning();
    return updated;
  }

  // Metodi per sistema ricarica IQCode
  async createIqcodeRecharge(recharge: any): Promise<any> {
    const [created] = await this.db
      .insert(iqcodeRecharges)
      .values(recharge)
      .returning();
    return created;
  }

  async getPendingRecharges(): Promise<any[]> {
    return await this.db
      .select()
      .from(iqcodeRecharges)
      .where(eq(iqcodeRecharges.status, 'payment_pending'))
      .orderBy(desc(iqcodeRecharges.requestedAt));
  }

  async activateRecharge(rechargeId: number, adminNote?: string): Promise<any> {
    // Ottieni dati ricarica
    const [recharge] = await this.db
      .select()
      .from(iqcodeRecharges)
      .where(eq(iqcodeRecharges.id, rechargeId));

    if (!recharge) {
      throw new Error('Ricarica non trovata');
    }

    // Aggiorna stato ricarica
    await this.db
      .update(iqcodeRecharges)
      .set({
        status: 'activated',
        confirmedAt: new Date(),
        activatedAt: new Date(),
        adminNote: adminNote || 'Ricarica approvata dall\'admin',
        updatedAt: new Date()
      })
      .where(eq(iqcodeRecharges.id, rechargeId));

    // Ripristina utilizzi validazione a 10
    const [updatedValidation] = await this.db
      .update(iqcodeValidations)
      .set({
        usesRemaining: 10,
        usesTotal: 10,
        updatedAt: new Date()
      })
      .where(eq(iqcodeValidations.id, recharge.validationId))
      .returning();

    return { recharge, validation: updatedValidation };
  }

  // Sistema avanzato per gestire migliaia di richieste di ricarica
  async getRechargesWithFilters(filters: {page: number, limit: number, search: string, status: string, sort: string}): Promise<{recharges: any[], total: number, stats: any}> {
    const { page, limit, search, status, sort } = filters;
    const offset = (page - 1) * limit;

    // Costruisci query base
    let query = this.db
      .select({
        id: iqcodeRecharges.id,
        validationId: iqcodeRecharges.validationId,
        touristIqCode: iqcodeRecharges.touristIqCode,
        status: iqcodeRecharges.status,
        requestedAt: iqcodeRecharges.requestedAt,
        confirmedAt: iqcodeRecharges.confirmedAt,
        activatedAt: iqcodeRecharges.activatedAt,
        adminNote: iqcodeRecharges.adminNote
      })
      .from(iqcodeRecharges);

    // Applica filtri
    const conditions = [];

    if (search) {
      conditions.push(
        ilike(iqcodeRecharges.touristIqCode, `%${search}%`)
      );
    }

    if (status) {
      conditions.push(eq(iqcodeRecharges.status, status));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Applica ordinamento
    if (sort === 'oldest') {
      query = query.orderBy(asc(iqcodeRecharges.requestedAt));
    } else {
      query = query.orderBy(desc(iqcodeRecharges.requestedAt));
    }

    // Esegui query con paginazione
    const recharges = await query
      .limit(limit)
      .offset(offset);

    // Conta totale
    let countQuery = this.db
      .select({ count: sql<number>`count(*)` })
      .from(iqcodeRecharges);

    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }

    const [{ count: total }] = await countQuery;

    // Calcola statistiche
    const statsQuery = await this.db
      .select({
        status: iqcodeRecharges.status,
        count: sql<number>`count(*)`
      })
      .from(iqcodeRecharges)
      .groupBy(iqcodeRecharges.status);

    const stats = {
      pending: 0,
      confirmed: 0,
      activated: 0,
      total: 0
    };

    statsQuery.forEach(stat => {
      if (stat.status === 'payment_pending') stats.pending = stat.count;
      if (stat.status === 'paid_confirmed') stats.confirmed = stat.count;
      if (stat.status === 'activated') stats.activated = stat.count;
      stats.total += stat.count;
    });

    return {
      recharges,
      total,
      stats
    };
  }

  async getPartnerOnboardingStatus(partnerCode: string): Promise<any> {
    try {
      // Verifica nel database se il partner ha completato l'onboarding
      const iqCodeRecord = await this.getIqCodeByCode(partnerCode);
      if (iqCodeRecord && iqCodeRecord.internalNote) {
        // Controlla se c'è il bypass admin o onboarding completato
        try {
          const noteData = JSON.parse(iqCodeRecord.internalNote);
          
          if (noteData.completed === true || noteData.bypassed === true) {
            return {
              completed: true,
              currentStep: 'completed',
              completedSteps: ['business', 'accessibility', 'allergies', 'family', 'specialties', 'services'],
              partnerCode: partnerCode,
              businessInfo: true,
              accessibilityInfo: true,
              allergyInfo: true,
              familyInfo: true,
              specialtyInfo: true,
              servicesInfo: true,
              isCompleted: true,
              bypassed: noteData.bypassed || false
            };
          }
        } catch (jsonError) {
          console.log(`DEBUG: Errore parsing JSON:`, jsonError);
          // Se non è JSON valido, prova il controllo stringa legacy
          if (iqCodeRecord.internalNote.includes('ONBOARDING_COMPLETED')) {
            return {
              completed: true,
              currentStep: 'completed',
              completedSteps: ['business', 'accessibility', 'allergies', 'family', 'specialties', 'services'],
              partnerCode: partnerCode,
              businessInfo: true,
              accessibilityInfo: true,
              allergyInfo: true,
              familyInfo: true,
              specialtyInfo: true,
              servicesInfo: true,
              isCompleted: true
            };
          }
        }
      }
    } catch (error) {
      console.log('Errore verifica onboarding database:', error);
    }
    
    // Fallback alla memoria globale
    const isCompleted = globalPartnerOnboardingData.get(`completed_${partnerCode}`) || false;
    
    if (isCompleted) {
      return {
        completed: true,
        currentStep: 'completed',
        completedSteps: ['business', 'accessibility', 'allergies', 'family', 'specialties', 'services'],
        partnerCode: partnerCode,
        businessInfo: true,
        accessibilityInfo: true,
        allergyInfo: true,
        familyInfo: true,
        specialtyInfo: true,
        servicesInfo: true,
        isCompleted: true
      };
    }
    
    return {
      completed: false,
      currentStep: 'business',
      completedSteps: [],
      partnerCode: partnerCode,
      businessInfo: false,
      accessibilityInfo: false,
      allergyInfo: false,
      familyInfo: false,
      specialtyInfo: false,
      servicesInfo: false,
      isCompleted: false
    };
  }

  async savePartnerOnboardingStep(partnerCode: string, step: string, data: any): Promise<void> {
    // Inizializza memoria se non esiste
    if (!this.partnerOnboardingData) {
      this.partnerOnboardingData = new Map();
    }
    
    const stepsKey = `onboarding_steps_${partnerCode}`;
    const currentSteps = this.partnerOnboardingData.get(stepsKey) || [];
    
    // Aggiungi step completato se non già presente
    if (!currentSteps.includes(step)) {
      currentSteps.push(step);
      this.partnerOnboardingData.set(stepsKey, currentSteps);
    }
    
    // Salva i dati dello step
    this.partnerOnboardingData.set(`${partnerCode}_${step}_data`, data);
    
    console.log(`Salvato step ${step} per partner ${partnerCode}:`, data);
  }

  async completePartnerOnboarding(partnerCode: string): Promise<void> {
    try {
      const iqCodeRecord = await this.getIqCodeByCode(partnerCode);
      
      if (iqCodeRecord) {
        // Aggiorna la nota interna usando il metodo esistente che funziona
        const newNote = `${iqCodeRecord.internalNote || ''} ONBOARDING_COMPLETED_${new Date().toISOString()}`.trim();
        await this.updateIqCodeNote(iqCodeRecord.id, newNote);
        
        // Marca anche nella memoria globale come backup
        globalPartnerOnboardingData.set(`completed_${partnerCode}`, true);
        
        console.log(`Onboarding completato e salvato per partner ${partnerCode}`);
      }
    } catch (error) {
      console.log('Errore salvataggio completamento onboarding:', error);
    }
  }

  // Implementazione metodi per offerte reali in ExtendedPostgreStorage
  async getAcceptedPartnersByTourist(touristCode: string): Promise<any[]> {
    const result = await this.db
      .select()
      .from(iqcodeValidations)
      .where(eq(iqcodeValidations.touristIqCode, touristCode))
      .where(eq(iqcodeValidations.status, 'accepted'));
    return result;
  }

  async getRealOffersByPartners(partnerCodes: string[]): Promise<any[]> {
    const { realOffers } = await import('@shared/schema');
    if (partnerCodes.length === 0) return [];
    
    const { inArray: inArrayOp } = await import('drizzle-orm');
    const result = await this.db
      .select()
      .from(realOffers)
      .where(inArrayOp(realOffers.partnerCode, partnerCodes))
      .where(eq(realOffers.isActive, true));
    
    return result;
  }

  async getRealOffersByCity(cityName: string): Promise<any[]> {
    const { realOffers } = await import('@shared/schema');
    const { ilike, and } = await import('drizzle-orm');
    
    console.log(`Ricerca per città: ${cityName}`);
    
    const result = await this.db
      .select()
      .from(realOffers)
      .where(and(
        ilike(realOffers.city, cityName),
        eq(realOffers.isActive, true)
      ));
    
    console.log(`Trovate ${result.length} offerte per ${cityName}`);
    
    return result;
  }

  async getRealOffersNearby(latitude: number, longitude: number, radius: number): Promise<any[]> {
    const { realOffers } = await import('@shared/schema');
    const { sql } = await import('drizzle-orm');
    
    // Calcolo distanza usando formula di Haversine per PostgreSQL
    const result = await this.db
      .select()
      .from(realOffers)
      .where(
        sql`6371 * acos(cos(radians(${latitude})) * cos(radians(CAST(${realOffers.latitude} AS FLOAT))) * cos(radians(CAST(${realOffers.longitude} AS FLOAT)) - radians(${longitude})) + sin(radians(${latitude})) * sin(radians(CAST(${realOffers.latitude} AS FLOAT)))) <= ${radius}`
      )
      .where(eq(realOffers.isActive, true))
      .where(sql`${realOffers.latitude} IS NOT NULL AND ${realOffers.longitude} IS NOT NULL`);
    
    return result;
  }

  // Metodi per messaggeria interna
  async createConversation(data: {touristCode: string, partnerCode: string, touristName?: string, partnerName: string}): Promise<any> {
    const { conversations } = await import('@shared/schema');
    const { and, eq } = await import('drizzle-orm');
    
    // Verifica se esiste già una conversazione tra questi due utenti
    const existing = await this.db
      .select()
      .from(conversations)
      .where(and(
        eq(conversations.touristCode, data.touristCode),
        eq(conversations.partnerCode, data.partnerCode)
      ));

    if (existing.length > 0) {
      return existing[0];
    }

    const [conversation] = await this.db
      .insert(conversations)
      .values({
        touristCode: data.touristCode,
        partnerCode: data.partnerCode,
        touristName: data.touristName,
        partnerName: data.partnerName
      })
      .returning();

    return conversation;
  }

  async getConversationsByTourist(touristCode: string): Promise<any[]> {
    const { conversations, messages } = await import('@shared/schema');
    const { desc, count } = await import('drizzle-orm');
    
    const result = await this.db
      .select({
        conversation: conversations,
        unreadCount: count(messages.id)
      })
      .from(conversations)
      .leftJoin(messages, and(
        eq(messages.conversationId, conversations.id),
        eq(messages.isRead, false),
        eq(messages.senderType, 'partner') // Messaggi non letti dal partner
      ))
      .where(and(
        eq(conversations.touristCode, touristCode),
        eq(conversations.isActiveForTourist, true)
      ))
      .groupBy(conversations.id)
      .orderBy(desc(conversations.lastMessageAt));

    return result;
  }

  async getConversationsByPartner(partnerCode: string): Promise<any[]> {
    const { conversations, messages } = await import('@shared/schema');
    const { desc, count } = await import('drizzle-orm');
    
    const result = await this.db
      .select({
        conversation: conversations,
        unreadCount: count(messages.id)
      })
      .from(conversations)
      .leftJoin(messages, and(
        eq(messages.conversationId, conversations.id),
        eq(messages.isRead, false),
        eq(messages.senderType, 'tourist') // Messaggi non letti dal turista
      ))
      .where(and(
        eq(conversations.partnerCode, partnerCode),
        eq(conversations.isActiveForPartner, true)
      ))
      .groupBy(conversations.id)
      .orderBy(desc(conversations.lastMessageAt));

    return result;
  }

  async getConversationById(conversationId: number): Promise<any | null> {
    const { conversations } = await import('@shared/schema');
    
    const [conversation] = await this.db
      .select()
      .from(conversations)
      .where(eq(conversations.id, conversationId));

    return conversation || null;
  }

  async createMessage(data: {conversationId: number, senderCode: string, senderType: string, senderName?: string, content: string}): Promise<any> {
    const { messages, conversations } = await import('@shared/schema');
    const { sql } = await import('drizzle-orm');
    
    const [message] = await this.db
      .insert(messages)
      .values({
        conversationId: data.conversationId,
        senderCode: data.senderCode,
        senderType: data.senderType,
        senderName: data.senderName,
        content: data.content
      })
      .returning();

    // Aggiorna il timestamp dell'ultima attività nella conversazione
    await this.db
      .update(conversations)
      .set({ lastMessageAt: sql`NOW()` })
      .where(eq(conversations.id, data.conversationId));

    return message;
  }

  async getMessagesByConversation(conversationId: number): Promise<any[]> {
    const { messages } = await import('@shared/schema');
    const { asc } = await import('drizzle-orm');
    
    const result = await this.db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(asc(messages.sentAt));

    return result;
  }

  async markMessagesAsRead(conversationId: number, readerCode: string): Promise<void> {
    const { messages } = await import('@shared/schema');
    const { and, eq, ne } = await import('drizzle-orm');
    
    await this.db
      .update(messages)
      .set({ isRead: true })
      .where(and(
        eq(messages.conversationId, conversationId),
        ne(messages.senderCode, readerCode), // Non marcare i propri messaggi
        eq(messages.isRead, false)
      ));
  }

  async getUnreadMessagesCount(userCode: string): Promise<number> {
    const { conversations, messages } = await import('@shared/schema');
    const { count, and, or, eq, ne } = await import('drizzle-orm');
    
    // Conta i messaggi non letti nelle conversazioni dove l'utente è coinvolto
    const [result] = await this.db
      .select({ count: count(messages.id) })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(and(
        or(
          eq(conversations.touristCode, userCode),
          eq(conversations.partnerCode, userCode)
        ),
        ne(messages.senderCode, userCode), // Non contare i propri messaggi
        eq(messages.isRead, false)
      ));

    return result?.count || 0;
  }
}

// Extend MemStorage con metodi impostazioni
class ExtendedMemStorage extends MemStorage {
  private settingsConfigMap: Map<string, SettingsConfig> = new Map();

  async getSettingsConfig(structureCode: string): Promise<SettingsConfig | null> {
    if (!this.settingsConfigMap.has(structureCode)) {
      // Crea impostazioni default
      const defaultSettings: SettingsConfig = {
        id: 1,
        structureCode,
        structureName: `Struttura ${structureCode.split('-').pop()}`,
        ownerName: "",
        contactEmail: "",
        contactPhone: "",
        address: "",
        city: "",
        province: structureCode.split('-')[1] || "VV",
        postalCode: "",
        businessType: "hotel",
        checkinTime: "15:00",
        checkoutTime: "11:00",
        maxGuestsPerRoom: 4,
        welcomeMessage: "Benvenuto nella nostra struttura!",
        additionalServices: "",
        wifiPassword: "",
        emergencyContact: "",
        taxRate: "3.00",
        defaultCurrency: "EUR",
        languagePreference: "it",
        notificationPreferences: "{}",
        backupFrequency: "daily",
        autoLogoutMinutes: 30,
        enableGuestPortal: true,
        enableWhatsappIntegration: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.settingsConfigMap.set(structureCode, defaultSettings);
    }
    
    return this.settingsConfigMap.get(structureCode) || null;
  }

  async updateSettingsConfig(structureCode: string, settings: Partial<InsertSettingsConfig>): Promise<SettingsConfig> {
    const existing = await this.getSettingsConfig(structureCode);
    if (!existing) throw new Error("Settings not found");
    
    const updated = {
      ...existing,
      ...settings,
      updatedAt: new Date()
    };
    
    this.settingsConfigMap.set(structureCode, updated);
    return updated;
  }

  async createTouristLinkRequest(partnerCode: string, touristCode: string): Promise<void> {
    // Mock implementation for MemStorage
  }

  async createPartnerOffer(offer: {partnerCode: string, title: string, description?: string, discount: number, validUntil?: string}): Promise<any> {
    return {
      id: Math.random().toString(36).substr(2, 9),
      ...offer,
      createdAt: new Date(),
      isActive: true
    };
  }

  async createSpecialClient(client: {partnerCode: string, name: string, notes: string}): Promise<any> {
    return {
      id: Math.random().toString(36).substr(2, 9),
      ...client,
      createdAt: new Date(),
      visits: 0,
      rewards: 0
    };
  }

  async getPartnerOnboardingStatus(partnerCode: string): Promise<any> {
    // Prima controlla se il partner ha bypass nelle note interne
    try {
      const iqCodeRecord = await this.getIqCodeByCode(partnerCode);
      if (iqCodeRecord && iqCodeRecord.internalNote) {
        try {
          const noteData = JSON.parse(iqCodeRecord.internalNote);
          if (noteData.completed === true || noteData.bypassed === true) {
            return {
              completed: true,
              currentStep: 'completed',
              completedSteps: ['business', 'accessibility', 'allergies', 'family', 'specialties', 'services'],
              partnerCode: partnerCode,
              businessInfo: true,
              accessibilityInfo: true,
              allergyInfo: true,
              familyInfo: true,
              specialtyInfo: true,
              servicesInfo: true,
              isCompleted: true,
              bypassed: noteData.bypassed || false
            };
          }
        } catch (jsonError) {
          // Ignora errori di parsing JSON
        }
      }
    } catch (error) {
      // Continua con il controllo memoria
    }

    // Usa la memoria globale condivisa
    const isCompleted = globalPartnerOnboardingData.get(`completed_${partnerCode}`) || false;
    
    if (isCompleted) {
      return {
        completed: true,
        currentStep: 'completed',
        completedSteps: ['business', 'accessibility', 'allergies', 'family', 'specialties', 'services'],
        partnerCode: partnerCode,
        businessInfo: true,
        accessibilityInfo: true,
        allergyInfo: true,
        familyInfo: true,
        specialtyInfo: true,
        servicesInfo: true,
        isCompleted: true
      };
    }
    
    return {
      completed: false,
      currentStep: 'business',
      completedSteps: [],
      partnerCode: partnerCode,
      businessInfo: false,
      accessibilityInfo: false,
      allergyInfo: false,
      familyInfo: false,
      specialtyInfo: false,
      servicesInfo: false,
      isCompleted: false
    };
  }

  async savePartnerOnboardingStep(partnerCode: string, step: string, data: any): Promise<void> {
    // Salva step nella memoria globale
    globalPartnerOnboardingData.set(`${partnerCode}_step_${step}`, data);
  }

  async completePartnerOnboarding(partnerCode: string): Promise<void> {
    // Marca come completato nella memoria globale
    globalPartnerOnboardingData.set(`completed_${partnerCode}`, true);
    console.log(`Onboarding completato per partner ${partnerCode}`);
  }

  // Implementazione metodi per offerte reali
  async getAcceptedPartnersByTourist(touristCode: string): Promise<any[]> {
    const result = await this.db
      .select()
      .from(iqcodeValidations)
      .where(eq(iqcodeValidations.touristIqCode, touristCode))
      .where(eq(iqcodeValidations.status, 'accepted'));
    return result;
  }

  async getRealOffersByPartners(partnerCodes: string[]): Promise<any[]> {
    const { realOffers } = await import('@shared/schema');
    if (partnerCodes.length === 0) return [];
    
    const { inArray: inArrayOp } = await import('drizzle-orm');
    const result = await this.db
      .select()
      .from(realOffers)
      .where(inArrayOp(realOffers.partnerCode, partnerCodes))
      .where(eq(realOffers.isActive, true));
    
    return result;
  }

  async getRealOffersByCity(cityName: string): Promise<any[]> {
    // Fallback per MemStorage - restituisce array vuoto
    return [];
  }

  async getRealOffersNearby(latitude: number, longitude: number, radius: number): Promise<any[]> {
    // Fallback per MemStorage - restituisce array vuoto  
    return [];
  }
}

// Use PostgreSQL storage if DATABASE_URL exists, otherwise fallback to memory
export const storage = process.env.DATABASE_URL ? new ExtendedPostgreStorage() : new ExtendedMemStorage();
