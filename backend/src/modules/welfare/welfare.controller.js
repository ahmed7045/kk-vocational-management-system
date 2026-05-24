const {
  createDonor,
  getDonors,
  updateDonor,
  deleteDonor,

  createCharity,
  getCharities,
  updateCharity,
  deleteCharity,
  getCharityHistory,
  createCharityForProfile,
  getAllCharityRecords,

  createDonation,
  getDonations,
  deleteDonation,
  getDonorDonations,
  createDonationForDonor,

  createWelfareApplication,
  getWelfareApplications,
  getWelfareApplicationById,
  updateWelfareApplication,
  deleteWelfareApplication,
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

const updateDonorController = async (req, res, next) => {
  try {
    const data = await updateDonor(req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: "Donor updated successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const deleteDonorController = async (req, res, next) => {
  try {
    await deleteDonor(req.params.id);

    res.status(200).json({
      success: true,
      message: "Donor deleted successfully",
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

const updateCharityController = async (req, res, next) => {
  try {
    const data = await updateCharity(req.params.id, req.body, req.user);

    res.status(200).json({
      success: true,
      message: "Charity updated successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const deleteCharityController = async (req, res, next) => {
  try {
    await deleteCharity(req.params.id, req.user);

    res.status(200).json({
      success: true,
      message: "Charity deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getCharityHistoryController = async (req, res, next) => {
  try {
    const data = await getCharityHistory(req.params.id);

    res.status(200).json({
      success: true,
      message: "Charity history fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const createCharityForProfileController = async (req, res, next) => {
  try {
    const data = await createCharityForProfile(
      req.params.id,
      req.body,
      req.user
    );

    res.status(201).json({
      success: true,
      message: "Charity record added successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};
const getAllCharityRecordsController = async (req, res, next) => {
  try {
    const data = await getAllCharityRecords(req.query);

    res.status(200).json({
      success: true,
      message: "Charity records fetched successfully",
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

const deleteDonationController = async (req, res, next) => {
  try {
    await deleteDonation(req.params.id, req.user);

    res.status(200).json({
      success: true,
      message: "Donation deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const getDonorDonationsController = async (req, res, next) => {
  try {
    const data = await getDonorDonations(req.params.id);

    res.status(200).json({
      success: true,
      message: "Donor donations fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const createDonationForDonorController = async (req, res, next) => {
  try {
    const data = await createDonationForDonor(
      req.params.id,
      req.body,
      req.user
    );

    res.status(201).json({
      success: true,
      message: "Donation added for donor successfully",
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

const updateApplicationController = async (req, res, next) => {
  try {
    const data = await updateWelfareApplication(req.params.id, req.body, req.user);

    res.status(200).json({
      success: true,
      message: "Welfare application updated successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const deleteApplicationController = async (req, res, next) => {
  try {
    await deleteWelfareApplication(req.params.id, req.user);

    res.status(200).json({
      success: true,
      message: "Welfare application deleted successfully",
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
  deleteDonationController,

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

  getDonorDonationsController,
  createDonationForDonorController,
};