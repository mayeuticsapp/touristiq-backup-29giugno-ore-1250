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

// Tabella promozioni partner per gestione avanzata
export const partnerPromotions = pgTable("partner_promotions", {
  id: serial("id").primaryKey(),
  partnerCode: text("partner_code").notNull(), // Codice IQ del partner
  title: text("title").notNull(),
  description: text("description").notNull(),
  discountType: text("discount_type").notNull(), // percentage, fixed, special
  discountValue: text("discount_value").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  requiresConnection: boolean("requires_connection").notNull().default(false), // Solo per turisti collegati
  viewCount: integer("view_count").notNull().default(0),
  usageCount: integer("usage_count").notNull().default(0),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

// Tabella collegamenti partner-turista per tracking relazioni
export const partnerTouristConnections = pgTable("partner_tourist_connections", {
  id: serial("id").primaryKey(),
  partnerCode: text("partner_code").notNull(), // Codice IQ del partner
  touristCode: text("tourist_code").notNull(), // Codice IQ del turista
  connectionStatus: text("connection_status").notNull().default("pending"), // pending, active, inactive
  connectedAt: timestamp("connected_at").defaultNow().notNull(),
  lastInteraction: timestamp("last_interaction").defaultNow().notNull(),
  totalVisits: integer("total_visits").notNull().default(0),
  promotionsUsed: integer("promotions_used").notNull().default(0),
  totalValue: integer("total_value").notNull().default(0), // Valore generato in centesimi
  notes: text("notes"), // Note interne del partner
  isActive: boolean("is_active").notNull().default(true)
});

// Tabella utilizzi promozioni per analytics dettagliate
export const promotionUsages = pgTable("promotion_usages", {
  id: serial("id").primaryKey(),
  promotionId: integer("promotion_id").notNull(),
  touristCode: text("tourist_code").notNull(),
  partnerCode: text("partner_code").notNull(),
  usageType: text("usage_type").notNull(), // view, click, redeem
  value: integer("value").default(0), // Valore transazione in centesimi
  metadata: text("metadata"), // JSON con dettagli extra
  usedAt: timestamp("used_at").defaultNow().notNull()
});

// Tabella comunicazioni admin-partner
export const adminCommunications = pgTable("admin_communications", {
  id: serial("id").primaryKey(),
  recipientCode: text("recipient_code").notNull(), // Codice IQ destinatario
  senderCode: text("sender_code").notNull(), // Codice IQ mittente (admin)
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("general"), // general, alert, promotion, system
  priority: text("priority").notNull().default("normal"), // low, normal, high, urgent
  isRead: boolean("is_read").notNull().default(false),
  requiresResponse: boolean("requires_response").notNull().default(false),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  readAt: timestamp("read_at")
});

// Tabella richieste crediti partner
export const creditRequests = pgTable("credit_requests", {
  id: serial("id").primaryKey(),
  partnerCode: text("partner_code").notNull(),
  requestedAmount: integer("requested_amount").notNull(),
  justification: text("justification").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: text("reviewed_by"),
  reviewNotes: text("review_notes")
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

export const insertPartnerPromotionSchema = createInsertSchema(partnerPromotions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPartnerTouristConnectionSchema = createInsertSchema(partnerTouristConnections).omit({
  id: true,
  connectedAt: true,
  lastInteraction: true,
});

export const insertPromotionUsageSchema = createInsertSchema(promotionUsages).omit({
  id: true,
  usedAt: true,
});

export const insertAdminCommunicationSchema = createInsertSchema(adminCommunications).omit({
  id: true,
  sentAt: true,
});

export const insertCreditRequestSchema = createInsertSchema(creditRequests).omit({
  id: true,
  requestedAt: true,
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
export type PartnerPromotion = typeof partnerPromotions.$inferSelect;
export type InsertPartnerPromotion = z.infer<typeof insertPartnerPromotionSchema>;
export type PartnerTouristConnection = typeof partnerTouristConnections.$inferSelect;
export type InsertPartnerTouristConnection = z.infer<typeof insertPartnerTouristConnectionSchema>;
export type PromotionUsage = typeof promotionUsages.$inferSelect;
export type InsertPromotionUsage = z.infer<typeof insertPromotionUsageSchema>;
export type AdminCommunication = typeof adminCommunications.$inferSelect;
export type InsertAdminCommunication = z.infer<typeof insertAdminCommunicationSchema>;
export type CreditRequest = typeof creditRequests.$inferSelect;
export type InsertCreditRequest = z.infer<typeof insertCreditRequestSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;

export type UserRole = 'admin' | 'tourist' | 'structure' | 'partner';
