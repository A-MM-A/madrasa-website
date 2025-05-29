require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const nodemailer = require('nodemailer');

// const simpleAuth = require('./simpleAuth'); // for future password integration
const mpesaRouter = require('./mpesa'); // mpesa stuff

// Express app setup
const app = express();
app.use(cors());  // enable CORS for all origins
app.use(express.json({ limit: '20mb' }));

// app.use(simpleAuth); // for future password integration
app.use(mpesaRouter); // mpesa stuff

//  Email setup
const EMAIL_USER = 'dar.al.arqam.admission@gmail.com';
const EMAIL_PASS = process.env.EMAIL_PASS;
const DEFAULT_CC = 'amma.buisness@gmail.com';
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

//---------email debugger
// transporter.verify((err, success) => {
//     if (err) console.error('Mailer verify failed:', err);
//     else console.log('Mailer is ready to send ✔️');
// });



async function buildPdfBytes(data) {
    // 1) Load your template PDF
        const templateBytes = fs.readFileSync('templates/enrollment_template.pdf');
        const pdfDoc = await PDFDocument.load(templateBytes);

        const page1 = pdfDoc.getPages()[0];
        const page2 = pdfDoc.getPages()[1];
        const { width, height } = page1.getSize();
        const { width: w2, height: h2 } = page2.getSize();

        // 2) Embed a standard font
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontSize = 12;

        // console.log('👉 Incoming form data:', Object.keys(data), '…');


        // 3) Draw text fields at coordinates
        // Student's Information
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

        // Guardian's Information
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

        page1.drawText(formattedDate, {
            x: 250,
            y: height - 470,
            size: fontSize,
            font,
            color: rgb(0, 0, 1)
        });

        // Medical Information (radio X marks)
        const medY = height - 577;
        const yesX = 470, noX = 522;
        if (data.medical === '1') page1.drawText('X', { x: yesX, y: medY, size: fontSize, font, color: rgb(1, 0, 0) });
        else page1.drawText('X', { x: noX, y: medY, size: fontSize, font, color: rgb(1, 0, 0) });
        page1.drawText(data.medical_info || '', { x: 40, y: height - 637, size: fontSize, font });

        // 4) Embed the passport photo (if provided)
        if (data.photoBase64) {
            const imgBytes = Buffer.from(data.photoBase64, 'base64');
            const jpgImage = await pdfDoc.embedJpg(imgBytes).catch(() => null);
            const pngImage = await pdfDoc.embedPng(imgBytes).catch(() => null);
            const photoImage = jpgImage || pngImage;
            if (photoImage) {
                page1.drawImage(photoImage, {
                    x: width - 80,
                    y: height - 80,
                    width: 70,
                    height: 80
                });
            }
        }

        if (data.photoBase64) {
            try {
                const imgBytes = Buffer.from(data.photoBase64, 'base64');
                // …embedding logic…
            } catch (e) {
                console.error('Failed to embed photo:', e);
            }
        }


        // 5) Embed QR code in pg 2
        const qrDataUrl = await QRCode.toDataURL(`https://google.com`);
        const qrBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64');
        const qrImg = await pdfDoc.embedPng(qrBytes);

        page2.drawImage(qrImg, {
            x: w2 - 120,
            y: h2 / 2 - 50,
            width: 100,
            height: 100
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

app.post('/email-pdf', async (req, res) => {
  try {
    const pdfBytes = await buildPdfBytes(req.body);
    await transporter.sendMail({
      from: `"Dar al‑Arqam Admissions" <${EMAIL_USER}>`,
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
    console.error('❌ /email-pdf error:', err);
    res.status(500).json({ sent: false, error: err.message });
  }
});

app.post('/generate-pdf', async (req, res) => {
  try {
    const pdfBytes = await buildPdfBytes(req.body);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=enrollment.pdf');
    res.send(pdfBytes);
  } catch (err) {
    console.error('❌ /generate-pdf error:', err);
    res.status(500).send('PDF generation error');
  }
});

// app.post('/generate-pdf', async (req, res) => {
//     try {
//         const data = req.body;
//         // 1) Load your template PDF
//         const templateBytes = fs.readFileSync('templates/enrollment_template.pdf');
//         const pdfDoc = await PDFDocument.load(templateBytes);

//         const page1 = pdfDoc.getPages()[0];
//         const page2 = pdfDoc.getPages()[1];
//         const { width, height } = page1.getSize();
//         const { width: w2, height: h2 } = page2.getSize();

//         // 2) Embed a standard font
//         const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
//         const fontSize = 12;

//         // console.log('👉 Incoming form data:', Object.keys(data), '…');


//         // 3) Draw text fields at coordinates
//         // Student's Information
//         page1.drawText(data.fullName || '', { x: 250, y: height - 174, size: fontSize, font });

//         // Format DOB
//         let dobFormatted = '';
//         if (data.birthDate) {
//             const [year, month, day] = data.birthDate.split('-');
//             dobFormatted = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
//         }
//         page1.drawText(dobFormatted, { x: 250, y: height - 190, size: fontSize, font });

//         page1.drawText(data.gender || '', { x: 250, y: height - 210, size: fontSize, font });
//         page1.drawText(data.studentPhone || '', { x: 350, y: height - 210, size: fontSize, font });
//         page1.drawText(data.address || '', { x: 250, y: height - 230, size: fontSize, font });
//         page1.drawText(data.nationality || '', { x: 250, y: height - 250, size: fontSize, font });
//         page1.drawText(data.studentemail || '', { x: 350, y: height - 250, size: fontSize, font });

//         // Guardian's Information
//         page1.drawText(data.guardianname || '', { x: 250, y: height - 292, size: fontSize, font });
//         page1.drawText(data.representative || '', { x: 250, y: height - 315, size: fontSize, font });
//         page1.drawText(data.guardianGender || '', { x: 250, y: height - 335, size: fontSize, font });
//         page1.drawText(data.Occupation || '', { x: 250, y: height - 352, size: fontSize, font });
//         page1.drawText(data.GuardianAddress || '', { x: 250, y: height - 370, size: fontSize, font });
//         page1.drawText(data.GuardianNationality || '', { x: 250, y: height - 390, size: fontSize, font });
//         page1.drawText(data.id || '', { x: 250, y: height - 412, size: fontSize, font });
//         page1.drawText(data.guardianPhone || '', { x: 250, y: height - 430, size: fontSize, font });
//         page1.drawText(data.email || '', { x: 250, y: height - 450, size: fontSize, font });

//         // Add date of submission in DD/MM/YYYY format
//         const now = new Date();
//         const dd = String(now.getDate()).padStart(2, '0');
//         const mm = String(now.getMonth() + 1).padStart(2, '0');
//         const yyyy = now.getFullYear();
//         const formattedDate = `${dd}/${mm}/${yyyy}`;

//         page1.drawText(formattedDate, {
//             x: 250,
//             y: height - 470,
//             size: fontSize,
//             font,
//             color: rgb(0, 0, 1)
//         });

//         // Medical Information (radio X marks)
//         const medY = height - 577;
//         const yesX = 470, noX = 522;
//         if (data.medical === '1') page1.drawText('X', { x: yesX, y: medY, size: fontSize, font, color: rgb(1, 0, 0) });
//         else page1.drawText('X', { x: noX, y: medY, size: fontSize, font, color: rgb(1, 0, 0) });
//         page1.drawText(data.medical_info || '', { x: 40, y: height - 637, size: fontSize, font });

//         // 4) Embed the passport photo (if provided)
//         if (data.photoBase64) {
//             const imgBytes = Buffer.from(data.photoBase64, 'base64');
//             const jpgImage = await pdfDoc.embedJpg(imgBytes).catch(() => null);
//             const pngImage = await pdfDoc.embedPng(imgBytes).catch(() => null);
//             const photoImage = jpgImage || pngImage;
//             if (photoImage) {
//                 page1.drawImage(photoImage, {
//                     x: width - 80,
//                     y: height - 80,
//                     width: 70,
//                     height: 80
//                 });
//             }
//         }

//         if (data.photoBase64) {
//             try {
//                 const imgBytes = Buffer.from(data.photoBase64, 'base64');
//                 // …embedding logic…
//             } catch (e) {
//                 console.error('Failed to embed photo:', e);
//             }
//         }


//         // 5) Embed QR code in pg 2
//         const qrDataUrl = await QRCode.toDataURL(`https://google.com`);
//         const qrBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64');
//         const qrImg = await pdfDoc.embedPng(qrBytes);

//         page2.drawImage(qrImg, {
//             x: w2 - 120,
//             y: h2 / 2 - 50,
//             width: 100,
//             height: 100
//         });


//         // 6) Attach each uploaded PDF/document as its own new page 
//         const appendFileIf = async (base64, filename) => {
//             if (!base64) return;
//             const bytes = Buffer.from(base64, 'base64');
//             const doc = await PDFDocument.load(bytes);
//             const [importedPage] = await pdfDoc.copyPages(doc, [0]);
//             pdfDoc.addPage(importedPage);
//         };
//         await appendFileIf(data.birthCertBase64, 'birth');
//         await appendFileIf(data.repIDBase64, 'repID');
//         await appendFileIf(data.vaccineBase64, 'vaccine');


//         // 7) Save pdf
//         const pdfBytes = await pdfDoc.save();

//         // 8) send the email

//         // await transporter.sendMail({
//         //     from: `"Dar al‑Arqam Admissions" <${EMAIL_USER}>`,
//         //     to: data.email,
//         //     cc: DEFAULT_CC,
//         //     subject: `Admission for ${data.fullName}`,
//         //     text: `Assalamu 'alaykum,\n\nPlease find attached your admission form.\n\nRegards`,
//         //     attachments: [{ filename: 'admission.pdf', content: pdfBytes }]
//         // });

//         // 9) download pdf

//         res.setHeader('Content-Type', 'application/pdf');
//         res.setHeader('Content-Disposition', 'attachment; filename=enrollment.pdf');
//         res.send(pdfBytes);
//     } catch (err) {
//         console.error('❌ PDF generation error:', err);
//         res.status(500).send('PDF generation error');
//     }
// });

// app.post('/send-email', async (req, res) => {
//     try {
//         const { pdfBase64, guardianEmail } = req.body;
//         const pdfBuffer = Buffer.from(pdfBase64, 'base64');
//         await transporter.sendMail({
//             from: `"Dar al‑Arqam Admissions" <${EMAIL_USER}>`,
//             to: guardianEmail,
//             cc: DEFAULT_CC,
//             subject: `Your admission form`,
//             text: `Assalamu ‘alaykum,\n\nPlease find attached your admission form.\n\nRegards`,
//             attachments: [{ filename: 'admission.pdf', content: pdfBuffer }]
//         });
//         res.json({ status: true });
//     } catch (err) {
//         console.error('Email error', err);
//         res.status(500).json({ status: false, error: err.message });
//     }
// });



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`PDF server running on ${PORT}`));