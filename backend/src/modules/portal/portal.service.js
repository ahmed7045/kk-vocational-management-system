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

const getAccessibleBranches = async (user) => {
  if (user.role === "super_admin") {
    const result = await pool.query(
      `
      SELECT 
        id,
        name,
        location,
        status,
        0 AS total_students,
        0 AS monthly_revenue
      FROM branches
      ORDER BY id ASC
      `
    );

    return result.rows;
  }

  const result = await pool.query(
    `
    SELECT 
      b.id,
      b.name,
      b.location,
      b.status,
      0 AS total_students,
      0 AS monthly_revenue
    FROM branches b
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