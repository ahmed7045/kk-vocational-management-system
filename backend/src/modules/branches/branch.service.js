const pool = require("../../config/db");
const ApiError = require("../../utils/ApiError");

const createBranch = async (data, currentUser) => {
  const { name, location, status } = data;

  if (!name) {
    throw new ApiError(400, "Branch name is required");
  }

  const result = await pool.query(
    `
    INSERT INTO branches (name, location, status)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [name, location || null, status || "active"]
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
      `Created branch ${name}`,
    ]
  );

  return result.rows[0];
};

const getBranches = async (query) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const offset = (page - 1) * limit;
  const search = query.search || "";

  const result = await pool.query(
    `
    SELECT 
      id,
      name,
      location,
      status,
      created_at
    FROM branches
    WHERE name ILIKE $1 OR location ILIKE $1
    ORDER BY id DESC
    LIMIT $2 OFFSET $3
    `,
    [`%${search}%`, limit, offset]
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
    [name || null, location || null, status || null, id]
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