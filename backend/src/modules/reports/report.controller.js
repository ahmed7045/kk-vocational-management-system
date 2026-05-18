const {
  getStudentReport,
  getFinancialReport,
  getWelfareReport,
} = require("./report.service");

const {
  exportSimplePdf,
  exportSimpleExcel,
} = require("./report.export");

const studentReport = async (req, res, next) => {
  try {
    const data = await getStudentReport(req.query, req.user);

    res.status(200).json({
      success: true,
      message: "Student report fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const financialReport = async (req, res, next) => {
  try {
    const data = await getFinancialReport(req.query, req.user);

    res.status(200).json({
      success: true,
      message: "Financial report fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const welfareReport = async (req, res, next) => {
  try {
    const data = await getWelfareReport(req.query);

    res.status(200).json({
      success: true,
      message: "Welfare report fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const exportStudentReportPdf = async (req, res, next) => {
  try {
    const data = await getStudentReport(req.query, req.user);
    exportSimplePdf("Student Report", data, res);
  } catch (error) {
    next(error);
  }
};

const exportStudentReportExcel = async (req, res, next) => {
  try {
    const data = await getStudentReport(req.query, req.user);
    await exportSimpleExcel("Student Report", data, res);
  } catch (error) {
    next(error);
  }
};

const exportFinancialReportPdf = async (req, res, next) => {
  try {
    const data = await getFinancialReport(req.query, req.user);

    const rows = [
      {
        totalRevenue: data.summary.totalRevenue,
        totalExpenses: data.summary.totalExpenses,
        profit: data.summary.profit,
      },
    ];

    exportSimplePdf("Financial Report", rows, res);
  } catch (error) {
    next(error);
  }
};

const exportFinancialReportExcel = async (req, res, next) => {
  try {
    const data = await getFinancialReport(req.query, req.user);

    const rows = [
      {
        totalRevenue: data.summary.totalRevenue,
        totalExpenses: data.summary.totalExpenses,
        profit: data.summary.profit,
      },
    ];

    await exportSimpleExcel("Financial Report", rows, res);
  } catch (error) {
    next(error);
  }
};

const exportWelfareReportPdf = async (req, res, next) => {
  try {
    const data = await getWelfareReport(req.query);

    const rows = [
      {
        totalDonations: data.summary.totalDonations,
        totalApprovedSupport: data.summary.totalApprovedSupport,
        balanceAfterApprovedSupport: data.summary.balanceAfterApprovedSupport,
        totalApplications: data.summary.totalApplications,
      },
    ];

    exportSimplePdf("Welfare Report", rows, res);
  } catch (error) {
    next(error);
  }
};

const exportWelfareReportExcel = async (req, res, next) => {
  try {
    const data = await getWelfareReport(req.query);

    const rows = [
      {
        totalDonations: data.summary.totalDonations,
        totalApprovedSupport: data.summary.totalApprovedSupport,
        balanceAfterApprovedSupport: data.summary.balanceAfterApprovedSupport,
        totalApplications: data.summary.totalApplications,
      },
    ];

    await exportSimpleExcel("Welfare Report", rows, res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  studentReport,
  financialReport,
  welfareReport,
  exportStudentReportPdf,
  exportStudentReportExcel,
  exportFinancialReportPdf,
  exportFinancialReportExcel,
  exportWelfareReportPdf,
  exportWelfareReportExcel,
};