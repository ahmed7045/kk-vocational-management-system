

const {
  createCourse,
  getCourses,
  updateCourse,
  deleteCourse,
  createCourseTeacher,
  getCourseTeachers,
  updateCourseTeacher,
  deleteCourseTeacher,
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
const remove = async (req, res, next) => {
  try {
    await deleteCourse(req.params.id, req.user);

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
const createTeacher = async (req, res, next) => {
  try {
    const teacher = await createCourseTeacher(req.body, req.user);

    res.status(201).json({
      success: true,
      message: "Teacher created successfully",
      data: teacher,
    });
  } catch (error) {
    next(error);
  }
};

const listTeachers = async (req, res, next) => {
  try {
    const teachers = await getCourseTeachers(req.query, req.user);

    res.status(200).json({
      success: true,
      message: "Teachers fetched successfully",
      data: teachers,
    });
  } catch (error) {
    next(error);
  }
};

const updateTeacher = async (req, res, next) => {
  try {
    const teacher = await updateCourseTeacher(req.params.id, req.body, req.user);

    res.status(200).json({
      success: true,
      message: "Teacher updated successfully",
      data: teacher,
    });
  } catch (error) {
    next(error);
  }
};

const removeTeacher = async (req, res, next) => {
  try {
    await deleteCourseTeacher(req.params.id, req.user);

    res.status(200).json({
      success: true,
      message: "Teacher deleted successfully",
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
  createTeacher,
  listTeachers,
  updateTeacher,
  removeTeacher,
};