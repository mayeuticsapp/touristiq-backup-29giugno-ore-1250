import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const iqCodes = pgTable("iq_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  role: text("role").notNull(), // 'admin', 'tourist', 'structure', 'partner'
  isActive: boolean("is_active").notNull().default(true),
  status: text("status").notNull().default("pending"), // pending, approved, blocked, inactive
  createdAt: timestamp("created_at").notNull().defaultNow(),
  assignedTo: text("assigned_to"), // Nome persona/azienda
  location: text("location"), // IT, VV, RC, etc.
  codeType: text("code_type"), // emotional, professional
  approvedAt: timestamp("approved_at"),
  approvedBy: text("approved_by"),
  internalNote: text("internal_note"), // Note private dell'admin
  isDeleted: boolean("is_deleted").notNull().default(false), // Cestino temporaneo
  deletedAt: timestamp("deleted_at"), // Data eliminazione per auto-cleanup
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  iqCode: text("iq_code").notNull(),
  role: text("role").notNull(),
  sessionToken: text("session_token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const assignedPackages = pgTable("assigned_packages", {
  id: serial("id").primaryKey(),
  recipientIqCode: text("recipient_iq_code").notNull(), // Codice IQ del destinatario
  packageSize: integer("package_size").notNull(), // 25, 50, 75, 100 crediti totali
  status: text("status").notNull().default("available"), // available, used, expired
  assignedBy: text("assigned_by").notNull(), // Codice IQ admin che ha assegnato
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  creditsRemaining: integer("credits_remaining").notNull(), // Crediti rimanenti per generare IQCode
  creditsUsed: integer("credits_used").notNull().default(0), // Crediti utilizzati
});

// Tabella per i codici IQ emozionali generati al momento dalle strutture
export const generatedEmotionalCodes = pgTable("generated_emotional_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // Codice IQ emozionale (es: TIQ-IT-ROSA)
  generatedBy: text("generated_by").notNull(), // Struttura che ha generato
  packageId: integer("package_id").notNull(), // Pacchetto da cui provengono i crediti
  assignedTo: text("assigned_to"), // Nome ospite a cui è assegnato
  guestId: integer("guest_id"), // ID ospite dalla gestione ospiti
  country: text("country").notNull(), // Paese (IT, FR, ES, etc.)
  emotionalWord: text("emotional_word").notNull(), // Parola emozionale usata
  status: text("status").notNull().default("active"), // active (permanente)
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
  assignedAt: timestamp("assigned_at").notNull().defaultNow()
});

// Tabella ospiti per gestione completa da parte delle strutture
export const guests = pgTable("guests", {
  id: serial("id").primaryKey(),
  structureCode: text("structure_code").notNull(), // Codice della struttura
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  roomNumber: text("room_number"),
  checkinDate: text("checkin_date"), // Formato YYYY-MM-DD
  checkoutDate: text("checkout_date"), // Formato YYYY-MM-DD
  notes: text("notes"),
  assignedCodes: integer("assigned_codes").default(0), // Contatore codici assegnati
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Tabella crediti admin per il Pacchetto RobS
export const adminCredits = pgTable("admin_credits", {
  id: serial("id").primaryKey(),
  adminCode: text("admin_code").notNull().unique(), // TIQ-IT-ADMIN
  creditsRemaining: integer("credits_remaining").notNull().default(1000),
  creditsUsed: integer("credits_used").notNull().default(0),
  lastGeneratedAt: timestamp("last_generated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertIqCodeSchema = createInsertSchema(iqCodes).omit({
  id: true,
  createdAt: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  createdAt: true,
});

export const insertAssignedPackageSchema = createInsertSchema(assignedPackages).omit({
  id: true,
  assignedAt: true,
});

export const insertGeneratedEmotionalCodeSchema = createInsertSchema(generatedEmotionalCodes).omit({
  id: true,
  generatedAt: true,
});

export const insertGuestSchema = createInsertSchema(guests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminCreditsSchema = createInsertSchema(adminCredits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const loginSchema = z.object({
  iqCode: z.string().min(1, "Codice IQ richiesto").max(20),
});

export type IqCode = typeof iqCodes.$inferSelect;
export type InsertIqCode = z.infer<typeof insertIqCodeSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type AssignedPackage = typeof assignedPackages.$inferSelect;
export type InsertAssignedPackage = z.infer<typeof insertAssignedPackageSchema>;
export type GeneratedEmotionalCode = typeof generatedEmotionalCodes.$inferSelect;
export type InsertGeneratedEmotionalCode = z.infer<typeof insertGeneratedEmotionalCodeSchema>;
export type Guest = typeof guests.$inferSelect;
export type InsertGuest = typeof guests.$inferInsert;
export type AdminCredits = typeof adminCredits.$inferSelect;
export type InsertAdminCredits = z.infer<typeof insertAdminCreditsSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;

export type UserRole = 'admin' | 'tourist' | 'structure' | 'partner';
