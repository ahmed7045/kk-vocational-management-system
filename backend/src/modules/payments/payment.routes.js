const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/auth.middleware");
const requirePermission = require("../../middleware/permission.middleware");

const {
  create,
  list,
  studentHistory,
  recent,
  methods,
  createMethod,
} = require("./payment.controller");

router.get(
  "/methods",
  authMiddleware,
  requirePermission("payment_methods.view"),
  methods
);

router.post(
  "/methods",
  authMiddleware,
  requirePermission("payment_methods.create"),
  createMethod
);

router.get(
  "/recent",
  authMiddleware,
  requirePermission("payments.view"),
  recent
);

router.get(
  "/student/:studentId",
  authMiddleware,
  requirePermission("payments.view"),
  studentHistory
);

router.get(
  "/",
  authMiddleware,
  requirePermission("payments.view"),
  list
);

router.post(
  "/",
  authMiddleware,
  requirePermission("payments.create"),
  create
);

module.exports = router;