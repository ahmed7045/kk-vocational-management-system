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

const TAB_PERMISSION_MAP = {
  vocational: {
    dashboard: ["dashboard.view"],
    students: [
      "students.view",
      "students.create",
      "students.update",
      "students.delete",
      "students.export",
      "students.view_paid",
      "students.view_pending",
      "students.view_non_active",
    ],
    nonActiveStudents: ["students.view_non_active", "students.view"],
    employees: [
      "employees.view",
      "employees.create",
      "employees.update",
      "employees.delete",
      "employees.create_account",
    ],
    expenses: [
      "expenses.view",
      "expenses.create",
      "expenses.update",
      "expenses.delete",
    ],
    courses: [
      "courses.view",
      "courses.create",
      "courses.update",
      "courses.delete",
      "shifts.view",
      "shifts.create",
      "shifts.update",
      "shifts.delete",
    ],
    certificates: [
      "certificates.view",
      "certificates.generate",
      "certificates.download",
    ],
    reports: [
      "reports.view",
      "reports.students.view",
      "reports.financial.view",
      "reports.export_pdf",
      "reports.export_excel",
    ],
  },

  welfare: {
    dashboard: ["welfare.view", "welfare.dashboard.view"],
    donors: [
      "welfare.donor.view",
      "welfare.donor.create",
      "welfare.donor.update",
      "welfare.donor.delete",
    ],
    donations: [
      "welfare.donation.view",
      "welfare.donation.create",
      "welfare.donation.delete",
      "donation_methods.view",
      "donation_methods.create",
    ],
    applications: [
      "welfare.application.view",
      "welfare.application.create",
      "welfare.application.update",
      "welfare.application.delete",
      "welfare.application.approve",
    ],
    beneficiaries: [
      "welfare.charity.view",
      "welfare.charity.create",
      "welfare.charity.update",
      "welfare.charity.delete",
    ],
    expenses: [
      "welfare.expense.view",
      "welfare.expense.create",
      "expenses.view",
      "expenses.create",
      "expenses.update",
      "expenses.delete",
    ],
    reports: [
      "reports.view",
      "reports.welfare.view",
      "reports.export_pdf",
      "reports.export_excel",
      "amounts.view",
    ],
  },
};

const getPermissionsFromTabs = (portalAccess, selectedTabs = []) => {
  const portalMap = TAB_PERMISSION_MAP[portalAccess] || {};

  return [
    ...new Set(
      selectedTabs.flatMap((tab) => portalMap[tab] || [])
    ),
  ];
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
    selectedTabs,
    portalAccess,
    genderVisibility,
  } = data;

  const finalPortalAccess = hasLoginAccount ? portalAccess : null;
  const finalBranchId = finalPortalAccess === "welfare" ? null : branchId;

  if (finalPortalAccess === "vocational" && !finalBranchId) {
    throw new ApiError(400, "Branch is required for vocational account");
  }

  if (finalBranchId && !canManageBranch(currentUser, finalBranchId)) {
    throw new ApiError(403, "You cannot create employee for this branch");
  }

  if (!fullName) {
    throw new ApiError(400, "Full name is required");
  }

  if (hasLoginAccount && !["vocational", "welfare"].includes(finalPortalAccess)) {
    throw new ApiError(400, "Portal access is required for login account");
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
        finalBranchId,
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
(full_name, email, password_hash, role_id, branch_id, employee_id, portal_access, is_active)
VALUES ($1,$2,$3,$4,$5,$6,$7,TRUE)
RETURNING id
        `,
        [
          fullName,
          email,
          passwordHash,
          employeeRoleId,
          finalBranchId,
          employee.id,
          finalPortalAccess,
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

      if (finalPortalAccess === "vocational" && finalBranchId) {
        await client.query(
          `
    INSERT INTO user_branches (user_id, branch_id)
    VALUES ($1, $2)
    ON CONFLICT (user_id, branch_id) DO NOTHING
    `,
          [userId, finalBranchId]
        );
      }
      const finalPermissions = Array.isArray(selectedTabs)
        ? getPermissionsFromTabs(finalPortalAccess, selectedTabs)
        : permissions || [];

      const permissionRows = await getPermissionIds(finalPermissions);

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
u.portal_access,
b.name AS branch_name,
COALESCE(
  JSON_AGG(DISTINCT p.name) FILTER (WHERE p.id IS NOT NULL),
  '[]'
) AS permissions
    FROM employees e
LEFT JOIN branches b ON b.id = e.branch_id
LEFT JOIN users u ON u.employee_id = e.id
LEFT JOIN user_permissions up ON up.user_id = u.id
LEFT JOIN permissions p ON p.id = up.permission_id
WHERE ($1::INT IS NULL OR e.branch_id = $1 OR e.branch_id IS NULL)
GROUP BY e.id, b.name, u.portal_access
ORDER BY e.id DESC
    LIMIT $2 OFFSET $3
    `,
    [branchId || null, limit, offset]
  );

  return result.rows;
};

const getEmployeeById = async (id, currentUser) => {
  const result = await pool.query(
    `
    SELECT 
      e.id,
      e.branch_id,
      e.user_id,
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
      b.name AS branch_name,
      COALESCE(
        JSON_AGG(DISTINCT p.name) FILTER (WHERE p.id IS NOT NULL),
        '[]'
      ) AS permissions
    FROM employees e
    LEFT JOIN branches b ON b.id = e.branch_id
    LEFT JOIN users u ON u.employee_id = e.id
    LEFT JOIN user_permissions up ON up.user_id = u.id
    LEFT JOIN permissions p ON p.id = up.permission_id
    WHERE e.id = $1
    GROUP BY e.id, b.name
    `,
    [id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, "Employee not found");
  }

  const employee = result.rows[0];

  if (!canManageBranch(currentUser, employee.branch_id)) {
    throw new ApiError(403, "You cannot view this employee");
  }

  return employee;
};

const updateEmployee = async (id, data, currentUser) => {
  const existing = await getEmployeeById(id, currentUser);

  const {
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

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const employeeResult = await client.query(
      `
  UPDATE employees
  SET
    full_name = COALESCE($1, full_name),
    designation = COALESCE($2, designation),
    phone = COALESCE($3, phone),
    email = COALESCE($4, email),
    salary = COALESCE($5, salary),
    gender = COALESCE($6, gender),
    has_login_account = COALESCE($7, has_login_account),
    gender_visibility = COALESCE($8, gender_visibility)
  WHERE id = $9
  RETURNING *
  `,
      [
        fullName || null,
        designation || null,
        phone || null,
        email || null,
        salary !== undefined ? Number(salary) : null,
        gender || null,
        hasLoginAccount,
        genderVisibility || null,
        id,
      ]
    );

    const employee = employeeResult.rows[0];

    if (hasLoginAccount) {
      let userId = existing.user_id;

      if (!userId) {
        if (!email || !password) {
          throw new ApiError(400, "Email and password are required for new login account");
        }

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
            fullName || existing.full_name,
            email,
            passwordHash,
            employeeRoleId,
            employee.branch_id,
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
          [userId, employee.branch_id]
        );
      } else {
        const updateValues = [];
        const updateFields = [];

        if (fullName) {
          updateValues.push(fullName);
          updateFields.push(`full_name = $${updateValues.length}`);
        }

        if (email) {
          updateValues.push(email);
          updateFields.push(`email = $${updateValues.length}`);
        }

        if (password) {
          const passwordHash = await bcrypt.hash(password, 10);
          updateValues.push(passwordHash);
          updateFields.push(`password_hash = $${updateValues.length}`);
        }

        if (updateFields.length > 0) {
          updateValues.push(userId);

          await client.query(
            `
UPDATE users
SET ${updateFields.join(", ")}
WHERE id = $${updateValues.length}
            `,
            updateValues
          );
        }
      }

      if (Array.isArray(permissions)) {
        await client.query(
          `DELETE FROM user_permissions WHERE user_id = $1`,
          [userId]
        );

        const permissionRows = await getPermissionIds(permissions);

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
    }

    await client.query(
      `
      INSERT INTO audit_logs (user_id, action, module_name, description)
      VALUES ($1, $2, $3, $4)
      `,
      [
        currentUser.id,
        "UPDATE_EMPLOYEE",
        "employees",
        `Updated employee ${employee.full_name}`,
      ]
    );

    await client.query("COMMIT");

    return employee;
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

const deleteEmployee = async (id, currentUser) => {
  const employee = await getEmployeeById(id, currentUser);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    if (employee.user_id) {
      await client.query(
        `DELETE FROM user_permissions WHERE user_id = $1`,
        [employee.user_id]
      );

      await client.query(
        `DELETE FROM user_branches WHERE user_id = $1`,
        [employee.user_id]
      );

      await client.query(
        `DELETE FROM users WHERE id = $1`,
        [employee.user_id]
      );
    }

    await client.query(
      `DELETE FROM employees WHERE id = $1`,
      [id]
    );

    await client.query(
      `
      INSERT INTO audit_logs (user_id, action, module_name, description)
      VALUES ($1, $2, $3, $4)
      `,
      [
        currentUser.id,
        "DELETE_EMPLOYEE",
        "employees",
        `Deleted employee ${employee.full_name}`,
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
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  getEmployeePermissions,
};