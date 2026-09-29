import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { handlers } from './src/server/handlers';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Parse JSON bodies
app.use(express.json());

// API Routes
app.post('/api/telegram/webhook', handlers.handleWebhook);
app.get('/api/telegram/image', handlers.handleImageProxy);
app.get('/api/telegram/image/:fileId', handlers.handleImageProxy);
app.post('/api/telegram/status', handlers.handleStatusUpdate);
app.get('/api/payments/sync', handlers.handleGetPending);
app.post('/api/payments/sync', handlers.handleAcknowledge);
app.get('/api/telegram/me', handlers.handleGetMe);
app.post('/api/telegram/set-webhook', handlers.handleSetWebhook);
app.post('/api/telegram/test-inbound', handlers.handleTestInbound);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    hasBotToken: Boolean(process.env.TELEGRAM_BOT_TOKEN),
  });
});

async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 TelePay Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
