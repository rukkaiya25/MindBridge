const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'mindbridge_secret_key';

// AUTH MIDDLEWARE
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: 'Token missing' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

// ADD DAILY CHECK-IN
router.post('/', verifyToken, (req, res) => {
    const { mood, stress, note } = req.body;

    if (mood == null || stress == null) {
        return res.status(400).json({ message: 'Mood and stress are required' });
    }

    const checkSql = `
    SELECT id FROM daily_checkins
    WHERE user_id = ? AND date = CURDATE()
  `;

    db.query(checkSql, [req.userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }

        if (result.length > 0) {
            return res.status(400).json({
                message: 'You have already submitted today’s check-in'
            });
        }

        const insertSql = `
      INSERT INTO daily_checkins (user_id, mood, stress, note, date)
      VALUES (?, ?, ?, ?, CURDATE())
    `;

        db.query(
            insertSql,
            [req.userId, mood, stress, note || null],
            (err) => {
                if (err) {
                    return res.status(500).json({ message: 'Failed to save check-in' });
                }
                res.json({ message: 'Check-in saved successfully' });
            }
        );
    });
});

// GET ALL CHECK-INS
router.get('/', verifyToken, (req, res) => {
    const sql = `
    SELECT date, mood, stress, note
    FROM daily_checkins
    WHERE user_id = ?
    ORDER BY date ASC
  `;

    db.query(sql, [req.userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        res.json(result);
    });
});

// GET TODAY / LATEST CHECK-IN
router.get('/latest', verifyToken, (req, res) => {
    const sql = `
    SELECT mood, stress, note, date
    FROM daily_checkins
    WHERE user_id = ?
    ORDER BY date DESC
    LIMIT 1
  `;

    db.query(sql, [req.userId], (err, result) => {
        if (err) {
            return res.status(500).json({ message: 'Database error' });
        }
        res.json(result[0] || null);
    });
});

module.exports = router;
