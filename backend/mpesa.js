require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const moment = require('moment');
const fs = require('fs');

const router = express.Router();
router.use(cors());

// ── 1) Load existing callback data (if any) ──────────────────────────────
const CALLBACK_STORE = '.stkcallback.json';
const paymentStatusMap = {};
try {
  const raw = fs.readFileSync(CALLBACK_STORE, 'utf8');
  Object.assign(paymentStatusMap, JSON.parse(raw));
  console.log('Loaded existing callbacks:', Object.keys(paymentStatusMap).length);
} catch {
  console.log('No existing callback file, starting fresh');
}

// ── 2) Your Daraja credentials & URLs ────────────────────────────────────
const consumerKey    = "kAdXZtxqBttVre3AekGkKMGJeuGg7dNW6VKQPFqOP2ZY2paj";
const consumerSecret = "AB6xFV0iFXO5KYYkAe6SLoXdusPq0Rz90IbKI3WS0GGKM5aYHQRur4p4ATsUN7RL";
const passkey        = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
const shortcode      = "174379";
const envUrl         = "https://sandbox.safaricom.co.ke";
const callbackUrl    = "https://df71-105-161-146-57.ngrok-free.app/api/callback";

// ── Helper to get an OAuth token ─────────────────────────────────────────
async function getAccessToken() {
  const url  = `${envUrl}/oauth/v1/generate?grant_type=client_credentials`;
  const auth = "Basic " + Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  const res  = await axios.get(url, { headers: { Authorization: auth } });
  return res.data.access_token;
}

// ── 3) STK Push endpoint ─────────────────────────────────────────────────
router.post('/api/stkpush', async (req, res) => {
  try {
    const { phone, accountReference, amount, description } = req.body;
    if (!phone || !accountReference || !amount) {
      return res.status(400).json({ status: false, msg: 'Missing parameters' });
    }

    // Normalize phone to 254...
    let msisdn = phone.startsWith('0') ? '254' + phone.slice(1) : phone;

    const token     = await getAccessToken();
    const timestamp = moment().format('YYYYMMDDHHmmss');
    const password  = Buffer.from(shortcode + passkey + timestamp).toString('base64');

    const { data } = await axios.post(
      `${envUrl}/mpesa/stkpush/v1/processrequest`,
      {
        BusinessShortCode: shortcode,
        Password:          password,
        Timestamp:         timestamp,
        TransactionType:   'CustomerPayBillOnline',
        Amount:            amount,
        PartyA:            msisdn,
        PartyB:            shortcode,
        PhoneNumber:       msisdn,
        CallBackURL:       callbackUrl,
        AccountReference:  accountReference,
        TransactionDesc:   description || 'Dar Al-Arqam'
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Return the CheckoutRequestID so frontend can poll against it
    res.json({ status: true, data, checkoutRequestID: data.CheckoutRequestID });
  } catch (err) {
    console.error('STK Push error:', err.response?.data || err.message);
    res.status(500).json({
      status: false,
      msg:     'STK Push failed',
      error:   err.response?.data || err.message
    });
  }
});

// ── 4) Callback endpoint ─────────────────────────────────────────────────
router.post('/api/callback', (req, res) => {
  try {
    const body      = req.body.Body.stkCallback;
    const checkout  = body.CheckoutRequestID;

    // Store in-memory
    paymentStatusMap[checkout] = body;

    // Persist entire map
    fs.writeFileSync(CALLBACK_STORE, JSON.stringify(paymentStatusMap, null, 2));

    console.log('STK Callback received:', body);
    // Acknowledge receipt to Safaricom
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    console.error('Callback error:', err);
    res.status(500).end();
  }
});

// ── 5) Polling endpoint ──────────────────────────────────────────────────
router.get('/api/payment-status', (req, res) => {
  const id = req.query.checkoutRequestID

  if (!id) {
    return res.status(400).json({
      paid:    false,
      message: 'Missing checkoutRequestID'
    });
  }

  const status = paymentStatusMap[id];
  if (!status) {
    return res.json({
      paid:    false,
      message: `No callback yet for ${id}`
    });
  }

  if (status.ResultCode === 0) {
    return res.json({
      paid:    true,
      message: status.ResultDesc
    });
  } else {
    return res.json({
      paid:    false,
      message: status.ResultDesc || 'Failed'
    });
  }
});


module.exports = router;
