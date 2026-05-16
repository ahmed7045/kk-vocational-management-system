const {
  getAvailablePortals,
  getAccessibleBranches,
} = require("./portal.service");

const portals = async (req, res, next) => {
  try {
    const data = await getAvailablePortals(req.user);

    res.status(200).json({
      success: true,
      message: "Available portals fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const branches = async (req, res, next) => {
  try {
    const data = await getAccessibleBranches(req.user);

    res.status(200).json({
      success: true,
      message: "Accessible branches fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  portals,
  branches,
};