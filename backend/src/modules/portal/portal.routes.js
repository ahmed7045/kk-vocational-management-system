const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/auth.middleware");
const { portals, branches } = require("./portal.controller");

router.get("/portals", authMiddleware, portals);
router.get("/branches", authMiddleware, branches);

module.exports = router;