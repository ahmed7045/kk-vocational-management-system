const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/auth.middleware");
const requirePermission = require("../../middleware/permission.middleware");

const {
  create,
  list,
  update,
} = require("./course.controller");

router.get(
  "/",
  authMiddleware,
  requirePermission("courses.view"),
  list
);

router.post(
  "/",
  authMiddleware,
  requirePermission("courses.create"),
  create
);

router.put(
  "/:id",
  authMiddleware,
  requirePermission("courses.update"),
  update
);

module.exports = router;