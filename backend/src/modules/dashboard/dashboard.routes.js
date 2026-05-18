const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/auth.middleware");
const requirePermission = require("../../middleware/permission.middleware");

const {
  summary,
  recentPayments,
  revenueAnalytics,
  expenseAnalytics,
  studentStats,
  coursePopularity,
  overview,
} = require("./dashboard.controller");

router.get(
  "/overview",
  authMiddleware,
  requirePermission("dashboard.view"),
  overview
);

router.get(
  "/summary",
  authMiddleware,
  requirePermission("dashboard.view"),
  summary
);

router.get(
  "/recent-payments",
  authMiddleware,
  requirePermission("dashboard.view"),
  recentPayments
);

router.get(
  "/revenue-analytics",
  authMiddleware,
  requirePermission("dashboard.analytics.view"),
  revenueAnalytics
);

router.get(
  "/expense-analytics",
  authMiddleware,
  requirePermission("dashboard.analytics.view"),
  expenseAnalytics
);

router.get(
  "/student-stats",
  authMiddleware,
  requirePermission("dashboard.analytics.view"),
  studentStats
);

router.get(
  "/course-popularity",
  authMiddleware,
  requirePermission("dashboard.analytics.view"),
  coursePopularity
);

module.exports = router;