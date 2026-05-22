const {
  createEmployee,
  getEmployees,
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
  permissions,
};