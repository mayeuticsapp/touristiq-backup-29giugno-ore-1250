import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const iqCodes = pgTable("iq_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  role: text("role").notNull(), // 'admin', 'tourist', 'structure', 'partner'
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  assignedTo: text("assigned_to"), // Nome persona/azienda
  location: text("location"), // IT, VV, RC, etc.
  codeType: text("code_type"), // emotional, professional
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
  packageSize: integer("package_size").notNull(), // 25, 50, 75, 100
  status: text("status").notNull().default("available"), // available, used, expired
  assignedBy: text("assigned_by").notNull(), // Codice IQ admin che ha assegnato
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  codesGenerated: text("codes_generated").array(), // Array dei codici IQ generati
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

export const loginSchema = z.object({
  iqCode: z.string().min(1, "Codice IQ richiesto").max(20),
});

export type IqCode = typeof iqCodes.$inferSelect;
export type InsertIqCode = z.infer<typeof insertIqCodeSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type AssignedPackage = typeof assignedPackages.$inferSelect;
export type InsertAssignedPackage = z.infer<typeof insertAssignedPackageSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;

export type UserRole = 'admin' | 'tourist' | 'structure' | 'partner';
