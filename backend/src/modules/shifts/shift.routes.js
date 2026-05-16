const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/auth.middleware");
const requirePermission = require("../../middleware/permission.middleware");

const {
  create,
  list,
  update,
} = require("./shift.controller");

router.get(
  "/",
  authMiddleware,
  requirePermission("shifts.view"),
  list
);

router.post(
  "/",
  authMiddleware,
  requirePermission("shifts.create"),
  create
);

router.put(
  "/:id",
  authMiddleware,
  requirePermission("shifts.update"),
  update
);

module.exports = router;