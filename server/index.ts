/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import http from 'http';
import path from 'path';
import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer as createViteServer } from 'vite';

import { ENV } from './config/env';
import { app } from './app';
import { errorHandler } from './middleware/errorHandler';
import { handleLiveAudition } from './websocket/liveAudition';

const PORT = ENV.PORT;

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Setup Gemini Live API session over WebSocket
wss.on('connection', async (clientWs, request) => {
  try {
    await handleLiveAudition(clientWs, request);
  } catch (err) {
    console.error('Error handling live audition connection:', err);
    try {
      clientWs.send(JSON.stringify({ error: 'Internal connection error' }));
      clientWs.close();
    } catch (_) {}
  }
});

wss.on('error', (err) => {
  console.error('WebSocket Server error:', err);
});

async function startServer() {
  // Statically serve dynamic uploaded files
  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

  if (ENV.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: { server } // Link custom HTTP server to enable Vite HMR upgrades
      },
      appType: "spa",
    });

    app.use(vite.middlewares);
    console.log("Vite middleware mounted in Development mode.");

  } else {
    const distPath = path.join(process.cwd(), "dist");

    // Serve static frontend assets
    app.use(express.static(distPath));

    // SPA fallback (exclude /api routes from falling back to index.html)
    app.get(/^(?!\/api).*/, (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });

    console.log("Serving production build assets from /dist.");
  }

  // ✅ Error handler MUST be the last middleware
  app.use(errorHandler);

  // WebSocket
  server.on("upgrade", (request, socket, head) => {
    try {
      const pathname = (request.url || "").split("?")[0];

      if (
        pathname === "/api/live-audition" ||
        pathname.startsWith("/api/live-audition")
      ) {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request);
        });
      } else if (ENV.NODE_ENV === "production") {
        socket.destroy();
      }

    } catch (err) {
      console.error("Upgrade routing error:", err);
      socket.destroy();
    }
  });

  // Handle port conflicts gracefully
  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[Server Error] Port ${PORT} is already in use. Please terminate the conflicting process.`);
      process.exit(1);
    } else {
      console.error('[Server Error] Exception occurred:', err);
    }
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(
      `ModelVerse India server fully operational on http://localhost:${PORT}`
    );
  });
}

startServer().catch((err) => {
  console.error("Critical server startup failure:", err);
  process.exit(1);
});

export { server };
