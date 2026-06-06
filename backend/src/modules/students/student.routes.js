const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/auth.middleware");
const requirePermission = require("../../middleware/permission.middleware");

const {
  create,
  list,
  details,
  update,
  updateStatus,
  markPaid,
  updatePaymentDate,
  paidStudentsPdfReport,
  remove,
} = require("./student.controller");

router.get(
  "/",
  authMiddleware,
  requirePermission("students.view"),
  list
);

router.get(
  "/reports/paid/pdf",
  authMiddleware,
  requirePermission("students.view"),
  paidStudentsPdfReport
);

router.post(
  "/",
  authMiddleware,
  requirePermission("students.create"),
  create
);

router.get(
  "/:id",
  authMiddleware,
  requirePermission("students.view"),
  details
);



router.put(
  "/:id",
  authMiddleware,
  requirePermission("students.update"),
  update
);

router.patch(
  "/:id/status",
  authMiddleware,
  requirePermission("students.update"),
  updateStatus
);

router.patch(
  "/:id/mark-paid",
  authMiddleware,
  requirePermission("students.update"),
  markPaid
);

router.patch(
  "/:id/payment-date",
  authMiddleware,
  requirePermission("students.update"),
  updatePaymentDate
);

router.delete(
  "/:id",
  authMiddleware,
  requirePermission("students.delete"),
  remove
);

module.exports = router;