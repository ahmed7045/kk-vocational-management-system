const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/auth.middleware");
const requirePermission = require("../../middleware/permission.middleware");

const {
  login,
  refresh,
  logout,
  me,
} = require("./auth.controller");

router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);

router.get("/me", authMiddleware, me);

router.get(
  "/test-protected",
  authMiddleware,
  requirePermission("dashboard.view"),
  (req, res) => {
    res.json({
      success: true,
      message: "Protected route working",
      user: req.user,
    });
  }
);

module.exports = router;