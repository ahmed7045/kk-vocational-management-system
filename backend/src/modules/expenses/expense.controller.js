const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseCategories,
  createExpenseCategory,
  generateExpensePdf,
  generateExpenseExcel,
} = require("./expense.service");

const create = async (req, res, next) => {
  try {
    const expense = await createExpense(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const expenses = await getExpenses(req.query, req.user);

    res.status(200).json({
      success: true,
      message: "Expenses fetched successfully",
      data: expenses,
    });
  } catch (error) {
    next(error);
  }
};

const details = async (req, res, next) => {
  try {
    const expense = await getExpenseById(req.params.id, req.user);

    res.status(200).json({
      success: true,
      message: "Expense fetched successfully",
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const expense = await updateExpense(req.params.id, req.body, req.user);

    res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await deleteExpense(req.params.id, req.user);

    res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const categories = async (req, res, next) => {
  try {
    const data = await getExpenseCategories();

    res.status(200).json({
      success: true,
      message: "Expense categories fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const data = await createExpenseCategory(req.body);

    res.status(201).json({
      success: true,
      message: "Expense category created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const exportPdf = async (req, res, next) => {
  try {
    const expenses = await generateExpensePdf(req.query, req.user);

    const logoPath = path.join(__dirname, "../../assets/logo.png");

    const portalTitle =
      req.query.portalType === "welfare"
        ? "Welfare Expenses Report"
        : "Vocational Expenses Report";

    const categoryText = expenses[0]?.category_name || "All Categories";

    const fromDateText = req.query.fromDate
      ? new Date(req.query.fromDate).toLocaleDateString("en-GB")
      : "Start";

    const toDateText = req.query.toDate
      ? new Date(req.query.toDate).toLocaleDateString("en-GB")
      : "Today";

    const totalExpense = expenses.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const doc = new PDFDocument({
      margin: 40,
      size: "A4",
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=expenses-report.pdf"
    );

    doc.pipe(res);

    const pageWidth = doc.page.width;
    const logoWidth = 95;
    const logoX = (pageWidth - logoWidth) / 2;

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, logoX, 25, {
        width: logoWidth,
      });
    }

    doc.y = 170;

    doc
      .fontSize(16)
      .font("Helvetica-Bold")
      .text(portalTitle, {
        align: "center",
      });

    doc.moveDown(0.4);

    doc
      .fontSize(11)
      .font("Helvetica-Bold")
      .text(`From ${fromDateText} to ${toDateText}`, {
        align: "center",
      });

    doc.moveDown(0.3);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Category: ${categoryText}`, {
        align: "center",
      });

    doc.moveDown(1.8);

    const tableLeft = 55;
    const tableWidth = 485;
    const rowHeight = 30;

    const col1 = 45;
    const col2 = 150;
    const col3 = 120;
    const col4 = 90;
    const col5 = 80;
    let y = doc.y;

    const drawTableRow = () => {
      doc.rect(tableLeft, y, tableWidth, rowHeight).stroke();

      doc
        .moveTo(tableLeft + col1, y)
        .lineTo(tableLeft + col1, y + rowHeight)
        .stroke();

      doc
        .moveTo(tableLeft + col1 + col2, y)
        .lineTo(tableLeft + col1 + col2, y + rowHeight)
        .stroke();

      doc
        .moveTo(tableLeft + col1 + col2 + col3, y)
        .lineTo(tableLeft + col1 + col2 + col3, y + rowHeight)
        .stroke();

      doc
        .moveTo(tableLeft + col1 + col2 + col3 + col4, y)
        .lineTo(tableLeft + col1 + col2 + col3 + col4, y + rowHeight)
        .stroke();
    };

    drawTableRow();

    doc.fontSize(10).font("Helvetica-Bold");

    doc.text("S.No", tableLeft + 8, y + 10, {
      width: col1 - 16,
    });

    doc.text("Name", tableLeft + col1 + 8, y + 10, {
      width: col2 - 16,
    });

    doc.text("Category", tableLeft + col1 + col2 + 8, y + 10, {
      width: col3 - 16,
    });

    doc.text("Amount", tableLeft + col1 + col2 + col3 + 8, y + 10, {
      width: col4 - 16,
      align: "right",
    });

    doc.text("Date", tableLeft + col1 + col2 + col3 + col4 + 8, y + 10, {
      width: col5 - 16,
    });

    y += rowHeight;

    doc.font("Helvetica");

    expenses.forEach((item, index) => {
      if (y > 720) {
        doc.addPage();
        y = 50;
      }

      drawTableRow();

      doc.text(index + 1, tableLeft + 8, y + 10, {
        width: col1 - 16,
      });

      doc.text(item.title || "-", tableLeft + col1 + 8, y + 10, {
        width: col2 - 16,
      });

      doc.text(item.category_name || "-", tableLeft + col1 + col2 + 8, y + 10, {
        width: col3 - 16,
      });

      doc.text(
        `Rs ${Number(item.amount || 0).toLocaleString()}`,
        tableLeft + col1 + col2 + col3 + 8,
        y + 10,
        {
          width: col4 - 16,
          align: "right",
        }
      );

      doc.text(
        item.expense_date
          ? new Date(item.expense_date).toLocaleDateString("en-GB")
          : "-",
        tableLeft + col1 + col2 + col3 + col4 + 8,
        y + 10,
        {
          width: col5 - 16,
        }
      );

      y += rowHeight;
    });

    if (y > 720) {
      doc.addPage();
      y = 50;
    }

    doc.rect(tableLeft, y, tableWidth, rowHeight).stroke();

    doc
      .font("Helvetica-Bold")
      .text("Total Expense", tableLeft + 8, y + 10, {
        width: col1 + col2 + col3 - 16,
        align: "right",
      });

    doc.text(
      `Rs ${totalExpense.toLocaleString()}`,
      tableLeft + col1 + col2 + col3 + 8,
      y + 10,
      {
        width: col4 - 16,
        align: "right",
      }
    );

    doc.end();
  } catch (error) {
    next(error);
  }
};

const exportExcel = async (req, res, next) => {
  try {
    const expenses = await generateExpenseExcel(req.query, req.user);

    const logoPath = path.join(__dirname, "../../assets/logo.png");

    const portalTitle =
      req.query.portalType === "welfare"
        ? "Welfare Expenses Report"
        : "Vocational Expenses Report";

    const categoryText = expenses[0]?.category_name || "All Categories";

    const fromDateText = req.query.fromDate
      ? new Date(req.query.fromDate).toLocaleDateString("en-GB")
      : "Start";

    const toDateText = req.query.toDate
      ? new Date(req.query.toDate).toLocaleDateString("en-GB")
      : "Today";

    const totalExpense = expenses.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Expenses Report");

    sheet.columns = [
      { key: "sr", width: 12 },
      { key: "name", width: 32 },
      { key: "category", width: 24 },
      { key: "amount", width: 20 },
      { key: "date", width: 20 },
    ];

    sheet.getRow(1).height = 25;
    sheet.getRow(2).height = 25;
    sheet.getRow(3).height = 25;
    sheet.getRow(4).height = 10;

    if (fs.existsSync(logoPath)) {
      const imageId = workbook.addImage({
        filename: logoPath,
        extension: "png",
      });

      sheet.addImage(imageId, {
        tl: { col: 1.75, row: 0.2 },
        ext: { width: 145, height: 62 },
      });
    }

    sheet.mergeCells("A7:E7");
    sheet.getCell("A7").value = portalTitle;
    sheet.getCell("A7").font = {
      bold: true,
      size: 16,
    };
    sheet.getCell("A7").alignment = {
      horizontal: "center",
    };

    sheet.mergeCells("A8:E8");
    sheet.getCell("A8").value = `From ${fromDateText} to ${toDateText}`;
    sheet.getCell("A8").font = {
      bold: true,
      size: 11,
    };
    sheet.getCell("A8").alignment = {
      horizontal: "center",
    };

    sheet.mergeCells("A9:E9");
    sheet.getCell("A9").value = `Category: ${categoryText}`;
    sheet.getCell("A9").alignment = {
      horizontal: "center",
    };

    const headerRow = sheet.getRow(11);
    headerRow.values = ["S.No", "Name", "Category", "Amount", "Date"];
    headerRow.height = 22;
    headerRow.font = {
      bold: true,
    };

    headerRow.eachCell((cell) => {
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    let rowNumber = 12;

    expenses.forEach((item, index) => {
      const row = sheet.getRow(rowNumber);

      row.values = [
        index + 1,
        item.title || "-",
        item.category_name || "-",
        Number(item.amount || 0),
        item.expense_date
          ? new Date(item.expense_date).toLocaleDateString("en-GB")
          : "-",
      ];

      row.height = 22;

      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };

        cell.alignment = {
          vertical: "middle",
          horizontal: colNumber === 4 ? "right" : "left",
        };
      });

      rowNumber += 1;
    });

    const totalRow = sheet.getRow(rowNumber);

    sheet.mergeCells(`A${rowNumber}:C${rowNumber}`);

    totalRow.getCell(1).value = "Total Expense";
    totalRow.getCell(4).value = totalExpense;
    totalRow.getCell(5).value = "";

    totalRow.height = 22;

    totalRow.eachCell((cell, colNumber) => {
      cell.font = {
        bold: true,
      };

      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };

      cell.alignment = {
        vertical: "middle",
        horizontal: colNumber === 4 ? "right" : "center",
      };
    });

    sheet.getColumn(4).numFmt = '"Rs "#,##0';

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=expenses-report.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  list,
  details,
  update,
  remove,
  categories,
  createCategory,
  exportPdf,
  exportExcel,
};