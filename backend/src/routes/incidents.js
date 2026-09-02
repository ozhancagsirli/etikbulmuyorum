import { spamFilter } from '../spamFilter.js';
import { Router } from 'express';
import { body, param, validationResult } from 'express-validator';
import pool from '../db/pool.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = Router();
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  next();
};

router.get('/subjects/search', async (req, res, next) => {
  try {
    const q = req.query.q || '';
    if (q.length < 2) return res.json([]);
    const { rows } = await pool.query(
      'SELECT name, count FROM subjects WHERE name ILIKE $1 ORDER BY count DESC LIMIT 8',
      ['%' + q + '%']
    );
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const page    = parseInt(req.query.page) || 1;
    const limit   = Math.min(parseInt(req.query.limit) || 15, 15);
    const offset  = (page - 1) * limit;
    const sort    = req.query.sort || 'newest';
    const search  = req.query.search;
    const category = req.query.category;
    const subject  = req.query.subject;

    const params  = ['approved'];
    const filters = ['i.status = $1'];

    if (category) { params.push(category); filters.push('c.slug = $' + params.length); }
    if (subject)  { params.push(subject);  filters.push('i.subject ILIKE $' + params.length); }
    if (req.query.person) { params.push(req.query.person); filters.push('i.person_name ILIKE $' + params.length); }
    if (search)   { params.push('%' + search + '%'); filters.push('(i.title ILIKE $' + params.length + ' OR i.description ILIKE $' + params.length + ' OR i.subject ILIKE $' + params.length + ')'); }

    const orderMap = {
      newest: 'i.created_at DESC',
      most_voted: '(i.vote_ethical + i.vote_unethical) DESC',
      most_discussed: 'comment_count DESC',
    };

    const where = filters.join(' AND ');
    const sql = `
      SELECT i.id, i.title, i.description, i.location, i.is_anonymous,
        i.vote_ethical, i.vote_unethical, i.view_count, i.created_at,
        i.images, i.tags, i.subject, i.person_name, i.instagram_username, i.instagram_avatar, i.instagram_verified, i.instagram_followers, i.trust_score, (SELECT avatar_url FROM subjects WHERE name = i.subject LIMIT 1) AS subject_avatar,
        c.slug AS category_slug, c.name_tr AS category_name, c.icon AS category_icon,
        CASE WHEN i.is_anonymous THEN NULL ELSE u.name END AS author_name,
        CASE WHEN i.is_anonymous THEN NULL ELSE u.avatar_url END AS author_avatar,
        COUNT(cm.id)::INT AS comment_count
      FROM incidents i
      LEFT JOIN categories c ON c.id = i.category_id
      
      LEFT JOIN users u ON u.id = i.author_id
      LEFT JOIN comments cm ON cm.incident_id = i.id AND NOT cm.is_removed
      WHERE ${where}
      GROUP BY i.id, c.slug, c.name_tr, c.icon, u.name, u.avatar_url
      ORDER BY ${orderMap[sort] || orderMap.newest}
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    params.push(limit, offset);

    const countSql = 'SELECT COUNT(DISTINCT i.id)::INT AS total FROM incidents i LEFT JOIN categories c ON c.id = i.category_id WHERE ' + where;

    const [{ rows }, { rows: countRows }] = await Promise.all([
      pool.query(sql, params),
      pool.query(countSql, params.slice(0, -2)),
    ]);

    res.json({ data: rows, total: countRows[0].total, page, pages: Math.ceil(countRows[0].total / limit) });
  } catch (err) { next(err); }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT i.id, i.title, i.description, i.location, i.incident_date, i.is_anonymous,
        i.vote_ethical, i.vote_unethical, i.view_count, i.status, i.created_at,
        i.images, i.tags, i.subject, i.person_name, i.instagram_username, i.instagram_avatar, i.instagram_verified, i.instagram_followers, i.trust_score, (SELECT avatar_url FROM subjects WHERE name = i.subject LIMIT 1) AS subject_avatar,
        c.slug AS category_slug, c.name_tr AS category_name, c.icon AS category_icon,
        CASE WHEN i.is_anonymous THEN NULL ELSE u.name END AS author_name,
        CASE WHEN i.is_anonymous THEN NULL ELSE u.avatar_url END AS author_avatar,
        CASE WHEN i.is_anonymous THEN NULL ELSE u.id END AS author_id
      FROM incidents i
      LEFT JOIN categories c ON c.id = i.category_id
      
      LEFT JOIN users u ON u.id = i.author_id
      WHERE i.id = $1
    `, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Olay bulunamadı.' });
    pool.query('UPDATE incidents SET view_count = view_count + 1 WHERE id = $1', [req.params.id]);
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.post('/', authenticate, spamFilter, async (req, res, next) => {
  try {
    const { title, description, categoryId, location, incidentDate, isAnonymous, images, tags, subject, person_name, instagram_username, instagram_avatar, instagram_verified, instagram_followers } = req.body;
    if (!title || title.length < 3) return res.status(422).json({ error: 'Başlık en az 3 karakter olmalı.' });
    if (!description || description.length < 50) return res.status(422).json({ error: 'Açıklama en az 50 karakter olmalı.' });
    if (!categoryId) return res.status(422).json({ error: 'Kategori gerekli.' });
    const { rows } = await pool.query(`
      INSERT INTO incidents (author_id, category_id, title, description, location, incident_date, is_anonymous, status, images, tags, subject, person_name, instagram_username, instagram_avatar, instagram_verified, instagram_followers)
      VALUES ($1,$2,$3,$4,$5,$6,$7,'pending',$8,$9,$10,$11,$12,$13,$14,$15)
      RETURNING id, title, status, created_at
    `, [req.user.id, categoryId, title, description, location||null, incidentDate||null, isAnonymous||false, images||[], tags||[], subject||null, person_name||null, instagram_username||null, instagram_avatar||null, instagram_verified||false, instagram_followers||0]);
    if (subject) {
      await pool.query(
        'INSERT INTO subjects (name, count) VALUES ($1, 1) ON CONFLICT (name) DO UPDATE SET count = subjects.count + 1',
        [subject.trim()]
      );
    }
    // Subjects tablosunu güncelle — profil otomatik oluşsun
    if (instagram_username) {
      await pool.query(`
        INSERT INTO subjects (name, instagram_username, instagram_avatar, instagram_verified, instagram_followers, category_id, count, score)
        VALUES ($1, $2, $3, $4, $5, $6, 1, 1000)
        ON CONFLICT (name) DO UPDATE SET
          instagram_username = COALESCE(EXCLUDED.instagram_username, subjects.instagram_username),
          instagram_avatar = COALESCE(EXCLUDED.instagram_avatar, subjects.instagram_avatar),
          instagram_verified = COALESCE(EXCLUDED.instagram_verified, subjects.instagram_verified),
          instagram_followers = COALESCE(EXCLUDED.instagram_followers, subjects.instagram_followers),
          category_id = COALESCE(EXCLUDED.category_id, subjects.category_id),
          count = subjects.count + 1
      `, [
        instagram_username,
        instagram_username,
        instagram_avatar || null,
        instagram_verified || false,
        instagram_followers || 0,
        categoryId || null
      ]);
    }
    res.status(201).json({ ...rows[0], message: 'Olayınız inceleme sonrası yayınlanacak!' });
  } catch (err) { next(err); }
});

// PUT /api/incidents/:id
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const { title, description, location, incidentDate, tags, subject } = req.body;
    const { rows: inc } = await pool.query('SELECT author_id, status FROM incidents WHERE id = $1', [req.params.id]);
    if (!inc.length) return res.status(404).json({ error: 'Olay bulunamadı.' });
    if (inc[0].author_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Yetkisiz.' });

    const { rows } = await pool.query(`
      UPDATE incidents SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        location = COALESCE($3, location),
        incident_date = COALESCE($4, incident_date),
        tags = COALESCE($5, tags),
        subject = COALESCE($6, subject),
        status = 'pending',
        updated_at = NOW()
      WHERE id = $7
      RETURNING id, title, status
    `, [title||null, description||null, location||null, incidentDate||null, tags||null, subject||null, req.params.id]);

    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT author_id FROM incidents WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Olay bulunamadı.' });
    if (rows[0].author_id !== req.user.id && req.user.role === 'user') return res.status(403).json({ error: 'Yetkiniz yok.' });
    await pool.query("UPDATE incidents SET status = 'removed', updated_at = NOW() WHERE id = $1", [req.params.id]);
    res.json({ message: 'Olay kaldırıldı.' });
  } catch (err) { next(err); }
});

// GET /api/incidents/persons/search
router.get('/persons/search', async (req, res, next) => {
  try {
    const q = req.query.q || '';
    if (q.length < 2) return res.json([]);
    const { rows } = await pool.query(
      'SELECT name, profession, count FROM persons WHERE name ILIKE $1 ORDER BY count DESC LIMIT 8',
      ['%' + q + '%']
    );
    res.json(rows);
  } catch (err) { next(err); }
});

export default router;
// Bu satırı export default router'dan önce ekle - aslında zaten var, sadece person search ekle
