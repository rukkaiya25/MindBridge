const express = require('express');
const router = express.Router();
const db = require('../config/db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'mindbridge_secret_key';

// token verification (same logic, kept simple)
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: 'Token missing' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Invalid token' });
        }
        req.userId = decoded.id;
        next();
    });
}

/*
  GET daily stats for charts
  returns date, mood, stress
*/
router.get('/daily', verifyToken, (req, res) => {
    const sql = `
    SELECT date, mood, stress
    FROM daily_checkins
    WHERE user_id = ?
    ORDER BY date
  `;

    db.query(sql, [req.userId], (err, result) => {
        res.json(result);
    });
});

/*
  GET weekly averages
*/
router.get('/weekly', verifyToken, (req, res) => {
    const sql = `
    SELECT
      WEEK(date) AS week,
      AVG(mood) AS avgMood,
      AVG(stress) AS avgStress
    FROM daily_checkins
    WHERE user_id = ?
    GROUP BY WEEK(date)
    ORDER BY WEEK(date)
  `;

    db.query(sql, [req.userId], (err, result) => {
        res.json(result);
    });
});

module.exports = router;
