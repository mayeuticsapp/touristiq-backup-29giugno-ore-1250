import { pgTable, text, serial, integer, boolean, timestamp, decimal, date, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { eq } from "drizzle-orm";

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
  availableOneTimeUses: integer("available_one_time_uses").default(10), // Codici monouso disponibili per turisti
  totalDiscountUsed: decimal("total_discount_used", { precision: 10, scale: 2 }).default("0.00"), // Totale sconto usato (max €150)
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
  status: text("status").notNull().default("assigned"), // assigned, available, used
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
  assignedAt: timestamp("assigned_at"),
  removedAt: timestamp("removed_at"), // Quando è stato rimosso dall'ospite
  removedReason: text("removed_reason") // Motivo rimozione
});

// Tabella per tracciare i codici IQ disponibili per riassegnazione
export const availableIqCodes = pgTable("available_iq_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // Codice IQ disponibile
  structureCode: text("structure_code").notNull(), // Struttura proprietaria
  originalGuestId: integer("original_guest_id"), // Ospite originale (se rimosso)
  originalGuestName: text("original_guest_name"), // Nome ospite originale
  packageId: integer("package_id").notNull(), // Pacchetto di provenienza
  madeAvailableAt: timestamp("made_available_at").notNull().defaultNow(),
  reason: text("reason").default("removed_from_guest"), // removed_from_guest, generated_unused
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// Tabella per le impostazioni del sistema admin
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // Nome impostazione
  value: text("value").notNull(), // Valore impostazione
  description: text("description"), // Descrizione opzionale
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: text("updated_by").notNull(), // Admin che ha modificato
});

// Tabella per informazioni business dettagliate dei partner
export const partnerBusinessInfo = pgTable("partner_business_info", {
  id: serial("id").primaryKey(),
  partnerCode: text("partner_code").notNull().unique(), // Codice IQ del partner
  
  // Contatti principali
  phone: text("phone"), // Numero telefono/WhatsApp
  email: text("email"), // Email aziendale
  website: text("website"), // Sito web
  
  // Social Media
  instagram: text("instagram"), // Username Instagram (senza @)
  facebook: text("facebook"), // Nome pagina Facebook
  tiktok: text("tiktok"), // Username TikTok (senza @)
  youtube: text("youtube"), // Nome canale YouTube (senza @)
  
  // Orari apertura (formato JSON)
  openingHours: text("opening_hours"), // JSON con orari per ogni giorno
  
  // Specialità e servizi
  specialties: text("specialties"), // JSON array delle specialità
  certifications: text("certifications"), // JSON array delle certificazioni
  
  // Accessibilità
  wheelchairAccessible: boolean("wheelchair_accessible").default(false),
  assistanceAvailable: boolean("assistance_available").default(false),
  reservedParking: boolean("reserved_parking").default(false),
  accessibleBathroom: boolean("accessible_bathroom").default(false),
  
  // Servizi famiglia
  childFriendly: boolean("child_friendly").default(false),
  highChairs: boolean("high_chairs").default(false),
  childMenu: boolean("child_menu").default(false),
  changingTable: boolean("changing_table").default(false),
  playArea: boolean("play_area").default(false),
  
  // Allergie e intolleranze
  glutenFree: boolean("gluten_free").default(false),
  vegan: boolean("vegan").default(false),
  vegetarian: boolean("vegetarian").default(false),
  allergenMenu: boolean("allergen_menu").default(false),
  
  // Servizi extra
  freeWifi: boolean("free_wifi").default(false),
  creditCards: boolean("credit_cards").default(false),
  delivery: boolean("delivery").default(false),
  reservations: boolean("reservations").default(false),
  
  // Metadati
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
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

// Tabella codici monouso per turisti
export const oneTimeCodes = pgTable("one_time_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // TIQ-OTC-XXXXX (5 cifre)
  touristIqCode: text("tourist_iq_code").notNull(), // IQCode del turista che ha generato
  isUsed: boolean("is_used").notNull().default(false),
  usedBy: text("used_by"), // IQCode del partner che ha validato
  usedByName: text("used_by_name"), // Nome del partner per cronologia turista
  // Campi per nuovo sistema €150
  originalAmount: decimal("original_amount", { precision: 10, scale: 2 }), // Importo originale speso
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }), // % sconto applicato
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }), // Importo sconto in €
  offerDescription: text("offer_description"), // Descrizione offerta partner
  createdAt: timestamp("created_at").notNull().defaultNow(),
  usedAt: timestamp("used_at"),
});

// Tabella per tracciare i risparmi effettivi ottenuti dai turisti
export const touristSavings = pgTable("tourist_savings", {
  id: serial("id").primaryKey(),
  touristIqCode: text("tourist_iq_code").notNull(), // IQCode del turista
  partnerCode: text("partner_code").notNull(), // IQCode del partner
  partnerName: text("partner_name").notNull(), // Nome del partner per visualizzazione
  discountDescription: text("discount_description").notNull(), // Descrizione sconto applicato
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }).notNull(), // Prezzo originale
  discountedPrice: decimal("discounted_price", { precision: 10, scale: 2 }).notNull(), // Prezzo con sconto
  savedAmount: decimal("saved_amount", { precision: 10, scale: 2 }).notNull(), // Importo risparmiato
  appliedAt: timestamp("applied_at").notNull().defaultNow(), // Quando è stato applicato lo sconto
  notes: text("notes"), // Note aggiuntive del turista
});

// Tabella per tracciare gli sconti applicati dai partner (per statistiche ricavi)
export const partnerDiscountApplications = pgTable("partner_discount_applications", {
  id: serial("id").primaryKey(),
  partnerCode: text("partner_code").notNull(), // IQCode del partner
  partnerName: text("partner_name").notNull(), // Nome del partner
  touristIqCode: text("tourist_iq_code").notNull(), // IQCode del turista
  otcCode: text("otc_code").notNull(), // Codice TIQ-OTC utilizzato
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).notNull(), // % sconto applicato
  originalAmount: decimal("original_amount", { precision: 10, scale: 2 }).notNull(), // Importo originale
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).notNull(), // Importo sconto
  finalAmount: decimal("final_amount", { precision: 10, scale: 2 }).notNull(), // Importo finale pagato
  description: text("description"), // Descrizione prodotto/servizio
  appliedAt: timestamp("applied_at").notNull().defaultNow(), // Quando è stato applicato
});

// Pacchetti IQCode acquistati dalle strutture
export const purchasedPackages = pgTable("purchased_packages", {
  id: serial("id").primaryKey(),
  structureCode: text("structure_code").notNull(),
  packageSize: integer("package_size").notNull(), // 10, 25, 50, 100
  price: text("price").notNull(), // Storing as text for simplicity
  iqCodesRemaining: integer("iq_codes_remaining").notNull(),
  iqCodesUsed: integer("iq_codes_used").default(0),
  purchaseDate: timestamp("purchase_date").defaultNow(),
  paymentMethod: text("payment_method").default("sumup"),
  paymentStatus: text("payment_status").default("completed"), // pending, completed, failed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Movimenti contabili mini gestionale
export const accountingMovements = pgTable("accounting_movements", {
  id: serial("id").primaryKey(),
  structureCode: text("structure_code").notNull(),
  type: text("type").notNull(), // "income" o "expense"
  category: text("category").notNull(), // categoria settore turistico
  description: text("description").notNull(),
  amount: text("amount").notNull(), // Storing as text for simplicity
  movementDate: text("movement_date").notNull(), // YYYY-MM-DD format
  paymentMethod: text("payment_method"), // contanti, carta, bonifico
  clientsServed: integer("clients_served"), // numero clienti per questo movimento
  iqcodesUsed: integer("iqcodes_used"), // IQCode utilizzati per questo servizio
  notes: text("notes"), // note aggiuntive
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Configurazioni struttura (per gestionale trial 48h)
export const structureSettings = pgTable("structure_settings", {
  id: serial("id").primaryKey(),
  structureCode: text("structure_code").notNull().unique(),
  gestionaleUnlockedAt: timestamp("gestionale_unlocked_at").defaultNow(), // Quando è stato sbloccato
  firstPackagePurchase: timestamp("first_package_purchase"), // Prima volta che compra
  isGestionaleBlocked: boolean("is_gestionale_blocked").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tabella per tracciare il risparmio totale generato dai codici temporanei di ogni struttura
export const structureGuestSavings = pgTable("structure_guest_savings", {
  id: serial("id").primaryKey(),
  structureCode: text("structure_code").notNull(), // Codice della struttura che ha generato il codice temporaneo
  temporaryCode: text("temporary_code").notNull(), // Codice temporaneo generato (TIQ-IT-PRIMOACCESSO-XXXXX)
  permanentCode: text("permanent_code"), // Codice definitivo attivato dal turista
  touristIqCode: text("tourist_iq_code"), // IQCode definitivo del turista
  totalSavingsGenerated: decimal("total_savings_generated", { precision: 10, scale: 2 }).default("0.00"), // Totale risparmi generati
  discountApplicationsCount: integer("discount_applications_count").default(0), // Numero di applicazioni sconti
  temporaryCodeGeneratedAt: timestamp("temporary_code_generated_at").notNull(), // Quando è stato generato il codice temporaneo
  permanentCodeActivatedAt: timestamp("permanent_code_activated_at"), // Quando è stato attivato il codice definitivo
  lastSavingUpdatedAt: timestamp("last_saving_updated_at"), // Ultimo aggiornamento risparmio
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});



// Sistema ricarica utilizzi per turisti
export const iqcodeRecharges = pgTable("iqcode_recharges", {
  id: serial("id").primaryKey(),
  validationId: integer("validation_id").notNull(), // ID della validazione da ricaricare
  touristIqCode: text("tourist_iq_code").notNull(), // Codice turista
  status: text("status").notNull().default("payment_pending"), // payment_pending, paid_confirmed, activated
  sumupPaymentId: text("sumup_payment_id"), // ID pagamento SumUp se disponibile
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  confirmedAt: timestamp("confirmed_at"), // Quando admin conferma pagamento
  activatedAt: timestamp("activated_at"), // Quando utilizzi vengono attivati
  adminNote: text("admin_note"), // Note admin su pagamento
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Impostazioni generali struttura con persistenza PostgreSQL
export const settingsConfig = pgTable("settings_config", {
  id: serial("id").primaryKey(),
  structureCode: text("structure_code").notNull().unique(),
  structureName: text("structure_name").notNull().default(""),
  ownerName: text("owner_name").notNull().default(""),
  contactEmail: text("contact_email").notNull().default(""),
  contactPhone: text("contact_phone").notNull().default(""),
  address: text("address").notNull().default(""),
  city: text("city").notNull().default(""),
  province: text("province").notNull().default(""),
  postalCode: text("postal_code").notNull().default(""),
  businessType: text("business_type").notNull().default("hotel"), // hotel, b&b, resort, etc.
  checkinTime: text("checkin_time").notNull().default("15:00"),
  checkoutTime: text("checkout_time").notNull().default("11:00"),
  maxGuestsPerRoom: integer("max_guests_per_room").notNull().default(4),
  welcomeMessage: text("welcome_message").notNull().default("Benvenuto nella nostra struttura!"),
  additionalServices: text("additional_services").notNull().default(""), // JSON string
  wifiPassword: text("wifi_password").notNull().default(""),
  emergencyContact: text("emergency_contact").notNull().default(""),
  taxRate: text("tax_rate").notNull().default("3.00"), // Tassa di soggiorno
  defaultCurrency: text("default_currency").notNull().default("EUR"),
  languagePreference: text("language_preference").notNull().default("it"),
  notificationPreferences: text("notification_preferences").notNull().default("{}"), // JSON string
  backupFrequency: text("backup_frequency").notNull().default("daily"),
  autoLogoutMinutes: integer("auto_logout_minutes").notNull().default(30),
  enableGuestPortal: boolean("enable_guest_portal").notNull().default(true),
  enableWhatsappIntegration: boolean("enable_whatsapp_integration").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tabella per il completamento onboarding partner
export const partnerOnboarding = pgTable("partner_onboarding", {
  id: serial("id").primaryKey(),
  partnerCode: text("partner_code").notNull().unique(), // Codice IQ del partner
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  businessInfo: boolean("business_info_completed").notNull().default(false),
  accessibilityInfo: boolean("accessibility_info_completed").notNull().default(false),
  allergyInfo: boolean("allergy_info_completed").notNull().default(false),
  familyInfo: boolean("family_info_completed").notNull().default(false),
  specialtyInfo: boolean("specialty_info_completed").notNull().default(false),
  servicesInfo: boolean("services_info_completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tabella per informazioni dettagliate partner per TIQai
export const partnerDetails = pgTable("partner_details", {
  id: serial("id").primaryKey(),
  partnerCode: text("partner_code").notNull().unique(),
  
  // Informazioni Business Base
  businessName: text("business_name").notNull(),
  businessType: text("business_type").notNull(), // ristorante, hotel, attrazione, negozio, etc.
  description: text("description").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  province: text("province").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  website: text("website"),
  
  // Orari di apertura
  openingHours: text("opening_hours").notNull(), // JSON string con orari settimanali
  seasonalHours: text("seasonal_hours"), // JSON per orari stagionali
  
  // Accessibilità
  wheelchairAccessible: boolean("wheelchair_accessible").notNull().default(false),
  rampWidth: text("ramp_width"), // Larghezza rampa in cm
  rampSlope: text("ramp_slope"), // Pendenza rampa
  elevatorAccess: boolean("elevator_access").notNull().default(false),
  accessibleBathroom: boolean("accessible_bathroom").notNull().default(false),
  parkingSpaces: integer("parking_spaces").default(0),
  accessibleParking: integer("accessible_parking").default(0),
  assistanceAvailable: boolean("assistance_available").notNull().default(false),
  accessibilityNotes: text("accessibility_notes"),
  
  // Allergie e intolleranze
  glutenFree: boolean("gluten_free").notNull().default(false),
  glutenFreeKitchen: boolean("gluten_free_kitchen").notNull().default(false), // Cucina separata
  dairyFree: boolean("dairy_free").notNull().default(false),
  nutFree: boolean("nut_free").notNull().default(false),
  vegetarianOptions: boolean("vegetarian_options").notNull().default(false),
  veganOptions: boolean("vegan_options").notNull().default(false),
  halalCertified: boolean("halal_certified").notNull().default(false),
  kosherCertified: boolean("kosher_certified").notNull().default(false),
  allergyTraining: boolean("allergy_training").notNull().default(false), // Staff formato
  allergyMenu: boolean("allergy_menu").notNull().default(false), // Menu specifico
  allergyNotes: text("allergy_notes"),
  
  // Famiglia e bambini
  childFriendly: boolean("child_friendly").notNull().default(false),
  highChairs: boolean("high_chairs").notNull().default(false),
  kidsMenu: boolean("kids_menu").notNull().default(false),
  changingTable: boolean("changing_table").notNull().default(false),
  playArea: boolean("play_area").notNull().default(false),
  babyFriendly: boolean("baby_friendly").notNull().default(false), // 0-2 anni
  toddlerFriendly: boolean("toddler_friendly").notNull().default(false), // 2-5 anni
  childFriendly6plus: boolean("child_friendly_6plus").notNull().default(false), // 6+ anni
  teenFriendly: boolean("teen_friendly").notNull().default(false), // 13+ anni
  familyPackages: boolean("family_packages").notNull().default(false),
  babysittingService: boolean("babysitting_service").notNull().default(false),
  familyNotes: text("family_notes"),
  
  // Specialità uniche
  uniqueSpecialties: text("unique_specialties"), // JSON array di specialità uniche
  localTraditions: text("local_traditions"), // Tradizioni locali offerte
  experienceTypes: text("experience_types"), // JSON array tipologie esperienza
  skillLevels: text("skill_levels"), // JSON array livelli difficoltà
  equipmentProvided: text("equipment_provided"), // JSON array attrezzature fornite
  languagesSpoken: text("languages_spoken"), // JSON array lingue parlate
  certifications: text("certifications"), // JSON array certificazioni
  awards: text("awards"), // JSON array premi/riconoscimenti
  
  // Servizi aggiuntivi
  wifiAvailable: boolean("wifi_available").notNull().default(false),
  petsAllowed: boolean("pets_allowed").notNull().default(false),
  smokingAllowed: boolean("smoking_allowed").notNull().default(false),
  creditCardsAccepted: boolean("credit_cards_accepted").notNull().default(false),
  deliveryService: boolean("delivery_service").notNull().default(false),
  takeawayService: boolean("takeaway_service").notNull().default(false),
  reservationsRequired: boolean("reservations_required").notNull().default(false),
  groupBookings: boolean("group_bookings").notNull().default(false),
  privateEvents: boolean("private_events").notNull().default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Tabella per i codici temporanei single-use (SENZA SCADENZA)
export const temporaryCodes = pgTable("temporary_codes", {
  id: serial("id").primaryKey(),
  tempCode: varchar("temp_code", { length: 35 }).unique().notNull(), // Esteso per "IQCODE-PRIMOACCESSO-12345"
  structureCode: varchar("structure_code", { length: 20 }).notNull(),
  guestName: varchar("guest_name", { length: 100 }),
  guestPhone: varchar("guest_phone", { length: 20 }),
  // expiresAt: timestamp("expires_at").notNull(), // RIMOSSO: Codici senza scadenza
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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

export const insertPartnerOnboardingSchema = createInsertSchema(partnerOnboarding).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPartnerDetailsSchema = createInsertSchema(partnerDetails).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminCreditsSchema = createInsertSchema(adminCredits).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPurchasedPackageSchema = createInsertSchema(purchasedPackages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAccountingMovementSchema = createInsertSchema(accountingMovements).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStructureSettingsSchema = createInsertSchema(structureSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStructureGuestSavingsSchema = createInsertSchema(structureGuestSavings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSettingsConfigSchema = createInsertSchema(settingsConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAvailableIqCodeSchema = createInsertSchema(availableIqCodes).omit({
  id: true,
  createdAt: true,
});



export const insertIqcodeRechargeSchema = createInsertSchema(iqcodeRecharges).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Tabella per il sistema di recupero "Custode del Codice IQ"
export const iqcodeRecoveryKeys = pgTable("iqcode_recovery_keys", {
  id: serial("id").primaryKey(),
  hashedIqCode: text("hashed_iqcode").notNull(), // Hash del codice IQ del turista
  hashedSecretWord: text("hashed_secret_word").notNull(), // Hash della parola segreta
  hashedBirthDate: text("hashed_birth_date").notNull(), // Hash della data di nascita
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const insertIqcodeRecoveryKeySchema = createInsertSchema(iqcodeRecoveryKeys).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTemporaryCodeSchema = createInsertSchema(temporaryCodes).omit({
  id: true,
  createdAt: true,
});

export const loginSchema = z.object({
  iqCode: z.string().min(1, "Codice IQ richiesto").max(100),
});

export type IqCode = typeof iqCodes.$inferSelect;
export type InsertIqCode = z.infer<typeof insertIqCodeSchema>;
export type Session = typeof sessions.$inferSelect;

export type IqcodeRecharge = typeof iqcodeRecharges.$inferSelect;
export type InsertIqcodeRecharge = z.infer<typeof insertIqcodeRechargeSchema>;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type AssignedPackage = typeof assignedPackages.$inferSelect;
export type InsertAssignedPackage = z.infer<typeof insertAssignedPackageSchema>;
export type GeneratedEmotionalCode = typeof generatedEmotionalCodes.$inferSelect;
export type InsertGeneratedEmotionalCode = z.infer<typeof insertGeneratedEmotionalCodeSchema>;
export type AvailableIqCode = typeof availableIqCodes.$inferSelect;
export type InsertAvailableIqCode = z.infer<typeof insertAvailableIqCodeSchema>;
export type Guest = typeof guests.$inferSelect;
export type InsertGuest = typeof guests.$inferInsert;
export type AdminCredits = typeof adminCredits.$inferSelect;
export type InsertAdminCredits = z.infer<typeof insertAdminCreditsSchema>;

export type PurchasedPackage = typeof purchasedPackages.$inferSelect;
export type InsertPurchasedPackage = z.infer<typeof insertPurchasedPackageSchema>;

export type AccountingMovement = typeof accountingMovements.$inferSelect;
export type InsertAccountingMovement = z.infer<typeof insertAccountingMovementSchema>;

export type StructureSettings = typeof structureSettings.$inferSelect;
export type InsertStructureSettings = z.infer<typeof insertStructureSettingsSchema>;

export type StructureGuestSavings = typeof structureGuestSavings.$inferSelect;
export type InsertStructureGuestSavings = z.infer<typeof insertStructureGuestSavingsSchema>;

export type SettingsConfig = typeof settingsConfig.$inferSelect;
export type InsertSettingsConfig = z.infer<typeof insertSettingsConfigSchema>;

export type IqcodeRecoveryKey = typeof iqcodeRecoveryKeys.$inferSelect;
export type InsertIqcodeRecoveryKey = z.infer<typeof insertIqcodeRecoveryKeySchema>;

export type TemporaryCode = typeof temporaryCodes.$inferSelect;
export type InsertTemporaryCode = z.infer<typeof insertTemporaryCodeSchema>;

export type LoginRequest = z.infer<typeof loginSchema>;

export type UserRole = 'admin' | 'tourist' | 'structure' | 'partner';

// Tabella offerte reali dei partner
export const realOffers = pgTable('real_offers', {
  id: serial('id').primaryKey(),
  partnerCode: text('partner_code').notNull(),
  partnerName: text('partner_name').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  discountPercentage: integer('discount_percentage').notNull(),
  discountType: text('discount_type').default('percentage'), // percentage, fixed_amount
  category: text('category').notNull(), // ristorante, boutique, attrazione, etc
  location: text('location'), // per targeting geografico
  city: text('city'), // Comune italiano specifico
  province: text('province'), // Sigla provincia (VV, RC, CS, etc)
  latitude: text('latitude'), // Coordinate GPS per geolocalizzazione  
  longitude: text('longitude'), // Coordinate GPS per geolocalizzazione
  isActive: boolean('is_active').default(true),
  validFrom: timestamp('valid_from'),
  validUntil: timestamp('valid_until'),
  maxUses: integer('max_uses'),
  currentUses: integer('current_uses').default(0),
  targetAudience: text('target_audience'), // tutti, famiglie, coppie, etc
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Tabella per offerte create dai partner
export const partnerOffers = pgTable("partner_offers", {
  id: serial("id").primaryKey(),
  partnerCode: text("partner_code").notNull(),
  title: text("title").notNull(),
  description: text("description").default(""),
  discount: text("discount").notNull(), // Percentuale o valore sconto
  validUntil: text("valid_until").default(""),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRealOfferSchema = createInsertSchema(realOffers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  currentUses: true
});

export const insertPartnerOfferSchema = createInsertSchema(partnerOffers).omit({
  id: true,
  createdAt: true
});

export const insertTouristSavingsSchema = createInsertSchema(touristSavings).omit({
  id: true,
  appliedAt: true
});

export const insertPartnerDiscountApplicationSchema = createInsertSchema(partnerDiscountApplications).omit({
  id: true,
  appliedAt: true
});

export type RealOffer = typeof realOffers.$inferSelect;
export type InsertRealOffer = z.infer<typeof insertRealOfferSchema>;
export type PartnerOffer = typeof partnerOffers.$inferSelect;
export type InsertPartnerOffer = z.infer<typeof insertPartnerOfferSchema>;

export const insertOneTimeCodeSchema = createInsertSchema(oneTimeCodes).omit({
  id: true,
  createdAt: true,
});

export type OneTimeCode = typeof oneTimeCodes.$inferSelect;
export type InsertOneTimeCode = z.infer<typeof insertOneTimeCodeSchema>;

export type TouristSavings = typeof touristSavings.$inferSelect;
export type InsertTouristSavings = z.infer<typeof insertTouristSavingsSchema>;

export type PartnerDiscountApplication = typeof partnerDiscountApplications.$inferSelect;
export type InsertPartnerDiscountApplication = z.infer<typeof insertPartnerDiscountApplicationSchema>;

// Tabella per i feedback turista-partner
export const partnerFeedback = pgTable('partner_feedback', {
  id: serial('id').primaryKey(),
  touristIqCode: text('tourist_iq_code').notNull(),
  partnerCode: text('partner_code').notNull(),
  otcCode: text('otc_code').notNull(), // Codice TIQ-OTC utilizzato
  rating: text('rating').notNull(), // 'positive' o 'negative'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  notes: text('notes'), // Note opzionali del turista
});

// Tabella per il rating aggregato dei partner
export const partnerRatings = pgTable('partner_ratings', {
  id: serial('id').primaryKey(),
  partnerCode: text('partner_code').notNull().unique(),
  totalFeedbacks: integer('total_feedbacks').notNull().default(0),
  positiveFeedbacks: integer('positive_feedbacks').notNull().default(0),
  negativeFeedbacks: integer('negative_feedbacks').notNull().default(0),
  currentRating: decimal('current_rating', { precision: 5, scale: 2 }).notNull().default('0.00'), // Percentuale
  lastUpdated: timestamp('last_updated').notNull().defaultNow(),
  warningLevel: integer('warning_level').notNull().default(0), // 0=ok, 1=70%, 2=60%, 3=50%, 4=40%
  isExcluded: boolean('is_excluded').notNull().default(false),
  excludedAt: timestamp('excluded_at'),
  excludedBy: text('excluded_by'), // admin che ha escluso
});

// Schema per inserimento feedback
export const insertPartnerFeedbackSchema = createInsertSchema(partnerFeedback).omit({
  id: true,
  createdAt: true
});

// Schema per inserimento rating
export const insertPartnerRatingSchema = createInsertSchema(partnerRatings).omit({
  id: true,
  lastUpdated: true,
  excludedAt: true
});

// Tipi TypeScript
export type PartnerFeedback = typeof partnerFeedback.$inferSelect;
export type InsertPartnerFeedback = z.infer<typeof insertPartnerFeedbackSchema>;
export type PartnerRating = typeof partnerRatings.$inferSelect;
export type InsertPartnerRating = z.infer<typeof insertPartnerRatingSchema>;
