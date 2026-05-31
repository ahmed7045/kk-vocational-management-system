const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/auth.middleware");
const requirePermission = require("../../middleware/permission.middleware");

const {
  create,
  list,
  update,
  remove,
  createTeacher,
  listTeachers,
  updateTeacher,
  removeTeacher,
} = require("./course.controller");

router.get(
  "/teachers",
  authMiddleware,
  requirePermission("courses.view"),
  listTeachers
);

router.post(
  "/teachers",
  authMiddleware,
  requirePermission("courses.create"),
  createTeacher
);

router.put(
  "/teachers/:id",
  authMiddleware,
  requirePermission("courses.update"),
  updateTeacher
);

router.delete(
  "/teachers/:id",
  authMiddleware,
  requirePermission("courses.delete"),
  removeTeacher
);

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

router.delete(
  "/:id",
  authMiddleware,
  requirePermission("courses.delete"),
  remove
);

module.exports = router;