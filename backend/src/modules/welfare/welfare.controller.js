const {
  createDonor,
  getDonors,
  createCharity,
  getCharities,
  createDonation,
  getDonations,
  createWelfareApplication,
  getWelfareApplications,
  getWelfareApplicationById,
  updateWelfareApplicationStatus,
  getDonationMethods,
  createDonationMethod,
  createWelfareImpact,
  getWelfareDashboard,
} = require("./welfare.service");

const createDonorController = async (req, res, next) => {
  try {
    const data = await createDonor(req.body);

    res.status(201).json({
      success: true,
      message: "Donor created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getDonorsController = async (req, res, next) => {
  try {
    const data = await getDonors(req.query);

    res.status(200).json({
      success: true,
      message: "Donors fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const createCharityController = async (req, res, next) => {
  try {
    const data = await createCharity(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Charity created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getCharitiesController = async (req, res, next) => {
  try {
    const data = await getCharities(req.query);

    res.status(200).json({
      success: true,
      message: "Charities fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const createDonationController = async (req, res, next) => {
  try {
    const data = await createDonation(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Donation created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getDonationsController = async (req, res, next) => {
  try {
    const data = await getDonations(req.query);

    res.status(200).json({
      success: true,
      message: "Donations fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const createApplicationController = async (req, res, next) => {
  try {
    const data = await createWelfareApplication(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Welfare application created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getApplicationsController = async (req, res, next) => {
  try {
    const data = await getWelfareApplications(req.query);

    res.status(200).json({
      success: true,
      message: "Welfare applications fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getApplicationDetailsController = async (req, res, next) => {
  try {
    const data = await getWelfareApplicationById(req.params.id);

    res.status(200).json({
      success: true,
      message: "Welfare application fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const updateApplicationStatusController = async (req, res, next) => {
  try {
    const data = await updateWelfareApplicationStatus(
      req.params.id,
      req.body,
      req.user
    );

    res.status(200).json({
      success: true,
      message: "Welfare application status updated successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getDonationMethodsController = async (req, res, next) => {
  try {
    const data = await getDonationMethods();

    res.status(200).json({
      success: true,
      message: "Donation methods fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const createDonationMethodController = async (req, res, next) => {
  try {
    const data = await createDonationMethod(req.body);

    res.status(201).json({
      success: true,
      message: "Donation method created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const createImpactController = async (req, res, next) => {
  try {
    const data = await createWelfareImpact(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Welfare impact record created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const dashboardController = async (req, res, next) => {
  try {
    const data = await getWelfareDashboard();

    res.status(200).json({
      success: true,
      message: "Welfare dashboard fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};