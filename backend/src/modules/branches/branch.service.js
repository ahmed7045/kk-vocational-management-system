const pool = require("../../config/db");
const ApiError = require("../../utils/ApiError");

const tableColumnExists = async (client, tableName, columnName) => {
  const result = await client.query(
    `
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
      AND column_name = $2
    LIMIT 1
    `,
    [tableName, columnName]
  );

  return result.rows.length > 0;
};

const deleteByColumnIfExists = async (client, tableName, columnName, value) => {
  const exists = await tableColumnExists(client, tableName, columnName);

  if (!exists) return;

  await client.query(
    `DELETE FROM ${tableName} WHERE ${columnName} = $1`,
    [value]
  );
};

const updateUsersBranchToNull = async (client, branchId) => {
  const hasBranchId = await tableColumnExists(client, "users", "branch_id");

  if (!hasBranchId) return;

  await client.query(
    `
    UPDATE users
    SET branch_id = NULL
    WHERE branch_id = $1
    `,
    [branchId]
  );
};

const createBranch = async (data, currentUser) => {
  const { name, location, status } = data;

  if (!name || !name.trim()) {
    throw new ApiError(400, "Branch name is required");
  }

  const result = await pool.query(
    `
    INSERT INTO branches (name, location, status)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [
      name.trim(),
      location?.trim() || null,
      status || "active",
    ]
  );

  await pool.query(
    `
    INSERT INTO audit_logs (user_id, action, module_name, description)
    VALUES ($1, $2, $3, $4)
    `,
    [
      currentUser.id,
      "CREATE_BRANCH",
      "branches",
      `Created branch ${name.trim()}`,
    ]
  );

  return result.rows[0];
};

const getBranches = async () => {
  const result = await pool.query(
    `
    SELECT
      b.id,
      b.name,
      b.location,
      b.status,
      b.created_at,

      COALESCE((
        SELECT COUNT(*)
        FROM students s
        WHERE s.branch_id = b.id
      ), 0) AS students_count,

      COALESCE((
        SELECT COUNT(*)
        FROM students s
        WHERE s.branch_id = b.id
      ), 0) AS total_students,

      COALESCE((
        SELECT SUM(p.amount)
        FROM payments p
        WHERE p.branch_id = b.id
      ), 0) AS total_payments,

      COALESCE((
        SELECT SUM(e.amount)
        FROM expenses e
        WHERE e.branch_id = b.id
        AND e.expense_type IN ('vocational', 'branch')
      ), 0) AS total_expenses,

      COALESCE((
  SELECT SUM(p2.amount)
  FROM payments p2
  WHERE p2.branch_id = b.id
), 0) AS balance,

COALESCE((
  SELECT SUM(p3.amount)
  FROM payments p3
  WHERE p3.branch_id = b.id
), 0) AS monthly_revenue

    FROM branches b
    ORDER BY b.id ASC
    `
  );

  return result.rows;
};

const getBranchById = async (id) => {
  const result = await pool.query(
    `
    SELECT 
      id,
      name,
      location,
      status,
      created_at
    FROM branches
    WHERE id = $1
    `,
    [id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, "Branch not found");
  }

  return result.rows[0];
};

const updateBranch = async (id, data, currentUser) => {
  const { name, location, status } = data;

  const result = await pool.query(
    `
    UPDATE branches
    SET 
      name = COALESCE($1, name),
      location = COALESCE($2, location),
      status = COALESCE($3, status)
    WHERE id = $4
    RETURNING *
    `,
    [
      name?.trim() || null,
      location?.trim() || null,
      status || null,
      id,
    ]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, "Branch not found");
  }

  await pool.query(
    `
    INSERT INTO audit_logs (user_id, action, module_name, description)
    VALUES ($1, $2, $3, $4)
    `,
    [
      currentUser.id,
      "UPDATE_BRANCH",
      "branches",
      `Updated branch ID ${id}`,
    ]
  );

  return result.rows[0];
};

const deleteBranch = async (id, currentUser) => {
  if (currentUser.role !== "super_admin") {
    throw new ApiError(403, "Only super admin can delete branch");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const branchResult = await client.query(
      `
      SELECT id, name
      FROM branches
      WHERE id = $1
      `,
      [id]
    );

    if (branchResult.rows.length === 0) {
      throw new ApiError(404, "Branch not found");
    }

    const branch = branchResult.rows[0];

    await deleteByColumnIfExists(client, "monthly_financial_reports", "branch_id", id);
    await deleteByColumnIfExists(client, "financial_opening_balances", "branch_id", id);
    await deleteByColumnIfExists(client, "expenses", "branch_id", id);
    await deleteByColumnIfExists(client, "payments", "branch_id", id);
    await deleteByColumnIfExists(client, "employees", "branch_id", id);

    const hasCertificatesStudentId = await tableColumnExists(
      client,
      "certificates",
      "student_id"
    );

    if (hasCertificatesStudentId) {
      await client.query(
        `
        DELETE FROM certificates
        WHERE student_id IN (
          SELECT id
          FROM students
          WHERE branch_id = $1
        )
        `,
        [id]
      );
    }

    await deleteByColumnIfExists(client, "certificates", "branch_id", id);

    const hasStudentCoursesStudentId = await tableColumnExists(
      client,
      "student_courses",
      "student_id"
    );

    if (hasStudentCoursesStudentId) {
      await client.query(
        `
        DELETE FROM student_courses
        WHERE student_id IN (
          SELECT id
          FROM students
          WHERE branch_id = $1
        )
        `,
        [id]
      );
    }

    const hasStudentFeeCyclesStudentId = await tableColumnExists(
      client,
      "student_fee_cycles",
      "student_id"
    );

    if (hasStudentFeeCyclesStudentId) {
      await client.query(
        `
        DELETE FROM student_fee_cycles
        WHERE student_id IN (
          SELECT id
          FROM students
          WHERE branch_id = $1
        )
        `,
        [id]
      );
    }

    await deleteByColumnIfExists(client, "student_fee_cycles", "branch_id", id);
    await deleteByColumnIfExists(client, "students", "branch_id", id);

    const hasCourseTeachersCourseId = await tableColumnExists(
      client,
      "course_teachers",
      "course_id"
    );

    if (hasCourseTeachersCourseId) {
      await client.query(
        `
        DELETE FROM course_teachers
        WHERE course_id IN (
          SELECT id
          FROM courses
          WHERE branch_id = $1
        )
        `,
        [id]
      );
    }

    await deleteByColumnIfExists(client, "course_teachers", "branch_id", id);
    await deleteByColumnIfExists(client, "courses", "branch_id", id);

    await updateUsersBranchToNull(client, id);

    await client.query(
      `
      DELETE FROM branches
      WHERE id = $1
      `,
      [id]
    );

    await client.query(
      `
      INSERT INTO audit_logs (user_id, action, module_name, description)
      VALUES ($1, $2, $3, $4)
      `,
      [
        currentUser.id,
        "DELETE_BRANCH",
        "branches",
        `Deleted branch ${branch.name} and related branch data`,
      ]
    );

    await client.query("COMMIT");

    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
};