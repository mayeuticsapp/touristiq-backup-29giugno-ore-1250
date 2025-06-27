import { iqCodes, sessions, assignedPackages, guests, adminCredits, purchasedPackages, accountingMovements, structureSettings, type IqCode, type InsertIqCode, type Session, type InsertSession, type AssignedPackage, type InsertAssignedPackage, type Guest, type InsertGuest, type AdminCredits, type InsertAdminCredits, type PurchasedPackage, type InsertPurchasedPackage, type AccountingMovement, type InsertAccountingMovement, type StructureSettings, type InsertStructureSettings, type UserRole } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, and, lt } from "drizzle-orm";

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
  getMonthlyAccountingSummary(structureCode: string, month: string): Promise<{income: number, expenses: number, balance: number}>;

  // Structure settings methods
  getStructureSettings(structureCode: string): Promise<StructureSettings | undefined>;
  createStructureSettings(settings: InsertStructureSettings): Promise<StructureSettings>;
  updateStructureSettings(structureCode: string, settings: Partial<InsertStructureSettings>): Promise<StructureSettings>;
  checkGestionaleAccess(structureCode: string): Promise<{hasAccess: boolean, hoursRemaining?: number}>;
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

  // Metodi placeholder per compatibilità con interfaccia
  async createPurchasedPackage(): Promise<PurchasedPackage> { throw new Error("Not implemented"); }
  async getPurchasedPackagesByStructure(): Promise<PurchasedPackage[]> { return []; }
  async getTotalIQCodesRemaining(): Promise<number> { return 0; }
  async useIQCodeFromPackage(): Promise<boolean> { return false; }
  async createAccountingMovement(): Promise<AccountingMovement> { throw new Error("Not implemented"); }
  async getAccountingMovements(): Promise<AccountingMovement[]> { return []; }
  async getMonthlyAccountingSummary(): Promise<{income: number, expenses: number, balance: number}> { return { income: 0, expenses: 0, balance: 0 }; }
  async getStructureSettings(): Promise<StructureSettings | undefined> { return undefined; }
  async createStructureSettings(): Promise<StructureSettings> { throw new Error("Not implemented"); }
  async updateStructureSettings(): Promise<StructureSettings> { throw new Error("Not implemented"); }
  async checkGestionaleAccess(): Promise<{hasAccess: boolean, hoursRemaining?: number}> { return { hasAccess: false }; }
}

// PostgreSQL Storage Class
export class PostgreStorage implements IStorage {
  private db: any;

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
  async createAccountingMovement(): Promise<AccountingMovement> { throw new Error("Not implemented"); }
  async getAccountingMovements(): Promise<AccountingMovement[]> { return []; }
  async getMonthlyAccountingSummary(): Promise<{income: number, expenses: number, balance: number}> { return { income: 0, expenses: 0, balance: 0 }; }
  async getStructureSettings(): Promise<StructureSettings | undefined> { return undefined; }
  async createStructureSettings(): Promise<StructureSettings> { throw new Error("Not implemented"); }
  async updateStructureSettings(): Promise<StructureSettings> { throw new Error("Not implemented"); }
  async checkGestionaleAccess(): Promise<{hasAccess: boolean, hoursRemaining?: number}> { return { hasAccess: false }; }
}

// Use PostgreSQL storage if DATABASE_URL exists, otherwise fallback to memory
export const storage = process.env.DATABASE_URL ? new PostgreStorage() : new MemStorage();
