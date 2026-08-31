import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { testConnection } from './db/pool.js';
import authRoutes from './routes/auth.js';
import incidentRoutes from './routes/incidents.js';
import voteRoutes from './routes/votes.js';
import commentRoutes from './routes/comments.js';
import categoryRoutes from './routes/categories.js';
import moderationRoutes from './routes/moderation.js';
import userRoutes from './routes/users.js';
import uploadRoutes from './routes/upload.js';
import sitemapRoutes from './routes/sitemap.js';
import statsRoutes from './routes/stats.js';
import notificationRoutes from './routes/notifications.js';
import leaderboardRoutes from './routes/leaderboard.js';
import aiRoutes from './routes/ai.js';
import passwordResetRoutes from './routes/passwordReset.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('combined'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false }));

app.use('/api/auth', authRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/auth', passwordResetRoutes);
app.use('/', sitemapRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: new Date() }));
app.use((_req, res) => res.status(404).json({ error: 'Endpoint bulunamadi.' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Sunucu hatasi.' });
});

(async () => {
  await testConnection();
  app.listen(PORT, () => console.log('API running on port ' + PORT));
})();
