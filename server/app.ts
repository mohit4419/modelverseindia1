import express, { Request, Response } from 'express';
import morgan from 'morgan';

import { setupSecurityMiddlewares } from './middleware/security';
import { requestDebugLogger } from './utils/debug';
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
import blogsRoutesV2 from './routes/blogs.routes';

const app = express();

// Trust the reverse proxy so express-rate-limit can accurately resolve client IPs behind ingress routing layers
app.set('trust proxy', true);

// Standard Morgan Logger & Security/CORS/Helmet middleware layers
app.use(morgan('combined'));
setupSecurityMiddlewares(app);

// JSON body parser with rawBuffer access required to match signatures for webhooks
app.use(express.json({
  limit: '50mb',
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(requestDebugLogger);

// Mount v2 routers (New Core Architecture) FIRST at /api/v2 and /api
app.use('/api/v2', authRoutesV2);
app.use('/api/v2', modelsRoutesV2);
app.use('/api/v2', bookingsRoutesV2);
app.use('/api/v2', usersRoutesV2);
app.use('/api/v2', adminRoutesV2);
app.use('/api/v2', paymentsRoutesV2);
app.use('/api/v2', reviewsRoutesV2);
app.use('/api/v2', notificationsRoutesV2);
app.use('/api/v2', chatRoutesV2);
app.use('/api/v2', uploadRoutesV2);
app.use('/api/v2', categoriesRoutesV2);
app.use('/api/v2', skillsRoutesV2);
app.use('/api/v2', portfolioRoutesV2);
app.use('/api/v2', favoritesRoutesV2);
app.use('/api/v2', dashboardRoutesV2);
app.use('/api/v2', analyticsRoutesV2);
app.use('/api/v2', subscriptionsRoutesV2);
app.use('/api/v2', reportsRoutesV2);
app.use('/api/v2', blogsRoutesV2);

// Mount v1/legacy routers and /api fallback
app.use('/api', authRoutesV2);
app.use('/api', modelsRoutesV2);
app.use('/api', bookingsRoutesV2);
app.use('/api', usersRoutesV2);
app.use('/api', adminRoutesV2);
app.use('/api', paymentsRoutesV2);
app.use('/api', reviewsRoutesV2);
app.use('/api', notificationsRoutesV2);
app.use('/api', chatRoutesV2);
app.use('/api', uploadRoutesV2);
app.use('/api', categoriesRoutesV2);
app.use('/api', skillsRoutesV2);
app.use('/api', portfolioRoutesV2);
app.use('/api', favoritesRoutesV2);
app.use('/api', dashboardRoutesV2);
app.use('/api', analyticsRoutesV2);
app.use('/api', subscriptionsRoutesV2);
app.use('/api', reportsRoutesV2);
app.use('/api', blogsRoutesV2);

app.use('/api', authRouter);
app.use('/api', paymentRouter);
app.use('/api', chatRouter);
app.use('/api', aiRouter);
app.use('/api', talentRouter);
app.use('/api', healthRouter);
app.use('/', sitemapRouter);


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
