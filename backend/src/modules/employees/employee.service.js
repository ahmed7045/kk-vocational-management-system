const bcrypt = require("bcrypt");
const pool = require("../../config/db");
const ApiError = require("../../utils/ApiError");

const canManageBranch = (user, branchId) => {
  if (user.role === "super_admin") return true;

  if (user.role === "branch_admin" && Number(user.branchId) === Number(branchId)) {
    return true;
  }

  return false;
};

const getPermissionIds = async (permissions) => {
  if (!permissions || permissions.length === 0) return [];

  const result = await pool.query(
    `
    SELECT id, name
    FROM permissions
    WHERE name = ANY($1)
    `,
    [permissions]
  );

  return result.rows;
};

const createEmployee = async (data, currentUser) => {
  const {
    branchId,
    fullName,
    designation,
    phone,
    email,
    salary,
    gender,
    hasLoginAccount,
    password,
    permissions,
    genderVisibility,
  } = data;

  if (!canManageBranch(currentUser, branchId)) {
    throw new ApiError(403, "You cannot create employee for this branch");
  }

  if (!fullName || !branchId) {
    throw new ApiError(400, "Full name and branch are required");
  }

  if (hasLoginAccount && (!email || !password)) {
    throw new ApiError(400, "Email and password are required for login account");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let userId = null;

    const employeeResult = await client.query(
      `
      INSERT INTO employees
      (branch_id, full_name, designation, phone, email, salary, gender, has_login_account, gender_visibility, created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *
      `,
      [
        branchId,
        fullName,
        designation || null,
        phone || null,
        email || null,
        salary || 0,
        gender || null,
        hasLoginAccount || false,
        genderVisibility || "both",
        currentUser.id,
      ]
    );

    const employee = employeeResult.rows[0];

    if (hasLoginAccount) {
      const roleResult = await client.query(
        `SELECT id FROM roles WHERE name = 'employee'`
      );

      const employeeRoleId = roleResult.rows[0].id;
      const passwordHash = await bcrypt.hash(password, 10);

      const userResult = await client.query(
        `
        INSERT INTO users
        (full_name, email, password_hash, role_id, branch_id, employee_id, is_active)
        VALUES ($1,$2,$3,$4,$5,$6,TRUE)
        RETURNING id
        `,
        [
          fullName,
          email,
          passwordHash,
          employeeRoleId,
          branchId,
          employee.id,
        ]
      );

      userId = userResult.rows[0].id;

      await client.query(
        `
        UPDATE employees
        SET user_id = $1
        WHERE id = $2
        `,
        [userId, employee.id]
      );

      await client.query(
        `
        INSERT INTO user_branches (user_id, branch_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, branch_id) DO NOTHING
        `,
        [userId, branchId]
      );

      const permissionRows = await getPermissionIds(permissions || []);

      for (const permission of permissionRows) {
        if (
          currentUser.role !== "super_admin" &&
          !currentUser.permissions.includes(permission.name)
        ) {
          throw new ApiError(
            403,
            `You cannot assign permission: ${permission.name}`
          );
        }

        await client.query(
          `
          INSERT INTO user_permissions (user_id, permission_id)
          VALUES ($1, $2)
          ON CONFLICT (user_id, permission_id) DO NOTHING
          `,
          [userId, permission.id]
        );
      }
    }

    await client.query(
      `
      INSERT INTO audit_logs (user_id, action, module_name, description)
      VALUES ($1, $2, $3, $4)
      `,
      [
        currentUser.id,
        "CREATE_EMPLOYEE",
        "employees",
        `Created employee ${fullName}`,
      ]
    );

    await client.query("COMMIT");

    return {
      ...employee,
      user_id: userId,
    };
  } catch (error) {
    await client.query("ROLLBACK");

    if (error.code === "23505") {
      throw new ApiError(409, "Email already exists");
    }

    throw error;
  } finally {
    client.release();
  }
};

const getEmployees = async (query, currentUser) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const offset = (page - 1) * limit;

  let branchId = query.branchId;

  if (currentUser.role !== "super_admin") {
    branchId = currentUser.branchId;
  }

  const result = await pool.query(
    `
    SELECT 
      e.id,
      e.full_name,
      e.designation,
      e.phone,
      e.email,
      e.salary,
      e.gender,
      e.has_login_account,
      e.gender_visibility,
      e.is_active,
      e.created_at,
      b.name AS branch_name
    FROM employees e
    LEFT JOIN branches b ON b.id = e.branch_id
    WHERE ($1::INT IS NULL OR e.branch_id = $1)
    ORDER BY e.id DESC
    LIMIT $2 OFFSET $3
    `,
    [branchId || null, limit, offset]
  );

  return result.rows;
};

const getEmployeePermissions = async () => {
  const result = await pool.query(
    `
    SELECT id, name, description
    FROM permissions
    WHERE name NOT IN (
      'branches.delete',
      'branches.create'
    )
    ORDER BY name ASC
    `
  );

  return result.rows;
};

module.exports = {
  createEmployee,
  getEmployees,
  getEmployeePermissions,
};