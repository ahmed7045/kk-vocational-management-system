const express = require("express");
const router = express.Router();

const authMiddleware = require("../../middleware/auth.middleware");
const requirePermission = require("../../middleware/permission.middleware");

const {
  createDonorController,
  getDonorsController,
  updateDonorController,
  deleteDonorController,

  createCharityController,
  getCharitiesController,
  updateCharityController,
  deleteCharityController,
  getCharityHistoryController,
  createCharityForProfileController,
  getAllCharityRecordsController,

  createDonationController,
  getDonationsController,
  updateDonationController,
  deleteDonationController,

  getDonorDonationsController,
  createDonationForDonorController,

  createApplicationController,
  getApplicationsController,
  getApplicationDetailsController,
  updateApplicationController,
  deleteApplicationController,
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
  "/donors/:id/donations",
  authMiddleware,
  requirePermission("welfare.donation.view"),
  getDonorDonationsController
);

router.post(
  "/donors/:id/donations",
  authMiddleware,
  requirePermission("welfare.donation.create"),
  createDonationForDonorController
);

router.put(
  "/donors/:id",
  authMiddleware,
  requirePermission("welfare.donor.update"),
  updateDonorController
);

router.delete(
  "/donors/:id",
  authMiddleware,
  requirePermission("welfare.donor.delete"),
  deleteDonorController
);

router.get(
  "/charities",
  authMiddleware,
  requirePermission("welfare.charity.view"),
  getCharitiesController
);

router.get(
  "/charity-records",
  authMiddleware,
  requirePermission("welfare.charity.view"),
  getAllCharityRecordsController
);

router.post(
  "/charities",
  authMiddleware,
  requirePermission("welfare.charity.create"),
  createCharityController
);

router.get(
  "/charities/:id/history",
  authMiddleware,
  requirePermission("welfare.charity.view"),
  getCharityHistoryController
);

router.post(
  "/charities/:id/history",
  authMiddleware,
  requirePermission("welfare.charity.create"),
  createCharityForProfileController
);

router.put(
  "/charities/:id",
  authMiddleware,
  requirePermission("welfare.charity.update"),
  updateCharityController
);

router.delete(
  "/charities/:id",
  authMiddleware,
  requirePermission("welfare.charity.delete"),
  deleteCharityController
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

router.put(
  "/donations/:id",
  authMiddleware,
  requirePermission("welfare.donation.create"),
  updateDonationController
);

router.delete(
  "/donations/:id",
  authMiddleware,
  requirePermission("welfare.donation.delete"),
  deleteDonationController
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

router.put(
  "/applications/:id",
  authMiddleware,
  requirePermission("welfare.application.update"),
  updateApplicationController
);

router.delete(
  "/applications/:id",
  authMiddleware,
  requirePermission("welfare.application.delete"),
  deleteApplicationController
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