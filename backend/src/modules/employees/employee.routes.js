// const express = require("express");
// const router = express.Router();

// const authMiddleware = require("../../middleware/auth.middleware");
// const requirePermission = require("../../middleware/permission.middleware");

// const { create, list } = require("./employee.controller");

// router.get(
//   "/",
//   authMiddleware,
//   requirePermission("employees.view"),
//   list
// );

// router.post(
//   "/",
//   authMiddleware,
//   requirePermission("employees.create"),
//   create
// );

// module.exports = router;

const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/auth.middleware");
const requirePermission = require("../../middleware/permission.middleware");

const {
  create,
  list,
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

module.exports = router;