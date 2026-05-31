const pool = require("../../config/db");
const ApiError = require("../../utils/ApiError");

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

module.exports = {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
};