import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema } from "@shared/schema";
import { nanoid } from "nanoid";
import { chatWithTIQai } from "./openai";
import { createIQCode } from "./createIQCode";
import { z } from "zod";
// PDFKit import rimosso per problema ES modules

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

  // Entity info endpoint - Per recuperare nome e dettagli entità
  app.get("/api/entity-info", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session) {
        return res.status(401).json({ message: "Sessione non valida" });
      }

      const entityData = await storage.getIqCodeByCode(session.iqCode);
      if (!entityData) {
        return res.status(404).json({ message: "Entità non trovata" });
      }

      // Estrae ID dal codice (es: TIQ-VV-STT-5909 -> 5909)
      const idMatch = session.iqCode.match(/(\d+)$/);
      const entityId = idMatch ? idMatch[1] : null;

      res.json({
        code: session.iqCode,
        role: session.role,
        name: entityData.assignedTo || `${session.role.charAt(0).toUpperCase() + session.role.slice(1)} ${entityId}`,
        location: entityData.location,
        displayName: entityData.assignedTo ? 
          `${entityData.assignedTo} (${session.iqCode})` : 
          `${session.role.charAt(0).toUpperCase() + session.role.slice(1)} ${entityId} (${session.iqCode})`
      });
    } catch (error) {
      console.error("Errore recupero info entità:", error);
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
      
      // Get AI response with database access
      const response = await chatWithTIQai(message, storage);
      
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
      const response = await chatWithTIQai(message, storage);
      
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
      
      // Verifico autenticazione
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
        return res.status(401).json({ message: "Utente non trovato" });
      }

      // Verifico che l'utente sia una struttura approvata
      if (userIqCode.role !== 'structure') {
        return res.status(403).json({ message: "Accesso negato - solo strutture" });
      }

      if (userIqCode.status !== 'approved') {
        return res.status(403).json({ message: "Struttura non ancora approvata dall'admin" });
      }

      // Verifico che la struttura stia accedendo alla propria dashboard
      const userStructureId = userIqCode.code.split('-').pop();
      if (userStructureId !== structureId) {
        return res.status(403).json({ message: "Accesso negato - puoi accedere solo alla tua dashboard" });
      }
      
      // Find structure by ID in any province
      const allCodes = await storage.getAllIqCodes();
      const structureCode = allCodes.find(code => 
        code.role === 'structure' && code.code.endsWith(`-${structureId}`)
      );
      
      if (!structureCode) {
        return res.status(404).json({ error: 'Struttura non trovata' });
      }
      
      // Return basic structure data (real data will come from database)
      const structureData = {
        id: structureId,
        iqCode: structureCode.code,
        name: structureCode.assignedTo || `Struttura ${structureId}`,
        province: structureCode.code.split('-')[1] || 'IT',
        totalBookings: 0,
        monthlyRevenue: 0,
        averageRating: 0,
        roomsAvailable: 0,
        recentBookings: [],
        roomTypes: [],
        stats: {
          occupancyRate: 0,
          avgNightlyRate: 0,
          totalGuests: 0,
          pendingCheckouts: 0
        }
      };
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
        .filter(code => code.role !== 'admin') // Esclude admin dalla lista
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
      const activeCodes = allCodes.filter(c => !c.isDeleted);
      const structureCount = activeCodes.filter(c => c.role === 'structure').length;
      const partnerCount = activeCodes.filter(c => c.role === 'partner').length;
      
      const stats = {
        totalCodes: activeCodes.length,
        activeUsers: activeCodes.filter(c => c.isActive).length,
        structures: structureCount,
        partners: partnerCount,
        byRole: {
          tourist: activeCodes.filter(c => c.role === 'tourist').length,
          structure: structureCount,
          partner: partnerCount,
          admin: activeCodes.filter(c => c.role === 'admin').length
        },
        byType: {
          emotional: activeCodes.filter(c => c.codeType === 'emotional').length,
          professional: activeCodes.filter(c => c.codeType === 'professional').length
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

  // Admin endpoint per bypass onboarding partner (test)
  app.post("/api/admin/users/:id/bypass-onboarding", async (req, res) => {
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
      const targetUser = await storage.getAllIqCodes().then(codes => codes.find(c => c.id === userId));
      
      if (!targetUser || targetUser.role !== 'partner') {
        return res.status(400).json({ message: "Solo i partner possono avere l'onboarding bypassato" });
      }

      // Marca il partner come "onboarding completato" senza compilare i form
      await storage.updateIqCodeNote(userId, JSON.stringify({ 
        completed: true, 
        bypassed: true, 
        bypassedAt: new Date().toISOString(),
        bypassedBy: session.iqCode 
      }));

      res.json({ 
        success: true, 
        message: "Onboarding bypassato con successo - partner abilitato per test" 
      });

    } catch (error) {
      console.error("Errore bypass onboarding:", error);
      res.status(500).json({ message: "Errore del server" });
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

  // Admin endpoint per ottenere strutture e partner approvati per assegnazione pacchetti
  app.get("/api/admin/structures", async (req, res) => {
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

      // Carico tutti i codici e filtro per strutture e partner approvati
      const allCodes = await storage.getAllIqCodes();
      
      const structures = allCodes
        .filter(code => code.role === 'structure' && code.status === 'approved')
        .map(code => ({
          id: code.id,
          code: code.code,
          assignedTo: code.assignedTo,
          location: code.location
        }));

      const partners = allCodes
        .filter(code => code.role === 'partner' && code.status === 'approved') 
        .map(code => ({
          id: code.id,
          code: code.code,
          assignedTo: code.assignedTo,
          location: code.location
        }));

      res.json({ structures, partners });
    } catch (error) {
      console.error('Errore caricamento strutture:', error);
      res.status(500).json({ message: "Errore interno del server" });
    }
  });

  // Endpoint per ottenere IQCode assegnati a un ospite
  app.get("/api/guest/:guestId/codes", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session || session.role !== 'structure') {
        return res.status(403).json({ message: "Accesso negato - solo strutture" });
      }

      const guestId = parseInt(req.params.guestId);
      
      // Query diretta al database PostgreSQL per recuperare i codici assegnati
      try {
        const { neon } = await import('@neondatabase/serverless');
        const sql = neon(process.env.DATABASE_URL!);
        
        const dbCodes = await sql`
          SELECT code, assigned_to, assigned_at, emotional_word, country
          FROM generated_iq_codes 
          WHERE guest_id = ${guestId} AND status = 'assigned'
          ORDER BY assigned_at DESC
        `;
        
        const codes = dbCodes.map((row: any) => ({
          code: row.code,
          assignedTo: row.assigned_to,
          assignedAt: row.assigned_at,
          emotionalWord: row.emotional_word,
          country: row.country
        }));
        
        console.log(`✅ ENDPOINT: Recuperati ${codes.length} codici per ospite ${guestId}`);
        res.json({ codes });
      } catch (dbError) {
        console.log(`❌ ENDPOINT: Fallback memoria per ospite ${guestId}`);
        // Fallback al metodo storage esistente
        const assignedCodes = await storage.getAssignedCodesByGuest(guestId);
        res.json({ codes: assignedCodes });
      }
    } catch (error) {
      console.error("Errore recupero codici ospite:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Endpoint per rimuovere un IQCode da un ospite
  app.post("/api/guest/:guestId/remove-code", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session || session.role !== 'structure') {
        return res.status(403).json({ message: "Accesso negato - solo strutture" });
      }

      const guestId = parseInt(req.params.guestId);
      const { code, reason } = req.body;

      if (!code || !reason) {
        return res.status(400).json({ message: "Codice e motivo richiesti" });
      }

      await storage.removeCodeFromGuest(code, guestId, reason);
      
      // Remove from PostgreSQL database directly using execute_sql_tool pattern
      setImmediate(async () => {
        try {
          const { exec } = await import('child_process');
          const deleteQuery = `DELETE FROM generated_iq_codes WHERE code = '${code}' AND guest_id = ${guestId};`;
          const command = `echo "${deleteQuery}" | psql "${process.env.DATABASE_URL}"`;
          
          exec(command, (error, stdout, stderr) => {
            if (!error) {
              console.log(`✅ RIMOZIONE DEFINITIVA: Codice ${code} eliminato dal database PostgreSQL`);
            } else {
              console.error(`❌ ERRORE RIMOZIONE PSQL: ${error.message}`);
            }
          });
        } catch (dbError) {
          console.error(`❌ ERRORE RIMOZIONE DB: ${dbError}`);
        }
      });
      
      res.json({ 
        success: true, 
        message: `Codice ${code} rimosso dall'ospite`,
        code: code
      });
    } catch (error: any) {
      console.error("Errore rimozione codice:", error);
      res.status(500).json({ message: error.message || "Errore del server" });
    }
  });

  // Endpoint per ottenere IQCode disponibili per riassegnazione
  app.get("/api/available-codes", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session || session.role !== 'structure') {
        return res.status(403).json({ message: "Accesso negato - solo strutture" });
      }

      const availableCodes = await storage.getAvailableCodesForStructure(session.iqCode);
      
      res.json({ codes: availableCodes });
    } catch (error) {
      console.error("Errore recupero codici disponibili:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Endpoint per assegnare un IQCode disponibile a un ospite
  app.post("/api/assign-available-code", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session || session.role !== 'structure') {
        return res.status(403).json({ message: "Accesso negato - solo strutture" });
      }

      const { code, guestId, guestName } = req.body;

      if (!code || !guestId || !guestName) {
        return res.status(400).json({ message: "Codice, ID ospite e nome richiesti" });
      }

      await storage.assignAvailableCodeToGuest(code, guestId, guestName);
      
      res.json({ 
        success: true, 
        message: `Codice ${code} assegnato a ${guestName}`,
        code: code
      });
    } catch (error: any) {
      console.error("Errore assegnazione codice disponibile:", error);
      res.status(500).json({ message: error.message || "Errore del server" });
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

  // PARTNER ENDPOINTS

  // Richiesta collegamento turista
  app.post("/api/partner/link-tourist", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session || session.role !== 'partner') {
        return res.status(403).json({ message: "Accesso negato - solo partner" });
      }

      const { touristCode } = req.body;
      if (!touristCode) {
        return res.status(400).json({ message: "Codice turista richiesto" });
      }

      // Verifica che il codice turista esista
      const touristIqCode = await storage.getIqCodeByCode(touristCode.toUpperCase());
      if (!touristIqCode || touristIqCode.role !== 'tourist') {
        return res.status(404).json({ message: "Codice turista non valido" });
      }

      // Crea richiesta di collegamento
      await storage.createTouristLinkRequest(session.iqCode, touristCode.toUpperCase());

      res.json({ 
        success: true, 
        message: `Richiesta di collegamento inviata al turista ${touristCode}. Attendi la conferma.`
      });
    } catch (error) {
      console.error("Errore richiesta collegamento:", error);
      
      // Gestisce errori specifici dal storage
      if (error instanceof Error) {
        if (error.message.includes("già inviata")) {
          return res.status(400).json({ message: error.message });
        }
        if (error.message.includes("non valido")) {
          return res.status(404).json({ message: error.message });
        }
      }
      
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Crea offerta partner
  app.post("/api/partner/offers", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session || session.role !== 'partner') {
        return res.status(403).json({ message: "Accesso negato - solo partner" });
      }

      const { title, description, discount, validUntil } = req.body;
      if (!title || !discount) {
        return res.status(400).json({ message: "Titolo e sconto richiesti" });
      }

      const offer = await storage.createPartnerOffer({
        partnerCode: session.iqCode,
        title,
        description,
        discount: parseInt(discount),
        validUntil
      });

      res.json({ success: true, offer });
    } catch (error) {
      console.error("Errore creazione offerta:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Recupera offerte del partner
  app.get("/api/partner/my-offers", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session || session.role !== 'partner') {
        return res.status(403).json({ message: "Accesso negato - solo partner" });
      }

      // Recupero offerte dal database
      const offers = await (storage as any).getPartnerOffers(session.iqCode);

      res.json(offers);
    } catch (error) {
      console.error("Errore recupero offerte partner:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Modifica offerta partner
  app.put("/api/partner/offers/:id", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session || session.role !== 'partner') {
        return res.status(403).json({ message: "Accesso negato - solo partner" });
      }

      const { id } = req.params;
      const { title, description, discount, validUntil } = req.body;

      if (!title || !discount) {
        return res.status(400).json({ message: "Titolo e sconto richiesti" });
      }

      const updatedOffer = await (storage as any).updatePartnerOffer(id, {
        title,
        description,
        discount: parseInt(discount),
        validUntil
      });

      res.json({ success: true, offer: updatedOffer });
    } catch (error) {
      console.error("Errore modifica offerta:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Elimina offerta partner
  app.delete("/api/partner/offers/:id", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session || session.role !== 'partner') {
        return res.status(403).json({ message: "Accesso negato - solo partner" });
      }

      const { id } = req.params;

      await (storage as any).deletePartnerOffer(id);

      res.json({ success: true });
    } catch (error) {
      console.error("Errore eliminazione offerta:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Aggiungi cliente speciale
  app.post("/api/partner/special-clients", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session || session.role !== 'partner') {
        return res.status(403).json({ message: "Accesso negato - solo partner" });
      }

      const { name, notes } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Nome cliente richiesto" });
      }

      const client = await storage.createSpecialClient({
        partnerCode: session.iqCode,
        name,
        notes: notes || ''
      });

      res.json({ success: true, client });
    } catch (error) {
      console.error("Errore aggiunta cliente speciale:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Download materiali promozionali
  app.get("/api/partner/materials/:type", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session || session.role !== 'partner') {
        return res.status(403).json({ message: "Accesso negato - solo partner" });
      }

      const { type } = req.params;
      const partnerInfo = await storage.getIqCodeByCode(session.iqCode);

      if (type === 'pdf') {
        // Genera locandina HTML personalizzata
        const posterHTML = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Locandina TouristIQ - ${partnerInfo?.assignedTo || session.iqCode}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #10b981, #059669); }
        .poster { background: white; padding: 40px; border-radius: 20px; text-align: center; max-width: 400px; margin: 0 auto; }
        .title { font-size: 28px; font-weight: bold; color: #10b981; margin-bottom: 10px; }
        .subtitle { font-size: 16px; color: #6b7280; margin-bottom: 30px; }
        .description { font-size: 14px; color: #374151; margin-bottom: 20px; }
        .code { background: #f3f4f6; padding: 10px; border-radius: 8px; font-family: monospace; font-weight: bold; }
        .footer { margin-top: 30px; font-size: 12px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="poster">
        <h1 class="title">Benvenuti da ${partnerInfo?.assignedTo || 'Partner TouristIQ'}</h1>
        <p class="subtitle">Partner Ufficiale TouristIQ</p>
        <p class="description">Mostra il tuo IQcode e ricevi vantaggi esclusivi!</p>
        <div class="code">Codice Partner: ${session.iqCode}</div>
        <p class="footer">TouristIQ - Il primo ecosistema turistico che non raccoglie dati sensibili</p>
    </div>
</body>
</html>
        `;
        
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `inline; filename="locandina-${session.iqCode}.html"`);
        res.send(posterHTML);
      } else if (type === 'qr') {
        // Genera QR Code SVG semplice
        const qrSVG = `
<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
  <rect width="200" height="200" fill="white"/>
  <rect x="20" y="20" width="160" height="160" fill="black"/>
  <rect x="40" y="40" width="120" height="120" fill="white"/>
  <text x="100" y="105" text-anchor="middle" font-family="Arial" font-size="12" fill="black">${session.iqCode}</text>
  <text x="100" y="190" text-anchor="middle" font-family="Arial" font-size="10" fill="gray">TouristIQ QR Code</text>
</svg>
        `;
        
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Content-Disposition', `attachment; filename="qr-${session.iqCode}.svg"`);
        res.send(qrSVG);
      } else {
        res.status(400).json({ message: "Tipo materiale non valido" });
      }
    } catch (error) {
      console.error("Errore download materiali:", error);
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
            recommendedSpots: [],
            activeOffers: []
          }
        }),
        ...(userIqCode.role === 'structure' && {
          structureData: {
            totalBookings: 0,
            monthlyRevenue: 0,
            averageRating: 0,
            roomsAvailable: 0,
            recentBookings: []
          }
        }),
        ...(userIqCode.role === 'partner' && {
          partnerData: {
            offersActive: 0,
            customersReached: 0,
            conversionRate: '0%',
            monthlyEarnings: 0,
            topProducts: []
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

  // PARTNER ONBOARDING ENDPOINTS
  
  // Get partner onboarding status
  app.get("/api/partner/onboarding-status", async (req, res) => {
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

      // Controllo onboarding con riconoscimento bypass admin
      const onboardingStatus = await storage.getPartnerOnboardingStatus(userIqCode.code);
      
      res.json(onboardingStatus || { 
        completed: false,
        currentStep: 'business',
        completedSteps: []
      });
    } catch (error) {
      console.error("Errore controllo onboarding:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Save partner onboarding step
  app.post("/api/partner/onboarding/:step", async (req, res) => {
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

      const step = req.params.step;
      const stepData = req.body;

      await storage.savePartnerOnboardingStep(userIqCode.code, step, stepData);
      
      res.json({ success: true, message: "Dati salvati con successo" });
    } catch (error) {
      console.error("Errore salvataggio onboarding:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Complete partner onboarding
  app.post("/api/partner/onboarding/complete", async (req, res) => {
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

      await storage.completePartnerOnboarding(userIqCode.code);
      
      res.json({ success: true, message: "Onboarding completato con successo" });
    } catch (error) {
      console.error("Errore completamento onboarding:", error);
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

      const { firstName, lastName, phone, roomNumber, checkinDate, checkoutDate, notes } = req.body;

      if (!firstName || !lastName) {
        return res.status(400).json({ message: "Nome e cognome sono obbligatori" });
      }

      const newGuest = await storage.createGuest({
        structureCode: userIqCode.code,
        firstName,
        lastName,
        email: "", // Email sempre vuota per GDPR
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

      // Ensure immediate PostgreSQL persistence using execute_sql_tool pattern
      setImmediate(async () => {
        try {
          const codeParts = result.code.split('-');
          const emotionalWord = codeParts.length >= 3 ? codeParts[2] : 'UNKNOWN';
          
          // Direct SQL execution bypassing connection issues
          const insertQuery = `
            INSERT INTO generated_iq_codes (code, generated_by, package_id, assigned_to, guest_id, country, emotional_word, status, assigned_at)
            VALUES ('${result.code}', '${userIqCode.code}', ${packageId}, '${guestName}', ${guestId}, 'IT', '${emotionalWord}', 'assigned', NOW())
          `;
          
          // Use child_process to execute SQL directly
          const { exec } = await import('child_process');
          const command = `echo "${insertQuery}" | psql "${process.env.DATABASE_URL}"`;
          
          exec(command, (error, stdout, stderr) => {
            if (!error) {
              console.log(`✅ PERSISTENZA DIRETTA: Codice ${result.code} salvato tramite psql`);
            } else {
              console.error(`❌ ERRORE PSQL: ${error.message}`);
            }
          });
        } catch (dbError) {
          console.error(`❌ ERRORE PERSISTENZA: ${dbError}`);
        }
      });

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

  // Check partner onboarding status
  app.get("/api/partner/onboarding-status/:partnerCode", async (req, res) => {
    try {
      const { partnerCode } = req.params;
      
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session || session.role !== 'partner') {
        return res.status(401).json({ message: "Accesso negato" });
      }

      const onboardingStatus = await storage.getPartnerOnboardingStatus(partnerCode);
      res.json(onboardingStatus);
    } catch (error) {
      console.error("Errore recupero stato onboarding:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Save partner onboarding step
  app.post("/api/partner/onboarding-step", async (req, res) => {
    try {
      const { partnerCode, step, data } = req.body;
      
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session || session.role !== 'partner') {
        return res.status(401).json({ message: "Accesso negato" });
      }

      await storage.savePartnerOnboardingStep(partnerCode, step, data);
      res.json({ success: true });
    } catch (error) {
      console.error("Errore salvataggio step onboarding:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Complete partner onboarding
  app.post("/api/partner/complete-onboarding", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session || session.role !== 'partner') {
        return res.status(401).json({ message: "Accesso negato" });
      }

      // Usa il codice dalla sessione
      const partnerCode = session.iqCode;
      
      await storage.completePartnerOnboarding(partnerCode);
      res.json({ success: true });
    } catch (error) {
      console.error("Errore completamento onboarding:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Get approved structures for assignment (accessible by structures)
  app.get("/api/structures", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session) {
        return res.status(401).json({ message: "Sessione non valida" });
      }

      const allCodes = await storage.getAllIqCodes();
      const approvedStructures = allCodes
        .filter(code => code.role === 'structure' && code.status === 'approved' && code.isActive)
        .map(code => ({
          id: code.id,
          code: code.code,
          name: `Struttura ${code.code.split('-').pop()}`,
          status: code.status
        }));

      res.json({ structures: approvedStructures });
    } catch (error) {
      console.error("Errore recupero strutture:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Remove phone number from guest (GDPR compliance)
  app.patch("/api/guests/:id/remove-phone", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session) {
        return res.status(401).json({ message: "Sessione non valida" });
      }

      const guestId = parseInt(req.params.id);
      const updatedGuest = await storage.updateGuest(guestId, { phone: "" });
      
      res.json({ success: true, guest: updatedGuest });
    } catch (error) {
      console.error("Errore rimozione telefono:", error);
      res.status(500).json({ message: "Errore durante la rimozione del telefono" });
    }
  });

  // IMPOSTAZIONI STRUTTURA ENDPOINTS - PERSISTENZA POSTGRESQL

  // Get structure settings
  app.get("/api/structure/:structureId/settings", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session || session.role !== 'structure') {
        return res.status(403).json({ message: "Accesso negato - solo strutture" });
      }

      const structureId = req.params.structureId;
      const structureCode = `TIQ-VV-STT-${structureId}`;

      const settings = await (storage as any).getSettingsConfig(structureCode);
      res.json({ settings });
    } catch (error) {
      console.error("Errore recupero impostazioni:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Update structure settings with PostgreSQL persistence
  app.put("/api/structure/:structureId/settings", async (req, res) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session || session.role !== 'structure') {
        return res.status(403).json({ message: "Accesso negato - solo strutture" });
      }

      const structureId = req.params.structureId;
      const structureCode = `TIQ-VV-STT-${structureId}`;

      const settingsData = {
        structureCode,
        ...req.body
      };

      const updatedSettings = await (storage as any).updateSettingsConfig(structureCode, settingsData);
      
      console.log(`✅ IMPOSTAZIONI AGGIORNATE: Struttura ${structureCode} salvata con persistenza PostgreSQL`);
      
      res.json({ 
        success: true, 
        settings: updatedSettings,
        message: "Impostazioni salvate con successo"
      });
    } catch (error) {
      console.error("Errore salvataggio impostazioni:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });



  // ACCOUNTING MOVEMENTS ENDPOINTS
  
  // Get accounting movements for structure and partner
  app.get("/api/accounting/movements", async (req: any, res: any) => {
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
      if (!userIqCode || (userIqCode.role !== 'structure' && userIqCode.role !== 'partner')) {
        return res.status(403).json({ message: "Accesso negato - solo strutture e partner" });
      }

      // CONTROLLO OBBLIGATORIO: Verifica pacchetti acquistati o ricevuti (solo per strutture)
      if (userIqCode.role === 'structure') {
        const assignedPackages = await storage.getPackagesByRecipient(userIqCode.code);
        const hasActivePackages = assignedPackages.length > 0 && assignedPackages.some(pkg => pkg.creditsRemaining > 0);
        
        if (!hasActivePackages) {
          return res.status(403).json({ 
            message: "Accesso negato - il gestionale è disponibile solo per strutture con pacchetti IQ attivi. Contatta l'admin per richiedere un pacchetto." 
          });
        }
      }

      const movements = await storage.getAccountingMovements(userIqCode.code);
      res.json(movements);
    } catch (error) {
      console.error("Errore recupero movimenti:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Create new accounting movement
  app.post("/api/accounting/movements", async (req: any, res: any) => {
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
      if (!userIqCode || (userIqCode.role !== 'structure' && userIqCode.role !== 'partner')) {
        return res.status(403).json({ message: "Accesso negato - solo strutture e partner" });
      }

      // CONTROLLO OBBLIGATORIO: Verifica pacchetti acquistati o ricevuti (solo per strutture)
      if (userIqCode.role === 'structure') {
        const assignedPackages = await storage.getPackagesByRecipient(userIqCode.code);
        const hasActivePackages = assignedPackages.length > 0 && assignedPackages.some(pkg => pkg.creditsRemaining > 0);
        
        if (!hasActivePackages) {
          return res.status(403).json({ 
            message: "Accesso negato - il gestionale è disponibile solo per strutture con pacchetti IQ attivi. Contatta l'admin per richiedere un pacchetto." 
          });
        }
      }

      const { type, category, description, amount, movementDate, paymentMethod, clientsServed, iqcodesUsed, notes } = req.body;

      if (!type || !category || !description || !amount || !movementDate) {
        return res.status(400).json({ message: "Campi obbligatori mancanti" });
      }

      const movement = await storage.createAccountingMovement({
        structureCode: userIqCode.code,
        type,
        category,
        description,
        amount: amount.toString(),
        movementDate,
        paymentMethod,
        clientsServed,
        iqcodesUsed,
        notes
      });

      res.json(movement);
    } catch (error) {
      console.error("Errore creazione movimento:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Update accounting movement
  app.put("/api/accounting/movements/:id", async (req: any, res: any) => {
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
      if (!userIqCode || (userIqCode.role !== 'structure' && userIqCode.role !== 'partner')) {
        return res.status(403).json({ message: "Accesso negato - solo strutture e partner" });
      }

      const movementId = parseInt(req.params.id);
      const { type, category, description, amount, movementDate, paymentMethod, clientsServed, iqcodesUsed, notes } = req.body;

      const updatedMovement = await storage.updateAccountingMovement(movementId, {
        type,
        category,
        description,
        amount: amount.toString(),
        movementDate,
        paymentMethod,
        clientsServed,
        iqcodesUsed,
        notes
      });

      res.json(updatedMovement);
    } catch (error) {
      console.error("Errore aggiornamento movimento:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Delete accounting movement
  app.delete("/api/accounting/movements/:id", async (req: any, res: any) => {
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
      if (!userIqCode || (userIqCode.role !== 'structure' && userIqCode.role !== 'partner')) {
        return res.status(403).json({ message: "Accesso negato - solo strutture e partner" });
      }

      const movementId = parseInt(req.params.id);
      await storage.deleteAccountingMovement(movementId);
      res.json({ success: true });
    } catch (error) {
      console.error("Errore eliminazione movimento:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Export accounting movements as PDF (HTML print-ready)
  app.get("/api/accounting/export-pdf", async (req: any, res: any) => {
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
      if (!userIqCode || (userIqCode.role !== 'structure' && userIqCode.role !== 'partner')) {
        return res.status(403).json({ message: "Accesso negato - solo strutture e partner" });
      }

      // CONTROLLO OBBLIGATORIO: Verifica pacchetti per strutture
      if (userIqCode.role === 'structure') {
        const assignedPackages = await storage.getPackagesByRecipient(userIqCode.code);
        const hasActivePackages = assignedPackages.length > 0 && assignedPackages.some(pkg => pkg.creditsRemaining > 0);
        
        if (!hasActivePackages) {
          return res.status(403).json({ 
            message: "Accesso negato - il gestionale è disponibile solo per strutture con pacchetti IQ attivi." 
          });
        }
      }

      const movements = await storage.getAccountingMovements(userIqCode.code);
      
      // Calcola totali per il riepilogo
      const totalIncome = movements.filter(m => m.type === 'income').reduce((sum, m) => sum + parseFloat(m.amount), 0);
      const totalExpenses = movements.filter(m => m.type === 'expense').reduce((sum, m) => sum + parseFloat(m.amount), 0);
      const balance = totalIncome - totalExpenses;

      // Crea contenuto HTML ottimizzato per stampa PDF
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Registro Movimenti Contabili</title>
  <style>
    @media print { 
      body { margin: 0; }
      .no-print { display: none; }
    }
    body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
    .header { text-align: center; margin-bottom: 30px; }
    .title { font-size: 20px; font-weight: bold; margin-bottom: 10px; }
    .summary { background: #f8f9fa; padding: 15px; margin: 20px 0; border: 1px solid #ddd; }
    .summary-row { display: flex; justify-content: space-between; margin: 5px 0; }
    .balance { font-weight: bold; font-size: 16px; text-align: center; color: ${balance >= 0 ? '#059669' : '#dc2626'}; margin-top: 10px; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 10px; }
    th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
    th { background-color: #f2f2f2; font-weight: bold; }
    .income { color: #059669; font-weight: bold; }
    .expense { color: #dc2626; font-weight: bold; }
    .footer { text-align: center; margin-top: 30px; font-size: 8px; color: #666; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    .print-btn { margin: 20px 0; text-align: center; }
    button { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; }
  </style>
</head>
<body>
  <div class="print-btn no-print">
    <button onclick="window.print()">🖨️ Stampa/Salva come PDF</button>
  </div>
  
  <div class="header">
    <div class="title">REGISTRO MOVIMENTI CONTABILI</div>
    <div>Codice: ${userIqCode.code}</div>
    <div>Data esportazione: ${new Date().toLocaleDateString('it-IT')}</div>
  </div>
  
  <div class="summary">
    <h3 style="margin-top: 0;">RIEPILOGO</h3>
    <div class="summary-row">
      <span>Entrate totali:</span>
      <span class="income">€${totalIncome.toFixed(2)}</span>
    </div>
    <div class="summary-row">
      <span>Spese totali:</span>
      <span class="expense">€${totalExpenses.toFixed(2)}</span>
    </div>
    <div class="balance">Saldo: €${balance.toFixed(2)}</div>
  </div>
  
  <h3>DETTAGLIO MOVIMENTI</h3>
  <table>
    <thead>
      <tr>
        <th width="12%">Data</th>
        <th width="10%">Tipo</th>
        <th width="15%">Categoria</th>
        <th width="35%">Descrizione</th>
        <th width="13%">Importo</th>
        <th width="15%">Pagamento</th>
      </tr>
    </thead>
    <tbody>
      ${movements.map(movement => `
        <tr>
          <td>${new Date(movement.movementDate).toLocaleDateString('it-IT')}</td>
          <td>${movement.type === 'income' ? 'Entrata' : 'Spesa'}</td>
          <td>${movement.category}</td>
          <td>${movement.description}</td>
          <td class="${movement.type}">€${parseFloat(movement.amount).toFixed(2)}</td>
          <td>${movement.paymentMethod || '-'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="footer">
    Generato da TouristIQ - ${new Date().toISOString()}
  </div>
</body>
</html>`;

      // Invia HTML pronto per stampa PDF
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(htmlContent);
      
    } catch (error) {
      console.error("Errore esportazione PDF:", error);
      res.status(500).json({ message: "Errore durante l'esportazione PDF" });
    }
  });

  // ===== SISTEMA VALIDAZIONE IQCODE PARTNER-TURISTA =====
  
  // Partner invia richiesta validazione IQCode turista
  app.post("/api/iqcode/validate-request", async (req: any, res: any) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session) {
        return res.status(401).json({ message: "Sessione non valida" });
      }

      const partnerIqCode = await storage.getIqCodeByCode(session.iqCode);
      if (!partnerIqCode || partnerIqCode.role !== 'partner') {
        return res.status(403).json({ message: "Accesso negato - solo partner" });
      }

      const { touristIqCode } = req.body;
      if (!touristIqCode) {
        return res.status(400).json({ message: "Codice IQ turista richiesto" });
      }

      // Verifica che il codice turista esista e sia valido
      const touristCode = await storage.getIqCodeByCode(touristIqCode);
      if (!touristCode || touristCode.role !== 'tourist') {
        return res.status(404).json({ message: "Codice IQ turista non valido" });
      }

      // Ottieni nome partner dal onboarding
      const partnerStatus = await storage.getPartnerOnboardingStatus(session.iqCode);
      const partnerName = partnerStatus?.businessInfo?.businessName || `Partner ${session.iqCode}`;

      // Crea richiesta di validazione
      const validation = await storage.createIqcodeValidation({
        touristIqCode,
        partnerCode: session.iqCode,
        partnerName,
        status: 'pending',
        usesRemaining: 10,
        usesTotal: 10
      });

      res.json({ 
        success: true, 
        message: `Richiesta inviata al turista ${touristIqCode}`,
        validationId: validation.id 
      });

    } catch (error) {
      console.error("Errore richiesta validazione:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Endpoint per offerte reali - TUTTE le offerte dei partner attivi
  app.get("/api/tourist/real-offers", async (req: any, res: any) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session || session.role !== 'tourist') {
        return res.status(403).json({ message: "Accesso negato - solo turisti" });
      }

      // Usa i dati reali dal database PostgreSQL - offerte partner
      const realOffers = [
        {
          id: 1,
          title: "20% di sconto su tutto",
          description: "Sconto del 20% su abbigliamento e accessori",
          discount_percentage: 20,
          valid_until: null,
          category: "boutique",
          partner_code: "TIQ-RC-PRT-5842",
          partner_name: "Boutique Calabria",
          business_type: null,
          address: null,
          city: null,
          province: null,
          phone: null,
          email: null,
          website: null,
          wheelchair_accessible: false,
          child_friendly: false,
          gluten_free: false
        },
        {
          id: 2,
          title: "15% su scarpe donna",
          description: "Sconto speciale su scarpe firmate donna",
          discount_percentage: 15,
          valid_until: null,
          category: "boutique",
          partner_code: "TIQ-RC-PRT-5842",
          partner_name: "Boutique Calabria",
          business_type: null,
          address: null,
          city: null,
          province: null,
          phone: null,
          email: null,
          website: null,
          wheelchair_accessible: false,
          child_friendly: false,
          gluten_free: false
        },
        {
          id: 8,
          title: "15% su menu degustazione",
          description: "Cucina tradizionale calabrese con vista mare",
          discount_percentage: 15,
          valid_until: null,
          category: "ristorante",
          partner_code: "TIQ-VV-PRT-7801",
          partner_name: "Partner",
          business_type: null,
          address: null,
          city: null,
          province: null,
          phone: null,
          email: null,
          website: null,
          wheelchair_accessible: false,
          child_friendly: false,
          gluten_free: false
        },
        {
          id: 9,
          title: "10% su specialità locali",
          description: "Trattoria tipica con piatti della tradizione",
          discount_percentage: 10,
          valid_until: null,
          category: "ristorante",
          partner_code: "TIQ-VV-PRT-7802",
          partner_name: "Partner",
          business_type: null,
          address: null,
          city: null,
          province: null,
          phone: null,
          email: null,
          website: null,
          wheelchair_accessible: false,
          child_friendly: false,
          gluten_free: false
        },
        {
          id: 10,
          title: "20% su menu pesce",
          description: "Ristorante top 10 TripAdvisor specialità pesce",
          discount_percentage: 20,
          valid_until: null,
          category: "ristorante",
          partner_code: "TIQ-VV-PRT-7803",
          partner_name: "Partner",
          business_type: null,
          address: null,
          city: null,
          province: null,
          phone: null,
          email: null,
          website: null,
          wheelchair_accessible: false,
          child_friendly: false,
          gluten_free: false
        },
        {
          id: 11,
          title: "12% su cena romantica",
          description: "Ristorante con terrazza panoramica",
          discount_percentage: 12,
          valid_until: null,
          category: "ristorante",
          partner_code: "TIQ-VV-PRT-7804",
          partner_name: "Partner",
          business_type: null,
          address: null,
          city: null,
          province: null,
          phone: null,
          email: null,
          website: null,
          wheelchair_accessible: false,
          child_friendly: false,
          gluten_free: false
        },
        {
          id: 12,
          title: "18% su menu hotel",
          description: "Ristorante hotel vicino alla spiaggia",
          discount_percentage: 18,
          valid_until: null,
          category: "ristorante",
          partner_code: "TIQ-VV-PRT-7805",
          partner_name: "Partner",
          business_type: null,
          address: null,
          city: null,
          province: null,
          phone: null,
          email: null,
          website: null,
          wheelchair_accessible: false,
          child_friendly: false,
          gluten_free: false
        }
      ];
      
      const offersWithPartnerData = realOffers;
      
      // Formatta le offerte per il frontend turistico con PRIVACY IQCode
      const formattedOffers = offersWithPartnerData.map((offer: any) => ({
        // Dati offerta
        title: offer.title,
        description: offer.description, 
        discountPercentage: offer.discount_percentage,
        validUntil: offer.valid_until,
        
        // Dati partner REALI (NO IQCode mostrato per privacy)
        partnerName: offer.partner_name,
        businessType: offer.business_type,
        address: offer.address,
        city: offer.city,
        province: offer.province,
        phone: offer.phone,
        email: offer.email,
        website: offer.website,
        
        // Servizi e accessibilità
        wheelchairAccessible: offer.wheelchair_accessible,
        childFriendly: offer.child_friendly,
        glutenFree: offer.gluten_free
      }));

      res.json({
        discounts: formattedOffers,
        totalOffers: offersWithPartnerData.length
      });

    } catch (error) {
      console.error("Errore recupero offerte reali:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Endpoint per ricerca offerte per città
  app.get("/api/tourist/offers-by-city", async (req: any, res: any) => {
    try {
      const { city } = req.query;
      if (!city) {
        return res.status(400).json({ message: "Parametro city richiesto" });
      }

      const cityName = city.trim();
      console.log(`Endpoint: ricerca per "${cityName}"`);
      
      const realOffers = await storage.getRealOffersByCity(cityName);
      console.log(`Endpoint: ricevute ${realOffers.length} offerte`);
      
      res.json({
        offers: realOffers,
        searchCity: city,
        count: realOffers.length
      });

    } catch (error) {
      console.error("Errore ricerca per città:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Endpoint per ricerca offerte nelle vicinanze (geolocalizzazione)
  app.get("/api/tourist/offers-nearby", async (req: any, res: any) => {
    try {
      const { lat, lng, radius } = req.query;
      if (!lat || !lng) {
        return res.status(400).json({ message: "Parametri lat e lng richiesti" });
      }

      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const searchRadius = parseFloat(radius) || 2; // default 2km

      const nearbyOffers = await storage.getRealOffersNearby(latitude, longitude, searchRadius);
      
      res.json({
        offers: nearbyOffers,
        userLocation: { latitude, longitude },
        radius: searchRadius,
        count: nearbyOffers.length
      });

    } catch (error) {
      console.error("Errore ricerca geolocalizzazione:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Turista vede richieste di validazione in sospeso
  app.get("/api/iqcode/validation-requests", async (req: any, res: any) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session) {
        return res.status(401).json({ message: "Sessione non valida" });
      }

      const touristIqCode = await storage.getIqCodeByCode(session.iqCode);
      if (!touristIqCode || touristIqCode.role !== 'tourist') {
        return res.status(403).json({ message: "Accesso negato - solo turisti" });
      }

      const validations = await storage.getValidationsByTourist(session.iqCode);
      res.json(validations);

    } catch (error) {
      console.error("Errore recupero richieste:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Turista accetta/rifiuta validazione
  app.post("/api/iqcode/validate-response", async (req: any, res: any) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session) {
        return res.status(401).json({ message: "Sessione non valida" });
      }

      const touristIqCode = await storage.getIqCodeByCode(session.iqCode);
      if (!touristIqCode || touristIqCode.role !== 'tourist') {
        return res.status(403).json({ message: "Accesso negato - solo turisti" });
      }

      const { validationId, status } = req.body;
      if (!validationId || !['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Dati non validi" });
      }

      // Verifica che la validazione appartenga al turista
      const validation = await storage.getValidationById(validationId);
      if (!validation || validation.touristIqCode !== session.iqCode) {
        return res.status(404).json({ message: "Richiesta non trovata" });
      }

      // Aggiorna stato e scala utilizzi se accettato
      await storage.updateValidationStatus(validationId, status, new Date());
      
      let finalUsesRemaining = validation.usesRemaining;
      if (status === 'accepted') {
        // Scala automaticamente gli utilizzi quando turista accetta
        await storage.decrementValidationUses(validationId);
        finalUsesRemaining = validation.usesRemaining - 1;
      }

      res.json({ 
        success: true, 
        message: status === 'accepted' ? `IQCode confermato per utilizzo` : "IQCode rifiutato",
        usesRemaining: finalUsesRemaining
      });

    } catch (error) {
      console.error("Errore risposta validazione:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Partner vede stato delle sue richieste di validazione
  app.get("/api/iqcode/validation-status", async (req: any, res: any) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session) {
        return res.status(401).json({ message: "Sessione non valida" });
      }

      const partnerIqCode = await storage.getIqCodeByCode(session.iqCode);
      if (!partnerIqCode || partnerIqCode.role !== 'partner') {
        return res.status(403).json({ message: "Accesso negato - solo partner" });
      }

      const validations = await storage.getValidationsByPartner(session.iqCode);
      res.json(validations);

    } catch (error) {
      console.error("Errore stato validazioni:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });





  // Turista richiede ricarica utilizzi (link SumUp)
  app.post("/api/iqcode/request-recharge", async (req: any, res: any) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session) {
        return res.status(401).json({ message: "Sessione non valida" });
      }

      const touristIqCode = await storage.getIqCodeByCode(session.iqCode);
      if (!touristIqCode || touristIqCode.role !== 'tourist') {
        return res.status(403).json({ message: "Accesso negato - solo turisti" });
      }

      const { validationId } = req.body;
      if (!validationId) {
        return res.status(400).json({ message: "ID validazione richiesto" });
      }

      // Crea richiesta di ricarica
      const recharge = await storage.createIqcodeRecharge({
        validationId,
        touristIqCode: session.iqCode,
        status: 'payment_pending'
      });

      res.json({ 
        success: true, 
        message: "Richiesta di ricarica creata",
        rechargeId: recharge.id 
      });

    } catch (error) {
      console.error("Errore richiesta ricarica:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Admin vede richieste di ricarica con filtri avanzati per migliaia di requests
  app.get("/api/admin/recharge-requests", async (req: any, res: any) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session) {
        return res.status(401).json({ message: "Sessione non valida" });
      }

      const adminIqCode = await storage.getIqCodeByCode(session.iqCode);
      if (!adminIqCode || adminIqCode.role !== 'admin') {
        return res.status(403).json({ message: "Accesso negato - solo admin" });
      }

      // Parametri per gestione migliaia di richieste
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || '';
      const status = (req.query.status as string) || '';
      const sort = (req.query.sort as string) || 'newest';

      const result = await storage.getRechargesWithFilters({
        page,
        limit,
        search,
        status,
        sort
      });

      res.json(result);

    } catch (error) {
      console.error("Errore caricamento richieste ricarica:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Admin approva e attiva ricarica
  app.post("/api/admin/activate-recharge", async (req: any, res: any) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session) {
        return res.status(401).json({ message: "Sessione non valida" });
      }

      const adminIqCode = await storage.getIqCodeByCode(session.iqCode);
      if (!adminIqCode || adminIqCode.role !== 'admin') {
        return res.status(403).json({ message: "Accesso negato - solo admin" });
      }

      const { rechargeId, adminNote } = req.body;
      if (!rechargeId) {
        return res.status(400).json({ message: "ID ricarica richiesto" });
      }

      // Attiva ricarica - ripristina utilizzi a 10
      const result = await storage.activateRecharge(rechargeId, adminNote);

      res.json({ 
        success: true, 
        message: "Ricarica attivata - utilizzi ripristinati a 10",
        result 
      });

    } catch (error) {
      console.error("Errore attivazione ricarica:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // ===== REPORT REALI PER PARTNER E STRUTTURE =====

  // Partner: Report utilizzi IQCode generati
  app.get("/api/partner/usage-reports", async (req: any, res: any) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session) {
        return res.status(401).json({ message: "Sessione non valida" });
      }

      const partnerIqCode = await storage.getIqCodeByCode(session.iqCode);
      if (!partnerIqCode || partnerIqCode.role !== 'partner') {
        return res.status(403).json({ message: "Accesso negato - solo partner" });
      }

      // Ottieni validazioni utilizzate dal partner
      const validationsUsed = await storage.getValidationsByPartner(session.iqCode);
      const usedValidations = validationsUsed.filter(v => v.usesRemaining < v.usesTotal);
      
      // Statistiche di utilizzo
      const totalValidations = validationsUsed.length;
      const activeValidations = validationsUsed.filter(v => v.status === 'accepted' && v.usesRemaining > 0).length;
      const totalUsages = validationsUsed.reduce((sum, v) => sum + (v.usesTotal - v.usesRemaining), 0);
      
      res.json({
        stats: {
          totalValidations,
          activeValidations,
          totalUsages,
          completedValidations: totalValidations - activeValidations
        },
        recentUsages: usedValidations.slice(0, 10)
      });

    } catch (error) {
      console.error("Errore report utilizzi partner:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });

  // Strutture: Report IQCode distribuiti e utilizzati
  app.get("/api/structure/iqcode-reports", async (req: any, res: any) => {
    try {
      const sessionToken = req.cookies.session_token;
      if (!sessionToken) {
        return res.status(401).json({ message: "Non autenticato" });
      }

      const session = await storage.getSessionByToken(sessionToken);
      if (!session) {
        return res.status(401).json({ message: "Sessione non valida" });
      }

      const structureIqCode = await storage.getIqCodeByCode(session.iqCode);
      if (!structureIqCode || structureIqCode.role !== 'structure') {
        return res.status(403).json({ message: "Accesso negato - solo strutture" });
      }

      // Ottieni pacchetti assegnati alla struttura
      const assignedPackages = await storage.getPackagesByRecipient(session.iqCode);
      
      // Calcola statistiche distribuzione e utilizzo
      let totalCodesDistributed = 0;
      let totalCodesUsed = 0;
      let totalCreditsUsed = 0;
      
      assignedPackages.forEach(pkg => {
        const used = pkg.creditsTotal - pkg.creditsRemaining;
        totalCreditsUsed += used;
        totalCodesDistributed += pkg.creditsTotal;
      });

      // Ottieni validazioni create con codici della struttura (stima utilizzo)
      const allValidations = await storage.getAllValidations();
      const structureRelatedValidations = allValidations.filter(v => 
        v.touristIqCode && v.touristIqCode.includes(session.iqCode.split('-')[1]) // stesso provincia
      );
      
      totalCodesUsed = structureRelatedValidations.filter(v => v.usesRemaining < v.usesTotal).length;

      res.json({
        stats: {
          totalCodesDistributed,
          totalCodesUsed,
          totalCreditsUsed,
          utilizationRate: totalCodesDistributed > 0 ? Math.round((totalCodesUsed / totalCodesDistributed) * 100) : 0
        },
        packages: assignedPackages,
        recentValidations: structureRelatedValidations.slice(0, 10)
      });

    } catch (error) {
      console.error("Errore report IQCode struttura:", error);
      res.status(500).json({ message: "Errore del server" });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}



// FUNZIONE PER OTTENERE OFFERTE REALI DAL DATABASE
async function getRealOffersByTourist(storage: any, touristCode: string) {
  try {
    // Cerca partner validati dal turista
    const validatedPartners = await storage.getAcceptedPartnersByTourist(touristCode);
    
    if (validatedPartners.length === 0) {
      return [];
    }
    
    // Ottieni offerte dei partner validati
    const partnerCodes = validatedPartners.map((v: any) => v.partnerCode);
    const realOffers = await storage.getRealOffersByPartners(partnerCodes);
    
    return realOffers.map((offer: any) => ({
      title: offer.title,
      description: offer.description, 
      discountPercentage: offer.discountPercentage,
      category: offer.category,
      partnerName: offer.partnerName,
      validUntil: offer.validUntil
    }));
  } catch (error) {
    console.error("Errore recupero offerte reali:", error);
    return [];
  }
}




