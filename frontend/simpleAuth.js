// simpleAuth.js
const express = require('express');
const router  = express.Router();

// In a real system, you'd store this in process.env or a DB:
const SECRET_PASSWORD = 'letmein123';

router.use(express.json());

// POST /api/validate-password
// Body: { password: '...' }
// Response: { valid: true, message: 'Welcome!' } or { valid: false, message: 'Wrong password' }
router.post('/api/validate-password', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ valid: false, message: 'Password is required' });
  }
  if (password === SECRET_PASSWORD) {
    return res.json({ valid: true, message: '✅ Password correct!' });
  } else {
    return res.json({ valid: false, message: '❌ Incorrect password.' });
  }
});

module.exports = router;
