const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/auth.middleware");
const requirePermission = require("../../middleware/permission.middleware");

const {
  createDonorController,
  getDonorsController,
  createCharityController,
  getCharitiesController,
  createDonationController,
  getDonationsController,
  createApplicationController,
  getApplicationsController,
  getApplicationDetailsController,
  updateApplicationStatusController,
  getDonationMethodsController,
  createDonationMethodController,
  createImpactController,
  dashboardController,
} = require("./welfare.controller");

router.get(
  "/dashboard",
  authMiddleware,
  requirePermission("welfare.dashboard.view"),
  dashboardController
);

router.get(
  "/donation-methods",
  authMiddleware,
  requirePermission("donation_methods.view"),
  getDonationMethodsController
);

router.post(
  "/donation-methods",
  authMiddleware,
  requirePermission("donation_methods.create"),
  createDonationMethodController
);

router.get(
  "/donors",
  authMiddleware,
  requirePermission("welfare.donor.view"),
  getDonorsController
);

router.post(
  "/donors",
  authMiddleware,
  requirePermission("welfare.donor.create"),
  createDonorController
);

router.get(
  "/charities",
  authMiddleware,
  requirePermission("welfare.charity.view"),
  getCharitiesController
);

router.post(
  "/charities",
  authMiddleware,
  requirePermission("welfare.charity.create"),
  createCharityController
);

router.get(
  "/donations",
  authMiddleware,
  requirePermission("welfare.donation.view"),
  getDonationsController
);

router.post(
  "/donations",
  authMiddleware,
  requirePermission("welfare.donation.create"),
  createDonationController
);

router.get(
  "/applications",
  authMiddleware,
  requirePermission("welfare.application.view"),
  getApplicationsController
);

router.get(
  "/applications/:id",
  authMiddleware,
  requirePermission("welfare.application.view"),
  getApplicationDetailsController
);

router.post(
  "/applications",
  authMiddleware,
  requirePermission("welfare.application.create"),
  createApplicationController
);

router.patch(
  "/applications/:id/status",
  authMiddleware,
  requirePermission("welfare.application.approve"),
  updateApplicationStatusController
);

router.post(
  "/impact",
  authMiddleware,
  requirePermission("welfare.dashboard.view"),
  createImpactController
);

module.exports = router;