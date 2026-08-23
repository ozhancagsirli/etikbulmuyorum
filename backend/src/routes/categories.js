import { Router } from 'express';
import pool from '../db/pool.js';

const router = Router();

router.get('/', async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, slug, name_tr, name_en, icon FROM categories ORDER BY sort_order'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
