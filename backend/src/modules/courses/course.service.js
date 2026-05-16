const pool = require("../../config/db");
const ApiError = require("../../utils/ApiError");

const canAccessBranch = (user, branchId) => {
  if (user.role === "super_admin") return true;
  return Number(user.branchId) === Number(branchId);
};

const createCourse = async (data, currentUser) => {
  const {
    branchId,
    courseName,
    courseCode,
    duration,
    fee,
    description,
  } = data;

  if (!branchId || !courseName) {
    throw new ApiError(400, "Branch and course name are required");
  }

  if (!canAccessBranch(currentUser, branchId)) {
    throw new ApiError(403, "You cannot create course for this branch");
  }

  const result = await pool.query(
    `
    INSERT INTO courses
    (branch_id, course_name, course_code, duration, fee, description, created_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *
    `,
    [
      branchId,
      courseName,
      courseCode || null,
      duration || null,
      fee || 0,
      description || null,
      currentUser.id,
    ]
  );

  await pool.query(
    `
    INSERT INTO audit_logs (user_id, action, module_name, description)
    VALUES ($1, $2, $3, $4)
    `,
    [
      currentUser.id,
      "CREATE_COURSE",
      "courses",
      `Created course ${courseName}`,
    ]
  );

  return result.rows[0];
};

const getCourses = async (query, currentUser) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const offset = (page - 1) * limit;
  const search = query.search || "";

  let branchId = query.branchId;

  if (currentUser.role !== "super_admin") {
    branchId = currentUser.branchId;
  }

  const result = await pool.query(
    `
    SELECT
      c.id,
      c.branch_id,
      b.name AS branch_name,
      c.course_name,
      c.course_code,
      c.duration,
      c.fee,
      c.description,
      c.is_active,
      c.created_at
    FROM courses c
    LEFT JOIN branches b ON b.id = c.branch_id
    WHERE 
      ($1::INT IS NULL OR c.branch_id = $1)
      AND
      (c.course_name ILIKE $2 OR c.course_code ILIKE $2)
    ORDER BY c.id DESC
    LIMIT $3 OFFSET $4
    `,
    [branchId || null, `%${search}%`, limit, offset]
  );

  return result.rows;
};

const updateCourse = async (id, data, currentUser) => {
  const existing = await pool.query(
    `SELECT * FROM courses WHERE id = $1`,
    [id]
  );

  if (existing.rows.length === 0) {
    throw new ApiError(404, "Course not found");
  }

  const course = existing.rows[0];

  if (!canAccessBranch(currentUser, course.branch_id)) {
    throw new ApiError(403, "You cannot update this course");
  }

  const {
    courseName,
    courseCode,
    duration,
    fee,
    description,
    isActive,
  } = data;

  const result = await pool.query(
    `
    UPDATE courses
    SET
      course_name = COALESCE($1, course_name),
      course_code = COALESCE($2, course_code),
      duration = COALESCE($3, duration),
      fee = COALESCE($4, fee),
      description = COALESCE($5, description),
      is_active = COALESCE($6, is_active)
    WHERE id = $7
    RETURNING *
    `,
    [
      courseName || null,
      courseCode || null,
      duration || null,
      fee ?? null,
      description || null,
      typeof isActive === "boolean" ? isActive : null,
      id,
    ]
  );

  await pool.query(
    `
    INSERT INTO audit_logs (user_id, action, module_name, description)
    VALUES ($1, $2, $3, $4)
    `,
    [
      currentUser.id,
      "UPDATE_COURSE",
      "courses",
      `Updated course ID ${id}`,
    ]
  );

  return result.rows[0];
};

module.exports = {
  createCourse,
  getCourses,
  updateCourse,
};