import express, { Request, Response } from 'express';
import morgan from 'morgan';

import { setupSecurityMiddlewares } from './middleware/security';
import authRouter from './routes/auth';
import paymentRouter from './routes/payment';
import chatRouter from './routes/chat';
import aiRouter from './routes/ai';
import talentRouter from './routes/talent';
import sitemapRouter from './routes/sitemap';
import healthRouter from './routes/health';

// Import new architectural routes (V2)
import authRoutesV2 from './routes/auth.routes';
import modelsRoutesV2 from './routes/models.routes';
import bookingsRoutesV2 from './routes/bookings.routes';
import usersRoutesV2 from './routes/users.routes';
import adminRoutesV2 from './routes/admin.routes';
import paymentsRoutesV2 from './routes/payments.routes';
import reviewsRoutesV2 from './routes/reviews.routes';
import notificationsRoutesV2 from './routes/notifications.routes';
import chatRoutesV2 from './routes/chat.routes';
import uploadRoutesV2 from './routes/upload.routes';
import categoriesRoutesV2 from './routes/categories.routes';
import skillsRoutesV2 from './routes/skills.routes';
import portfolioRoutesV2 from './routes/portfolio.routes';
import favoritesRoutesV2 from './routes/favorites.routes';
import dashboardRoutesV2 from './routes/dashboard.routes';
import analyticsRoutesV2 from './routes/analytics.routes';
import subscriptionsRoutesV2 from './routes/subscriptions.routes';
import reportsRoutesV2 from './routes/reports.routes';

const app = express();

// Trust the reverse proxy so express-rate-limit can accurately resolve client IPs behind ingress routing layers
app.set('trust proxy', true);

// Standard Morgan Logger & Security/CORS/Helmet middleware layers
app.use(morgan('combined'));
setupSecurityMiddlewares(app);

// JSON body parser with rawBuffer access required to match signatures for webhooks
app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));

// Mount v1 routers (Backward Compatibility)
app.use('/api', authRouter);
app.use('/api', paymentRouter);
app.use('/api', chatRouter);
app.use('/api', aiRouter);
app.use('/api', talentRouter);
app.use('/api', healthRouter);
app.use('/', sitemapRouter);

// Mount v2 routers (New Core Architecture)
const apiPrefixes = ['/api', '/api/v2'];
for (const prefix of apiPrefixes) {
  app.use(prefix, authRoutesV2);
  app.use(prefix, modelsRoutesV2);
  app.use(prefix, bookingsRoutesV2);
  app.use(prefix, usersRoutesV2);
  app.use(prefix, adminRoutesV2);
  app.use(prefix, paymentsRoutesV2);
  app.use(prefix, reviewsRoutesV2);
  app.use(prefix, notificationsRoutesV2);
  app.use(prefix, chatRoutesV2);
  app.use(prefix, uploadRoutesV2);
  app.use(prefix, categoriesRoutesV2);
  app.use(prefix, skillsRoutesV2);
  app.use(prefix, portfolioRoutesV2);
  app.use(prefix, favoritesRoutesV2);
  app.use(prefix, dashboardRoutesV2);
  app.use(prefix, analyticsRoutesV2);
  app.use(prefix, subscriptionsRoutesV2);
  app.use(prefix, reportsRoutesV2);
}


// Secure Callback route for OAuth popup
app.get(['/oauth-callback', '/oauth-callback/'], (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Authenticating...</title>
    </head>
    <body style="background-color: #121212; color: #ffffff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
      <div style="text-align: center; padding: 20px;">
        <p style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">Authenticating with Google...</p>
        <p style="font-size: 14px; color: #a0a0a0;">This window will close automatically once authentication is completed.</p>
      </div>
      <script>
        console.log("OAuth popup callback loaded, hash:", window.location.hash);
        if (window.opener) {
          window.opener.postMessage({ 
            type: 'OAUTH_AUTH_SUCCESS', 
            hash: window.location.hash,
            search: window.location.search
          }, '*');
          window.close();
        } else {
          window.location.href = '/';
        }
      </script>
    </body>
    </html>
  `);
});

export { app };
