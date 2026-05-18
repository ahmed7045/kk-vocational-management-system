const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/auth.middleware");
const requirePermission = require("../../middleware/permission.middleware");

const {
  create,
  list,
  download,
} = require("./certificate.controller");

router.get(
  "/",
  authMiddleware,
  requirePermission("certificates.view"),
  list
);

router.post(
  "/generate",
  authMiddleware,
  requirePermission("certificates.generate"),
  create
);

router.get(
  "/:id/download",
  authMiddleware,
  requirePermission("certificates.download"),
  download
);

module.exports = router;