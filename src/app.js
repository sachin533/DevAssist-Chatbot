import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import contactsRouter from './routes/contacts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const app = express();

app.use(express.json({ limit: '1mb' }));

// Enable CORS only when a separate Vite dev origin is configured.
if (process.env.CORS_ORIGIN) {
  app.use(cors({ origin: process.env.CORS_ORIGIN }));
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/contacts', contactsRouter);

// 404 for unknown API routes
app.use('/api', (_req, res) => res.status(404).json({ message: 'API route not found.' }));

// Serve built Vue SPA (client/dist copied to public/) — one process serves API + UI.
const staticDir = fs.existsSync(path.join(projectRoot, 'public', 'index.html'))
  ? path.join(projectRoot, 'public')
  : path.join(projectRoot, 'client', 'dist');

if (fs.existsSync(path.join(staticDir, 'index.html'))) {
  app.use(express.static(staticDir));
  app.get('*', (_req, res) => res.sendFile(path.join(staticDir, 'index.html')));
} else {
  app.get('/', (_req, res) =>
    res.json({ message: 'Phonebook API running. Build the Vue client into public/ to serve the UI.' }),
  );
}

// Central error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: 'Internal server error.' });
});

export default app;
