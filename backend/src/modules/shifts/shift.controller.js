const {
  createShift,
  getShifts,
  updateShift,
  deleteShift,
} = require("./shift.service");

const create = async (req, res, next) => {
  try {
    const shift = await createShift(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Shift created successfully",
      data: shift,
    });
  } catch (error) {
    next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const shifts = await getShifts(req.query, req.user);

    res.status(200).json({
      success: true,
      message: "Shifts fetched successfully",
      data: shifts,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const shift = await updateShift(req.params.id, req.body, req.user);

    res.status(200).json({
      success: true,
      message: "Shift updated successfully",
      data: shift,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await deleteShift(req.params.id, req.user);

    res.status(200).json({
      success: true,
      message: "Shift deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  list,
  update,
  remove,
};