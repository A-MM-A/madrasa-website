/* app.js */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));



// ─── ROUTE IMPORTS ────────────────────────────────────────────────────────────────
const pdfRouter   = require('./routes/pdf');
const emailRouter = require('./routes/email');
const mpesaRouter = require('./routes/mpesa');



// ─── CREATE HTTP SERVER AND SOCKET.IO ─────────────────────────────────────────────
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // or your frontend URL
        methods: ["GET", "POST"]
    }
});

// Attach io so routes can use it
app.set('io', io);

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('joinPayment', (checkoutRequestID) => {
        socket.join(checkoutRequestID);
        console.log(`Client joined room: ${checkoutRequestID}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});



// ─── MOUNT ROUTES ────────────────────────────────────────────────────────────────
app.use('/api/pdf', pdfRouter);
app.use('/api/email', emailRouter);
app.use('/api/mpesa', mpesaRouter);



// ─── START THE SERVER ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🛡️  Server running on port ${PORT}`);
});


// 404
app.use((req, res, next) => res.status(404).json({ error: 'Not found' }));

// 500
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});