import { iqCodes, sessions, assignedPackages, guests, adminCredits, purchasedPackages, accountingMovements, structureSettings, settingsConfig, iqcodeRecharges, iqcodeRecoveryKeys, partnerOffers, temporaryCodes, type IqCode, type InsertIqCode, type Session, type InsertSession, type AssignedPackage, type InsertAssignedPackage, type Guest, type InsertGuest, type AdminCredits, type InsertAdminCredits, type PurchasedPackage, type InsertPurchasedPackage, type AccountingMovement, type InsertAccountingMovement, type StructureSettings, type InsertStructureSettings, type SettingsConfig, type InsertSettingsConfig, type UserRole, type IqcodeRecharge, type InsertIqcodeRecharge, type PartnerOffer, type InsertPartnerOffer, type TemporaryCode, type InsertTemporaryCode } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, lt, desc, like, sql, inArray } from "drizzle-orm";
import { pool } from "./db";

// Memoria globale condivisa per onboarding partner
const globalPartnerOnboardingData = new Map<string, any>();
const globalValidationsData = new Map<string, any>();

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
  getAllPartnersWithOffers(): Promise<any[]>;
  getPartnerOffersByCity(cityName: string): Promise<any[]>;

  // Temporary codes methods
  createTempCode(code: string, createdBy: string): Promise<any>;
  createIqCode(iqCodeData: any): Promise<any>;



  // Ricariche IQCode methods
  createIqcodeRecharge(data: {touristCode: string, amount: number, status: string, requestedAt: Date}): Promise<IqcodeRecharge>;
  getRechargesWithFilters(filters: any): Promise<{recharges: IqcodeRecharge[], total: number}>;
  activateRecharge(rechargeId: number, adminCode: string): Promise<IqcodeRecharge>;
  createPartnerOffer(offer: {partnerCode: string, title: string, description?: string, discount: number, validUntil?: string}): Promise<PartnerOffer>;
  getPartnerOffers(partnerCode: string): Promise<PartnerOffer[]>;
  createSpecialClient(client: {partnerCode: string, name: string, notes: string}): Promise<any>;

  // Partner onboarding methods
  getPartnerOnboardingStatus(partnerCode: string): Promise<{completed: boolean, currentStep?: string, completedSteps?: string[]} | undefined>;
  savePartnerOnboardingStep(partnerCode: string, step: string, data: any): Promise<void>;
  completePartnerOnboarding(partnerCode: string): Promise<void>;

  // IQCode recharge methods
  createIqcodeRecharge(validationId: number, touristCode: string): Promise<IqcodeRecharge>;
  getPendingRecharges(): Promise<IqcodeRecharge[]>;
  activateRecharge(rechargeId: number, adminNote?: string): Promise<IqcodeRecharge>;
  getRechargesWithFilters(filters: {page: number, limit: number, search: string, status: string, sort: string}): Promise<{recharges: IqcodeRecharge[], total: number, stats: any}>;

  // Metodi per offerte reali
  getAcceptedPartnersByTourist(touristCode: string): Promise<any[]>;
  getRealOffersByPartners(partnerCodes: string[]): Promise<any[]>;
  getRealOffersByCity(cityName: string): Promise<any[]>;
  getRealOffersNearby(latitude: number, longitude: number, radius: number): Promise<any[]>;

  // **CUSTODE DEL CODICE - Metodi per gestione dati di recupero hashati**
  createRecoveryKey(data: {hashedIqCode: string, hashedSecretWord: string, hashedBirthDate: string}): Promise<any>;
  getRecoveryKeyByIqCode(iqCode: string): Promise<any>;
  verifyRecoveryData(hashedIqCode: string, hashedSecretWord: string, hashedBirthDate: string): Promise<any>;
  updateRecoveryKey(id: number, data: {hashedIqCode: string, hashedSecretWord: string, hashedBirthDate: string, updatedAt: Date}): Promise<any>;

  // **SISTEMA RECUPERO IQCODE - Metodi addizionali**
  getRecoveryByCredentials(hashedSecretWord: string, hashedBirthDate: string): Promise<any>;
  getIqCodeByHashedCode(hashedIqCode: string): Promise<string | null>;

  // **INFORMAZIONI STRATEGICHE ADMIN**
  getUsersStrategicInfo(): Promise<any>;

  // **SISTEMA CODICI TEMPORANEI (Privacy-First)**
  generateTempCode(structureCode: string, guestName?: string, guestPhone?: string): Promise<string>;
  activateTempCode(tempCode: string): Promise<{ success: boolean; tempCodeData?: TemporaryCode }>;
  isTempCodeValid(tempCode: string): Promise<boolean>;
  createPermanentFromTemp(tempCode: string, touristProfile: any): Promise<{ iqCode: string; success: boolean }>;
  cleanupExpiredTempCodes(): Promise<void>;
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
    // Trova il pacchetto e verifica crediti
    const pkg = this.assignedPackages.get(packageId);
    if (!pkg) {
      throw new Error('Pacchetto non trovato');
    }

    if (pkg.creditsRemaining <= 0) {
      throw new Error('Nessun credito disponibile');
    }

    // Genera codice emozionale unico
    let attempts = 0;
    let uniqueCode: string;

    do {
      uniqueCode = generateEmotionalIQCode('IT');
      attempts++;
      if (attempts > 50) {
        throw new Error('Impossibile generare codice unico');
      }
    } while (await this.getIqCodeByCode(uniqueCode));

    // CRITICO: Crea IQCode nel sistema principale con isActive: true
    const newIqCode = await this.createIqCode({
      code: uniqueCode,
      role: 'tourist',
      isActive: true,              // FONDAMENTALE
      status: 'approved',          // Subito approvato per turisti
      assignedTo: guestName,
      location: 'IT',
      codeType: 'emotional',
      assignedBy: structureCode
    });

    // Parse the generated code to extract country and word
    const { parseIQCode } = await import('./iq-generator');
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
    console.log(`✅ IQCODE ATTIVO CREATO: ${uniqueCode} per ospite ${guestName} - isActive: true, status: approved`);

    // Scala i crediti
    pkg.creditsRemaining--;
    pkg.creditsUsed++;

    return {
      code: uniqueCode,
      remainingCredits: pkg.creditsRemaining
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

  // Validazione metodi placeholder

  async createIqcodeRecharge(): Promise<any> { throw new Error("Not implemented"); }
  async getRechargesWithFilters(): Promise<any> { throw new Error("Not implemented"); }
  async activateRecharge(): Promise<any> { throw new Error("Not implemented"); }
  async createPartnerOffer(): Promise<any> { throw new Error("Not implemented"); }
  async getPartnerOffers(): Promise<any[]> { return []; }
  async createSpecialClient(): Promise<any> { throw new Error("Not implemented"); }
  async getPartnerOnboardingStatus(): Promise<any> { return undefined; }
  async savePartnerOnboardingStep(): Promise<void> { }
  async completePartnerOnboarding(): Promise<void> { }
  async getPendingRecharges(): Promise<any[]> { return []; }
  async getAcceptedPartnersByTourist(): Promise<any[]> { return []; }
  async getRealOffersByPartners(): Promise<any[]> { return []; }
  async getRealOffersByCity(): Promise<any[]> { return []; }
  async getRealOffersNearby(): Promise<any[]> { return []; }
  async createRecoveryKey(): Promise<any> { throw new Error("Not implemented"); }
  async getRecoveryKeyByIqCode(): Promise<any> { return null; }
  async verifyRecoveryData(): Promise<any> { return null; }
  async updateRecoveryKey(): Promise<any> { throw new Error("Not implemented"); }
  async getRecoveryByCredentials(): Promise<any> { return null; }
  async getIqCodeByHashedCode(): Promise<any> { return null; }
  async getAllValidations(): Promise<any[]> { return []; }
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

  // Removed duplicate methods (originals are implemented above)

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
    console.log(`MemStorage: ricerca per città "${cityName}" - restituisce array vuoto`);
    return [];
  }

  async getRealOffersNearby(latitude: number, longitude: number, radius: number): Promise<any[]> {
    console.log(`MemStorage: ricerca geolocalizzazione - restituisce array vuoto`);
    return [];
  }

  async getAllPartnersWithOffers(): Promise<any[]> {
    return [];
  }

  async getPartnerOffersByCity(cityName: string): Promise<any[]> {
    // MemStorage implementation - usa sempre array vuoto per dev
    return [];
  }
}

// PostgreSQL Storage Class
export class PostgreStorage implements IStorage {
  protected db: any;

  constructor() {
    const sql = neon(process.env.DATABASE_URL!);
    this.db = drizzle(sql, { schema: { iqCodes, sessions, assignedPackages, guests, partnerOffers, iqcodeRecoveryKeys } });
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
    console.log("🔍 IQ LOGIN ATTEMPT:", code);
    const result = await this.db.select().from(iqCodes).where(eq(iqCodes.code, code)).limit(1);
    console.log("📋 IQ CODE FOUND:", result[0] ? "✅ SI" : "❌ NO");
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
    // Import SQL client for direct operations
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(process.env.DATABASE_URL!);

    // Get package and verify credits
    const packages = await this.db.select().from(assignedPackages).where(eq(assignedPackages.id, packageId));
    const targetPackage = packages[0];

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

      // Check if code exists in database
      const existing = await this.db.select().from(iqCodes).where(eq(iqCodes.code, uniqueCode)).limit(1);
      if (existing.length === 0) break;
    } while (attempts < 50);

    if (attempts >= 50) {
      throw new Error("Impossibile generare codice univoco");
    }

    // CRITICO: Crea il codice IQ operativo nella tabella principale
    try {
      const newIqCode = await this.createIqCode({
        code: uniqueCode,
        role: 'tourist',
        isActive: true,              // FONDAMENTALE
        status: 'approved',          // Subito approvato per turisti
        assignedTo: guestName,
        location: 'IT',
        codeType: 'emotional',
        assignedBy: structureCode
      });
      console.log(`✅ CODICE ATTIVO CREATO: ${uniqueCode} per ospite ${guestName} - isActive: true, status: approved`);
    } catch (err) {
      console.error('❌ Errore scrittura IQCode in tabella principale:', err);
      throw err;
    }

    // Decrement credits
    await this.db.update(assignedPackages)
      .set({ 
        creditsRemaining: targetPackage.creditsRemaining - 1,
        creditsUsed: targetPackage.creditsUsed + 1
      })
      .where(eq(assignedPackages.id, packageId));

    // Save generated code for tracking
        try {
          const { neon } = await import('@neondatabase/serverless');
          const sql = neon(process.env.DATABASE_URL!);

          const result = await sql`
            INSERT INTO generated_iq_codes (code, generated_by, package_id, assigned_to, guest_id, country, emotional_word, status, assigned_at)
            VALUES (${uniqueCode}, ${structureCode}, ${packageId}, ${guestName}, ${guestId}, ${'IT'}, ${'UNKNOWN'}, 'assigned', NOW())
            RETURNING id, code
          `;

          console.log(`✅ PERSISTENZA OK: Codice ${uniqueCode} salvato con ID ${result[0].id}`);
        } catch (dbError) {
          console.error(`❌ ERRORE NEON: Salvataggio ${uniqueCode} fallito:`, dbError);
        }

    // Parse the generated code to extract country and word
    const parsedCode = parseIQCode(uniqueCode);

        // IMMEDIATAMENTE ATTIVO: Crea il codice IQ operativo nella tabella principale
        try {
            // Per PostgreSQL, usa inserimento diretto nella tabella iq_codes
            const result = await sql`
              INSERT INTO iq_codes (code, role, is_active, assigned_to, location, code_type, status, created_at)
              VALUES (${uniqueCode}, 'tourist', true, ${guestName}, ${parsedCode?.country || 'IT'}, 'emotional', 'approved', NOW())
              RETURNING id, code
            `;

            console.log(`✅ CODICE ATTIVO: ${uniqueCode} inserito direttamente in iq_codes - ID: ${result[0].id}`);
        } catch (activeError) {
            console.error(`❌ ERRORE ATTIVAZIONE DIRETTA: ${uniqueCode} non attivato:`, activeError);

            // Fallback al metodo storage esistente
            try {
                const activeIqCode = await this.createIqCode({
                    code: uniqueCode,
                    role: 'tourist',
                    isActive: true,
                    assignedTo: guestName,
                    location: parsedCode?.country || 'IT',
                    codeType: 'emotional',
                    status: 'approved',
                    assignedBy: structureCode
                });
                console.log(`✅ FALLBACK OK: ${uniqueCode} creato via storage`);
            } catch (fallbackError) {
                console.error(`❌ FALLBACK FAILED: ${fallbackError}`);
            }
        }

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

  // Metodi onboarding partner per PostgreSQL
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
        } catch (parseError) {
          console.log('Errore parsing note interne per onboarding:', parseError);
        }
      }

      // Default: nessun onboarding iniziato
      return {
        completed: false,
        currentStep: 'business',
        completedSteps: [],
        partnerCode: partnerCode
      };
    } catch (error) {
      console.error('Errore getPartnerOnboardingStatus PostgreSQL:', error);
      return {
        completed: false,
        currentStep: 'business',
        completedSteps: [],
        partnerCode: partnerCode
      };
    }
  }

  async savePartnerOnboardingStep(partnerCode: string, step: string, data: any): Promise<void> {
    try {
      const iqCodeRecord = await this.getIqCodeByCode(partnerCode);
      if (iqCodeRecord) {
        let noteData: any = {};

        // Parse existing data
        if (iqCodeRecord.internalNote) {
          try {
            noteData = JSON.parse(iqCodeRecord.internalNote);
          } catch (e) {
            console.log('Parsing error, starting fresh');
          }
        }

        // Initialize onboarding object if not exists
        if (!noteData.onboarding) {
          noteData.onboarding = {
            currentStep: 'business',
            completedSteps: [],
            stepData: {}
          };
        }

        // Save step data
        noteData.onboarding.stepData[step] = data;

        // Add to completed steps if not already there
        if (!noteData.onboarding.completedSteps.includes(step)) {
          noteData.onboarding.completedSteps.push(step);
        }

        // Determine next step
        const allSteps = ['business', 'accessibility', 'allergies', 'family', 'specialties', 'services'];
        const currentIndex = allSteps.indexOf(step);
        if (currentIndex < allSteps.length - 1) {
          noteData.onboarding.currentStep = allSteps[currentIndex + 1];
        } else {
          noteData.onboarding.currentStep = 'completed';
        }

        // Update database
        await this.db.update(iqCodes)
          .set({ internalNote: JSON.stringify(noteData) })
          .where(eq(iqCodes.code, partnerCode));

        console.log(`Step ${step} salvato per partner ${partnerCode}`);
      }
    } catch (error) {
      console.error('Errore savePartnerOnboardingStep PostgreSQL:', error);
      throw error;
    }
  }

  async completePartnerOnboarding(partnerCode: string): Promise<void> {
    try {
      const iqCodeRecord = await this.getIqCodeByCode(partnerCode);
      if (iqCodeRecord) {
        let noteData: any = {};

        if (iqCodeRecord.internalNote) {
          try {
            noteData = JSON.parse(iqCodeRecord.internalNote);
          } catch (e) {
            console.log('Parsing error, starting fresh');
          }
        }

        // Mark as completed
        noteData.completed = true;
        noteData.completedAt = new Date().toISOString();

        await this.db.update(iqCodes)
          .set({ internalNote: JSON.stringify(noteData) })
          .where(eq(iqCodes.code, partnerCode));

        console.log(`Onboarding completato per partner ${partnerCode}`);
      }
    } catch (error) {
      console.error('Errore completePartnerOnboarding PostgreSQL:', error);
      throw error;
    }
  }


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

  async createPartnerOffer(offer: {partnerCode: string, title: string, description?: string, discount: number, validUntil?: string}): Promise<any> {
    const { partnerOffers } = await import('@shared/schema');
    const [newOffer] = await this.db
      .insert(partnerOffers)
      .values({
        partnerCode: offer.partnerCode,
        title: offer.title,
        description: offer.description || "",
        discount: offer.discount.toString(),
        validUntil: offer.validUntil || "",
        isActive: true
      })
      .returning();
    return newOffer;
  }

  async getPartnerOffers(partnerCode: string): Promise<any[]> {
    const { partnerOffers } = await import('@shared/schema');
    const { eq, and } = await import('drizzle-orm');

    console.log(`🔍 STORAGE DEBUG: Cercando offerte per partner: ${partnerCode}`);

    const result = await this.db
      .select()
      .from(partnerOffers)
      .where(and(
        eq(partnerOffers.partnerCode, partnerCode),
        eq(partnerOffers.isActive, true)
      ));

    console.log(`📊 STORAGE RESULT: Trovate ${result.length} offerte per ${partnerCode}`);
    result.forEach((offer: any, index: number) => {
      console.log(`   ${index + 1}. "${offer.title}" (ID: ${offer.id}, Partner: ${offer.partnerCode})`);
    });

    return result;
  }

  async updatePartnerOffer(offerId: string, updates: {title?: string, description?: string, discount?: number, validUntil?: string}): Promise<any> {
    const { partnerOffers } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    const [updatedOffer] = await this.db
      .update(partnerOffers)
      .set({
        title: updates.title,
        description: updates.description,
        discount: updates.discount?.toString(),
        validUntil: updates.validUntil
      })
      .where(eq(partnerOffers.id, parseInt(offerId)))
      .returning();
    return updatedOffer;
  }

  async deletePartnerOffer(offerId: string): Promise<void> {
    const { partnerOffers } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    await this.db
      .update(partnerOffers)
      .set({ isActive: false })
      .where(eq(partnerOffers.id, parseInt(offerId)));
  }

  async getAllPartnerOffers(): Promise<any[]> {
    const { partnerOffers } = await import('@shared/schema');
    const { eq } = await import('drizzle-orm');
    const result = await this.db
      .select()
      .from(partnerOffers)
      .where(eq(partnerOffers.isActive, true));
    return result;
  }



  // Metodi per sistema ricarica IQCode
  async createIqCode(iqCodeData: any): Promise<any> {
    const [created] = await this.db
      .insert(iqCodes)
      .values(iqCodeData)
      .returning();
    return created;
  }

  async createTempCode(code: string, createdBy: string): Promise<any> {
    // Crea nella tabella temporaryCodes per compatibilità
    const [created] = await this.db
      .insert(temporaryCodes)
      .values({
        code,
        createdBy,
        createdAt: new Date(),
        isActive: true
      })
      .returning();
    return created;
  }

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
          if (iqCodeRecord.internalNote.includes('ONBOARDING_COMPLETED') || 
              iqCodeRecord.internalNote.includes('ONBOARDING COMPLETED') ||
              iqCodeRecord.internalNote.startsWith('ONBOARDING')) {
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
    const { realOffers } = await import('@shared/schema');
    const { ilike, and, eq } = await import('drizzle-orm');

    console.log(`Ricerca per città: ${cityName}`);

    // Ricerca case-insensitive con matching parziale per città
    const searchPattern = `%${cityName.toLowerCase()}%`;

    const result = await this.db
      .select()
      .from(realOffers)
      .where(and(
        ilike(realOffers.city, searchPattern),
        eq(realOffers.isActive, true)
      ));

    console.log(`Trovate ${result.length} offerte per ${cityName}`);

    return result;
  }

  async getAllPartnersWithOffers(): Promise<any[]> {
    const { sql } = await import('drizzle-orm');

    try {
      // Query SQL diretta per prendere offerte dalla tabella partner_offers
      const result = await this.db.execute(sql`
        SELECT 
          po.id,
          po.title,
          po.description,
          po.discount as "discountPercentage",
          po.valid_until as "validUntil",
          'general' as category,
          po.partner_code as "partnerCode",
          COALESCE(pd.business_name, ic.assigned_to, 'Partner') as "partnerName",
          pd.business_type as "businessType",
          pd.address,
          pd.city,
          pd.province,
          pd.phone,
          pd.email,
          pd.website,
          COALESCE(pd.wheelchair_accessible, false) as "wheelchairAccessible",
          COALESCE(pd.child_friendly, false) as "childFriendly",
          COALESCE(pd.gluten_free, false) as "glutenFree"
        FROM partner_offers po
        LEFT JOIN iq_codes ic ON po.partner_code = ic.code
        LEFT JOIN partner_details pd ON po.partner_code = pd.partner_code
        WHERE po.is_active = true 
          AND ic.role = 'partner' 
          AND ic.is_active = true
        ORDER BY po.created_at DESC
      `);

      return result.rows.map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        discountPercentage: row.discountPercentage,
        validUntil: row.validUntil,
        category: row.category,
        partnerCode: row.partnerCode,
        partnerName: row.partnerName || 'Partner',
        businessType: row.businessType || 'Non specificato',
        address: row.address,
        city: row.city,
        province: row.province,
        phone: row.phone,
        email: row.email,
        website: row.website,
        wheelchairAccessible: row.wheelchairAccessible,
        childFriendly: row.childFriendly,
        glutenFree: row.glutenFree
      }));
    } catch (error) {
      console.error('Errore getAllPartnersWithOffers:', error);
      return [];
    }
  }

  async getPartnerOffersByCity(cityName: string): Promise<any[]> {
    try {
      // Usa getAllPartnersWithOffers() e filtra per città - METODO SICURO
      const allOffers = await this.getAllPartnersWithOffers();
      const cityOffers = allOffers.filter(offer => 
        offer.city && offer.city.toLowerCase() === cityName.toLowerCase()
      );
      
      console.log(`🔍 TIQai Debug: Città '${cityName}' → Totali: ${allOffers.length}, Filtrate per città: ${cityOffers.length}`);
      if (cityOffers.length > 0) {
        console.log(`🔍 TIQai Partner trovati:`, cityOffers.map(o => `${o.partnerName}: ${o.title}`));
      }
      return cityOffers;
    } catch (error) {
      console.error('Errore getPartnerOffersByCity:', error);
      return [];
    }
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



  // Metodi onboarding partner per PostgreSQL
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
          if (iqCodeRecord.internalNote.includes('ONBOARDING_COMPLETED') || 
              iqCodeRecord.internalNote.includes('ONBOARDING COMPLETED') ||
              iqCodeRecord.internalNote.startsWith('ONBOARDING')) {
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
    // Salva step nella memoria globale
    globalPartnerOnboardingData.set(`${partnerCode}_step_${step}`, data);
  }

  async completePartnerOnboarding(partnerCode: string): Promise<void> {
    // Marca come completato nella memoria globale
    globalPartnerOnboardingData.set(`completed_${partnerCode}`, true);
    console.log(`Onboarding completato per partner ${partnerCode}`);
  }



  // METODI MANCANTI PER OFFERTE PARTNER - POSTGRESQL
  async createPartnerOffer(offer: {partnerCode: string, title: string, description?: string, discount: number, validUntil?: string}): Promise<PartnerOffer> {
    const result = await this.db.insert(partnerOffers).values({
      partnerCode: offer.partnerCode,
      title: offer.title,
      description: offer.description,
      discount: offer.discount,
      validUntil: offer.validUntil ? new Date(offer.validUntil) : undefined,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async createSpecialClient(client: {partnerCode: string, name: string, notes: string}): Promise<any> {
    // Per ora implementazione base - si può estendere con tabella dedicata
    return {
      id: Date.now(),
      partnerCode: client.partnerCode,
      name: client.name,
      notes: client.notes,
      createdAt: new Date()
    };
  }

  async createTouristLinkRequest(partnerCode: string, touristCode: string): Promise<void> {
    // Implementazione base per richieste collegamento turistico
    console.log(`Richiesta collegamento da ${partnerCode} a ${touristCode}`);
  }

  // **CUSTODE DEL CODICE - Implementazione PostgreSQL**
  async createRecoveryKey(data: {hashedIqCode: string, hashedSecretWord: string, hashedBirthDate: string}): Promise<any> {
    const [recoveryKey] = await this.db
      .insert(iqcodeRecoveryKeys)
      .values({
        hashedIqCode: data.hashedIqCode,
        hashedSecretWord: data.hashedSecretWord,
        hashedBirthDate: data.hashedBirthDate
      })
      .returning();

    return recoveryKey;
  }

  async getRecoveryKeyByIqCode(iqCode: string): Promise<any> {
    // Hash del codice per confronto sicuro
    const crypto = await import('crypto');
    const hashedIqCode = crypto.createHash('sha256').update(iqCode).digest('hex');

    const [recoveryKey] = await this.db
      .select()
      .from(iqcodeRecoveryKeys)
      .where(eq(iqcodeRecoveryKeys.hashedIqCode, hashedIqCode))
      .limit(1);

    return recoveryKey;
  }

  async verifyRecoveryData(hashedIqCode: string, hashedSecretWord: string, hashedBirthDate: string): Promise<any> {
    const [recoveryKey] = await this.db
      .select()
      .from(iqcodeRecoveryKeys)
      .where(
        and(
          eq(iqcodeRecoveryKeys.hashedIqCode, hashedIqCode),
          eq(iqcodeRecoveryKeys.hashedSecretWord, hashedSecretWord),
          eq(iqcodeRecoveryKeys.hashedBirthDate, hashedBirthDate)
        )
      )
      .limit(1);

    return recoveryKey;
  }

  // **SISTEMA RECUPERO IQCODE - Metodi addizionali**
  async getRecoveryByCredentials(hashedSecretWord: string, hashedBirthDate: string): Promise<any> {
    const [recoveryKey] = await this.db
      .select()
      .from(iqcodeRecoveryKeys)
      .where(
        and(
          eq(iqcodeRecoveryKeys.hashedSecretWord, hashedSecretWord),
          eq(iqcodeRecoveryKeys.hashedBirthDate, hashedBirthDate)
        )
      )
      .limit(1);

    return recoveryKey;
  }

  async getIqCodeByHashedCode(hashedIqCode: string): Promise<string | null> {
    // Dobbiamo fare il reverse lookup - cerchiamo tutti i codici IQ attivi e confrontiamo l'hash
    const activeCodes = await this.db
      .select()
      .from(iqCodes)
      .where(
        and(
          eq(iqCodes.isActive, true),
          eq(iqCodes.role, 'tourist') // Solo codici turistici possono essere recuperati
        )
      );

    // Confrontiamo l'hash di ogni codice con quello richiesto
    const crypto = await import('crypto');
    for (const codeRecord of activeCodes) {
      const codeHash = crypto.createHash('sha256').update(codeRecord.code).digest('hex');
      if (codeHash === hashedIqCode) {
        return codeRecord.code;
      }
    }

    return null;
  }

  async updateRecoveryKey(id: number, data: {hashedIqCode: string, hashedSecretWord: string, hashedBirthDate: string, updatedAt: Date}): Promise<any> {
    const [updatedKey] = await this.db
      .update(iqcodeRecoveryKeys)
      .set({
        hashedSecretWord: data.hashedSecretWord,
        hashedBirthDate: data.hashedBirthDate,
        updatedAt: data.updatedAt
      })
      .where(eq(iqcodeRecoveryKeys.id, id))
      .returning();

    return updatedKey;
  }

  async getUsersStrategicInfo(): Promise<any> {
    try {
      const { sql } = await import('drizzle-orm');

      // Informazioni strategiche Partner Commerciali
      const partnersInfo = await this.db.execute(sql`
        SELECT 
          ic.code,
          ic.assigned_to as "partnerName",
          COUNT(DISTINCT ro.id) as "totalOffers",
          ROUND(CAST(AVG(ro.discount_percentage) AS NUMERIC), 1) as "avgDiscount",
          CASE 
            WHEN pd.phone IS NOT NULL AND pd.email IS NOT NULL AND pd.website IS NOT NULL THEN 3
            WHEN pd.phone IS NOT NULL AND pd.email IS NOT NULL THEN 2
            WHEN pd.phone IS NOT NULL OR pd.email IS NOT NULL OR pd.website IS NOT NULL THEN 1
            ELSE 0
          END as "contactsFilled",
          pd.updated_at as "lastProfileUpdate"
        FROM iq_codes ic
        LEFT JOIN real_offers ro ON ic.code = ro.partner_code AND ro.is_active = true
        LEFT JOIN partner_details pd ON ic.code = pd.partner_code
        WHERE ic.role = 'partner' AND ic.is_active = true AND ic.deleted_at IS NULL
        GROUP BY ic.code, ic.assigned_to, pd.phone, pd.email, pd.website, pd.updated_at
        ORDER BY ic.assigned_to
      `);

      // Informazioni strategiche Strutture Ricettive
      const structuresInfo = await this.db.execute(sql`
        SELECT 
          ic.code,
          ic.assigned_to as "structureName",
          COALESCE(SUM(ap.package_size), 0) as "totalCredits",
          COALESCE(SUM(ap.credits_used), 0) as "creditsUsed",
          CASE 
            WHEN SUM(ap.package_size) > 0 THEN ROUND(CAST((SUM(ap.credits_used)::float / SUM(ap.package_size)) * 100 AS NUMERIC), 1)
            ELSE 0
          END as "usagePercentage",
          MAX(ap.assigned_at) as "lastPackageAssigned"
        FROM iq_codes ic
        LEFT JOIN assigned_packages ap ON ic.code = ap.recipient_iq_code AND ap.status = 'approved'
        WHERE ic.role = 'structure' AND ic.is_active = true AND ic.deleted_at IS NULL
        GROUP BY ic.code, ic.assigned_to
        ORDER BY ic.assigned_to
      `);

      // Informazioni strategiche Turisti
      const touristsInfo = await this.db.execute(sql`
        SELECT 
          ic.code,
          ic.assigned_to as "touristName",
          ic.created_at as "registrationDate",
          COUNT(iv.id) as "totalValidations"
        FROM iq_codes ic
        LEFT JOIN iqcode_validations iv ON ic.code = iv.tourist_iq_code
        WHERE ic.role = 'tourist' AND ic.is_active = true AND ic.deleted_at IS NULL
        GROUP BY ic.code, ic.assigned_to, ic.created_at
        ORDER BY ic.created_at DESC
        LIMIT 50
      `);

      return {
        partners: partnersInfo.rows.map((row: any) => ({
          code: row.code,
          partnerName: row.partnerName || 'Partner',
          totalOffers: parseInt(row.totalOffers) || 0,
          avgDiscount: parseFloat(row.avgDiscount) || 0,
          contactsFilled: parseInt(row.contactsFilled) || 0,
          lastProfileUpdate: row.lastProfileUpdate || null
        })),

        structures: structuresInfo.rows.map((row: any) => ({
          code: row.code,
          structureName: row.structureName || 'Struttura',
          totalCredits: parseInt(row.totalCredits) || 0,
          creditsUsed: parseInt(row.creditsUsed) || 0,
          usagePercentage: parseFloat(row.usagePercentage) || 0,
          lastPackageAssigned: row.lastPackageAssigned || null
        })),

        tourists: touristsInfo.rows.map((row: any) => ({
          code: row.code,
          touristName: row.touristName || 'Turista',
          registrationDate: row.registrationDate || null,
          lastAccess: row.lastAccess || null
        }))
      };

    } catch (error) {
      console.error('Errore recupero informazioni strategiche:', error);
      return {
        partners: [],
        structures: [],
        tourists: []
      };
    }
  }



  // **SISTEMA CODICI TEMPORANEI (Privacy-First) - SENZA SCADENZA**
  async generateTempCode(structureCode: string, guestName?: string, guestPhone?: string): Promise<string> {
    const tempCode = `IQCODE-PRIMOACCESSO-${Math.floor(10000 + Math.random() * 90000)}`;

    await this.db.insert(temporaryCodes).values({
      tempCode,
      structureCode,
      guestName: guestName || null,
      guestPhone: guestPhone || null,
      // Nessun expiresAt: codici senza scadenza
    });

    return tempCode;
  }

  async activateTempCode(tempCode: string): Promise<{ success: boolean; tempCodeData?: any }> {
    // I codici temporanei sono ora nella tabella principale iq_codes
    const [tempCodeData] = await this.db
      .select()
      .from(iqCodes)
      .where(
        and(
          eq(iqCodes.code, tempCode),
          eq(iqCodes.codeType, 'temporary'),
          eq(iqCodes.isActive, true)
        )
      );

    if (!tempCodeData) {
      return { success: false };
    }

    // Segna il codice come utilizzato disattivandolo
    await this.db
      .update(iqCodes)
      .set({ isActive: false })
      .where(eq(iqCodes.code, tempCode));

    return { success: true, tempCodeData: { structureCode: tempCodeData.assignedTo } };
  }

  async isTempCodeValid(tempCode: string): Promise<boolean> {
    // I codici temporanei sono salvati nella tabella principale iq_codes con codeType='temporary'
    const [tempCodeData] = await this.db
      .select()
      .from(iqCodes)
      .where(
        and(
          eq(iqCodes.code, tempCode),
          eq(iqCodes.codeType, 'temporary'),
          eq(iqCodes.isActive, true)
        )
      );

    return !!tempCodeData;
  }

  async createPermanentFromTemp(tempCode: string, touristProfile: any): Promise<{ iqCode: string; success: boolean }> {
    // Cerca il codice temporaneo nella tabella principale (deve essere già disattivato)
    const [tempCodeData] = await this.db
      .select()
      .from(iqCodes)
      .where(
        and(
          eq(iqCodes.code, tempCode),
          eq(iqCodes.codeType, 'temporary'),
          eq(iqCodes.isActive, false) // Già attivato/disattivato
        )
      );

    if (!tempCodeData) {
      return { iqCode: '', success: false };
    }

    // GENERA IQCODE DIRETTAMENTE SENZA PACCHETTI
    const uniqueCode = this.generateDirectEmotionalCode();
    const guestName = touristProfile.name || 'Turista';
    
    // Crea IQCode direttamente nella tabella principale
    await this.db.insert(iqCodes).values({
      code: uniqueCode,
      role: 'tourist',
      isActive: true,
      status: 'approved',
      assignedTo: guestName,
      location: 'IT',
      codeType: 'emotional',
      createdAt: new Date(),
    });
    
    return { iqCode: uniqueCode, success: true };
  }

  // GENERA CODICE EMOZIONALE DIRETTO CON FORMATO TERRITORIALE
  private generateDirectEmotionalCode(): string {
    const territories = ['COLOSSEO', 'PANTHEON', 'FONTANA', 'VATICANO', 'PIAZZA', 'TORRE', 'CASTELLO', 'DUOMO', 'PONTE', 'VILLA', 'PARCO', 'MUSEO', 'TEATRO', 'PALAZZO', 'CHIESA'];
    const randomTerritory = territories[Math.floor(Math.random() * territories.length)];
    const randomDigits = Math.floor(Math.random() * 9000) + 1000; // Genera 4 cifre (1000-9999)
    return `IQ-IT-${randomDigits}-${randomTerritory}`;
  }

  // Cleanup automatico rimosso: i codici temporanei non scadono più
  async cleanupExpiredTempCodes(): Promise<void> {
    // Metodo mantenuto per compatibilità ma non fa nulla
    return;
  }

  // Metodi per compatibilità con interfaccia IStorage
  async createTempCode(code: string, createdBy: string): Promise<any> {
    // Implementazione per MemStorage - crea un oggetto temporaneo
    return {
      id: Date.now(),
      code,
      createdBy,
      createdAt: new Date(),
      isActive: true
    };
  }


}

// Extend MemStorage con metodi impostazioni
class ExtendedMemStorage extends MemStorage {
  private settingsConfigMap: Map<string, SettingsConfig> = new Map();
  private partnerOffers: any[] = [];

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
    const newOffer = {
      id: Date.now(),
      ...offer,
      createdAt: new Date(),
      isActive: true
    };
    this.partnerOffers.push(newOffer);
    return newOffer;
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



  // **CUSTODE DEL CODICE - Implementazione MemStorage**
  private recoveryKeys: Map<string, any> = new Map();

  async createRecoveryKey(data: {hashedIqCode: string, hashedSecretWord: string, hashedBirthDate: string}): Promise<any> {
    const recoveryKey = {
      id: this.recoveryKeys.size + 1,
      hashedIqCode: data.hashedIqCode,
      hashedSecretWord: data.hashedSecretWord,
      hashedBirthDate: data.hashedBirthDate,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.recoveryKeys.set(data.hashedIqCode, recoveryKey);
    return recoveryKey;
  }

  async getRecoveryKeyByIqCode(iqCode: string): Promise<any> {
    const crypto = await import('crypto');
    const hashedIqCode = crypto.createHash('sha256').update(iqCode).digest('hex');

    return this.recoveryKeys.get(hashedIqCode);
  }

  async verifyRecoveryData(hashedIqCode: string, hashedSecretWord: string, hashedBirthDate: string): Promise<any> {
    const recoveryKey = this.recoveryKeys.get(hashedIqCode);

    if (recoveryKey && 
        recoveryKey.hashedSecretWord === hashedSecretWord && 
        recoveryKey.hashedBirthDate === hashedBirthDate) {
      return recoveryKey;
    }

    return undefined;
  }

  async updateRecoveryKey(id: number, data: {hashedIqCode: string, hashedSecretWord: string, hashedBirthDate: string, updatedAt: Date}): Promise<any> {
    const existingKey = this.recoveryKeys.get(data.hashedIqCode);
    if (existingKey && existingKey.id === id) {
      const updatedKey = {
        ...existingKey,
        hashedSecretWord: data.hashedSecretWord,
        hashedBirthDate: data.hashedBirthDate,
        updatedAt: data.updatedAt
      };
      this.recoveryKeys.set(data.hashedIqCode, updatedKey);
      return updatedKey;
    }
    return undefined;
  }

  async getUsersStrategicInfo(): Promise<any> {
    // Implementazione base per MemStorage - dati fittizi
    return {
      partners: [],
      structures: [],
      tourists: []
    };
  }

  // **SISTEMA CODICI TEMPORANEI (Privacy-First) - Memory Implementation**
  async generateTempCode(structureCode: string, guestName?: string, guestPhone?: string): Promise<string> {
    const { randomBytes } = await import('crypto');
    return randomBytes(6).toString('hex').toUpperCase();
  }

  async activateTempCode(tempCode: string): Promise<{ success: boolean; tempCodeData?: TemporaryCode }> {
    return { success: true };
  }

  async isTempCodeValid(tempCode: string): Promise<boolean> {
    return true;
  }

  async createPermanentFromTemp(tempCode: string, touristProfile: any): Promise<{ iqCode: string; success: boolean }> {
    return { iqCode: 'TIQ-IT-TEMP-CODE', success: true };
  }

  async cleanupExpiredTempCodes(): Promise<void> {
    // No-op per memoria
  }
}



// Use PostgreSQL storage if DATABASE_URL exists, otherwise fallback to memory
export const storage = process.env.DATABASE_URL ? new ExtendedPostgreStorage() : new ExtendedMemStorage();