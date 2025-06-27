import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema } from "@shared/schema";
import { nanoid } from "nanoid";
import { chatWithTIQai } from "./openai";
import { createIQCode } from "./createIQCode";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { iqCode } = loginSchema.parse(req.body);
      
      const iqCodeRecord = await storage.getIqCodeByCode(iqCode.toUpperCase());
      
      if (!iqCodeRecord) {
        return res.status(401).json({ message: "Codice IQ non valido" });
      }

      if (!iqCodeRecord.isActive) {
        return res.status(401).json({ message: "Codice IQ disattivato" });
      }

      // CONTROLLO STATO APPROVAZIONE PER STRUTTURE E PARTNER
      if ((iqCodeRecord.role === 'structure' || iqCodeRecord.role === 'partner') && iqCodeRecord.status !== 'approved') {
        let statusMessage = '';
        switch (iqCodeRecord.status) {
          case 'pending':
            statusMessage = 'Il tuo account è in attesa di approvazione. Contatta l\'amministratore.';
            break;
          case 'blocked':
            statusMessage = 'Il tuo account è stato bloccato. Contatta l\'amministratore.';
            break;
          case 'inactive':
            statusMessage = 'Il tuo account è stato disattivato. Contatta l\'amministratore.';
            break;
          default:
            statusMessage = 'Accesso non autorizzato. Contatta l\'amministratore.';
        }
        
        return res.status(403).json({ 
          success: false, 
          message: statusMessage
        });
      }

      // Create session
      const sessionToken = nanoid();
      await storage.createSession({
        iqCode: iqCode.toUpperCase(),
        role: iqCodeRecord.role,
        sessionToken,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      res.cookie('session_token', sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      });

      res.json({ 
        success: true, 
        role: iqCodeRecord.role, 
        iqCode: iqCode.toUpperCase() 
      });
    } catch (error) {
      console.error("Errore login:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Get current user
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

      res.json({ role: session.role, iqCode: session.iqCode });
    } catch (error) {
      console.error("Errore verifica sessione:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Logout
  app.post("/api/auth/logout", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (sessionToken) {
        await storage.deleteSession(sessionToken);
      }
      res.clearCookie('session_token');
      res.json({ success: true });
    } catch (error) {
      console.error("Errore logout:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session || session.role !== 'admin') {
        return res.status(403).json({ message: "Accesso negato" });
      }

      const allCodes = await storage.getAllIqCodes();
      const stats = {
        totalUsers: allCodes.filter(code => !code.isDeleted).length,
        activeUsers: allCodes.filter(code => code.isActive && !code.isDeleted).length,
        totalAdmins: allCodes.filter(code => code.role === 'admin' && !code.isDeleted).length,
        totalTourists: allCodes.filter(code => code.role === 'tourist' && !code.isDeleted).length,
        totalStructures: allCodes.filter(code => code.role === 'structure' && !code.isDeleted).length,
        totalPartners: allCodes.filter(code => code.role === 'partner' && !code.isDeleted).length,
        pendingApprovals: allCodes.filter(code => code.status === 'pending' && !code.isDeleted).length,
        blockedUsers: allCodes.filter(code => code.status === 'blocked' && !code.isDeleted).length
      };

      res.json(stats);
    } catch (error) {
      console.error("Errore ottenimento statistiche:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Chat with TIQai
  app.post("/api/chat/tiqai", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ message: "Messaggio richiesto" });
      }

      const response = await chatWithTIQai(message);
      res.json({ response });
    } catch (error) {
      console.error("Errore chat TIQai:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Clean expired sessions periodically
  setInterval(async () => {
    await storage.cleanExpiredSessions();
  }, 60000); // Clean every minute

  const server = createServer(app);
  return server;
}