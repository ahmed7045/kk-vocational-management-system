const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");

const {
  createStudent,
  getStudents,
  getStudentById,
  getPaidStudentsReportData,
  updateStudent,
  updateStudentStatus,
  deleteStudent,
  upsertStudentPaymentDate,
  markStudentPaid,
} = require("./student.service");

const formatDate = (date) => {
  if (!date) return "-";

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (amount) => {
  return `Rs ${Number(amount || 0).toLocaleString("en-PK")}`;
};

const getCourseNames = (student) => {
  return student.courses?.length
    ? student.courses.map((course) => course.courseName).join(", ")
    : "-";
};

const getMonthName = (month) => {
  if (!month) return "-";

  const date = new Date(2026, Number(month) - 1, 1);

  return date.toLocaleString("en-US", {
    month: "long",
  });
};

const create = async (req, res, next) => {
  try {
    const student = await createStudent(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

const list = async (req, res, next) => {
  try {
const data = await getStudents({
  branchId: req.query.branchId,
  search: req.query.search,
  feeStatus: req.query.feeStatus,
  studentStatus: req.query.studentStatus,
  fromDate: req.query.fromDate,
  toDate: req.query.toDate,
  month: req.query.month,
  year: req.query.year,
  page: req.query.page,
  limit: req.query.limit,
});

    res.status(200).json({
      success: true,
      message: "Students fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const details = async (req, res, next) => {
  try {
    const student = await getStudentById(req.params.id, req.user);

    res.status(200).json({
      success: true,
      message: "Student fetched successfully",
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const student = await updateStudent(req.params.id, req.body, req.user);

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const student = await updateStudentStatus(req.params.id, req.body, req.user);

    res.status(200).json({
      success: true,
      message: "Student status updated successfully",
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

const markPaid = async (req, res, next) => {
  try {
    const data = await markStudentPaid(
      {
        studentId: req.params.id,
        feeCycleId: req.body.feeCycleId,
        feeDate: req.body.feeDate,
        paidDate: req.body.paidDate,
        amount: req.body.amount,
        paymentMethodId: req.body.paymentMethodId,
      },
      req.user
    );

    res.status(200).json({
      success: true,
      message: "Student marked as paid successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const updatePaymentDate = async (req, res, next) => {
  try {
    const data = await upsertStudentPaymentDate(
      {
        studentId: req.params.id,
        feeDate: req.body.feeDate,
        paidDate: req.body.paidDate,
      },
      req.user
    );

    res.status(200).json({
      success: true,
      message: "Paid date updated successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await deleteStudent(req.params.id, req.user);

    res.status(200).json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const paidStudentsPdfReport = async (req, res, next) => {
  try {
    const filters = {
      branchId: req.query.branchId,
      search: req.query.search,
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      month: req.query.month,
      year: req.query.year,
    };

    const students = await getPaidStudentsReportData(filters);

    const doc = new PDFDocument({
      size: "A4",
      margin: 35,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="paid-students-report.pdf"`
    );

    doc.pipe(res);

    const pageWidth = doc.page.width;
    const logoPath = path.join(__dirname, "../../assets/logo.png");

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, pageWidth / 2 - 38, 25, {
        width: 76,
        height: 76,
      });
    }

    // doc.moveDown(4.4);
    doc.y = 115;

    doc
      .font("Helvetica-Bold")
      .fontSize(16)
      .text("Paid Students Report", {
        align: "center",
      });

    doc.moveDown(0.4);

    doc
      .font("Helvetica")
      .fontSize(10)
      .text(`Report Generated: ${formatDate(new Date())}`, {
        align: "center",
      });

    doc.moveDown(1);

    const filterText = [];

    filterText.push(`Branch: ${students[0]?.branch_name || "Selected Branch"}`);

    if (filters.search) {
      filterText.push(`Search: ${filters.search}`);
    }

    if (filters.fromDate && filters.toDate) {
      filterText.push(
        `Date Range: ${formatDate(filters.fromDate)} to ${formatDate(filters.toDate)}`
      );
    } else {
      filterText.push(
        `Month/Year: ${getMonthName(filters.month)} ${filters.year || ""}`
      );
    }

    filterText.push("Status: Paid");

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text("Filters:");

    doc
      .font("Helvetica")
      .fontSize(9)
      .text(filterText.join(" | "));

    doc.moveDown(1);

    const startX = 35;
    let y = doc.y;

const columns = [
  { title: "S.No", width: 40 },
  { title: "Student", width: 95 },
  { title: "Student ID", width: 60 },
  { title: "Course", width: 120 },
  { title: "Fees", width: 70 },
  { title: "Fees Date", width: 70 },
  { title: "Paid Date", width: 70 },
];

    const drawTableHeader = () => {
      let x = startX;

      doc
        .rect(startX, y, 525, 24)
        .fill("#eff6ff");

      doc
        .fillColor("#111827")
        .font("Helvetica-Bold")
        .fontSize(8.5);

      columns.forEach((column) => {
        doc.text(column.title, x + 4, y + 8, {
          width: column.width - 8,
          lineBreak: false,
        });

        x += column.width;
      });

      y += 24;
      doc.fillColor("#111827");
    };

    const drawRow = (student, index) => {
      if (y > 760) {
        doc.addPage();
        y = 35;
        drawTableHeader();
      }

      let x = startX;

      if (index % 2 === 0) {
        doc
          .rect(startX, y, 525, 28)
          .fill("#f8fafc")
          .fillColor("#111827");
      }

      const rowValues = [
        index + 1,
        student.full_name || "-",
        student.student_code || student.id || "-",
        getCourseNames(student),
        formatCurrency(student.cycle_amount || student.total_fee || student.paid_fee || 0),
        formatDate(student.fees_date),
        formatDate(student.paid_date),
      ];

      doc
        .font("Helvetica")
        .fontSize(8)
        .fillColor("#111827");

      rowValues.forEach((value, columnIndex) => {
        doc.text(String(value), x + 4, y + 8, {
          width: columns[columnIndex].width - 8,
          lineBreak: false,
          ellipsis: true,
        });

        x += columns[columnIndex].width;
      });

      y += 28;
    };

    drawTableHeader();

    if (students.length === 0) {
      doc
        .font("Helvetica")
        .fontSize(10)
        .text("No paid students found for selected filters.", startX, y + 15);
    } else {
      students.forEach((student, index) => {
        drawRow(student, index);
      });
    }

    doc.moveDown(1);

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .text(`Total Records: ${students.length}`, startX, y + 12);

    doc.end();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  list,
  details,
  update,
  updateStatus,
  markPaid,
  updatePaymentDate,
  paidStudentsPdfReport,
  remove,
};