// 🛡️ Security & Performance Enhancements - C24 Strategic Implementation
import rateLimit from 'express-rate-limit';
import type { Express } from 'express';

// Rate limiting configurations per endpoint sensitivity
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per window
  message: {
    error: "Troppi tentativi di login. Riprova tra 15 minuti.",
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per minute
  message: {
    error: "Troppe richieste. Rallenta le operazioni.",
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const adminLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // Higher limit for admin operations
  message: {
    error: "Limite richieste admin superato.",
    retryAfter: 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security headers middleware
export function setupSecurityHeaders(app: Express) {
  app.use((req, res, next) => {
    // Security headers for production
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Custom TouristIQ headers
    res.setHeader('X-TouristIQ-Version', '2.0');
    res.setHeader('X-Privacy-First', 'true');
    
    next();
  });
}

// Advanced session validation
export async function validateSessionSecurity(session: any): Promise<boolean> {
  if (!session || !session.iqCode || !session.role) {
    return false;
  }
  
  // Check session expiration with buffer
  const now = new Date();
  const sessionExpiry = new Date(session.expires_at);
  if (sessionExpiry <= now) {
    return false;
  }
  
  // Validate role consistency
  const validRoles = ['admin', 'tourist', 'partner', 'structure'];
  if (!validRoles.includes(session.role)) {
    return false;
  }
  
  return true;
}

// Performance monitoring middleware
export function performanceMonitor(req: any, res: any, next: any) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log slow queries (> 1 second) for optimization
    if (duration > 1000) {
      console.warn(`🐌 SLOW REQUEST: ${req.method} ${req.path} took ${duration}ms`);
    }
    
    // Track API usage patterns for optimization
    if (req.path.startsWith('/api/')) {
      // In production, this would go to analytics service
      // For now, just track pattern in development
      if (duration > 500) {
        console.info(`📊 API METRICS: ${req.path} - ${duration}ms - ${res.statusCode}`);
      }
    }
  });
  
  next();
}

export default {
  loginLimiter,
  apiLimiter,
  adminLimiter,
  setupSecurityHeaders,
  validateSessionSecurity,
  performanceMonitor
};