const {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
} = require("./branch.service");

const create = async (req, res, next) => {
  try {
    const branch = await createBranch(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Branch created successfully",
      data: branch,
    });
  } catch (error) {
    next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const branches = await getBranches(req.query);

    res.status(200).json({
      success: true,
      message: "Branches fetched successfully",
      data: branches,
    });
  } catch (error) {
    next(error);
  }
};

const details = async (req, res, next) => {
  try {
    const branch = await getBranchById(req.params.id);

    res.status(200).json({
      success: true,
      message: "Branch fetched successfully",
      data: branch,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const branch = await updateBranch(req.params.id, req.body, req.user);

    res.status(200).json({
      success: true,
      message: "Branch updated successfully",
      data: branch,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  list,
  details,
  update,
};