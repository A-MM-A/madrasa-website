/* app.js */
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));



// ─── ROUTE IMPORTS ────────────────────────────────────────────────────────────────
const pdfRouter   = require('./routes/pdf');
const emailRouter = require('./routes/email');
const mpesaRouter = require('./routes/mpesa');


// ─── MOUNT ROUTES ────────────────────────────────────────────────────────────────
app.use('/api/pdf', pdfRouter);
app.use('/api/email', emailRouter);
app.use('/api/mpesa', mpesaRouter);



// ─── START THE SERVER ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🛡️  Server running on port ${PORT}`);
});


// 404
app.use((req, res, next) => res.status(404).json({ error: 'Not found' }));

// 500
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});