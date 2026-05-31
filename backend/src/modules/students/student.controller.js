const {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  updateStudentStatus,
  deleteStudent,
  upsertStudentPaymentDate,
} = require("./student.service");

const create = async (req, res, next) => {
  try {
    const student = await createStudent(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Student created successfully",
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

const list = async (req, res, next) => {
  try {
const data = await getStudents({
  branchId: req.query.branchId,
  search: req.query.search,
  feeStatus: req.query.feeStatus,
  studentStatus: req.query.studentStatus,
  fromDate: req.query.fromDate,
  toDate: req.query.toDate,
  month: req.query.month,
  year: req.query.year,
  page: req.query.page,
  limit: req.query.limit,
});

    res.status(200).json({
      success: true,
      message: "Students fetched successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const details = async (req, res, next) => {
  try {
    const student = await getStudentById(req.params.id, req.user);

    res.status(200).json({
      success: true,
      message: "Student fetched successfully",
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const student = await updateStudent(req.params.id, req.body, req.user);

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const student = await updateStudentStatus(req.params.id, req.body, req.user);

    res.status(200).json({
      success: true,
      message: "Student status updated successfully",
      data: student,
    });
  } catch (error) {
    next(error);
  }
};

const updatePaymentDate = async (req, res, next) => {
  try {
    const data = await upsertStudentPaymentDate(
      {
        studentId: req.params.id,
        feeDate: req.body.feeDate,
        paidDate: req.body.paidDate,
      },
      req.user
    );

    res.status(200).json({
      success: true,
      message: "Paid date updated successfully",
      data,
    });
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await deleteStudent(req.params.id, req.user);

    res.status(200).json({
      success: true,
      message: "Student deleted successfully",
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
  updateStatus,
  updatePaymentDate,
  remove,
};