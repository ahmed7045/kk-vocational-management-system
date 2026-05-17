const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/auth.middleware");
const requirePermission = require("../../middleware/permission.middleware");

const {
  create,
  list,
  details,
  update,
  categories,
  createCategory,
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

module.exports = router;