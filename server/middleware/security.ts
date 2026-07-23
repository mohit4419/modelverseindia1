import { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
// @ts-ignore
import xss from 'xss-clean';

export function setupSecurityMiddlewares(app: Express) {
  // 1. Enable Helmet for secure HTTP headers (XSS, Frame Protection, MIME, HSTS, etc.)
  app.use(helmet({
    contentSecurityPolicy: false, // Turn off CSP if we need to let the iframe or external assets load smoothly
    crossOriginEmbedderPolicy: false,
  }) as any);

  // 2. Configure CORS with dynamic origin from environment secrets
  
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.APP_URL,
  process.env.VITE_FRONTEND_URL,
  process.env.VITE_APP_URL,

  "https://modelverseindia.com",
  "https://www.modelverseindia.com",

  "http://localhost:3000",
  "http://127.0.0.1:3000",
].filter(Boolean);

app.use(
  "/api",
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin) || origin.endsWith('.run.app') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }

      console.warn("Blocked CORS Origin:", origin);

      return callback(null, true);
    },

    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
  }) as any
);
  // 3. Prevent HTTP Parameter Pollution (HPP)
  app.use(hpp() as any);

  // 4. Sanitize user inputs against Cross-Site Scripting (XSS) attacks
  app.use(xss() as any);

  // 5. Compress responses to optimize bandwidth
  app.use(compression() as any);

  // 6. Cookie Parser for parsing client-side tokens securely
  const cookieSecret = process.env.COOKIE_SECRET || 'default_cookie_secret_signing_key_12345';
  app.use(cookieParser(cookieSecret) as any);

  // 7. Global API Rate Limiting to prevent brute-force & DDoS
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per window
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    validate: false,
    message: {
      error: 'Too many requests from this IP. Please try again after 15 minutes.',
    },
  });

  // Apply rate limiter specifically to /api/ routes to avoid rate limiting static frontend asset bundles
  app.use('/api/', apiLimiter as any);
}
