const {
  createCourse,
  getCourses,
  updateCourse,
} = require("./course.service");

const create = async (req, res, next) => {
  try {
    const course = await createCourse(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

const list = async (req, res, next) => {
  try {
    const courses = await getCourses(req.query, req.user);

    res.status(200).json({
      success: true,
      message: "Courses fetched successfully",
      data: courses,
    });
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const course = await updateCourse(req.params.id, req.body, req.user);

    res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: course,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
  list,
  update,
};