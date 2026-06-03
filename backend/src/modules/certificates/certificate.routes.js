const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/auth.middleware");
const requirePermission = require("../../middleware/permission.middleware");

const {
  create,
  studentsDropdown,
  list,
  download,
  remove,
} = require("./certificate.controller");

router.get(
  "/",
  authMiddleware,
  requirePermission("certificates.view"),
  list
);

router.get(
  "/students/dropdown",
  authMiddleware,
  requirePermission("certificates.view"),
  studentsDropdown
);

router.post(
  "/generate",
  authMiddleware,
  requirePermission("certificates.generate"),
  create
);

router.delete(
  "/:id",
  authMiddleware,
  requirePermission("certificates.generate"),
  remove
);


router.get(
  "/:id/download",
  authMiddleware,
  requirePermission("certificates.download"),
  download
);

module.exports = router;