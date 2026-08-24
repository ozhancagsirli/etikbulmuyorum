import { Router } from 'express';
import pool from '../db/pool.js';

const router = Router();

router.get('/sitemap.xml', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT id, updated_at FROM incidents WHERE status = 'approved' ORDER BY updated_at DESC LIMIT 1000
    `);

    const urls = [
      { loc: 'https://etikbulmuyorum.com/', priority: '1.0', changefreq: 'daily' },
      { loc: 'https://etikbulmuyorum.com/bildir', priority: '0.8', changefreq: 'monthly' },
      { loc: 'https://etikbulmuyorum.com/istatistik', priority: '0.7', changefreq: 'daily' },
      ...rows.map(r => ({
        loc: `https://etikbulmuyorum.com/olay/${r.id}`,
        lastmod: new Date(r.updated_at).toISOString().split('T')[0],
        priority: '0.6',
        changefreq: 'weekly',
      })),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url>
    <loc>${u.loc}</loc>
    ${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) { next(err); }
});

export default router;
