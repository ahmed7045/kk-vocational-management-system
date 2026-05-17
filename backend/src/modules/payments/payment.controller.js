const {
  createPayment,
  getPayments,
  getStudentPaymentHistory,
  getRecentPayments,
  getPaymentMethods,
  createPaymentMethod,
} = require("./payment.service");

const create = async (req, res, next) => {
  try {
    const payment = await createPayment(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Payment added successfully",
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const payments = await getPayments(req.query, req.user);

    res.status(200).json({
      success: true,
      message: "Payments fetched successfully",
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

const studentHistory = async (req, res, next) => {
  try {
    const data = await getStudentPaymentHistory(req.params.studentId, req.user);

    res.status(200).json({
      success: true,
      message: "Student payment history fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const recent = async (req, res, next) => {
  try {
    const payments = await getRecentPayments(req.query, req.user);

    res.status(200).json({
      success: true,
      message: "Recent payments fetched successfully",
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

const methods = async (req, res, next) => {
  try {
    const data = await getPaymentMethods();

    res.status(200).json({
      success: true,
      message: "Payment methods fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const createMethod = async (req, res, next) => {
  try {
    const data = await createPaymentMethod(req.body);

    res.status(201).json({
      success: true,
      message: "Payment method created successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  list,
  studentHistory,
  recent,
  methods,
  createMethod,
};