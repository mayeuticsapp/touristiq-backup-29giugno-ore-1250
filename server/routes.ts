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
      
      // Generate new code
      const { createIQCode } = await import("./createIQCode");
      const result = await createIQCode(codeType, role, location, assignedTo || "");
      
      res.json(result);
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
      const users = allCodes.map(code => ({
        id: code.id,
        code: code.code,
        role: code.role,
        assignedTo: code.assignedTo,
        location: code.location,
        codeType: code.codeType,
        isActive: code.isActive,
        createdAt: code.createdAt
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

      // Verify target exists
      const allCodes = await storage.getAllIqCodes();
      const targetExists = allCodes.some(code => 
        code.role === targetType && code.code.includes(`-${targetId}`)
      );

      if (!targetExists) {
        return res.status(404).json({ message: "Destinatario non trovato" });
      }

      // Generate package codes - simplified for packages
      const generatedCodes = [];
      for (let i = 0; i < packageSize; i++) {
        try {
          // Create simple tourist codes for packages
          const packageCodeId = Math.floor(Math.random() * 9000) + 1000;
          const packageCode = `TIQ-PKG-${targetType.toUpperCase()}-${targetId}-${packageCodeId}`;
          
          const newCodeData = {
            code: packageCode,
            role: 'tourist' as const,
            assignedTo: `Pacchetto per ${targetType} ${targetId}`,
            location: 'IT',
            codeType: 'package',
            isActive: true,
            createdAt: new Date()
          };
          
          const savedCode = await storage.createIqCode(newCodeData);
          generatedCodes.push(savedCode);
        } catch (error) {
          console.error(`Errore generazione codice ${i + 1}:`, error);
          // Continue with next code if one fails
        }
      }

      // Log assignment
      console.log(`Admin ${userIqCode.code} ha assegnato pacchetto di ${packageSize} codici a ${targetType} ${targetId}`);

      res.json({
        success: true,
        message: `Pacchetto di ${packageSize} codici assegnato con successo`,
        targetType,
        targetId,
        packageSize,
        generatedCodesIds: generatedCodes.map(code => code.id),
        assignedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Errore assegnazione pacchetto:", error);
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
  
  return {
    id: structureId,
    iqCode: iqCode,
    name: (structureNames[province] && structureNames[province][seed % 3]) || `Hotel ${province} ${structureId}`,
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
