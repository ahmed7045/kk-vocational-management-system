const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

const formatDate = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

const generateCertificatePdf = (certificate, res) => {
  const doc = new PDFDocument({
    size: "A4",
    layout: "portrait",
    margin: 35,
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

  // Outer border
  doc
    .lineWidth(3)
    .strokeColor("#b59a3b")
    .rect(18, 18, pageWidth - 36, pageHeight - 36)
    .stroke();

  // Inner border
  doc
    .lineWidth(1)
    .strokeColor("#d8c56d")
    .rect(30, 30, pageWidth - 60, pageHeight - 60)
    .stroke();

  // Logo
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, pageWidth / 2 - 55, 25, {
      width: 110,
      height: 110,
    });
  }

  // Association name
  doc
    .fillColor("#222")
    .font("Times-Bold")
    .fontSize(24)
    .text(certificate.association_name, 45, 150, {
      width: pageWidth - 90,
      align: "center",
    });

  doc
    .fillColor("#b30000")
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(certificate.registration_text || "(Regd)", pageWidth - 160, 180);

  // Institute name
  doc
    .fillColor("#222")
    .font("Times-Bold")
    .fontSize(22)
    .text(certificate.institute_name, 45, 215, {
      width: pageWidth - 90,
      align: "center",
    });

  // Certificate title
  doc
    .font("Times-BoldItalic")
    .fontSize(28)
    .text(certificate.certificate_title || "Certificate of Achievement", 45, 270, {
      width: pageWidth - 90,
      align: "center",
      underline: true,
    });

  // Date
  doc
    .font("Helvetica")
    .fontSize(12)
    .text("Date:", pageWidth - 205, 335);

  doc
    .font("Times-BoldItalic")
    .fontSize(18)
    .text(formatDate(certificate.issue_date), pageWidth - 160, 328, {
      width: 110,
      align: "center",
    });

  doc
    .moveTo(pageWidth - 155, 352)
    .lineTo(pageWidth - 45, 352)
    .strokeColor("#111")
    .stroke();

  const bodyY = 405;

  // Student line
  doc
    .fillColor("#111")
    .font("Helvetica")
    .fontSize(15)
    .text("This is to certify that", 40, bodyY);

  doc
    .font("Times-BoldItalic")
    .fontSize(22)
    .text(certificate.student_name, 235, bodyY - 8, {
      width: 300,
      align: "center",
    });

  doc
    .moveTo(180, bodyY + 18)
    .lineTo(pageWidth - 60, bodyY + 18)
    .strokeColor("#111")
    .stroke();

  // Course line
  doc
    .font("Helvetica")
    .fontSize(15)
    .text(
      `has Successfully completed a ${certificate.course_duration || ""} ${certificate.course_name} course at the`,
      40,
      bodyY + 45,
      {
        width: pageWidth - 80,
        align: "left",
      }
    );

  doc
    .font("Helvetica-Bold")
    .fontSize(15)
    .text(certificate.institute_name, 40, bodyY + 80, {
      width: pageWidth - 80,
      align: "left",
    });

  const achievementText =
    certificate.achievement_text ||
    "Furthermore, the student has achieved a Distinguished Position in recognition of outstanding performance, dedication, and hard work. This certificate is proudly awarded in appreciation of their commitment and excellence.";

  doc
    .font("Helvetica")
    .fontSize(15)
    .text(achievementText, 40, bodyY + 120, {
      width: pageWidth - 80,
      align: "left",
      lineGap: 8,
    });

  // Red diagonal ribbon
  doc.save();
  doc.rotate(45, { origin: [0, pageHeight] });
  doc.rect(-90, pageHeight - 170, 360, 42).fill("#b30000");
  doc.restore();

  // Signatures
  const sigY = pageHeight - 120;

  doc
    .strokeColor("#111")
    .moveTo(210, sigY)
    .lineTo(340, sigY)
    .stroke();

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor("#111")
    .text(certificate.secretary_name || "Aftab Ahmed", 195, sigY + 10, {
      width: 160,
      align: "center",
    });

  doc
    .font("Helvetica")
    .fontSize(11)
    .text("( General Secretary )", 195, sigY + 28, {
      width: 160,
      align: "center",
    });

  doc
    .strokeColor("#111")
    .moveTo(pageWidth - 250, sigY)
    .lineTo(pageWidth - 95, sigY)
    .stroke();

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(certificate.president_name || "Muhammad Rafiq Mara", pageWidth - 265, sigY + 10, {
      width: 185,
      align: "center",
    });

  doc
    .font("Helvetica")
    .fontSize(11)
    .text("( President )", pageWidth - 265, sigY + 28, {
      width: 185,
      align: "center",
    });

  // Certificate number
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#555")
    .text(`Certificate No: ${certificate.certificate_no}`, 40, pageHeight - 35);

  doc.end();
};

module.exports = generateCertificatePdf;