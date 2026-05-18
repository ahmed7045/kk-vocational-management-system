const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/auth.middleware");
const requirePermission = require("../../middleware/permission.middleware");

const {
  studentReport,
  financialReport,
  welfareReport,
  exportStudentReportPdf,
  exportStudentReportExcel,
  exportFinancialReportPdf,
  exportFinancialReportExcel,
  exportWelfareReportPdf,
  exportWelfareReportExcel,
} = require("./report.controller");

router.get(
  "/students",
  authMiddleware,
  requirePermission("reports.students.view"),
  studentReport
);

router.get(
  "/financial",
  authMiddleware,
  requirePermission("reports.financial.view"),
  financialReport
);

router.get(
  "/welfare",
  authMiddleware,
  requirePermission("reports.welfare.view"),
  welfareReport
);

router.get(
  "/students/export/pdf",
  authMiddleware,
  requirePermission("reports.export_pdf"),
  exportStudentReportPdf
);

router.get(
  "/students/export/excel",
  authMiddleware,
  requirePermission("reports.export_excel"),
  exportStudentReportExcel
);

router.get(
  "/financial/export/pdf",
  authMiddleware,
  requirePermission("reports.export_pdf"),
  exportFinancialReportPdf
);

router.get(
  "/financial/export/excel",
  authMiddleware,
  requirePermission("reports.export_excel"),
  exportFinancialReportExcel
);

router.get(
  "/welfare/export/pdf",
  authMiddleware,
  requirePermission("reports.export_pdf"),
  exportWelfareReportPdf
);

router.get(
  "/welfare/export/excel",
  authMiddleware,
  requirePermission("reports.export_excel"),
  exportWelfareReportExcel
);

module.exports = router;