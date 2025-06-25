import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema } from "@shared/schema";
import { nanoid } from "nanoid";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { iqCode } = loginSchema.parse(req.body);
      
      const iqCodeRecord = await storage.getIqCodeByCode(iqCode.toUpperCase());
      
      if (!iqCodeRecord) {
        return res.status(401).json({ message: "Codice IQ non valido" });
      }

      // Create session
      const sessionToken = nanoid();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour session

      const session = await storage.createSession({
        iqCode: iqCodeRecord.code,
        role: iqCodeRecord.role,
        sessionToken,
        expiresAt,
      });

      // Set session cookie
      res.cookie('session_token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: expiresAt,
      });

      res.json({
        success: true,
        role: iqCodeRecord.role,
        iqCode: iqCodeRecord.code,
      });
    } catch (error) {
      res.status(400).json({ message: "Richiesta non valida" });
    }
  });

  // Get current user from session
  app.get("/api/auth/me", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      
      if (!session) {
        return res.status(401).json({ message: "Sessione non valida" });
      }

      res.json({
        role: session.role,
        iqCode: session.iqCode,
      });
    } catch (error) {
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      
      if (sessionToken) {
        await storage.deleteSession(sessionToken);
      }

      res.clearCookie('session_token');
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Clean expired sessions periodically
  setInterval(async () => {
    await storage.cleanExpiredSessions();
  }, 60000); // Clean every minute

  const httpServer = createServer(app);
  return httpServer;
}
