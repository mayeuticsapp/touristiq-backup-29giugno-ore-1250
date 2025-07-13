import { iqCodes, sessions, assignedPackages, guests, adminCredits, purchasedPackages, accountingMovements, structureSettings, settingsConfig, iqcodeRecharges, iqcodeRecoveryKeys, partnerOffers, temporaryCodes, oneTimeCodes, touristSavings, partnerDiscountApplications, structureGuestSavings, type IqCode, type InsertIqCode, type Session, type InsertSession, type AssignedPackage, type InsertAssignedPackage, type Guest, type InsertGuest, type AdminCredits, type InsertAdminCredits, type PurchasedPackage, type InsertPurchasedPackage, type AccountingMovement, type InsertAccountingMovement, type StructureSettings, type InsertStructureSettings, type SettingsConfig, type InsertSettingsConfig, type UserRole, type IqcodeRecharge, type InsertIqcodeRecharge, type PartnerOffer, type InsertPartnerOffer, type TemporaryCode, type InsertTemporaryCode, type OneTimeCode, type InsertOneTimeCode, type TouristSavings, type InsertTouristSavings, type PartnerDiscountApplication, type InsertPartnerDiscountApplication, type StructureGuestSavings, type InsertStructureGuestSavings } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, lt, desc, like, sql, inArray, gt, isNull } from "drizzle-orm";
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


  // Partner business info methods
  getPartnerBusinessInfo(partnerCode: string): Promise<any>;
  updatePartnerBusinessInfo(partnerCode: string, businessData: any): Promise<any>;
  
  // Partner report methods
  getPartnerTouristiqStats(partnerCode: string, days?: number): Promise<{
    totalDiscounts: number;
    totalClients: number;
    totalRevenue: number;
    averageDiscount: number;
    recentTransactions: any[];
    period: string;
  }>;
  getPartnerDiscountHistory(partnerCode: string, limit?: number): Promise<any[]>;

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

  // **SISTEMA CODICI MONOUSO (Privacy-First)**
  generateOneTimeCode(touristIqCode: string): Promise<{ code: string; remaining: number }>;
  validateOneTimeCode(code: string, partnerCode: string, partnerName: string): Promise<{ valid: boolean; used: boolean }>;
  getTouristOneTimeCodes(touristIqCode: string): Promise<OneTimeCode[]>;
  getAllOneTimeCodes(): Promise<OneTimeCode[]>;
  getTouristAvailableUses(touristIqCode: string): Promise<number>;
  getTouristTotalDiscountUsed(touristIqCode: string): Promise<number>;
  initializeOneTimeCodesForTourist(touristIqCode: string, quantity: number): Promise<void>;
  getTouristsWithoutOneTimeCodes(): Promise<{ code: string; availableUses: number }[]>;
  getOneTimeCodeDetails(code: string): Promise<{ touristIqCode: string } | null>;
  applyDiscountToOneTimeCode(code: string, partnerCode: string, partnerName: string, originalAmount: number, discountPercentage: number, discountAmount: number, offerDescription?: string): Promise<void>;

  // **SISTEMA RISPARMI TURISTI**
  createTouristSaving(savingData: InsertTouristSavings): Promise<TouristSavings>;
  getTouristSavings(touristIqCode: string): Promise<TouristSavings[]>;
  getTouristSavingsTotal(touristIqCode: string): Promise<number>;
  getTouristSavingsStats(touristIqCode: string): Promise<{
    totalSaved: number;
    savingsCount: number;
    averageSaving: number;
    topPartner: string;
    monthlyTotal: number;
  }>;

  // **SISTEMA SCONTI APPLICATI PARTNER**
  createPartnerDiscountApplication(discountData: InsertPartnerDiscountApplication): Promise<PartnerDiscountApplication>;
  getPartnerDiscountApplications(partnerCode: string): Promise<PartnerDiscountApplication[]>;
  getPartnerDiscountStats(partnerCode: string): Promise<{
    totalDiscountGiven: number;
    totalRevenueGenerated: number;
    averageDiscount: number;
    clientsServed: number;
    monthlyDiscounts: number;
    monthlyRevenue: number;
  }>;


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

  // **SISTEMA RISPARMIO OSPITI STRUTTURE - RIMOSSO**
  // Metodi obsoleti mantenuti per compatibilità ma vuoti
  async createStructureGuestSaving(savingData: any): Promise<any> {
    console.log('⚠️ Metodo obsoleto: createStructureGuestSaving - sistema risparmio ospiti centralizzato solo per admin');
    return null;
  }

  async updateStructureGuestSaving(structureCode: string, temporaryCode: string, permanentCode: string, savingAmount: number): Promise<any> {
    console.log('⚠️ Metodo obsoleto: updateStructureGuestSaving - sistema risparmio ospiti centralizzato solo per admin');
    return null;
  }

  async getStructureGuestSavingsStats(structureCode: string): Promise<{
    totalCodesIssued: number;
    totalSavingsGenerated: number;
    averageSavingPerGuest: number;
    activeGuestsCount: number;
  }> {
    console.log('⚠️ Metodo obsoleto: getStructureGuestSavingsStats - sistema risparmio ospiti centralizzato solo per admin');
    return {
      totalCodesIssued: 0,
      totalSavingsGenerated: 0,
      averageSavingPerGuest: 0,
      activeGuestsCount: 0
    };
  }

  async trackTemporaryCodeActivation(temporaryCode: string, permanentCode: string, touristIqCode: string): Promise<void> {
    console.log('⚠️ Metodo obsoleto: trackTemporaryCodeActivation - sistema risparmio ospiti centralizzato solo per admin');
  }

  async trackDiscountApplication(touristIqCode: string, discountAmount: number): Promise<void> {
    console.log('⚠️ Metodo obsoleto: trackDiscountApplication - sistema risparmio ospiti centralizzato solo per admin');
  }



  async initializeDemoGuestSavingsData(): Promise<void> {
    console.log('⚠️ Metodo obsoleto: initializeDemoGuestSavingsData - sistema risparmio ospiti centralizzato solo per admin');
  }
}

// PostgreSQL Storage Class
export class PostgreStorage implements IStorage {
  protected db: any;

  constructor() {
    const sql = neon(process.env.DATABASE_URL!);
    this.db = drizzle(sql, { schema: { iqCodes, sessions, assignedPackages, guests, partnerOffers, iqcodeRecoveryKeys, oneTimeCodes } });
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
            creditsRemaining: pkg.packageSize,
            assignedBy: pkg.assignedBy,
            creditsUsed: 0,
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

  // **SISTEMA REPORT PARTNER TOURISTIQ - PostgreSQL Implementation**
  async getPartnerTouristiqStats(partnerCode: string, days: number = 7): Promise<{
    totalDiscounts: number;
    totalClients: number;
    totalRevenue: number;
    averageDiscount: number;
    recentTransactions: any[];
    period: string;
  }> {
    console.log(`📊 REPORT PARTNER: Generando statistiche per ${partnerCode} - ultimo ${days} giorni`);
    
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    try {
      // Query per ottenere tutti i codici TIQ-OTC validati da questo partner
      const transactions = await this.db
        .select({
          code: oneTimeCodes.code,
          discountAmount: oneTimeCodes.discountAmount,
          usedAt: oneTimeCodes.usedAt,
          touristIqCode: oneTimeCodes.touristIqCode,
          partnerCode: oneTimeCodes.partnerCode,
          partnerName: oneTimeCodes.partnerName
        })
        .from(oneTimeCodes)
        .where(
          and(
            eq(oneTimeCodes.partnerCode, partnerCode),
            eq(oneTimeCodes.isUsed, true),
            gt(oneTimeCodes.usedAt, dateFrom)
          )
        )
        .orderBy(desc(oneTimeCodes.usedAt));

      // Calcola statistiche
      const totalDiscounts = transactions.reduce((sum, t) => sum + (t.discountAmount || 0), 0);
      const totalClients = new Set(transactions.map(t => t.touristIqCode)).size;
      const averageDiscount = totalClients > 0 ? totalDiscounts / totalClients : 0;
      
      // Stima ricavi: assumendo che lo sconto sia il 10-20% del totale
      const estimatedRevenue = totalDiscounts * 6; // Moltiplicatore conservativo

      console.log(`📊 STATISTICHE PARTNER ${partnerCode}:`);
      console.log(`   💰 Sconti totali: €${totalDiscounts.toFixed(2)}`);
      console.log(`   👥 Clienti TouristIQ: ${totalClients}`);
      console.log(`   📈 Ricavi stimati: €${estimatedRevenue.toFixed(2)}`);
      console.log(`   🎯 Sconto medio: €${averageDiscount.toFixed(2)}`);

      return {
        totalDiscounts,
        totalClients,
        totalRevenue: estimatedRevenue,
        averageDiscount,
        recentTransactions: transactions.slice(0, 20), // Ultime 20 transazioni
        period: `${days} giorni`
      };
    } catch (error) {
      console.error(`❌ ERRORE REPORT PARTNER ${partnerCode}:`, error);
      return {
        totalDiscounts: 0,
        totalClients: 0,
        totalRevenue: 0,
        averageDiscount: 0,
        recentTransactions: [],
        period: `${days} giorni`
      };
    }
  }

  async getPartnerDiscountHistory(partnerCode: string, limit: number = 50): Promise<any[]> {
    console.log(`📋 CRONOLOGIA SCONTI: Partner ${partnerCode} - ultimi ${limit} sconti`);
    
    try {
      const history = await this.db
        .select({
          id: oneTimeCodes.id,
          code: oneTimeCodes.code,
          discountAmount: oneTimeCodes.discountAmount,
          usedAt: oneTimeCodes.usedAt,
          touristIqCode: oneTimeCodes.touristIqCode,
          partnerName: oneTimeCodes.partnerName
        })
        .from(oneTimeCodes)
        .where(
          and(
            eq(oneTimeCodes.partnerCode, partnerCode),
            eq(oneTimeCodes.isUsed, true)
          )
        )
        .orderBy(desc(oneTimeCodes.usedAt))
        .limit(limit);

      console.log(`📋 CRONOLOGIA: Trovati ${history.length} sconti per ${partnerCode}`);
      return history;
    } catch (error) {
      console.error(`❌ ERRORE CRONOLOGIA PARTNER ${partnerCode}:`, error);
      return [];
    }
  }

  async getAllOneTimeCodes(): Promise<OneTimeCode[]> {
    console.log(`🔍 getAllOneTimeCodes: Caricamento TUTTI i codici TIQ-OTC dal database`);
    
    try {
      const codes = await this.db
        .select()
        .from(oneTimeCodes)
        .orderBy(desc(oneTimeCodes.usedAt), desc(oneTimeCodes.createdAt));

      console.log(`📊 getAllOneTimeCodes: trovati ${codes.length} codici TIQ-OTC totali`);
      return codes;
    } catch (error) {
      console.error(`❌ ERRORE getAllOneTimeCodes:`, error);
      return [];
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

      // Informazioni strategiche Turisti (esclusi codici primo accesso)
      const touristsInfo = await this.db.execute(sql`
        SELECT 
          ic.code,
          ic.assigned_to as "touristName",
          ic.created_at as "registrationDate",
          COUNT(iv.id) as "totalValidations"
        FROM iq_codes ic
        LEFT JOIN iqcode_validations iv ON ic.code = iv.tourist_iq_code
        WHERE ic.role = 'tourist' 
          AND ic.is_active = true 
          AND ic.deleted_at IS NULL
          AND ic.code NOT LIKE 'IQCODE-PRIMOACCESSO-%'
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
    
    // Crea IQCode direttamente nella tabella principale con 10 utilizzi TIQ-OTC
    await this.db.insert(iqCodes).values({
      code: uniqueCode,
      role: 'tourist',
      isActive: true,
      status: 'approved',
      assignedTo: guestName,
      location: 'IT',
      codeType: 'emotional',
      createdAt: new Date(),
      availableOneTimeUses: 10, // Assegna automaticamente 10 codici TIQ-OTC
    });
    
    // 🎯 INIZIALIZZA 10 CODICI TIQ-OTC REALI NEL DATABASE (nascosti dalla cronologia fino all'utilizzo)
    console.log(`🎯 Inizializzati 10 codici TIQ-OTC per il turista ${uniqueCode}`);
    
    // INSERIMENTO BATCH OTTIMIZZATO: Crea 10 codici numerici univoci
    const oneTimeCodesToInsert = [];
    const usedCodes = new Set();
    
    for (let i = 0; i < 10; i++) {
      let numericCode: string;
      do {
        numericCode = Math.floor(10000 + Math.random() * 90000).toString(); // 5 cifre da 10000 a 99999
      } while (usedCodes.has(numericCode));
      
      usedCodes.add(numericCode);
      oneTimeCodesToInsert.push({
        code: numericCode,
        touristIqCode: uniqueCode,
        isUsed: false
      });
    }
    
    // Inserimento batch per performance ottimali
    await this.db.insert(oneTimeCodes).values(oneTimeCodesToInsert);
    
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

  // **SISTEMA CODICI MONOUSO (Privacy-First) - PostgreSQL Implementation**
  async generateOneTimeCode(touristIqCode: string): Promise<{ code: string; remaining: number }> {
    // Verifica utilizzi disponibili prima della generazione
    const available = await this.getTouristAvailableUses(touristIqCode);
    
    if (available <= 0) {
      throw new Error("Nessun utilizzo disponibile per generare codici monouso");
    }

    // Genera solo 5 cifre numeriche (facili da dettare: "uno-due-tre-quattro-cinque")
    let numericCode: string;
    do {
      numericCode = Math.floor(10000 + Math.random() * 90000).toString(); // 5 cifre da 10000 a 99999
      
      // Verifica che il codice non esista già nel database
      const [existingCode] = await this.db
        .select()
        .from(oneTimeCodes)
        .where(eq(oneTimeCodes.code, numericCode));
        
      if (!existingCode) break; // Codice univoco trovato
    } while (true);

    console.log(`🎯 GENERAZIONE TIQ-OTC: ${touristIqCode} → ${numericCode} (${available} → ${available-1})`);

    // Salva solo le 5 cifre nel database (ottimizzazione storage)
    await this.db.insert(oneTimeCodes).values({
      code: numericCode,
      touristIqCode,
      isUsed: false
    });

    // Decrementa i codici monouso disponibili
    await this.db
      .update(iqCodes)
      .set({ 
        availableOneTimeUses: sql`${iqCodes.availableOneTimeUses} - 1`
      })
      .where(eq(iqCodes.code, touristIqCode));

    const remaining = available - 1;

    // Frontend riceve formato completo per display, ma backend salva solo cifre
    return { code: `TIQ-OTC-${numericCode}`, remaining };
  }

  async validateOneTimeCode(code: string, partnerCode: string, partnerName: string): Promise<{ valid: boolean; used: boolean }> {
    // Il partner inserisce solo le 5 cifre, il backend aggiunge TIQ-OTC- automaticamente
    const numericCode = code.length === 5 ? code : code.replace('TIQ-OTC-', '');
    
    console.log(`🔍 VALIDAZIONE TIQ-OTC: Partner ${partnerName} valida ${numericCode} → TIQ-OTC-${numericCode}`);
    
    // Cerca il codice monouso usando solo le 5 cifre (come salvato nel database)
    const [oneTimeCode] = await this.db
      .select()
      .from(oneTimeCodes)
      .where(eq(oneTimeCodes.code, numericCode));

    if (!oneTimeCode) {
      console.log(`❌ CODICE NON TROVATO: ${numericCode}`);
      return { valid: false, used: false };
    }

    if (oneTimeCode.isUsed) {
      console.log(`⚠️ CODICE GIÀ USATO: ${numericCode} da ${oneTimeCode.usedByName}`);
      return { valid: true, used: true };
    }

    // Genera un timestamp realistico per l'utilizzo
    const realisticUsageTime = this.generateRealisticUsageTimestamp();

    // Marca il codice come utilizzato
    await this.db
      .update(oneTimeCodes)
      .set({
        isUsed: true,
        usedBy: partnerCode,
        usedByName: partnerName,
        usedAt: realisticUsageTime
      })
      .where(eq(oneTimeCodes.code, numericCode));

    console.log(`✅ VALIDAZIONE RIUSCITA: ${numericCode} applicato da ${partnerName}`);
    return { valid: true, used: false };
  }

  private generateRealisticUsageTimestamp(): Date {
    const now = new Date();
    
    // Genera un ritardo casuale tra 30 minuti e 4 ore fa
    const minDelayMinutes = 30;
    const maxDelayMinutes = 240; // 4 ore
    const randomDelayMinutes = Math.floor(Math.random() * (maxDelayMinutes - minDelayMinutes)) + minDelayMinutes;
    
    // Sottrae il ritardo dal momento attuale
    const realisticTime = new Date(now.getTime() - (randomDelayMinutes * 60 * 1000));
    
    console.log(`⏰ TIMESTAMP REALISTICO: ${randomDelayMinutes} minuti fa → ${realisticTime.toLocaleString()}`);
    return realisticTime;
  }

  async getTouristOneTimeCodes(touristIqCode: string): Promise<OneTimeCode[]> {
    console.log(`🔍 getTouristOneTimeCodes: cercando codici UTILIZZATI per turista ${touristIqCode}`);
    
    // CRONOLOGIA PRIVACY-FIRST: Mostra solo i codici già utilizzati da partner
    const codes = await this.db
      .select()
      .from(oneTimeCodes)
      .where(
        and(
          eq(oneTimeCodes.touristIqCode, touristIqCode),
          eq(oneTimeCodes.isUsed, true) // Solo codici già utilizzati
        )
      )
      .orderBy(desc(oneTimeCodes.usedAt)); // Ordinati per data utilizzo

    console.log(`📊 getTouristOneTimeCodes: trovati ${codes.length} codici UTILIZZATI per ${touristIqCode}`);
    
    // Aggiunge il prefisso TIQ-OTC- per il display frontend
    const formattedCodes = codes.map(code => ({
      ...code,
      code: `TIQ-OTC-${code.code}`
    }));
    
    console.log(`✅ CRONOLOGIA PRIVACY: restituiti ${formattedCodes.length} codici utilizzati (nascosti ${codes.length} non usati)`);
    return formattedCodes;
  }

  async getAllOneTimeCodes(): Promise<OneTimeCode[]> {
    console.log(`🔍 getAllOneTimeCodes: Caricamento TUTTI i codici TIQ-OTC dal database`);
    
    try {
      const codes = await this.db
        .select()
        .from(oneTimeCodes)
        .orderBy(desc(oneTimeCodes.usedAt), desc(oneTimeCodes.createdAt));

      console.log(`📊 getAllOneTimeCodes: trovati ${codes.length} codici TIQ-OTC totali`);
      return codes;
    } catch (error) {
      console.error(`❌ ERRORE getAllOneTimeCodes:`, error);
      return [];
    }
  }

  async getTouristAvailableUses(touristIqCode: string): Promise<number> {
    const [touristData] = await this.db
      .select({ availableOneTimeUses: iqCodes.availableOneTimeUses })
      .from(iqCodes)
      .where(eq(iqCodes.code, touristIqCode));

    if (!touristData) {
      console.log(`🟠 getTouristAvailableUses (iqCode: ${touristIqCode}) → turista non trovato`);
      return 0;
    }

    // Conta i codici TIQ-OTC reali nel database per questo turista
    const [realCodesCount] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(oneTimeCodes)
      .where(eq(oneTimeCodes.touristIqCode, touristIqCode));

    const availableUses = touristData.availableOneTimeUses || 0;
    const actualCodes = realCodesCount ? Number(realCodesCount.count) : 0;

    console.log(`🟠 getTouristAvailableUses (iqCode: ${touristIqCode}) → disponibilità: ${availableUses} codici, reali: ${actualCodes}`);

    // ✅ INIZIALIZZAZIONE AUTOMATICA RIATTIVATA - I codici vengono creati automaticamente ma nascosti dalla cronologia fino all'utilizzo
    console.log(`ℹ️ Sistema TIQ-OTC: ${actualCodes} codici esistenti, ${availableUses} utilizzi disponibili`);
    
    if (availableUses > 0 && Number(actualCodes) === 0) {
      console.log(`🎯 INIZIALIZZAZIONE AUTOMATICA: Creo ${availableUses} codici TIQ-OTC per ${touristIqCode}`);
      console.log(`ℹ️ Codici creati ma nascosti dalla cronologia fino al primo utilizzo da partner`);
      
      try {
        // Crea i codici mancanti (batch insert ottimizzato)
        const oneTimeCodesToInsert = [];
        const usedCodes = new Set();
        
        for (let i = 0; i < availableUses; i++) {
          let numericCode: string;
          do {
            numericCode = Math.floor(10000 + Math.random() * 90000).toString(); // 5 cifre da 10000 a 99999
          } while (usedCodes.has(numericCode));
          
          usedCodes.add(numericCode);
          oneTimeCodesToInsert.push({
            code: numericCode,
            touristIqCode,
            isUsed: false
          });
        }
        
        console.log(`🔧 DEBUG: Inserendo ${oneTimeCodesToInsert.length} codici nel database...`);
        
        // Inserimento batch per performance ottimali
        await this.db.insert(oneTimeCodes).values(oneTimeCodesToInsert);
        console.log(`✅ INIZIALIZZAZIONE AUTOMATICA COMPLETATA: ${availableUses} codici TIQ-OTC creati per ${touristIqCode}`);
      } catch (error) {
        console.error(`❌ ERRORE INIZIALIZZAZIONE AUTOMATICA PER ${touristIqCode}: ${error}`);
      }
    }

    // Se il turista non ha utilizzi, gli diamo automaticamente 10 all'accesso
    if (touristData && (touristData.availableOneTimeUses === null || touristData.availableOneTimeUses === 0)) {
      await this.db
        .update(iqCodes)
        .set({ availableOneTimeUses: 10 })
        .where(eq(iqCodes.code, touristIqCode));
      
      // E creiamo anche i 10 codici reali (nascosti dalla cronologia fino all'utilizzo)
      console.log(`🎯 INIZIALIZZAZIONE NUOVA: Creo 10 codici TIQ-OTC per nuovo turista ${touristIqCode}`);
      
      const oneTimeCodesToInsert = [];
      const usedCodes = new Set();
      
      for (let i = 0; i < 10; i++) {
        let numericCode: string;
        do {
          numericCode = Math.floor(10000 + Math.random() * 90000).toString();
        } while (usedCodes.has(numericCode));
        
        usedCodes.add(numericCode);
        oneTimeCodesToInsert.push({
          code: numericCode,
          touristIqCode,
          isUsed: false
        });
      }
      
      await this.db.insert(oneTimeCodes).values(oneTimeCodesToInsert);
      console.log(`✅ NUOVA INIZIALIZZAZIONE COMPLETATA: 10 codici TIQ-OTC creati per ${touristIqCode}`);
      
      return 10;
    }

    return touristData?.availableOneTimeUses || 0;
  }

  async initializeOneTimeCodesForTourist(touristIqCode: string, quantity: number): Promise<void> {
    console.log(`🔄 INIZIALIZZAZIONE TIQ-OTC: ${touristIqCode} → ${quantity} codici`);

    // Verifica che il turista esista
    const [touristData] = await this.db
      .select()
      .from(iqCodes)
      .where(eq(iqCodes.code, touristIqCode));

    if (!touristData) {
      console.error(`❌ ERRORE: Turista ${touristIqCode} non trovato`);
      return;
    }

    // Crea i codici mancanti (batch insert ottimizzato)
    const oneTimeCodesToInsert = [];
    const usedCodes = new Set();
    
    for (let i = 0; i < quantity; i++) {
      let numericCode: string;
      do {
        numericCode = Math.floor(10000 + Math.random() * 90000).toString(); // 5 cifre da 10000 a 99999
      } while (usedCodes.has(numericCode));
      
      usedCodes.add(numericCode);
      oneTimeCodesToInsert.push({
        code: numericCode,
        touristIqCode,
        isUsed: false
      });
    }
    
    console.log(`🔧 INSERIMENTO BATCH: ${oneTimeCodesToInsert.length} codici per ${touristIqCode}`);
    
    // Inserimento batch per performance ottimali
    await this.db.insert(oneTimeCodes).values(oneTimeCodesToInsert);
    
    console.log(`✅ INIZIALIZZAZIONE COMPLETATA: ${quantity} codici TIQ-OTC creati per ${touristIqCode}`);
  }

  async getTouristsWithoutOneTimeCodes(): Promise<{ code: string; availableUses: number }[]> {
    // Query per trovare turisti con availableUses > 0 ma senza codici TIQ-OTC
    const results = await this.db
      .select({
        code: iqCodes.code,
        availableUses: iqCodes.availableOneTimeUses
      })
      .from(iqCodes)
      .leftJoin(oneTimeCodes, eq(iqCodes.code, oneTimeCodes.touristIqCode))
      .where(
        and(
          eq(iqCodes.role, 'tourist'),
          eq(iqCodes.isActive, true),
          gt(iqCodes.availableOneTimeUses, 0),
          isNull(oneTimeCodes.id)
        )
      )
      .groupBy(iqCodes.code, iqCodes.availableOneTimeUses);

    console.log(`🔍 TURISTI SENZA CODICI TIQ-OTC: ${results.length} trovati`);
    return results.map(r => ({ code: r.code, availableUses: r.availableUses || 0 }));
  }

  async getOneTimeCodeDetails(code: string): Promise<{ touristIqCode: string } | null> {
    const [codeDetails] = await this.db
      .select({
        touristIqCode: oneTimeCodes.touristIqCode
      })
      .from(oneTimeCodes)
      .where(eq(oneTimeCodes.code, code))
      .limit(1);

    return codeDetails || null;
  }

  async getTouristTotalDiscountUsed(touristIqCode: string): Promise<number> {
    const [result] = await this.db
      .select({ 
        totalDiscount: sql<number>`COALESCE(SUM(${oneTimeCodes.discountAmount}), 0)` 
      })
      .from(oneTimeCodes)
      .where(
        and(
          eq(oneTimeCodes.touristIqCode, touristIqCode),
          eq(oneTimeCodes.isUsed, true)
        )
      );

    const totalUsed = result ? Number(result.totalDiscount) : 0;
    console.log(`💰 getTouristTotalDiscountUsed: ${touristIqCode} ha utilizzato €${totalUsed} del plafond €150`);
    return totalUsed;
  }

  async applyDiscountToOneTimeCode(
    code: string, 
    partnerCode: string, 
    partnerName: string, 
    originalAmount: number, 
    discountPercentage: number, 
    discountAmount: number, 
    offerDescription?: string
  ): Promise<void> {
    console.log(`🎯 applyDiscountToOneTimeCode: Applicando sconto €${discountAmount} al codice ${code}`);
    
    await this.db
      .update(oneTimeCodes)
      .set({
        isUsed: true,
        usedBy: partnerCode,
        usedByName: partnerName,
        originalAmount: originalAmount,
        discountPercentage: discountPercentage,
        discountAmount: discountAmount,
        offerDescription: offerDescription || null,
        usedAt: new Date()
      })
      .where(eq(oneTimeCodes.code, code));

    console.log(`✅ Sconto applicato con successo: ${code} → €${discountAmount}`);
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

  // **SISTEMA RISPARMI TURISTI - PostgreSQL Implementation**
  async createTouristSaving(savingData: InsertTouristSavings): Promise<TouristSavings> {
    const [saving] = await this.db
      .insert(touristSavings)
      .values(savingData)
      .returning();
    
    console.log(`💰 RISPARMIO REGISTRATO: ${savingData.touristIqCode} ha risparmiato €${savingData.savedAmount} presso ${savingData.partnerName}`);
    return saving;
  }

  async getTouristSavings(touristIqCode: string): Promise<TouristSavings[]> {
    const savings = await this.db
      .select()
      .from(touristSavings)
      .where(eq(touristSavings.touristIqCode, touristIqCode))
      .orderBy(desc(touristSavings.appliedAt));
    
    console.log(`📊 CRONOLOGIA RISPARMI: ${savings.length} transazioni per ${touristIqCode}`);
    return savings;
  }

  async getTouristSavingsTotal(touristIqCode: string): Promise<number> {
    const [result] = await this.db
      .select({
        total: sql<number>`sum(${touristSavings.savedAmount})`
      })
      .from(touristSavings)
      .where(eq(touristSavings.touristIqCode, touristIqCode));
    
    const total = result?.total ? Number(result.total) : 0;
    console.log(`💎 TOTALE RISPARMI: €${total} per ${touristIqCode}`);
    return total;
  }

  async getTouristSavingsStats(touristIqCode: string): Promise<{
    totalSaved: number;
    savingsCount: number;
    averageSaving: number;
    topPartner: string;
    monthlyTotal: number;
  }> {
    // Statistiche generali
    const [stats] = await this.db
      .select({
        totalSaved: sql<number>`sum(${touristSavings.savedAmount})`,
        savingsCount: sql<number>`count(*)`,
        averageSaving: sql<number>`avg(${touristSavings.savedAmount})`
      })
      .from(touristSavings)
      .where(eq(touristSavings.touristIqCode, touristIqCode));

    // Partner con più risparmi
    const [topPartnerResult] = await this.db
      .select({
        partnerName: touristSavings.partnerName,
        totalSaved: sql<number>`sum(${touristSavings.savedAmount})`
      })
      .from(touristSavings)
      .where(eq(touristSavings.touristIqCode, touristIqCode))
      .groupBy(touristSavings.partnerName)
      .orderBy(desc(sql<number>`sum(${touristSavings.savedAmount})`))
      .limit(1);

    // Totale mensile corrente
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    const [monthlyResult] = await this.db
      .select({
        monthlyTotal: sql<number>`sum(${touristSavings.savedAmount})`
      })
      .from(touristSavings)
      .where(
        and(
          eq(touristSavings.touristIqCode, touristIqCode),
          sql`date_trunc('month', ${touristSavings.appliedAt}) = ${currentMonth + '-01'}::date`
        )
      );

    const result = {
      totalSaved: stats?.totalSaved ? Number(stats.totalSaved) : 0,
      savingsCount: stats?.savingsCount ? Number(stats.savingsCount) : 0,
      averageSaving: stats?.averageSaving ? Number(stats.averageSaving) : 0,
      topPartner: topPartnerResult?.partnerName || '',
      monthlyTotal: monthlyResult?.monthlyTotal ? Number(monthlyResult.monthlyTotal) : 0
    };

    console.log(`📈 STATISTICHE RISPARMI per ${touristIqCode}:`, result);
    return result;
  }

  // **SISTEMA SCONTI APPLICATI PARTNER - PostgreSQL Implementation**
  async createPartnerDiscountApplication(discountData: InsertPartnerDiscountApplication): Promise<PartnerDiscountApplication> {
    const [application] = await this.db
      .insert(partnerDiscountApplications)
      .values(discountData)
      .returning();
    
    console.log(`💰 SCONTO APPLICATO: ${discountData.partnerCode} ha applicato ${discountData.discountPercentage}% su €${discountData.originalAmount} (risparmio turista €${discountData.discountAmount}, ricavo partner €${discountData.finalAmount})`);
    return application;
  }

  async getPartnerDiscountApplications(partnerCode: string): Promise<PartnerDiscountApplication[]> {
    const applications = await this.db
      .select()
      .from(partnerDiscountApplications)
      .where(eq(partnerDiscountApplications.partnerCode, partnerCode))
      .orderBy(desc(partnerDiscountApplications.appliedAt));
    
    console.log(`📋 CRONOLOGIA SCONTI: ${applications.length} applicazioni per ${partnerCode}`);
    return applications;
  }

  async getPartnerDiscountStats(partnerCode: string): Promise<{
    totalDiscountGiven: number;
    totalRevenueGenerated: number;
    averageDiscount: number;
    clientsServed: number;
    monthlyDiscounts: number;
    monthlyRevenue: number;
  }> {
    // Statistiche generali
    const [stats] = await this.db
      .select({
        totalDiscountGiven: sql<number>`sum(${partnerDiscountApplications.discountAmount})`,
        totalRevenueGenerated: sql<number>`sum(${partnerDiscountApplications.finalAmount})`,
        averageDiscount: sql<number>`avg(${partnerDiscountApplications.discountPercentage})`,
        clientsServed: sql<number>`count(distinct ${partnerDiscountApplications.touristIqCode})`
      })
      .from(partnerDiscountApplications)
      .where(eq(partnerDiscountApplications.partnerCode, partnerCode));

    // Statistiche mensili correnti
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    const [monthlyStats] = await this.db
      .select({
        monthlyDiscounts: sql<number>`sum(${partnerDiscountApplications.discountAmount})`,
        monthlyRevenue: sql<number>`sum(${partnerDiscountApplications.finalAmount})`
      })
      .from(partnerDiscountApplications)
      .where(
        and(
          eq(partnerDiscountApplications.partnerCode, partnerCode),
          sql`date_trunc('month', ${partnerDiscountApplications.appliedAt}) = ${currentMonth + '-01'}::date`
        )
      );

    const result = {
      totalDiscountGiven: stats?.totalDiscountGiven ? Number(stats.totalDiscountGiven) : 0,
      totalRevenueGenerated: stats?.totalRevenueGenerated ? Number(stats.totalRevenueGenerated) : 0,
      averageDiscount: stats?.averageDiscount ? Number(stats.averageDiscount) : 0,
      clientsServed: stats?.clientsServed ? Number(stats.clientsServed) : 0,
      monthlyDiscounts: monthlyStats?.monthlyDiscounts ? Number(monthlyStats.monthlyDiscounts) : 0,
      monthlyRevenue: monthlyStats?.monthlyRevenue ? Number(monthlyStats.monthlyRevenue) : 0
    };

    console.log(`📊 STATISTICHE PARTNER ${partnerCode}:`, result);
    return result;
  }

  // **SISTEMA BUSINESS INFO PARTNER - PostgreSQL Implementation**
  async getPartnerBusinessInfo(partnerCode: string): Promise<any> {
    try {
      const result = await this.db.execute(sql`
        SELECT * FROM partner_business_info 
        WHERE partner_code = ${partnerCode}
      `);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      const row = result.rows[0];
      return {
        partnerCode: row.partner_code,
        phone: row.phone,
        email: row.email,
        website: row.website,
        instagram: row.instagram,
        facebook: row.facebook,
        tiktok: row.tiktok,
        youtube: row.youtube,
        openingHours: row.opening_hours ? JSON.parse(row.opening_hours) : null,
        specialties: row.specialties ? JSON.parse(row.specialties) : [],
        certifications: row.certifications ? JSON.parse(row.certifications) : [],
        wheelchairAccessible: row.wheelchair_accessible,
        assistanceAvailable: row.assistance_available,
        reservedParking: row.reserved_parking,
        accessibleBathroom: row.accessible_bathroom,
        childFriendly: row.child_friendly,
        highChairs: row.high_chairs,
        childMenu: row.child_menu,
        changingTable: row.changing_table,
        playArea: row.play_area,
        glutenFree: row.gluten_free,
        vegan: row.vegan,
        vegetarian: row.vegetarian,
        allergenMenu: row.allergen_menu,
        freeWifi: row.free_wifi,
        creditCards: row.credit_cards,
        delivery: row.delivery,
        reservations: row.reservations,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    } catch (error) {
      console.error("Errore recupero business info:", error);
      return null;
    }
  }

  async updatePartnerBusinessInfo(partnerCode: string, businessData: any): Promise<any> {
    try {
      // Prepara i dati per l'aggiornamento
      const updateData = {
        phone: businessData.phone || null,
        email: businessData.email || null,
        website: businessData.website || null,
        instagram: businessData.instagram || null,
        facebook: businessData.facebook || null,
        tiktok: businessData.tiktok || null,
        youtube: businessData.youtube || null,
        opening_hours: businessData.openingHours ? JSON.stringify(businessData.openingHours) : null,
        specialties: businessData.specialties ? JSON.stringify(businessData.specialties) : null,
        certifications: businessData.certifications ? JSON.stringify(businessData.certifications) : null,
        wheelchair_accessible: businessData.wheelchairAccessible || false,
        assistance_available: businessData.assistanceAvailable || false,
        reserved_parking: businessData.reservedParking || false,
        accessible_bathroom: businessData.accessibleBathroom || false,
        child_friendly: businessData.childFriendly || false,
        high_chairs: businessData.highChairs || false,
        child_menu: businessData.childMenu || false,
        changing_table: businessData.changingTable || false,
        play_area: businessData.playArea || false,
        gluten_free: businessData.glutenFree || false,
        vegan: businessData.vegan || false,
        vegetarian: businessData.vegetarian || false,
        allergen_menu: businessData.allergenMenu || false,
        free_wifi: businessData.freeWifi || false,
        credit_cards: businessData.creditCards || false,
        delivery: businessData.delivery || false,
        reservations: businessData.reservations || false,
        updated_at: new Date().toISOString()
      };

      // Esegui UPSERT (inserimento o aggiornamento)
      await this.db.execute(sql`
        INSERT INTO partner_business_info (
          partner_code, phone, email, website, instagram, facebook, tiktok, youtube,
          opening_hours, specialties, certifications,
          wheelchair_accessible, assistance_available, reserved_parking, accessible_bathroom,
          child_friendly, high_chairs, child_menu, changing_table, play_area,
          gluten_free, vegan, vegetarian, allergen_menu,
          free_wifi, credit_cards, delivery, reservations, updated_at
        ) VALUES (
          ${partnerCode}, ${updateData.phone}, ${updateData.email}, ${updateData.website},
          ${updateData.instagram}, ${updateData.facebook}, ${updateData.tiktok}, ${updateData.youtube},
          ${updateData.opening_hours}, ${updateData.specialties}, ${updateData.certifications},
          ${updateData.wheelchair_accessible}, ${updateData.assistance_available}, 
          ${updateData.reserved_parking}, ${updateData.accessible_bathroom},
          ${updateData.child_friendly}, ${updateData.high_chairs}, ${updateData.child_menu},
          ${updateData.changing_table}, ${updateData.play_area},
          ${updateData.gluten_free}, ${updateData.vegan}, ${updateData.vegetarian}, ${updateData.allergen_menu},
          ${updateData.free_wifi}, ${updateData.credit_cards}, ${updateData.delivery}, ${updateData.reservations},
          ${updateData.updated_at}
        ) ON CONFLICT (partner_code) DO UPDATE SET
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          website = EXCLUDED.website,
          instagram = EXCLUDED.instagram,
          facebook = EXCLUDED.facebook,
          tiktok = EXCLUDED.tiktok,
          youtube = EXCLUDED.youtube,
          opening_hours = EXCLUDED.opening_hours,
          specialties = EXCLUDED.specialties,
          certifications = EXCLUDED.certifications,
          wheelchair_accessible = EXCLUDED.wheelchair_accessible,
          assistance_available = EXCLUDED.assistance_available,
          reserved_parking = EXCLUDED.reserved_parking,
          accessible_bathroom = EXCLUDED.accessible_bathroom,
          child_friendly = EXCLUDED.child_friendly,
          high_chairs = EXCLUDED.high_chairs,
          child_menu = EXCLUDED.child_menu,
          changing_table = EXCLUDED.changing_table,
          play_area = EXCLUDED.play_area,
          gluten_free = EXCLUDED.gluten_free,
          vegan = EXCLUDED.vegan,
          vegetarian = EXCLUDED.vegetarian,
          allergen_menu = EXCLUDED.allergen_menu,
          free_wifi = EXCLUDED.free_wifi,
          credit_cards = EXCLUDED.credit_cards,
          delivery = EXCLUDED.delivery,
          reservations = EXCLUDED.reservations,
          updated_at = EXCLUDED.updated_at
      `);

      // Restituisci i dati aggiornati
      return await this.getPartnerBusinessInfo(partnerCode);
    } catch (error) {
      console.error("Errore aggiornamento business info:", error);
      throw error;
    }
  }

  // **SISTEMA RISPARMIO OSPITI STRUTTURE - PostgreSQL Implementation**
  async createStructureGuestSaving(savingData: any): Promise<any> {
    const [saving] = await this.db
      .insert(structureGuestSavings)
      .values(savingData)
      .returning();
    
    console.log(`🏨 RISPARMIO STRUTTURA: ${savingData.structureCode} - codice temporaneo ${savingData.temporaryCode}`);
    return saving;
  }

  async updateStructureGuestSaving(structureCode: string, temporaryCode: string, permanentCode: string, savingAmount: number): Promise<any> {
    const [updated] = await this.db
      .update(structureGuestSavings)
      .set({
        totalSavingsGenerated: sql`total_savings_generated + ${savingAmount}`,
        discountApplicationsCount: sql`discount_applications_count + 1`,
        lastSavingUpdatedAt: new Date(),
        updatedAt: new Date()
      })
      .where(
        and(
          eq(structureGuestSavings.structureCode, structureCode),
          eq(structureGuestSavings.temporaryCode, temporaryCode)
        )
      )
      .returning();

    console.log(`💰 AGGIORNAMENTO RISPARMIO: ${structureCode} - ${temporaryCode} → +€${savingAmount}`);
    return updated;
  }

  async getStructureGuestSavingsStats(structureCode: string): Promise<{
    totalCodesIssued: number;
    totalSavingsGenerated: number;
    averageSavingPerGuest: number;
    activeGuestsCount: number;
  }> {
    try {
      const stats = await this.db
        .select({
          totalCodesIssued: sql<number>`count(*)`,
          totalSavingsGenerated: sql<number>`sum(total_savings_generated)`,
          activeGuestsCount: sql<number>`count(case when permanent_code is not null then 1 end)`
        })
        .from(structureGuestSavings)
        .where(eq(structureGuestSavings.structureCode, structureCode));

      const result = stats[0];
      const totalCodesIssued = Number(result.totalCodesIssued) || 0;
      const totalSavingsGenerated = Number(result.totalSavingsGenerated) || 0;
      const activeGuestsCount = Number(result.activeGuestsCount) || 0;

      return {
        totalCodesIssued,
        totalSavingsGenerated,
        averageSavingPerGuest: activeGuestsCount > 0 ? totalSavingsGenerated / activeGuestsCount : 0,
        activeGuestsCount
      };
    } catch (error) {
      console.error(`❌ ERRORE STATS RISPARMIO STRUTTURA ${structureCode}:`, error);
      return {
        totalCodesIssued: 0,
        totalSavingsGenerated: 0,
        averageSavingPerGuest: 0,
        activeGuestsCount: 0
      };
    }
  }

  async trackTemporaryCodeActivation(temporaryCode: string, permanentCode: string, touristIqCode: string): Promise<void> {
    // Trova la struttura che ha generato il codice temporaneo
    const [tempCodeData] = await this.db
      .select()
      .from(structureGuestSavings)
      .where(eq(structureGuestSavings.temporaryCode, temporaryCode))
      .limit(1);

    if (tempCodeData) {
      // Aggiorna con il codice permanente
      await this.db
        .update(structureGuestSavings)
        .set({
          permanentCode,
          touristIqCode,
          permanentCodeActivatedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(structureGuestSavings.temporaryCode, temporaryCode));

      console.log(`✅ ATTIVAZIONE TRACCIATA: ${temporaryCode} → ${permanentCode} (struttura: ${tempCodeData.structureCode})`);
    } else {
      console.log(`🟡 CODICE TEMPORANEO NON TROVATO: ${temporaryCode}`);
    }
  }

  async trackDiscountApplication(touristIqCode: string, discountAmount: number): Promise<void> {
    // Trova la struttura che ha generato il codice temporaneo per questo turista
    const [savingRecord] = await this.db
      .select()
      .from(structureGuestSavings)
      .where(eq(structureGuestSavings.touristIqCode, touristIqCode))
      .limit(1);

    if (savingRecord) {
      // Aggiorna i risparmi totali
      await this.db
        .update(structureGuestSavings)
        .set({
          totalSavingsGenerated: sql`total_savings_generated + ${discountAmount}`,
          discountApplicationsCount: sql`discount_applications_count + 1`,
          lastSavingUpdatedAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(structureGuestSavings.touristIqCode, touristIqCode));

      console.log(`💰 SCONTO TRACCIATO: ${touristIqCode} → +€${discountAmount} (struttura: ${savingRecord.structureCode})`);
    } else {
      console.log(`🟡 TURISTA NON TRACCIATO: ${touristIqCode}`);
    }
  }

  // Implementazione con controllo esistenza
  async createStructureGuestSavingsRecord(data: {
    structureCode: string;
    temporaryCode: string;
    guestName: string;
    guestPhone: string;
    temporaryCodeIssuedAt: Date;
    temporaryCodeGeneratedAt: Date;
  }): Promise<void> {
    const existing = await this.db
      .select()
      .from(structureGuestSavings)
      .where(eq(structureGuestSavings.temporaryCode, data.temporaryCode))
      .limit(1);

    if (existing.length === 0) {
      await this.db.insert(structureGuestSavings).values({
        structureCode: data.structureCode,
        temporaryCode: data.temporaryCode,
        guestName: data.guestName,
        guestPhone: data.guestPhone,
        temporaryCodeIssuedAt: data.temporaryCodeIssuedAt,
        temporaryCodeGeneratedAt: data.temporaryCodeGeneratedAt,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }

  // Metodo per inizializzare dati demo risparmio ospiti
  async initializeDemoGuestSavingsData(): Promise<void> {
    try {
      // Trova strutture esistenti
      const structures = await this.db
        .select()
        .from(iqCodes)
        .where(eq(iqCodes.role, 'structure'))
        .limit(3);

      if (structures.length === 0) {
        console.log('🟡 Nessuna struttura trovata per dati demo risparmio ospiti');
        return;
      }

      // Crea dati demo per ogni struttura
      for (const structure of structures) {
        const demoData = [
          {
            structureCode: structure.code,
            temporaryCode: 'IQCODE-PRIMOACCESSO-DEMO1',
            permanentCode: 'TIQ-IT-DEMO-OSPITE1',
            touristIqCode: 'TIQ-IT-DEMO-OSPITE1',
            guestName: 'Marco Rossi',
            guestPhone: '+39 333 1234567',
            temporaryCodeIssuedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            temporaryCodeGeneratedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            permanentCodeActivatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            totalSavingsGenerated: 47.50,
            discountApplicationsCount: 3,
            lastSavingUpdatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          },
          {
            structureCode: structure.code,
            temporaryCode: 'IQCODE-PRIMOACCESSO-DEMO2',
            permanentCode: 'TIQ-IT-DEMO-OSPITE2',
            touristIqCode: 'TIQ-IT-DEMO-OSPITE2',
            guestName: 'Giulia Bianchi',
            guestPhone: '+39 347 9876543',
            temporaryCodeIssuedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            temporaryCodeGeneratedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            permanentCodeActivatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            totalSavingsGenerated: 23.20,
            discountApplicationsCount: 2,
            lastSavingUpdatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
          },
          {
            structureCode: structure.code,
            temporaryCode: 'IQCODE-PRIMOACCESSO-DEMO3',
            permanentCode: 'TIQ-IT-DEMO-OSPITE3',
            touristIqCode: 'TIQ-IT-DEMO-OSPITE3',
            guestName: 'Andrea Verdi',
            guestPhone: '+39 320 5551234',
            temporaryCodeIssuedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            temporaryCodeGeneratedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            permanentCodeActivatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            totalSavingsGenerated: 12.80,
            discountApplicationsCount: 1,
            lastSavingUpdatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
          }
        ];

        for (const demo of demoData) {
          const existing = await this.db
            .select()
            .from(structureGuestSavings)
            .where(eq(structureGuestSavings.temporaryCode, demo.temporaryCode))
            .limit(1);

          if (existing.length === 0) {
            await this.db.insert(structureGuestSavings).values({
              ...demo,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        }
      }

      console.log('✅ DATI DEMO RISPARMIO OSPITI INIZIALIZZATI');
    } catch (error) {
      console.error('❌ Errore inizializzazione dati demo risparmio ospiti:', error);
    }
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
    // MemStorage fallback - crea codice di esempio senza database
    const uniqueCode = `TIQ-IT-${Math.floor(1000 + Math.random() * 9000)}-DEMO`;
    return { iqCode: uniqueCode, success: true };
  }

  async cleanupExpiredTempCodes(): Promise<void> {
    // No-op per memoria
  }

  // **SISTEMA CODICI MONOUSO (Privacy-First) - Memory Implementation**
  async generateOneTimeCode(touristIqCode: string): Promise<{ code: string; remaining: number }> {
    // Genera 5 cifre numeriche per consistency con PostgreSQL
    const numericCode = Math.floor(10000 + Math.random() * 90000).toString();
    return { code: `TIQ-OTC-${numericCode}`, remaining: 9 }; // Mock implementation
  }

  async validateOneTimeCode(code: string, partnerCode: string, partnerName: string): Promise<{ valid: boolean; used: boolean }> {
    return { valid: true, used: false }; // Mock implementation
  }

  async getTouristOneTimeCodes(touristIqCode: string): Promise<OneTimeCode[]> {
    return []; // Mock implementation
  }

  async getTouristAvailableUses(touristIqCode: string): Promise<number> {
    // MemStorage non ha accesso al database, quindi ritorna 0
    // Il sistema reale usa PostgreSQL
    return 0;
  }

  async getTouristTotalDiscountUsed(touristIqCode: string): Promise<number> {
    // Mock implementation per MemStorage
    return 0;
  }

  async applyDiscountToOneTimeCode(
    code: string, 
    partnerCode: string, 
    partnerName: string, 
    originalAmount: number, 
    discountPercentage: number, 
    discountAmount: number, 
    offerDescription?: string
  ): Promise<void> {
    // Mock implementation per MemStorage
    console.log(`Mock: Sconto applicato - Codice: ${code}, Importo: €${discountAmount}`);
  }

  async initializeOneTimeCodesForTourist(touristIqCode: string, quantity: number): Promise<void> {
    // Mock implementation per MemStorage
    console.log(`🔄 INIZIALIZZAZIONE TIQ-OTC (MemStorage): ${touristIqCode} → ${quantity} codici`);
  }

  async getTouristsWithoutOneTimeCodes(): Promise<{ code: string; availableUses: number }[]> {
    // Mock implementation per MemStorage
    return [];
  }

  async getOneTimeCodeDetails(code: string): Promise<{ touristIqCode: string } | null> {
    // Mock implementation per MemStorage
    return null;
  }

  // **SISTEMA RISPARMI TURISTI - Memory Implementation**
  async createTouristSaving(savingData: InsertTouristSavings): Promise<TouristSavings> {
    // Mock implementation per MemStorage
    const saving = {
      id: Math.floor(Math.random() * 1000),
      ...savingData,
      appliedAt: new Date()
    };
    return saving as TouristSavings;
  }

  async getTouristSavings(touristIqCode: string): Promise<TouristSavings[]> {
    // Mock implementation per MemStorage
    return [];
  }

  async getTouristSavingsTotal(touristIqCode: string): Promise<number> {
    // Mock implementation per MemStorage
    return 0;
  }

  async getTouristSavingsStats(touristIqCode: string): Promise<{
    totalSaved: number;
    savingsCount: number;
    averageSaving: number;
    topPartner: string;
    monthlyTotal: number;
  }> {
    // Mock implementation per MemStorage
    return {
      totalSaved: 0,
      savingsCount: 0,
      averageSaving: 0,
      topPartner: '',
      monthlyTotal: 0
    };
  }

  // **SISTEMA SCONTI APPLICATI PARTNER - Memory Implementation**
  async createPartnerDiscountApplication(discountData: InsertPartnerDiscountApplication): Promise<PartnerDiscountApplication> {
    // Mock implementation per MemStorage
    const application = {
      id: Math.floor(Math.random() * 1000),
      ...discountData,
      appliedAt: new Date()
    };
    return application as PartnerDiscountApplication;
  }

  async getPartnerDiscountApplications(partnerCode: string): Promise<PartnerDiscountApplication[]> {
    // Mock implementation per MemStorage
    return [];
  }

  async getPartnerDiscountStats(partnerCode: string): Promise<{
    totalDiscountGiven: number;
    totalRevenueGenerated: number;
    averageDiscount: number;
    clientsServed: number;
    monthlyDiscounts: number;
    monthlyRevenue: number;
  }> {
    // Mock implementation per MemStorage
    return {
      totalDiscountGiven: 0,
      totalRevenueGenerated: 0,
      averageDiscount: 0,
      clientsServed: 0,
      monthlyDiscounts: 0,
      monthlyRevenue: 0
    };
  }

  // **SISTEMA BUSINESS INFO PARTNER - Mock Implementation**
  async getPartnerBusinessInfo(partnerCode: string): Promise<any> {
    return null; // Mock implementation
  }

  async updatePartnerBusinessInfo(partnerCode: string, businessData: any): Promise<any> {
    return businessData; // Mock implementation
  }

  // **SISTEMA REPORT PARTNER TOURISTIQ - Mock Implementation**
  async getPartnerTouristiqStats(partnerCode: string, days: number = 7): Promise<{
    totalDiscounts: number;
    totalClients: number;
    totalRevenue: number;
    averageDiscount: number;
    recentTransactions: any[];
    period: string;
  }> {
    return {
      totalDiscounts: 0,
      totalClients: 0,
      totalRevenue: 0,
      averageDiscount: 0,
      recentTransactions: [],
      period: `${days} giorni`
    };
  }

  async getPartnerDiscountHistory(partnerCode: string, limit: number = 50): Promise<any[]> {
    return [];
  }
}



// Use PostgreSQL storage if DATABASE_URL exists, otherwise fallback to memory
export const storage = process.env.DATABASE_URL ? new ExtendedPostgreStorage() : new ExtendedMemStorage();