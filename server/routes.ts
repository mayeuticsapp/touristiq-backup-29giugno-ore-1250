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

  // =================== PARTNER DASHBOARD AVANZATA API ===================

  // 1. GESTIONE PROMOZIONI PARTNER
  app.get("/api/partner/promotions", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session) {
        return res.status(401).json({ message: "Sessione non valida" });
      }

      const userIqCode = await storage.getIqCodeByCode(session.iqCode);
      if (!userIqCode || userIqCode.role !== 'partner') {
        return res.status(403).json({ message: "Accesso negato - solo partner" });
      }

      const promotions = await storage.getPartnerPromotions(userIqCode.code);
      res.json({ promotions });
    } catch (error) {
      console.error("Errore ottenimento promozioni:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  app.post("/api/partner/promotions", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session) {
        return res.status(401).json({ message: "Sessione non valida" });
      }

      const userIqCode = await storage.getIqCodeByCode(session.iqCode);
      if (!userIqCode || userIqCode.role !== 'partner') {
        return res.status(403).json({ message: "Accesso negato - solo partner" });
      }

      const { title, description, discountType, discountValue, requiresConnection, expiresAt } = req.body;

      const promotion = await storage.createPartnerPromotion({
        partnerCode: userIqCode.code,
        title,
        description,
        discountType,
        discountValue,
        requiresConnection: requiresConnection || false,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: true
      });

      res.json({ success: true, promotion });
    } catch (error) {
      console.error("Errore creazione promozione:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // 2. GESTIONE COLLEGAMENTI TURISTI
  app.get("/api/partner/connections", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session) {
        return res.status(401).json({ message: "Sessione non valida" });
      }

      const userIqCode = await storage.getIqCodeByCode(session.iqCode);
      if (!userIqCode || userIqCode.role !== 'partner') {
        return res.status(403).json({ message: "Accesso negato - solo partner" });
      }

      const connections = await storage.getPartnerConnections(userIqCode.code);
      res.json({ connections });
    } catch (error) {
      console.error("Errore ottenimento collegamenti:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  app.post("/api/partner/assign-multiple-tourists", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session) {
        return res.status(401).json({ message: "Sessione non valida" });
      }

      const userIqCode = await storage.getIqCodeByCode(session.iqCode);
      if (!userIqCode || userIqCode.role !== 'partner') {
        return res.status(403).json({ message: "Accesso negato - solo partner" });
      }

      const { touristCodes } = req.body;
      if (!Array.isArray(touristCodes) || touristCodes.length === 0) {
        return res.status(400).json({ message: "Lista codici turista richiesta" });
      }

      const connections = await storage.assignMultipleTourists(userIqCode.code, touristCodes);
      res.json({ success: true, connections, assigned: connections.length });
    } catch (error) {
      console.error("Errore assegnazione multipla:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // 3. ANALYTICS E STATISTICHE AVANZATE
  app.get("/api/partner/analytics", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session) {
        return res.status(401).json({ message: "Sessione non valida" });
      }

      const userIqCode = await storage.getIqCodeByCode(session.iqCode);
      if (!userIqCode || userIqCode.role !== 'partner') {
        return res.status(403).json({ message: "Accesso negato - solo partner" });
      }

      const analytics = await storage.getPartnerAnalytics(userIqCode.code);
      res.json({ analytics });
    } catch (error) {
      console.error("Errore ottenimento analytics:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // 4. COMUNICAZIONI ADMIN
  app.get("/api/partner/communications", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session) {
        return res.status(401).json({ message: "Sessione non valida" });
      }

      const userIqCode = await storage.getIqCodeByCode(session.iqCode);
      if (!userIqCode || userIqCode.role !== 'partner') {
        return res.status(403).json({ message: "Accesso negato - solo partner" });
      }

      const communications = await storage.getPartnerCommunications(userIqCode.code);
      const unreadCount = await storage.getUnreadCommunicationsCount(userIqCode.code);
      
      res.json({ communications, unreadCount });
    } catch (error) {
      console.error("Errore ottenimento comunicazioni:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // 5. RICHIESTE CREDITI
  app.get("/api/partner/credit-requests", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session) {
        return res.status(401).json({ message: "Sessione non valida" });
      }

      const userIqCode = await storage.getIqCodeByCode(session.iqCode);
      if (!userIqCode || userIqCode.role !== 'partner') {
        return res.status(403).json({ message: "Accesso negato - solo partner" });
      }

      const requests = await storage.getPartnerCreditRequests(userIqCode.code);
      res.json({ requests });
    } catch (error) {
      console.error("Errore ottenimento richieste crediti:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  app.post("/api/partner/credit-requests", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session) {
        return res.status(401).json({ message: "Sessione non valida" });
      }

      const userIqCode = await storage.getIqCodeByCode(session.iqCode);
      if (!userIqCode || userIqCode.role !== 'partner') {
        return res.status(403).json({ message: "Accesso negato - solo partner" });
      }

      const { requestedAmount, justification } = req.body;
      if (!requestedAmount || !justification) {
        return res.status(400).json({ message: "Importo e giustificazione richiesti" });
      }

      const request = await storage.createCreditRequest({
        partnerCode: userIqCode.code,
        requestedAmount,
        justification
      });

      res.json({ success: true, request });
    } catch (error) {
      console.error("Errore creazione richiesta crediti:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // 6. EXPORT DATI PARTNER
  app.get("/api/partner/export", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session) {
        return res.status(401).json({ message: "Sessione non valida" });
      }

      const userIqCode = await storage.getIqCodeByCode(session.iqCode);
      if (!userIqCode || userIqCode.role !== 'partner') {
        return res.status(403).json({ message: "Accesso negato - solo partner" });
      }

      const exportData = await storage.exportPartnerData(userIqCode.code);
      
      // Format CSV data for connections
      const csvConnections = exportData.connections.map(conn => ({
        TuristaCode: conn.touristCode,
        Stato: conn.connectionStatus,
        DataCollegamento: new Date(conn.connectedAt).toLocaleDateString('it-IT'),
        UltimaInterazione: new Date(conn.lastInteraction).toLocaleDateString('it-IT'),
        TotaleVisite: conn.totalVisits,
        PromozioniUsate: conn.promotionsUsed,
        ValoreTotale: (conn.totalValue / 100).toFixed(2) + '€',
        Note: conn.notes || ''
      }));

      res.json({ 
        success: true, 
        data: exportData,
        csvConnections,
        summary: {
          totalConnections: exportData.connections.length,
          activeConnections: exportData.connections.filter(c => c.isActive).length,
          totalPromotions: exportData.promotions.length,
          activePromotions: exportData.promotions.filter(p => p.isActive).length
        }
      });
    } catch (error) {
      console.error("Errore export dati:", error);
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