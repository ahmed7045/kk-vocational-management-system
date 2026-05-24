const pool = require("../../config/db");

const getAvailablePortals = async (user) => {
  const permissions = user.permissions || [];
  const portals = [];

  if (
    user.role === "super_admin" ||
    permissions.includes("dashboard.view") ||
    permissions.includes("students.view") ||
    permissions.includes("branches.view")
  ) {
    portals.push({
      key: "vocational",
      name: "Vocational Training Center",
      description: "Manage branches, students, courses, fees and reports",
    });
  }

  if (user.role === "super_admin" || permissions.includes("welfare.view")) {
    portals.push({
      key: "welfare",
      name: "Welfare Management",
      description: "Manage donations, charities, welfare cases and reports",
    });
  }

  return portals;
};

const branchStatsSelect = `
  SELECT 
    b.id,
    b.name,
    b.location,
    b.status,

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
      AND e.expense_type IN ('branch', 'vocational')
    ), 0) AS total_expenses,

    (
      COALESCE((
        SELECT SUM(p2.amount)
        FROM payments p2
        WHERE p2.branch_id = b.id
      ), 0)
      -
      COALESCE((
        SELECT SUM(e2.amount)
        FROM expenses e2
        WHERE e2.branch_id = b.id
        AND e2.expense_type IN ('branch', 'vocational')
      ), 0)
    ) AS balance,

    (
      COALESCE((
        SELECT SUM(p3.amount)
        FROM payments p3
        WHERE p3.branch_id = b.id
      ), 0)
      -
      COALESCE((
        SELECT SUM(e3.amount)
        FROM expenses e3
        WHERE e3.branch_id = b.id
        AND e3.expense_type IN ('branch', 'vocational')
      ), 0)
    ) AS monthly_revenue

  FROM branches b
`;

const getAccessibleBranches = async (user) => {
  if (user.role === "super_admin") {
    const result = await pool.query(
      `
      ${branchStatsSelect}
      ORDER BY b.id ASC
      `
    );

    return result.rows;
  }

  const result = await pool.query(
    `
    ${branchStatsSelect}
    LEFT JOIN user_branches ub ON ub.branch_id = b.id
    WHERE ub.user_id = $1 OR b.id = $2
    ORDER BY b.id ASC
    `,
    [user.id, user.branchId]
  );

  return result.rows;
};

module.exports = {
  getAvailablePortals,
  getAccessibleBranches,
};