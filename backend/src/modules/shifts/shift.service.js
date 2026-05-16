const pool = require("../../config/db");
const ApiError = require("../../utils/ApiError");

const canAccessBranch = (user, branchId) => {
  if (user.role === "super_admin") return true;
  return Number(user.branchId) === Number(branchId);
};

const createShift = async (data, currentUser) => {
  const {
    branchId,
    shiftName,
    startTime,
    endTime,
  } = data;

  if (!branchId || !shiftName || !startTime || !endTime) {
    throw new ApiError(400, "Branch, shift name, start time and end time are required");
  }

  if (!canAccessBranch(currentUser, branchId)) {
    throw new ApiError(403, "You cannot create shift for this branch");
  }

  const result = await pool.query(
    `
    INSERT INTO shift_timings
    (branch_id, shift_name, start_time, end_time, created_by)
    VALUES ($1,$2,$3,$4,$5)
    RETURNING *
    `,
    [
      branchId,
      shiftName,
      startTime,
      endTime,
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
      "CREATE_SHIFT",
      "shift_timings",
      `Created shift ${shiftName}`,
    ]
  );

  return result.rows[0];
};

const getShifts = async (query, currentUser) => {
  let branchId = query.branchId;

  if (currentUser.role !== "super_admin") {
    branchId = currentUser.branchId;
  }

  const result = await pool.query(
    `
    SELECT
      s.id,
      s.branch_id,
      b.name AS branch_name,
      s.shift_name,
      s.start_time,
      s.end_time,
      s.is_active,
      s.created_at
    FROM shift_timings s
    LEFT JOIN branches b ON b.id = s.branch_id
    WHERE ($1::INT IS NULL OR s.branch_id = $1)
    ORDER BY s.start_time ASC
    `,
    [branchId || null]
  );

  return result.rows;
};

const updateShift = async (id, data, currentUser) => {
  const existing = await pool.query(
    `SELECT * FROM shift_timings WHERE id = $1`,
    [id]
  );

  if (existing.rows.length === 0) {
    throw new ApiError(404, "Shift not found");
  }

  const shift = existing.rows[0];

  if (!canAccessBranch(currentUser, shift.branch_id)) {
    throw new ApiError(403, "You cannot update this shift");
  }

  const {
    shiftName,
    startTime,
    endTime,
    isActive,
  } = data;

  const result = await pool.query(
    `
    UPDATE shift_timings
    SET
      shift_name = COALESCE($1, shift_name),
      start_time = COALESCE($2, start_time),
      end_time = COALESCE($3, end_time),
      is_active = COALESCE($4, is_active)
    WHERE id = $5
    RETURNING *
    `,
    [
      shiftName || null,
      startTime || null,
      endTime || null,
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
      "UPDATE_SHIFT",
      "shift_timings",
      `Updated shift ID ${id}`,
    ]
  );

  return result.rows[0];
};

module.exports = {
  createShift,
  getShifts,
  updateShift,
};