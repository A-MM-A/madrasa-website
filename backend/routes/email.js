// email.js
const express = require('express');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');

const router = express.Router();

// Mailer setup
const EMAIL_USER = 'dar.al.arqam.admission@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS;
const DEFAULT_CC = 'amma.buisness@gmail.com';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});


async function buildPdfBytes(data) {
    // 1) Load your template PDF
    const templatePath = path.join(__dirname, '..', 'templates', 'enrollment_template.pdf');
    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);

    const [page1, page2] = pdfDoc.getPages();
    const { width, height } = page1.getSize();
    const { width: w2, height: h2 } = page2.getSize();

    // 2) Embed a standard font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 12;


    // 3) Draw text fields at coordinates

    // Student info
    page1.drawText(data.fullName || '', { x: 250, y: height - 174, size: fontSize, font });

    // Format DOB
    let dobFormatted = '';
    if (data.birthDate) {
        const [year, month, day] = data.birthDate.split('-');
        dobFormatted = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
    }
    page1.drawText(dobFormatted, { x: 250, y: height - 190, size: fontSize, font });

    page1.drawText(data.gender || '', { x: 250, y: height - 210, size: fontSize, font });
    page1.drawText(data.studentPhone || '', { x: 350, y: height - 210, size: fontSize, font });
    page1.drawText(data.address || '', { x: 250, y: height - 230, size: fontSize, font });
    page1.drawText(data.nationality || '', { x: 250, y: height - 250, size: fontSize, font });
    page1.drawText(data.studentemail || '', { x: 350, y: height - 250, size: fontSize, font });


    // Guardian info
    page1.drawText(data.guardianname || '', { x: 250, y: height - 292, size: fontSize, font });
    page1.drawText(data.representative || '', { x: 250, y: height - 315, size: fontSize, font });
    page1.drawText(data.guardianGender || '', { x: 250, y: height - 335, size: fontSize, font });
    page1.drawText(data.Occupation || '', { x: 250, y: height - 352, size: fontSize, font });
    page1.drawText(data.GuardianAddress || '', { x: 250, y: height - 370, size: fontSize, font });
    page1.drawText(data.GuardianNationality || '', { x: 250, y: height - 390, size: fontSize, font });
    page1.drawText(data.id || '', { x: 250, y: height - 412, size: fontSize, font });
    page1.drawText(data.guardianPhone || '', { x: 250, y: height - 430, size: fontSize, font });
    page1.drawText(data.email || '', { x: 250, y: height - 450, size: fontSize, font });


    // Add date of submission in DD/MM/YYYY format
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const formattedDate = `${dd}/${mm}/${yyyy}`;

    page1.drawText(formattedDate, { x: 250, y: height - 470, size: fontSize, font, color: rgb(0, 0, 1) });


    // Medical
    const medY = height - 577, yesX = 470, noX = 522;
    if (data.medical === '1') {
        page1.drawText('X', { x: yesX, y: medY, size: fontSize, font, color: rgb(1, 0, 0) });
    } else {
        page1.drawText('X', { x: noX, y: medY, size: fontSize, font, color: rgb(1, 0, 0) });
    }
    page1.drawText(data.medical_info || '', { x: 40, y: height - 637, size: fontSize, font });


    // 4) Embed the passport photo
    if (data.photoBase64) {
        try {
            const imgBytes = Buffer.from(data.photoBase64, 'base64');
            const jpgImg = await pdfDoc.embedJpg(imgBytes).catch(() => null);
            const pngImg = await pdfDoc.embedPng(imgBytes).catch(() => null);
            const photo = jpgImg || pngImg;
            if (photo) {
                page1.drawImage(photo, { x: width - 80, y: height - 80, width: 70, height: 80 });
            }
        } catch (e) {
            console.error('Failed to embed photo:', e);
        }
    }


    // 5) Embed QR code in pg 2
    const qrDataUrl = await QRCode.toDataURL('https://google.com');
    const qrBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64');
    const qrImg = await pdfDoc.embedPng(qrBytes);
    page2.drawImage(qrImg, {
        x: w2 - 120, y: h2 / 2 - 50, width: 100, height: 100
    });



    // 6) Attach each uploaded PDF/document as its own new page 
    const appendFileIf = async (base64, filename) => {
        if (!base64) return;
        const bytes = Buffer.from(base64, 'base64');
        const doc = await PDFDocument.load(bytes);
        const [importedPage] = await pdfDoc.copyPages(doc, [0]);
        pdfDoc.addPage(importedPage);
    };
    await appendFileIf(data.birthCertBase64, 'birth');
    await appendFileIf(data.repIDBase64, 'repID');
    await appendFileIf(data.vaccineBase64, 'vaccine');

    return pdfDoc.save();
}


// Admission email the pdf
router.post('/email-pdf', async (req, res) => {
    try {
        const pdfBytes = await buildPdfBytes(req.body);
        await transporter.sendMail({
            from: `"Dar al-Arqam Admissions" <${EMAIL_USER}>`,
            to: req.body.email,
            cc: DEFAULT_CC,
            subject: `Admission for ${req.body.fullName}`,
            text: `Assalamu 'alaykum,\n\nPlease find attached your admission form.\n\nRegards`,
            attachments: [{
                filename: 'admission.pdf',
                content: pdfBytes,
                contentType: 'application/pdf'
            }]
        });
        res.json({ sent: true });
    } catch (err) {
        console.error('Admission email error:', err);
        res.status(500).json({ sent: false, error: err.message });
    }
});

// Generic email
router.post('/send-email', async (req, res) => {
    try {
        const { to, subject, text, attachments } = req.body;
        await transporter.sendMail({
            from: `"Dar al-Arqam" <${EMAIL_USER}>`,
            to, 
            subject, 
            text, 
            attachments
        });
        res.json({ ok: true });
    } catch (err) {
        console.error('Send email error:', err);
        res.status(500).json({ ok: false, error: err.message });
    }
});

module.exports = router;
