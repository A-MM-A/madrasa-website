// const express = require('express');
// const cors = require('cors');
// const fs = require('fs');
// const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
// const QRCode = require('qrcode');

// const app = express();
// app.use(cors());
// app.use(express.json());

// // …rest of your /generate-pdf code…


// app.post('/generate-pdf', async (req, res) => {
//     try {
//         const data = req.body;
//         // 1) Load your template PDF
//         const templateBytes = fs.readFileSync('templates/enrollment_template.pdf');
//         const pdfDoc = await PDFDocument.load(templateBytes);
//         const page = pdfDoc.getPages()[0];
//         const { width, height } = page.getSize();

//         // 2) Embed a standard font
//         const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
//         const fontSize = 12;

//         // 3) Draw each piece of text at (x, y)
//         //    Coordinates origin (0,0) is bottom-left of page
//         page.drawText(data.fullName || '', {  //
//             x: 250,
//             y: height - 170,
//             size: fontSize,
//             font,
//             color: rgb(0, 0, 0)
//         });

//         page.drawText(data.birthDate || '', {  //
//             x: 250,
//             y: height - 190,
//             size: fontSize,
//             font
//         });

//         page.drawText(data.gender || '', {  //
//             x: 250,
//             y: height - 210,
//             size: fontSize,
//             font
//         });
//         page.drawText(data.address || '', {
//             x: 250,
//             y: height - 230,
//             size: fontSize,
//             font
//         });
//         page.drawText(data.nationality || '', { //
//             x: 250,
//             y: height - 250,
//             size: fontSize,
//             font
//         });
//         page.drawText(data.studentemail || '', {
//             x: 300,
//             y: height - 230,
//             size: fontSize,
//             font
//         });
//         page.drawText(data.studentPhone || '', {
//             x: 300,
//             y: height - 500,
//             size: fontSize,
//             font
//         });
//         page.drawText(data.representative || '', {
//             x: 250,
//             y: height - 310,
//             size: fontSize,
//             font
//         });
//         page.drawText(data.guardianname || '', {
//             x: 250,
//             y: height - 290,
//             size: fontSize,
//             font
//         });
//         page.drawText(data.guardianGender || '', {
//             x: 250,
//             y: height - 330,
//             size: fontSize,
//             font
//         });
//         page.drawText(data.Occupation || '', {
//             x: 200,
//             y: height - 350,
//             size: fontSize,
//             font
//         });
//         page.drawText(data.GuardianAddress || '', {
//             x: 200,
//             y: height - 370,
//             size: fontSize,
//             font
//         });
//         page.drawText(data.GuardianNationality || '', {
//             x: 200,
//             y: height - 390,
//             size: fontSize,
//             font
//         });
//         // …repeat for every field, adjusting y-coordinates downward...

//         // 4) Embed QR code in corner
//         const qrDataUrl = await QRCode.toDataURL(`https://your.domain/verify?id=${data.id}`);
//         const qrImageBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64');
//         const qrImage = await pdfDoc.embedPng(qrImageBytes);
//         page.drawImage(qrImage, { x: width - 120, y: 20, width: 100, height: 100 });

//         // 5) Save & return PDF
//         const pdfBytes = await pdfDoc.save();
//         res.setHeader('Content-Type', 'application/pdf');
//         res.setHeader('Content-Disposition', 'attachment; filename=enrollment.pdf');
//         res.send(pdfBytes);
//     } catch (err) {
//         console.error(err);
//         res.status(500).send('PDF generation error');
//     }
// });

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`PDF server running on ${PORT}`));




// const express = require('express');
// const cors = require('cors');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { PDFDocument,
    rgb,
    StandardFonts } = require('pdf-lib');
const QRCode = require('qrcode');


const app = express();
app.use(cors());  // enable CORS for all origins
app.use(express.json({ limit: '20mb' }));


app.post('/generate-pdf', async (req, res) => {
    try {
        const data = req.body;
        // 1) Load your template PDF
        const templateBytes = fs.readFileSync('templates/enrollment_template.pdf');
        const pdfDoc = await PDFDocument.load(templateBytes);
        const page = pdfDoc.getPages()[0];
        const { width, height } = page.getSize();

        // 2) Embed a standard font
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontSize = 12;

        // console.log('👉 Incoming form data:', Object.keys(data), '…');


        // 3) Draw text fields at coordinates (adjust x/y to match your template)
        // Student's Information
        page.drawText(data.fullName || '', { x: 250, y: height - 174, size: fontSize, font });
        page.drawText(data.birthDate || '', { x: 250, y: height - 190, size: fontSize, font });
        page.drawText(data.gender || '', { x: 250, y: height - 210, size: fontSize, font });
        page.drawText(data.studentPhone || '', { x: 350, y: height - 210, size: fontSize, font });
        page.drawText(data.address || '', { x: 250, y: height - 230, size: fontSize, font });
        page.drawText(data.nationality || '', { x: 250, y: height - 250, size: fontSize, font });
        page.drawText(data.studentemail || '', { x: 350, y: height - 250, size: fontSize, font });

        // Guardian's Information (example positions)
        page.drawText(data.guardianname || '', { x: 250, y: height - 292, size: fontSize, font });
        page.drawText(data.representative || '', { x: 250, y: height - 315, size: fontSize, font });
        page.drawText(data.guardianGender || '', { x: 250, y: height - 335, size: fontSize, font });
        page.drawText(data.Occupation || '', { x: 250, y: height - 352, size: fontSize, font });
        page.drawText(data.GuardianAddress || '', { x: 250, y: height - 370, size: fontSize, font });
        page.drawText(data.GuardianNationality || '', { x: 250, y: height - 390, size: fontSize, font });
        page.drawText(data.id || '', { x: 250, y: height - 412, size: fontSize, font });
        page.drawText(data.guardianPhone || '', { x: 250, y: height - 430, size: fontSize, font });
        page.drawText(data.email || '', { x: 250, y: height - 450, size: fontSize, font });

        // Medical Information (radio X marks)
        const medY = height - 577;
        const yesX = 470, noX = 520;
        if (data.medical === '1') page.drawText('X', { x: yesX, y: medY, size: fontSize, font, color: rgb(1, 0, 0) });
        else page.drawText('X', { x: noX, y: medY, size: fontSize, font, color: rgb(1, 0, 0) });
        page.drawText(data.medical_info || '', { x: 40, y: height - 637, size: fontSize, font });

        // 4) Embed the passport photo (if provided)
        if (data.photoBase64) {
            const imgBytes = Buffer.from(data.photoBase64, 'base64');
            const jpgImage = await pdfDoc.embedJpg(imgBytes).catch(() => null);
            const pngImage = await pdfDoc.embedPng(imgBytes).catch(() => null);
            const photoImage = jpgImage || pngImage;
            if (photoImage) {
                page.drawImage(photoImage, {
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


        // 5) Embed QR code in corner
        const qrDataUrl = await QRCode.toDataURL(`https://your.domain/verify?id=${data.id}`);
        const qrImageBytes = Buffer.from(qrDataUrl.split(',')[1], 'base64');
        const qrImage = await pdfDoc.embedPng(qrImageBytes);
        page.drawImage(qrImage, { x: width - 120, y: 20, width: 100, height: 100 });

        // 6) Save & return PDF
        const pdfBytes = await pdfDoc.save();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=enrollment.pdf');
        res.send(pdfBytes);
    } catch (err) {
        console.error('❌ PDF generation error:', err);
        res.status(500).send('PDF generation error');
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`PDF server running on ${PORT}`)); (PORT, () => console.log(`PDF server running on ${PORT}`));