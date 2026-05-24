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
  permissions,
} = require("./employee.controller");

router.get(
  "/permissions",
  authMiddleware,
  requirePermission("employees.create_account"),
  permissions
);

router.get(
  "/",
  authMiddleware,
  requirePermission("employees.view"),
  list
);

router.post(
  "/",
  authMiddleware,
  requirePermission("employees.create"),
  create
);

router.get(
  "/:id",
  authMiddleware,
  requirePermission("employees.view"),
  details
);

router.put(
  "/:id",
  authMiddleware,
  requirePermission("employees.update"),
  update
);

router.delete(
  "/:id",
  authMiddleware,
  requirePermission("employees.delete"),
  remove
);

module.exports = router;