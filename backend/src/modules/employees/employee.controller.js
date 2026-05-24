const {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeePermissions,
} = require("./employee.service");

const create = async (req, res, next) => {
  try {
    const employee = await createEmployee(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const employees = await getEmployees(req.query, req.user);

    res.status(200).json({
      success: true,
      message: "Employees fetched successfully",
      data: employees,
    });
  } catch (error) {
    next(error);
  }
};

const details = async (req, res, next) => {
  try {
    const employee = await getEmployeeById(req.params.id, req.user);

    res.status(200).json({
      success: true,
      message: "Employee fetched successfully",
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const employee = await updateEmployee(req.params.id, req.body, req.user);

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await deleteEmployee(req.params.id, req.user);

    res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const permissions = async (req, res, next) => {
  try {
    const data = await getEmployeePermissions();

    res.status(200).json({
      success: true,
      message: "Employee permissions fetched successfully",
      data,
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
  remove,
  permissions,
};