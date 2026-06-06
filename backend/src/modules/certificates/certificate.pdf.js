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

const drawTopRibbon = (doc, pageWidth) => {
  const centerX = pageWidth / 2;

  doc.save();

  // Main red ribbon behind logo
  doc.fillColor("#c81010");
  doc
    .moveTo(centerX - 142, 92)
    .bezierCurveTo(centerX - 95, 68, centerX - 44, 76, centerX, 103)
    .bezierCurveTo(centerX + 44, 76, centerX + 95, 68, centerX + 142, 92)
    .lineTo(centerX + 104, 128)
    .bezierCurveTo(centerX + 62, 108, centerX + 28, 111, centerX, 134)
    .bezierCurveTo(centerX - 28, 111, centerX - 62, 108, centerX - 104, 128)
    .closePath()
    .fill();

  // Ribbon side folds
  doc.fillColor("#8f0707");

  doc
    .moveTo(centerX - 142, 92)
    .lineTo(centerX - 190, 106)
    .lineTo(centerX - 118, 126)
    .closePath()
    .fill();

  doc
    .moveTo(centerX + 142, 92)
    .lineTo(centerX + 190, 106)
    .lineTo(centerX + 118, 126)
    .closePath()
    .fill();

  doc.restore();
};

const drawRibbon = (doc, pageHeight) => {
  doc.save();

  // Bottom-left diagonal red ribbon
  doc.fillColor("#aa0000");
  doc
    .moveTo(-28, pageHeight - 235)
    .lineTo(32, pageHeight - 275)
    .lineTo(315, pageHeight + 8)
    .lineTo(250, pageHeight + 38)
    .lineTo(-28, pageHeight - 165)
    .closePath()
    .fill();

  // Fine diagonal stripes
  doc.strokeColor("#6d0000");
  doc.lineWidth(1);

  for (let i = 0; i < 24; i++) {
    const offset = i * 6;

    doc
      .moveTo(-15 + offset, pageHeight - 245 + offset)
      .lineTo(280 + offset, pageHeight + 18 + offset)
      .stroke();
  }

  doc.restore();
};

const drawBorders = (doc, pageWidth, pageHeight) => {
  doc.save();

  // Outer gold border
  doc
    .lineWidth(2.2)
    .strokeColor("#aa9638")
    .rect(15, 15, pageWidth - 30, pageHeight - 30)
    .stroke();

  // Inner thin border
  doc
    .lineWidth(1)
    .strokeColor("#c9b45b")
    .rect(29, 29, pageWidth - 58, pageHeight - 58)
    .stroke();

  // Decorative corner curves
  doc.strokeColor("#aa9638");
  doc.lineWidth(1.4);

  doc.moveTo(15, 62).quadraticCurveTo(62, 62, 62, 15).stroke();
  doc
    .moveTo(pageWidth - 15, 62)
    .quadraticCurveTo(pageWidth - 62, 62, pageWidth - 62, 15)
    .stroke();

  doc
    .moveTo(15, pageHeight - 62)
    .quadraticCurveTo(62, pageHeight - 62, 62, pageHeight - 15)
    .stroke();

  doc
    .moveTo(pageWidth - 15, pageHeight - 62)
    .quadraticCurveTo(pageWidth - 62, pageHeight - 62, pageWidth - 62, pageHeight - 15)
    .stroke();

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
  drawTopRibbon(doc, pageWidth);

  // Logo
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, pageWidth / 2 - 52, 22, {
      width: 104,
      height: 104,
    });
  }

  // Header title - fixed two centered lines
doc
  .fillColor("#222222")
  .font("Times-Bold")
  .fontSize(24)
  .text("KUTCHI KUMBHAR KHIDMAT-E-KHALQ", 42, 140, {
    width: pageWidth - 84,
    align: "center",
    lineBreak: false,
  });

doc
  .fillColor("#222222")
  .font("Times-Bold")
  .fontSize(24)
  .text("WELFARE ASSOCIATION", 42, 170, {
    width: pageWidth - 84,
    align: "center",
    lineBreak: false,
  });

// Regd text - no overlap
doc
  .fillColor("#b30000")
  .font("Helvetica-Bold")
  .fontSize(10)
  .text(certificate.registration_text || "(Regd)", pageWidth - 148, 178, {
    width: 70,
    align: "left",
    lineBreak: false,
  });

  // Institute name
  doc
    .fillColor("#222222")
    .font("Times-Bold")
    .fontSize(25)
    .text(
      certificate.institute_name || "Khidmat-e-Khalq Vocational IT Center",
      42,
      218,
      {
        width: pageWidth - 80,
        align: "center",
        lineBreak: false,
      }
    );

  // Certificate title
  doc
    .font("Times-BoldItalic")
    .fontSize(30)
    .text(
      certificate.certificate_title || "Certificate of Achievement",
      40,
      275,
      {
        width: pageWidth - 80,
        align: "center",
        lineBreak: false,
      }
    );

  doc
    .strokeColor("#111111")
    .lineWidth(1)
    .moveTo(155, 313)
    .lineTo(pageWidth - 155, 313)
    .stroke();

  // Date
  doc
    .fillColor("#111111")
    .font("Helvetica")
    .fontSize(13)
    .text("Date:", pageWidth - 195, 357, {
      width: 45,
      lineBreak: false,
    });

  doc
    .font("Times-BoldItalic")
    .fontSize(19)
    .text(formatDate(certificate.issue_date), pageWidth - 150, 349, {
      width: 118,
      align: "center",
      lineBreak: false,
    });

  doc
    .strokeColor("#111111")
    .lineWidth(1)
    .moveTo(pageWidth - 142, 374)
    .lineTo(pageWidth - 35, 374)
    .stroke();

  // Main body
  const bodyY = 425;

  const certificateStudentName = certificate.student_name || "";

  doc
    .fillColor("#111111")
    .font("Helvetica")
    .fontSize(15.5)
    .text("This is to certify that", 40, bodyY, {
      width: 165,
      lineBreak: false,
    });

  doc
    .font("Times-BoldItalic")
    .fontSize(22)
    .text(certificateStudentName, 220, bodyY - 10, {
      width: 310,
      align: "center",
      lineBreak: false,
    });

  doc
    .strokeColor("#111111")
    .lineWidth(1)
    .moveTo(178, bodyY + 18)
    .lineTo(pageWidth - 45, bodyY + 18)
    .stroke();

  doc
    .fillColor("#111111")
    .font("Helvetica")
    .fontSize(15.5)
    .text(
      `has Successfully completed a ${certificate.course_duration || ""} ${
        certificate.course_name || ""
      } course at the`,
      40,
      bodyY + 50,
      {
        width: pageWidth - 80,
        align: "left",
        lineBreak: false,
      }
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(15.5)
    .text(
      certificate.institute_name || "Khidmat-e-Khalq Vocational IT Center",
      40,
      bodyY + 88,
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
    .fontSize(15.5)
    .text(achievementText, 40, bodyY + 132, {
      width: pageWidth - 80,
      align: "left",
      lineGap: 8,
      height: 132,
      ellipsis: false,
    });

  // Signatures
  const sigY = 735;

  // Secretary signature line
  doc
    .strokeColor("#111111")
    .lineWidth(1)
    .moveTo(205, sigY)
    .lineTo(335, sigY)
    .stroke();

  doc
    .font("Helvetica-Bold")
    .fontSize(12.5)
    .fillColor("#111111")
    .text(certificate.secretary_name || "Aftab Ahmed", 190, sigY + 12, {
      width: 160,
      align: "center",
      lineBreak: false,
    });

  doc
    .font("Helvetica")
    .fontSize(11.5)
    .text("( General Secretary )", 190, sigY + 31, {
      width: 160,
      align: "center",
      lineBreak: false,
    });

  // President signature line
  doc
    .strokeColor("#111111")
    .lineWidth(1)
    .moveTo(pageWidth - 255, sigY)
    .lineTo(pageWidth - 95, sigY)
    .stroke();

  doc
    .font("Helvetica-Bold")
    .fontSize(12.5)
    .fillColor("#111111")
    .text(
      certificate.president_name || "Muhammad Rafiq Mara",
      pageWidth - 275,
      sigY + 12,
      {
        width: 200,
        align: "center",
        lineBreak: false,
      }
    );

  doc
    .font("Helvetica")
    .fontSize(11.5)
    .text("( President )", pageWidth - 275, sigY + 31, {
      width: 200,
      align: "center",
      lineBreak: false,
    });

  // Keep certificate number tiny and hidden near bottom
  doc
    .font("Helvetica")
    .fontSize(6.5)
    .fillColor("#888888")
    .text(`Certificate No: ${certificate.certificate_no}`, 38, pageHeight - 42, {
      width: 240,
      lineBreak: false,
    });

  doc.end();
};

module.exports = generateCertificatePdf;