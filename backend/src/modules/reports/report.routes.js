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
  getOpeningBalanceController,
  saveOpeningBalanceController,
  vocationalMonthlyReportController,
  exportVocationalMonthlyReportPdf,
  getWelfareOpeningBalanceController,
  saveWelfareOpeningBalanceController,
  welfareMonthlyReportController,
  exportWelfareMonthlyReportPdf,
  listSavedMonthlyReportsController,
  createSavedMonthlyReportController,
  previewSavedMonthlyReportPdf,
  downloadSavedMonthlyReportPdf,
  deleteSavedMonthlyReportController,
} = require("./report.controller");

router.get(
  "/monthly/saved",
  authMiddleware,
  requirePermission("reports.financial.view"),
  listSavedMonthlyReportsController
);

router.post(
  "/monthly/saved",
  authMiddleware,
  requirePermission("reports.financial.view"),
  createSavedMonthlyReportController
);

router.get(
  "/monthly/saved/:id/preview",
  authMiddleware,
  requirePermission("reports.export_pdf"),
  previewSavedMonthlyReportPdf
);

router.get(
  "/monthly/saved/:id/download",
  authMiddleware,
  requirePermission("reports.export_pdf"),
  downloadSavedMonthlyReportPdf
);

router.delete(
  "/monthly/saved/:id",
  authMiddleware,
  requirePermission("reports.financial.view"),
  deleteSavedMonthlyReportController
);

router.get(
  "/vocational/opening-balance",
  authMiddleware,
  requirePermission("reports.financial.view"),
  getOpeningBalanceController
);

router.put(
  "/vocational/opening-balance",
  authMiddleware,
  requirePermission("reports.financial.view"),
  saveOpeningBalanceController
);

router.get(
  "/vocational/monthly",
  authMiddleware,
  requirePermission("reports.financial.view"),
  vocationalMonthlyReportController
);

router.get(
  "/vocational/monthly/export/pdf",
  authMiddleware,
  requirePermission("reports.export_pdf"),
  exportVocationalMonthlyReportPdf
);

router.get(
  "/welfare/opening-balance",
  authMiddleware,
  requirePermission("reports.welfare.view"),
  getWelfareOpeningBalanceController
);

router.put(
  "/welfare/opening-balance",
  authMiddleware,
  requirePermission("reports.welfare.view"),
  saveWelfareOpeningBalanceController
);

router.get(
  "/welfare/monthly",
  authMiddleware,
  requirePermission("reports.welfare.view"),
  welfareMonthlyReportController
);

router.get(
  "/welfare/monthly/export/pdf",
  authMiddleware,
  requirePermission("reports.export_pdf"),
  exportWelfareMonthlyReportPdf
);

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