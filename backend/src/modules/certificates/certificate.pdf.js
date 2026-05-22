const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

const formatDate = (date) => {
  const d = new Date(date || new Date());
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

const drawWaveBackground = (doc, pageWidth, pageHeight) => {
  doc.save();
  doc.opacity(0.08);
  doc.strokeColor("#9ca3af");
  doc.lineWidth(0.6);

  for (let y = 45; y < pageHeight - 35; y += 16) {
    doc.moveTo(35, y);

    for (let x = 35; x < pageWidth - 35; x += 20) {
      doc.bezierCurveTo(
        x + 5,
        y - 6,
        x + 15,
        y + 6,
        x + 20,
        y
      );
    }

    doc.stroke();
  }

  doc.restore();
};

const drawRibbon = (doc, pageHeight) => {
  doc.save();

  doc.fillColor("#b80000");
  doc
    .moveTo(-20, pageHeight - 250)
    .lineTo(25, pageHeight - 285)
    .lineTo(345, pageHeight + 15)
    .lineTo(285, pageHeight + 35)
    .lineTo(-20, pageHeight - 190)
    .fill();

  doc.strokeColor("#7f0000");
  doc.lineWidth(1.1);

  for (let i = 0; i < 18; i++) {
    const offset = i * 8;

    doc
      .moveTo(-10 + offset, pageHeight - 270 + offset)
      .lineTo(310 + offset, pageHeight + 15 + offset)
      .stroke();
  }

  doc.restore();
};

const drawBorders = (doc, pageWidth, pageHeight) => {
  doc
    .lineWidth(2.2)
    .strokeColor("#b59a3b")
    .rect(18, 18, pageWidth - 36, pageHeight - 36)
    .stroke();

  doc
    .lineWidth(1)
    .strokeColor("#c8b45a")
    .rect(31, 31, pageWidth - 62, pageHeight - 62)
    .stroke();

  // Small decorative corner curves similar to the reference
  doc.save();
  doc.strokeColor("#b59a3b");
  doc.lineWidth(1.2);

  // top-left
  doc.moveTo(18, 58).quadraticCurveTo(58, 58, 58, 18).stroke();
  // top-right
  doc.moveTo(pageWidth - 18, 58).quadraticCurveTo(pageWidth - 58, 58, pageWidth - 58, 18).stroke();
  // bottom-left
  doc.moveTo(18, pageHeight - 58).quadraticCurveTo(58, pageHeight - 58, 58, pageHeight - 18).stroke();
  // bottom-right
  doc.moveTo(pageWidth - 18, pageHeight - 58).quadraticCurveTo(pageWidth - 58, pageHeight - 58, pageWidth - 58, pageHeight - 18).stroke();

  doc.restore();
};

const generateCertificatePdf = (certificate, res) => {
  const doc = new PDFDocument({
    size: "A4",
    layout: "portrait",
    margin: 0,
    autoFirstPage: true,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${certificate.certificate_no}.pdf"`
  );

  doc.pipe(res);

  const pageWidth = doc.page.width;
  const pageHeight = doc.page.height;

  const logoPath = path.join(__dirname, "../../assets/logo.png");

  // Background
  doc.rect(0, 0, pageWidth, pageHeight).fill("#fffdf0");
  drawWaveBackground(doc, pageWidth, pageHeight);
  drawRibbon(doc, pageHeight);
  drawBorders(doc, pageWidth, pageHeight);

  // Red ribbon behind logo
  doc.save();
  doc.fillColor("#c40000");
  doc
    .moveTo(pageWidth / 2 - 115, 92)
    .bezierCurveTo(pageWidth / 2 - 70, 72, pageWidth / 2 - 35, 80, pageWidth / 2, 98)
    .bezierCurveTo(pageWidth / 2 + 35, 80, pageWidth / 2 + 70, 72, pageWidth / 2 + 115, 92)
    .lineTo(pageWidth / 2 + 80, 120)
    .bezierCurveTo(pageWidth / 2 + 40, 105, pageWidth / 2 + 25, 108, pageWidth / 2, 124)
    .bezierCurveTo(pageWidth / 2 - 25, 108, pageWidth / 2 - 40, 105, pageWidth / 2 - 80, 120)
    .closePath()
    .fill();

  doc.fillColor("#8b0000");
  doc
    .moveTo(pageWidth / 2 - 115, 92)
    .lineTo(pageWidth / 2 - 150, 105)
    .lineTo(pageWidth / 2 - 90, 118)
    .fill();

  doc
    .moveTo(pageWidth / 2 + 115, 92)
    .lineTo(pageWidth / 2 + 150, 105)
    .lineTo(pageWidth / 2 + 90, 118)
    .fill();

  doc.restore();

  // Logo
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, pageWidth / 2 - 48, 26, {
      width: 96,
      height: 96,
    });
  }

  // Header title
  doc
    .fillColor("#222222")
    .font("Times-Bold")
    .fontSize(24)
    .text(
      certificate.association_name ||
        "KUTCHI KUMBHAR KHIDMAT-E-KHALQ WELFARE ASSOCIATION",
      42,
      140,
      {
        width: pageWidth - 84,
        align: "center",
        lineGap: 2,
      }
    );

  doc
    .fillColor("#b30000")
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(certificate.registration_text || "(Regd)", pageWidth - 160, 174, {
      width: 80,
      align: "left",
      lineBreak: false,
    });

  // Institute
  doc
    .fillColor("#222222")
    .font("Times-Bold")
    .fontSize(22)
    .text(
      certificate.institute_name || "Khidmat-e-Khalq Vocational IT Center",
      42,
      212,
      {
        width: pageWidth - 84,
        align: "center",
        lineBreak: false,
      }
    );

  // Certificate title
  doc
    .font("Times-BoldItalic")
    .fontSize(28)
    .text(
      certificate.certificate_title || "Certificate of Achievement",
      42,
      260,
      {
        width: pageWidth - 84,
        align: "center",
        lineBreak: false,
      }
    );

  doc
    .moveTo(150, 294)
    .lineTo(pageWidth - 150, 294)
    .strokeColor("#111111")
    .lineWidth(1)
    .stroke();

  // Date
  doc
    .fillColor("#111111")
    .font("Helvetica")
    .fontSize(12)
    .text("Date:", pageWidth - 190, 335, {
      width: 42,
      lineBreak: false,
    });

  doc
    .font("Times-BoldItalic")
    .fontSize(18)
    .text(formatDate(certificate.issue_date), pageWidth - 145, 328, {
      width: 115,
      align: "center",
      lineBreak: false,
    });

  doc
    .moveTo(pageWidth - 135, 352)
    .lineTo(pageWidth - 35, 352)
    .strokeColor("#111111")
    .lineWidth(1)
    .stroke();

  // Main body
  const bodyY = 404;

  doc
    .fillColor("#111111")
    .font("Helvetica")
    .fontSize(15)
    .text("This is to certify that", 40, bodyY, {
      width: 160,
      lineBreak: false,
    });

  doc
    .font("Times-BoldItalic")
    .fontSize(21)
    .text(certificate.student_name || "", 230, bodyY - 9, {
      width: 295,
      align: "center",
      lineBreak: false,
    });

  doc
    .moveTo(175, bodyY + 17)
    .lineTo(pageWidth - 45, bodyY + 17)
    .strokeColor("#111111")
    .lineWidth(1)
    .stroke();

  doc
    .font("Helvetica")
    .fontSize(15)
    .text(
      `has Successfully completed a ${certificate.course_duration || ""} ${
        certificate.course_name || ""
      } course at the`,
      40,
      bodyY + 48,
      {
        width: pageWidth - 80,
        align: "left",
        lineBreak: false,
      }
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(15)
    .text(
      certificate.institute_name || "Khidmat-e-Khalq Vocational IT Center",
      40,
      bodyY + 84,
      {
        width: pageWidth - 80,
        align: "left",
        lineBreak: false,
      }
    );

  const achievementText =
    certificate.achievement_text ||
    "Furthermore, the student has achieved a Distinguished Position in recognition of outstanding performance, dedication, and hard work. This certificate is proudly awarded in appreciation of their commitment and excellence.";

  doc
    .font("Helvetica")
    .fontSize(15)
    .text(achievementText, 40, bodyY + 126, {
      width: pageWidth - 80,
      align: "left",
      lineGap: 8,
      height: 118,
      ellipsis: false,
    });

  // Signature area
  const sigY = 720;

  // Optional signature image support, if added later
  const secretarySignaturePath = path.join(
    __dirname,
    "../../assets/secretary-signature.png"
  );

  const presidentSignaturePath = path.join(
    __dirname,
    "../../assets/president-signature.png"
  );

  if (fs.existsSync(secretarySignaturePath)) {
    doc.image(secretarySignaturePath, 218, sigY - 48, {
      width: 95,
      height: 45,
    });
  }

  if (fs.existsSync(presidentSignaturePath)) {
    doc.image(presidentSignaturePath, pageWidth - 218, sigY - 52, {
      width: 100,
      height: 48,
    });
  }

  doc
    .strokeColor("#111111")
    .lineWidth(1)
    .moveTo(205, sigY)
    .lineTo(335, sigY)
    .stroke();

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor("#111111")
    .text(certificate.secretary_name || "Aftab Ahmed", 190, sigY + 10, {
      width: 160,
      align: "center",
      lineBreak: false,
    });

  doc
    .font("Helvetica")
    .fontSize(11)
    .text("( General Secretary )", 190, sigY + 29, {
      width: 160,
      align: "center",
      lineBreak: false,
    });

  doc
    .strokeColor("#111111")
    .lineWidth(1)
    .moveTo(pageWidth - 255, sigY)
    .lineTo(pageWidth - 95, sigY)
    .stroke();

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(
      certificate.president_name || "Muhammad Rafiq Mara",
      pageWidth - 275,
      sigY + 10,
      {
        width: 200,
        align: "center",
        lineBreak: false,
      }
    );

  doc
    .font("Helvetica")
    .fontSize(11)
    .text("( President )", pageWidth - 275, sigY + 29, {
      width: 200,
      align: "center",
      lineBreak: false,
    });

  // Certificate number - kept inside page to avoid second page issue
  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor("#777777")
    .text(`Certificate No: ${certificate.certificate_no}`, 38, pageHeight - 45, {
      width: 240,
      lineBreak: false,
    });

  doc.end();
};

module.exports = generateCertificatePdf;