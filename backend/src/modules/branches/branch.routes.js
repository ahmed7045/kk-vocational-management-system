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
} = require("./branch.controller");

router.get(
  "/",
  authMiddleware,
  requirePermission("branches.view"),
  list
);

router.get(
  "/:id",
  authMiddleware,
  requirePermission("branches.view"),
  details
);

router.post(
  "/",
  authMiddleware,
  requirePermission("branches.create"),
  create
);

router.put(
  "/:id",
  authMiddleware,
  requirePermission("branches.update"),
  update
);

router.delete(
  "/:id",
  authMiddleware,
  requirePermission("branches.delete"),
  remove
);

module.exports = router;