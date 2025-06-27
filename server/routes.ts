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

  // Get packages assigned to current user
  app.get("/api/my-packages", async (req, res) => {
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
      if (!userIqCode) {
        return res.status(404).json({ message: "Codice IQ non trovato" });
      }

      // Get packages assigned to this user
      const assignedPackages = await storage.getPackagesByRecipient(userIqCode.code);

      res.json({
        packages: assignedPackages.map(pkg => ({
          id: pkg.id,
          packageSize: pkg.packageSize,
          status: pkg.status,
          assignedBy: pkg.assignedBy,
          assignedAt: pkg.assignedAt,
          creditsRemaining: pkg.creditsRemaining,
          creditsUsed: pkg.creditsUsed,
          availableCodes: pkg.creditsRemaining
        }))
      });
    } catch (error) {
      console.error("Errore recupero pacchetti:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // TIQai chat endpoint
  const chatSchema = z.object({
    message: z.string().min(1, "Messaggio richiesto").max(500, "Messaggio troppo lungo"),
  });

  app.post("/api/chat/tiqai", async (req, res) => {
    try {
      // Check if user is authenticated
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session) {
        return res.status(401).json({ message: "Sessione non valida" });
      }

      // Validate request
      const { message } = chatSchema.parse(req.body);
      
      // Get AI response
      const response = await chatWithTIQai(message);
      
      res.json({ response });
    } catch (error) {
      console.error("Errore chat TIQai:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Richiesta non valida" });
      }
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Generate IQ Code (Admin only)
  const generateCodeSchema = z.object({
    codeType: z.enum(["emotional", "professional"]),
    role: z.enum(["admin", "tourist", "structure", "partner"]),
    country: z.string().optional(),
    province: z.string().optional(),
    assignedTo: z.string().optional()
  });

  app.post("/api/genera-iqcode", async (req, res) => {
    try {
      // Check if user is authenticated and is admin
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session) {
        return res.status(401).json({ message: "Sessione non valida" });
      }

      const userIqCode = await storage.getIqCodeByCode(session.iqCode);
      if (!userIqCode || userIqCode.role !== 'admin') {
        return res.status(403).json({ message: "Accesso negato - solo admin" });
      }

      // Validate request
      const { codeType, role, country, province, assignedTo } = generateCodeSchema.parse(req.body);
      
      // Determine location based on code type
      const location = codeType === "emotional" ? country : province;
      if (!location) {
        return res.status(400).json({ 
          message: codeType === "emotional" ? "Paese richiesto per codici emozionali" : "Provincia richiesta per codici professionali" 
        });
      }

      // DISTINZIONE CRITICA: CODICI PROFESSIONALI vs EMOZIONALI
      if (codeType === "professional") {
        // CODICI PROFESSIONALI - SEMPRE DISPONIBILI (NON SCALANO CREDITI)
        const { createIQCode } = await import("./createIQCode");
        const result = await createIQCode(codeType, role, location, assignedTo || `Generato da ${userIqCode.code}`);
        // NON scala crediti per codici professionali
        res.json(result);
        return;
      }

      if (codeType === "emotional") {
        // CODICI EMOZIONALI - VERIFICO E SCALO PACCHETTO ROBS
        const adminCredits = await storage.getAdminCredits(userIqCode.code);
        if (adminCredits && adminCredits.creditsRemaining <= 0) {
          return res.status(400).json({ 
            message: "Hai finito i tuoi 1000 codici, oh Grande RobS 😅" 
          });
        }

        const { createIQCode } = await import("./createIQCode");
        const result = await createIQCode(codeType, role, location, assignedTo || `Generato da ${userIqCode.code}`);
        
        // Scala crediti SOLO per codici emozionali
        await storage.decrementAdminCredits(userIqCode.code);
        
        res.json(result);
        return;
      }

      res.status(400).json({ message: "Tipo di codice non riconosciuto" });
    } catch (error) {
      console.error("Errore generazione codice IQ:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Richiesta non valida" });
      }
      res.status(500).json({ 
        message: (error as Error).message || "Errore durante la generazione del codice" 
      });
    }
  });

  // TIQai Chat endpoint
  app.post("/api/tiqai/chat", async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ message: "Messaggio richiesto" });
      }

      const { chatWithTIQai } = await import("./openai");
      const response = await chatWithTIQai(message);
      
      res.json({ response });
    } catch (error) {
      console.error("Errore TIQai:", error);
      res.status(500).json({ 
        message: "Mi dispiace, non riesco a rispondere in questo momento. Riprova." 
      });
    }
  });

  // Structure specific data endpoint
  app.get('/api/structure/:id', async (req, res) => {
    try {
      const structureId = req.params.id;
      
      // Find structure by ID in any province
      const allCodes = await storage.getAllIqCodes();
      const structureCode = allCodes.find(code => 
        code.role === 'structure' && code.code.endsWith(`-${structureId}`)
      );
      
      if (!structureCode) {
        return res.status(404).json({ error: 'Struttura non trovata' });
      }
      
      // Generate unique data based on structure ID
      const structureData = generateStructureData(structureId, structureCode.code);
      res.json(structureData);
    } catch (error) {
      console.error('Errore recupero dati struttura:', error);
      res.status(500).json({ error: 'Errore interno server' });
    }
  });

  // Admin Users Management
  app.get("/api/admin/users", async (req, res) => {
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
      if (!userIqCode || userIqCode.role !== 'admin') {
        return res.status(403).json({ message: "Accesso negato - solo admin" });
      }

      const allCodes = await storage.getAllIqCodes();
      const users = allCodes
        .filter(code => !code.isDeleted) // Esclude utenti nel cestino
        .map(code => ({
          id: code.id,
          code: code.code,
          role: code.role,
          assignedTo: code.assignedTo,
          location: code.location,
          codeType: code.codeType,
          status: code.status,
          isActive: code.isActive,
          createdAt: code.createdAt,
          approvedAt: code.approvedAt,
          approvedBy: code.approvedBy,
          internalNote: code.internalNote
        }));

      res.json({ users });
    } catch (error) {
      console.error("Errore gestione utenti:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Admin IQ Codes Management
  app.get("/api/admin/iqcodes", async (req, res) => {
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
      if (!userIqCode || userIqCode.role !== 'admin') {
        return res.status(403).json({ message: "Accesso negato - solo admin" });
      }

      const allCodes = await storage.getAllIqCodes();
      res.json({ codes: allCodes });
    } catch (error) {
      console.error("Errore lista codici IQ:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Admin Statistics
  app.get("/api/admin/stats", async (req, res) => {
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
      if (!userIqCode || userIqCode.role !== 'admin') {
        return res.status(403).json({ message: "Accesso negato - solo admin" });
      }

      const allCodes = await storage.getAllIqCodes();
      const stats = {
        totalCodes: allCodes.length,
        activeUsers: allCodes.filter(c => c.isActive).length,
        byRole: {
          tourist: allCodes.filter(c => c.role === 'tourist').length,
          structure: allCodes.filter(c => c.role === 'structure').length,
          partner: allCodes.filter(c => c.role === 'partner').length,
          admin: allCodes.filter(c => c.role === 'admin').length
        },
        byType: {
          emotional: allCodes.filter(c => c.codeType === 'emotional').length,
          professional: allCodes.filter(c => c.codeType === 'professional').length
        }
      };

      res.json({ stats });
    } catch (error) {
      console.error("Errore statistiche:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Pacchetto RobS - Admin credits endpoint
  app.get('/api/admin/credits', async (req, res) => {
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
      if (!userIqCode || userIqCode.role !== 'admin') {
        return res.status(403).json({ message: "Accesso negato - solo admin" });
      }

      const adminCredits = await storage.getAdminCredits(userIqCode.code);
      const generationLog = await storage.getAdminGenerationLog(userIqCode.code);

      res.json({
        credits: adminCredits || { creditsRemaining: 1000, creditsUsed: 0 },
        generationLog: generationLog.slice(0, 10)
      });
    } catch (error) {
      console.error('Error fetching admin credits:', error);
      res.status(500).json({ message: 'Errore nel caricamento dei crediti' });
    }
  });

  // Admin User Management - Approve/Block/Delete
  app.patch("/api/admin/users/:id", async (req, res) => {
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
      if (!userIqCode || userIqCode.role !== 'admin') {
        return res.status(403).json({ message: "Accesso negato - solo admin" });
      }

      const userId = parseInt(req.params.id);
      const { action } = req.body; // approve, block, activate, deactivate

      if (!action || !['approve', 'block', 'activate', 'deactivate'].includes(action)) {
        return res.status(400).json({ message: "Azione non valida" });
      }

      let newStatus = 'pending';
      switch (action) {
        case 'approve':
          newStatus = 'approved';
          break;
        case 'block':
          newStatus = 'blocked';
          break;
        case 'activate':
          newStatus = 'approved';
          break;
        case 'deactivate':
          newStatus = 'inactive';
          break;
      }

      const updatedUser = await storage.updateIqCodeStatus(userId, newStatus, userIqCode.code);
      res.json({ success: true, user: updatedUser });

    } catch (error) {
      console.error('Error updating user status:', error);
      res.status(500).json({ message: 'Errore nell\'aggiornamento dello stato utente' });
    }
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
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
      if (!userIqCode || userIqCode.role !== 'admin') {
        return res.status(403).json({ message: "Accesso negato - solo admin" });
      }

      const userId = parseInt(req.params.id);
      
      // Non permettere cancellazione dell'admin stesso
      const targetUser = await storage.getAllIqCodes().then(codes => codes.find(c => c.id === userId));
      if (targetUser && targetUser.code === userIqCode.code) {
        return res.status(400).json({ message: "Non puoi cancellare il tuo stesso account" });
      }

      await storage.deleteIqCode(userId);
      res.json({ success: true, message: "Utente cancellato con successo" });

    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Errore nella cancellazione dell\'utente' });
    }
  });

  // Admin Settings
  app.get("/api/admin/settings", async (req, res) => {
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
      if (!userIqCode || userIqCode.role !== 'admin') {
        return res.status(403).json({ message: "Accesso negato - solo admin" });
      }

      const settings = {
        platformName: "TouristIQ",
        supportEmail: "support@touristiq.com",
        welcomeMessage: "Benvenuto nella piattaforma TouristIQ",
        maxCodesPerDay: 100
      };

      res.json({ settings });
    } catch (error) {
      console.error("Errore impostazioni:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Admin endpoint per aggiornare note interne utente
  app.patch("/api/admin/users/:id/note", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session || session.role !== 'admin') {
        return res.status(403).json({ message: "Accesso negato - solo admin" });
      }

      const userId = parseInt(req.params.id);
      const { note } = req.body;

      if (typeof note !== 'string') {
        return res.status(400).json({ message: "Nota deve essere una stringa" });
      }

      const updatedUser = await storage.updateIqCodeNote(userId, note);
      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error("Errore aggiornamento nota:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Admin endpoint per cestino temporaneo
  app.get("/api/admin/trash", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session || session.role !== 'admin') {
        return res.status(403).json({ message: "Accesso negato - solo admin" });
      }

      const deletedUsers = await storage.getDeletedIqCodes();
      const users = deletedUsers.map(user => ({
        id: user.id,
        code: user.code,
        role: user.role,
        assignedTo: user.assignedTo,
        location: user.location,
        codeType: user.codeType,
        status: user.status,
        deletedAt: user.deletedAt,
        internalNote: user.internalNote
      }));

      res.json({ users });
    } catch (error) {
      console.error("Errore recupero cestino:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Admin endpoint per spostare utente nel cestino
  app.patch("/api/admin/users/:id/trash", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session || session.role !== 'admin') {
        return res.status(403).json({ message: "Accesso negato - solo admin" });
      }

      const userId = parseInt(req.params.id);
      
      // Protezione: admin non può cancellare se stesso
      const userToDelete = await storage.getIqCodeByCode(session.iqCode);
      if (userToDelete && userToDelete.id === userId) {
        return res.status(400).json({ message: "Non puoi cancellare il tuo stesso account" });
      }

      const deletedUser = await storage.softDeleteIqCode(userId, session.iqCode);
      res.json({ success: true, user: deletedUser });
    } catch (error) {
      console.error("Errore spostamento cestino:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Admin endpoint per ripristinare utente dal cestino
  app.patch("/api/admin/users/:id/restore", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session || session.role !== 'admin') {
        return res.status(403).json({ message: "Accesso negato - solo admin" });
      }

      const userId = parseInt(req.params.id);
      const restoredUser = await storage.restoreIqCode(userId);
      res.json({ success: true, user: restoredUser });
    } catch (error) {
      console.error("Errore ripristino utente:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Admin endpoint per reportistica strategica IQCode
  app.get("/api/admin/reports", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session || session.role !== 'admin') {
        return res.status(403).json({ message: "Accesso negato - solo admin" });
      }

      const allCodes = await storage.getAllIqCodes();
      const activeCodes = allCodes.filter(code => !code.isDeleted && code.isActive);

      // Analisi per tipologia
      const professionalCodes = activeCodes.filter(code => code.codeType === 'professional');
      const emotionalCodes = activeCodes.filter(code => code.codeType === 'emotional');

      // Analisi per ruolo
      const roleStats = {
        admin: activeCodes.filter(code => code.role === 'admin').length,
        tourist: activeCodes.filter(code => code.role === 'tourist').length,
        structure: activeCodes.filter(code => code.role === 'structure').length,
        partner: activeCodes.filter(code => code.role === 'partner').length
      };

      // Analisi per location
      const locationStats: { [key: string]: number } = {};
      activeCodes.forEach(code => {
        if (code.location) {
          locationStats[code.location] = (locationStats[code.location] || 0) + 1;
        }
      });

      // Analisi per status
      const statusStats = {
        pending: activeCodes.filter(code => code.status === 'pending').length,
        approved: activeCodes.filter(code => code.status === 'approved').length,
        blocked: activeCodes.filter(code => code.status === 'blocked').length
      };

      // Top strutture/partner per attivazioni
      const topStructures = activeCodes
        .filter(code => code.role === 'structure' && code.assignedTo)
        .reduce((acc: { [key: string]: number }, code) => {
          const name = code.assignedTo!;
          acc[name] = (acc[name] || 0) + 1;
          return acc;
        }, {});

      const topPartners = activeCodes
        .filter(code => code.role === 'partner' && code.assignedTo)
        .reduce((acc: { [key: string]: number }, code) => {
          const name = code.assignedTo!;
          acc[name] = (acc[name] || 0) + 1;
          return acc;
        }, {});

      // Crescita per mese
      const growthByMonth: { [key: string]: number } = {};
      activeCodes.forEach(code => {
        const month = code.createdAt.toISOString().substring(0, 7); // YYYY-MM
        growthByMonth[month] = (growthByMonth[month] || 0) + 1;
      });

      const reportData = {
        overview: {
          totalActiveCodes: activeCodes.length,
          professionalCodes: professionalCodes.length,
          emotionalCodes: emotionalCodes.length,
          pendingApproval: statusStats.pending,
          approvedCodes: statusStats.approved,
          blockedCodes: statusStats.blocked
        },
        roleDistribution: roleStats,
        locationDistribution: locationStats,
        topStructures: Object.entries(topStructures)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([name, count]) => ({ name, count })),
        topPartners: Object.entries(topPartners)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([name, count]) => ({ name, count })),
        growthByMonth: Object.entries(growthByMonth)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([month, count]) => ({ month, count })),
        lastUpdated: new Date().toISOString()
      };

      res.json(reportData);
    } catch (error) {
      console.error("Errore generazione report:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Admin Assign IQCode Packages
  app.post("/api/admin/assign-iqcodes", async (req, res) => {
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
      if (!userIqCode || userIqCode.role !== 'admin') {
        return res.status(403).json({ message: "Accesso negato - solo admin" });
      }

      const { targetType, targetId, packageSize } = req.body;

      // Validate input
      if (!targetType || !targetId || !packageSize) {
        return res.status(400).json({ message: "Parametri mancanti" });
      }

      if (!['structure', 'partner'].includes(targetType)) {
        return res.status(400).json({ message: "Tipo destinatario non valido" });
      }

      if (![25, 50, 75, 100].includes(packageSize)) {
        return res.status(400).json({ message: "Dimensione pacchetto non valida" });
      }

      // Verify target exists in real database
      const allCodes = await storage.getAllIqCodes();
      const targetCode = allCodes.find(code => 
        code.role === targetType && code.code === targetId
      );

      if (!targetCode) {
        return res.status(404).json({ message: "Destinatario non trovato nel database" });
      }

      // Save package assignment to database (SOLO CREDITI, non liste pregenerate)
      const packageAssignment = await storage.createAssignedPackage({
        recipientIqCode: targetCode.code,
        packageSize,
        status: "available", 
        assignedBy: userIqCode.code,
        creditsRemaining: packageSize,
        creditsUsed: 0
      });

      // Log assignment
      console.log(`Admin ${userIqCode.code} ha assegnato pacchetto di ${packageSize} CREDITI a ${targetType} ${targetCode.code}`);

      res.json({
        success: true,
        message: `Pacchetto di ${packageSize} crediti assegnato con successo a ${targetCode.code}`,
        targetType,
        targetCode: targetCode.code,
        packageSize,
        packageId: packageAssignment.id,
        creditsRemaining: packageSize,
        assignedAt: packageAssignment.assignedAt.toISOString()
      });
    } catch (error) {
      console.error("Errore assegnazione pacchetto:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Get packages assigned to current user
  app.get("/api/my-packages", async (req, res) => {
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
      if (!userIqCode) {
        return res.status(404).json({ message: "Codice IQ non trovato" });
      }

      // Get packages assigned to this user
      const assignedPackages = await storage.getPackagesByRecipient(userIqCode.code);

      res.json({
        packages: assignedPackages.map(pkg => ({
          id: pkg.id,
          packageSize: pkg.packageSize,
          status: pkg.status,
          assignedBy: pkg.assignedBy,
          assignedAt: pkg.assignedAt,
          creditsRemaining: pkg.creditsRemaining,
          creditsUsed: pkg.creditsUsed,
          availableCodes: pkg.creditsRemaining
        }))
      });
    } catch (error) {
      console.error("Errore recupero pacchetti:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // User-specific dashboard data
  app.get("/api/dashboard/data", async (req, res) => {
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
      if (!userIqCode) {
        return res.status(404).json({ message: "Codice IQ non trovato" });
      }

      // Generate dashboard data specific to this user
      const dashboardData = {
        userInfo: {
          code: userIqCode.code,
          role: userIqCode.role,
          assignedTo: userIqCode.assignedTo,
          location: userIqCode.location,
          codeType: userIqCode.codeType,
          createdAt: userIqCode.createdAt,
          isActive: userIqCode.isActive
        },
        // Role-specific data
        ...(userIqCode.role === 'tourist' && {
          touristData: {
            visitedPlaces: 0,
            discountsUsed: 0,
            recommendedSpots: generateTouristRecommendations(userIqCode.location || 'IT'),
            activeOffers: generateActiveOffers(userIqCode.location || 'IT')
          }
        }),
        ...(userIqCode.role === 'structure' && {
          structureData: {
            totalBookings: Math.floor(Math.random() * 100) + 50,
            monthlyRevenue: Math.floor(Math.random() * 10000) + 5000,
            averageRating: (Math.random() * 2 + 3).toFixed(1),
            roomsAvailable: Math.floor(Math.random() * 20) + 5,
            recentBookings: generateRecentBookings(userIqCode.assignedTo || 'Struttura')
          }
        }),
        ...(userIqCode.role === 'partner' && {
          partnerData: {
            offersActive: Math.floor(Math.random() * 10) + 3,
            customersReached: Math.floor(Math.random() * 500) + 100,
            conversionRate: (Math.random() * 10 + 5).toFixed(1) + '%',
            monthlyEarnings: Math.floor(Math.random() * 5000) + 1000,
            topProducts: generateTopProducts(userIqCode.assignedTo || 'Partner')
          }
        })
      };

      res.json(dashboardData);
    } catch (error) {
      console.error("Errore dashboard data:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Clean expired sessions periodically
  setInterval(async () => {
    await storage.cleanExpiredSessions();
  }, 60000); // Clean every minute

  // Generate tourist code from package pool (for structures/partners)
  app.post("/api/generate-tourist-code", async (req, res) => {
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
      if (!userIqCode || !['structure', 'partner'].includes(userIqCode.role)) {
        return res.status(403).json({ message: "Accesso negato - solo strutture e partner" });
      }

      const { packageId, guestName } = req.body;
      if (!packageId) {
        return res.status(400).json({ message: "ID pacchetto richiesto" });
      }

      // Get user's packages
      const assignedPackages = await storage.getPackagesByRecipient(userIqCode.code);
      const targetPackage = assignedPackages.find(pkg => pkg.id === packageId);

      if (!targetPackage) {
        return res.status(404).json({ message: "Pacchetto non trovato" });
      }

      // Check if package has available codes
      const creditsUsed = targetPackage.creditsUsed || 0;
      if (creditsUsed >= targetPackage.packageSize) {
        return res.status(400).json({ message: "Pacchetto esaurito - nessun credito disponibile" });
      }

      // Generate unique tourist code
      const touristCodeId = Math.floor(Math.random() * 9000) + 1000;
      const touristCode = `TIQ-${userIqCode.location || 'IT'}-TOURIST-${touristCodeId}`;

      // Create the tourist IQ code
      const newTouristCode = await storage.createIqCode({
        code: touristCode,
        role: 'tourist',
        assignedTo: guestName || `Ospite generato da ${userIqCode.code}`,
        location: userIqCode.location || 'IT',
        codeType: 'anonymous',
        isActive: true
      });

      // Update package usage count (simplified in memory storage)
      targetPackage.creditsUsed = creditsUsed + 1;

      res.json({
        success: true,
        touristCode: newTouristCode.code,
        guestName: guestName || "Ospite anonimo",
        packageId: packageId,
        remainingCodes: targetPackage.packageSize - targetPackage.creditsUsed,
        generatedAt: new Date().toISOString()
      });

    } catch (error) {
      console.error("Errore generazione codice turistico:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // GUEST MANAGEMENT ENDPOINTS
  
  // Get guests for current structure
  app.get("/api/guests", async (req, res) => {
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
      if (!userIqCode || userIqCode.role !== 'structure') {
        return res.status(403).json({ message: "Accesso negato - solo strutture" });
      }

      const guests = await storage.getGuestsByStructure(userIqCode.code);
      res.json({ guests });
    } catch (error) {
      console.error("Errore recupero ospiti:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Create new guest
  app.post("/api/guests", async (req, res) => {
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
      if (!userIqCode || userIqCode.role !== 'structure') {
        return res.status(403).json({ message: "Accesso negato - solo strutture" });
      }

      const { firstName, lastName, email, phone, roomNumber, checkinDate, checkoutDate, notes } = req.body;

      if (!firstName || !lastName) {
        return res.status(400).json({ message: "Nome e cognome sono obbligatori" });
      }

      const newGuest = await storage.createGuest({
        structureCode: userIqCode.code,
        firstName,
        lastName,
        email,
        phone,
        roomNumber,
        checkinDate,
        checkoutDate,
        notes,
        assignedCodes: 0,
        isActive: true
      });

      res.json({ success: true, guest: newGuest });
    } catch (error) {
      console.error("Errore creazione ospite:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Generate emotional IQCode for guest using credits system
  app.post("/api/assign-code-to-guest", async (req, res) => {
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
      if (!userIqCode || userIqCode.role !== 'structure') {
        return res.status(403).json({ message: "Accesso negato - solo strutture" });
      }

      const { guestId, packageId } = req.body;

      if (!guestId || !packageId) {
        return res.status(400).json({ message: "ID ospite e pacchetto richiesti" });
      }

      // Get guest details
      const guest = await storage.getGuestById(guestId);
      if (!guest || guest.structureCode !== userIqCode.code) {
        return res.status(404).json({ message: "Ospite non trovato" });
      }

      // Get package details and verify credits
      const packages = await storage.getPackagesByRecipient(userIqCode.code);
      const targetPackage = packages.find(pkg => pkg.id === packageId);
      
      if (!targetPackage) {
        return res.status(404).json({ message: "Pacchetto non trovato" });
      }

      if (targetPackage.creditsRemaining <= 0) {
        return res.status(400).json({ message: "Nessun credito disponibile in questo pacchetto" });
      }

      // Generate unique emotional IQCode (TIQ-IT-ROSA format)
      const guestName = `${guest.firstName} ${guest.lastName}`;
      const result = await storage.generateEmotionalIQCode(userIqCode.code, packageId, guestName, guestId);

      // Update guest assigned codes count
      await storage.updateGuest(guestId, {
        assignedCodes: (guest.assignedCodes || 0) + 1
      });

      console.log(`Struttura ${userIqCode.code} ha generato IQCode emozionale ${result.code} per ospite ${guestName} (ID: ${guestId}), crediti rimanenti: ${result.remainingCredits}`);

      res.json({
        success: true,
        touristCode: result.code,
        guestName: guestName,
        remainingCredits: result.remainingCredits,
        message: `IQCode emozionale ${result.code} generato con successo per ${guestName}`,
        guest: {
          phone: guest.phone,
          firstName: guest.firstName,
          lastName: guest.lastName,
          roomNumber: guest.roomNumber
        }
      });
    } catch (error) {
      console.error("Errore generazione IQCode emozionale:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper functions for generating role-specific data
function generateTouristRecommendations(location: string) {
  const recommendations: Record<string, string[]> = {
    'IT': ['Colosseo', 'Fontana di Trevi', 'Pantheon'],
    'VV': ['Tropea', 'Pizzo Calabro', 'Scilla'],
    'RC': ['Castello Aragonese', 'Museo Nazionale', 'Lungomare'],
    'CS': ['Centro Storico', 'Castello Svevo', 'Teatro Rendano']
  };
  return recommendations[location] || ['Attrazione Locale 1', 'Attrazione Locale 2', 'Attrazione Locale 3'];
}

function generateActiveOffers(location: string) {
  return [
    { title: 'Sconto 20% Ristoranti', validUntil: '2025-07-01' },
    { title: 'Ingresso Gratuito Musei', validUntil: '2025-06-30' },
    { title: 'Tour Guidato -30%', validUntil: '2025-07-15' }
  ];
}

function generateRecentBookings(structureName: string) {
  return [
    { guest: 'Mario Rossi', checkIn: '2025-06-28', nights: 3 },
    { guest: 'Anna Bianchi', checkIn: '2025-06-29', nights: 2 },
    { guest: 'Luigi Verdi', checkIn: '2025-07-01', nights: 5 }
  ];
}

function generateTopProducts(partnerName: string) {
  return [
    { name: 'Pizza Margherita', sales: 45 },
    { name: 'Gelato Artigianale', sales: 38 },
    { name: 'Caffè Espresso', sales: 67 }
  ];
}

function generateStructureData(structureId: string, iqCode: string) {
  // Extract province from code
  const province = iqCode.split('-')[1];
  
  // Generate unique data based on structure ID
  const seed = parseInt(structureId) || 1000;
  
  // Mapping specifico per strutture reali esistenti nel database
  const specificStructures: { [key: string]: string } = {
    '0700': 'Hotel Pazzo Calabria',
    '9576': 'Resort Capo Vaticano', 
    '4334': 'Grand Hotel Reggio',
    '7541': 'Hotel Calabria Palace'
  };
  
  // Fallback names per province se non c'è mapping specifico
  const structureNames: { [key: string]: string[] } = {
    'VV': ['Hotel Lo Stretto', 'Resort Capo Vaticano', 'B&B Vista Mare Tropea'],
    'RC': ['Hotel Bergamotto', 'Villa Aspromonte', 'Grand Hotel Reggio'],
    'CS': ['Hotel Cosenza Palace', 'Resort Sila Verde', 'B&B Centro Storico']
  };
  
  const managerNames = [
    'Giuseppe Calabrese', 'Maria Rossini', 'Antonio Greco', 'Francesca Romano',
    'Salvatore Marino', 'Elena Bianchi', 'Marco Ricci', 'Lucia Ferretti'
  ];
  
  const totalRooms = 15 + (seed % 25); // 15-40 rooms
  const occupiedRooms = Math.floor(totalRooms * (0.6 + (seed % 30) / 100)); // 60-90% occupancy
  const checkinToday = 3 + (seed % 8); // 3-10 checkins
  const rating = 4.0 + ((seed % 10) / 10); // 4.0-4.9 rating
  
  // Usa nome specifico se disponibile, altrimenti fallback
  const structureName = specificStructures[structureId] || 
    (structureNames[province] && structureNames[province][seed % 3]) || 
    `Hotel ${province} ${structureId}`;
  
  return {
    id: structureId,
    iqCode: iqCode,
    name: structureName,
    manager: managerNames[seed % managerNames.length],
    province: province,
    totalRooms: totalRooms,
    occupiedRooms: occupiedRooms,
    checkinToday: checkinToday,
    rating: Math.round(rating * 10) / 10,
    revenue: Math.floor(5000 + (seed * 47) % 15000),
    recentBookings: generateUniqueBookings(structureId),
    roomTypes: generateRoomTypes(seed),
    stats: {
      occupancyRate: Math.round((occupiedRooms / totalRooms) * 100),
      avgNightlyRate: 80 + (seed % 120),
      totalGuests: occupiedRooms * 2,
      pendingCheckouts: 2 + (seed % 5)
    }
  };
}

function generateUniqueBookings(structureId: string) {
  const seed = parseInt(structureId) || 1000;
  const guests = [
    'Marco Bianchi', 'Laura Ferretti', 'Giuseppe Marino', 'Elena Romano',
    'Antonio Greco', 'Francesca Ricci', 'Salvatore Rossi', 'Maria Calabrese'
  ];
  
  return Array.from({ length: 5 }, (_, i) => ({
    id: seed + i,
    guest: guests[(seed + i) % guests.length],
    room: 100 + ((seed + i * 7) % 50),
    checkin: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toLocaleDateString('it-IT'),
    checkout: new Date(Date.now() + ((3 - i) * 24 * 60 * 60 * 1000)).toLocaleDateString('it-IT'),
    status: i < 2 ? 'Attivo' : 'Check-out'
  }));
}

function generateRoomTypes(seed: number) {
  return [
    { type: 'Standard', count: 8 + (seed % 5), price: 80 + (seed % 30) },
    { type: 'Superior', count: 4 + (seed % 3), price: 120 + (seed % 40) },
    { type: 'Suite', count: 2 + (seed % 2), price: 200 + (seed % 80) }
  ];
}
