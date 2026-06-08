const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");


const REPORT_FOOTER_TEXT = "Powered by Cybrox - cybrox.info";

const addReportFooter = (doc) => {
  const pages = doc.bufferedPageRange();

  for (let i = pages.start; i < pages.start + pages.count; i += 1) {
    doc.switchToPage(i);

    const footerY = doc.page.height - 24;

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#6b7280")
      .text(REPORT_FOOTER_TEXT, 0, footerY, {
        width: doc.page.width,
        align: "center",
        lineBreak: false,
      });

    doc.fillColor("#111827");
  }
};

const exportSimplePdf = (title, rows, res) => {
  const doc = new PDFDocument({
    margin: 40,
    bufferPages: true,
  });

  const footerRowNumber = worksheet.rowCount + 2;
  worksheet.mergeCells(`A${footerRowNumber}:D${footerRowNumber}`);
  worksheet.getCell(`A${footerRowNumber}`).value = REPORT_FOOTER_TEXT;
  worksheet.getCell(`A${footerRowNumber}`).font = {
    italic: true,
    size: 10,
    color: { argb: "FF6B7280" },
  };
  worksheet.getCell(`A${footerRowNumber}`).alignment = {
    horizontal: "center",
  };

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${title.replace(/\s+/g, "_")}.pdf"`
  );

  doc.pipe(res);

  doc.fontSize(20).text(title, {
    align: "center",
  });

  doc.moveDown();

  if (!rows || rows.length === 0) {
    doc.fontSize(12).text("No records found.");
    addReportFooter(doc);
    doc.end();
    return;
  }

  rows.forEach((row, index) => {
    doc.fontSize(11).text(`${index + 1}. ${JSON.stringify(row)}`, {
      width: 520,
    });

    doc.moveDown(0.5);
  });
  addReportFooter(doc);
  doc.end();
};

const exportSimpleExcel = async (title, rows, res) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(title);

  if (rows && rows.length > 0) {
    worksheet.columns = Object.keys(rows[0]).map((key) => ({
      header: key,
      key,
      width: 25,
    }));

    rows.forEach((row) => {
      worksheet.addRow(row);
    });
  } else {
    worksheet.addRow(["No records found"]);
  }

  worksheet.getRow(1).font = {
    bold: true,
  };

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${title.replace(/\s+/g, "_")}.xlsx"`
  );

  await workbook.xlsx.write(res);
  res.end();
};

module.exports = {
  exportSimplePdf,
  exportSimpleExcel,
};