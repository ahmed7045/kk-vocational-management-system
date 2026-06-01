const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/auth.middleware");
const requirePermission = require("../../middleware/permission.middleware");

const {
  create,
  list,
  details,
  update,
  remove,
  categories,
  createCategory,
  exportPdf,
exportExcel,
} = require("./expense.controller");

router.get(
  "/categories",
  authMiddleware,
  requirePermission("expense_categories.view"),
  categories
);

router.post(
  "/categories",
  authMiddleware,
  requirePermission("expense_categories.create"),
  createCategory
);

router.get(
  "/",
  authMiddleware,
  requirePermission("expenses.view"),
  list
);

router.get(
  "/report/pdf",
  authMiddleware,
  requirePermission("expenses.view"),
  exportPdf
);

router.get(
  "/report/excel",
  authMiddleware,
  requirePermission("expenses.view"),
  exportExcel
);

router.get(
  "/:id",
  authMiddleware,
  requirePermission("expenses.view"),
  details
);

router.post(
  "/",
  authMiddleware,
  requirePermission("expenses.create"),
  create
);

router.put(
  "/:id",
  authMiddleware,
  requirePermission("expenses.update"),
  update
);

router.delete(
  "/:id",
  authMiddleware,
  requirePermission("expenses.delete"),
  remove
);



module.exports = router;