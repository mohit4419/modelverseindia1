import { Request, Response, NextFunction } from 'express';

/**
 * Server-side debug utility to log incoming request paths, headers, and body payloads
 * for model registration endpoints and related routing debug tasks.
 */
export function requestDebugLogger(req: Request, res: Response, next: NextFunction) {
  const targetPath = req.originalUrl || req.url || req.path;
  
  if (targetPath.includes('/models/register') || targetPath.includes('/register')) {
    console.log('[DEBUG] [Registration Request Intercepted]');
    console.log(`[DEBUG] Timestamp: ${new Date().toISOString()}`);
    console.log(`[DEBUG] Method: ${req.method}`);
    console.log(`[DEBUG] Original URL: ${req.originalUrl}`);
    console.log(`[DEBUG] Path: ${req.path}`);
    console.log(`[DEBUG] URL: ${req.url}`);
    console.log('[DEBUG] Request Headers:', JSON.stringify(req.headers, null, 2));
    console.log('[DEBUG] Request Body:', JSON.stringify(req.body, null, 2));
  }

  next();
}

export function logRegistrationDebug(req: Request, message: string, data?: any) {
  console.log(`[DEBUG] [Registration] ${message}`);
  console.log(`[DEBUG] Path: ${req.originalUrl || req.path}`);
  if (data !== undefined) {
    console.log('[DEBUG] Payload/Data:', JSON.stringify(data, null, 2));
  }
}
