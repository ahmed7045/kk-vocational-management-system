const {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseCategories,
  createExpenseCategory,
} = require("./expense.service");

const create = async (req, res, next) => {
  try {
    const expense = await createExpense(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const expenses = await getExpenses(req.query, req.user);

    res.status(200).json({
      success: true,
      message: "Expenses fetched successfully",
      data: expenses,
    });
  } catch (error) {
    next(error);
  }
};

const details = async (req, res, next) => {
  try {
    const expense = await getExpenseById(req.params.id, req.user);

    res.status(200).json({
      success: true,
      message: "Expense fetched successfully",
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const expense = await updateExpense(req.params.id, req.body, req.user);

    res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: expense,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await deleteExpense(req.params.id, req.user);

    res.status(200).json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

const categories = async (req, res, next) => {
  try {
    const data = await getExpenseCategories();

    res.status(200).json({
      success: true,
      message: "Expense categories fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const data = await createExpenseCategory(req.body);

    res.status(201).json({
      success: true,
      message: "Expense category created successfully",
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
  categories,
  createCategory,
};