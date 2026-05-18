const {
  getDashboardSummary,
  getRecentPayments,
  getRevenueAnalytics,
  getExpenseAnalytics,
  getStudentStats,
  getCoursePopularity,
  getDashboardOverview,
} = require("./dashboard.service");

const summary = async (req, res, next) => {
  try {
    const data = await getDashboardSummary(req.query, req.user);

    res.status(200).json({
      success: true,
      message: "Dashboard summary fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const recentPayments = async (req, res, next) => {
  try {
    const data = await getRecentPayments(req.query, req.user);

    res.status(200).json({
      success: true,
      message: "Recent payments fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const revenueAnalytics = async (req, res, next) => {
  try {
    const data = await getRevenueAnalytics(req.query, req.user);

    res.status(200).json({
      success: true,
      message: "Revenue analytics fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const expenseAnalytics = async (req, res, next) => {
  try {
    const data = await getExpenseAnalytics(req.query, req.user);

    res.status(200).json({
      success: true,
      message: "Expense analytics fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const studentStats = async (req, res, next) => {
  try {
    const data = await getStudentStats(req.query, req.user);

    res.status(200).json({
      success: true,
      message: "Student stats fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const coursePopularity = async (req, res, next) => {
  try {
    const data = await getCoursePopularity(req.query, req.user);

    res.status(200).json({
      success: true,
      message: "Course popularity fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const overview = async (req, res, next) => {
  try {
    const data = await getDashboardOverview(req.query, req.user);

    res.status(200).json({
      success: true,
      message: "Dashboard overview fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  summary,
  recentPayments,
  revenueAnalytics,
  expenseAnalytics,
  studentStats,
  coursePopularity,
  overview,
};