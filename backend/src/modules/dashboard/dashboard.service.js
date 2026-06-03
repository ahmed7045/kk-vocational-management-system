const pool = require("../../config/db");
const ApiError = require("../../utils/ApiError");

const canAccessBranch = (user, branchId) => {
  if (user.role === "super_admin") return true;
  return Number(user.branchId) === Number(branchId);
};

const getBranchIdForUser = (queryBranchId, currentUser) => {
  if (currentUser.role === "super_admin") {
    return queryBranchId || null;
  }

  return currentUser.branchId;
};

const getDashboardSummary = async (query, currentUser) => {
  const branchId = getBranchIdForUser(query.branchId, currentUser);

  if (query.branchId && !canAccessBranch(currentUser, query.branchId)) {
    throw new ApiError(403, "You cannot view dashboard for this branch");
  }

  const result = await pool.query(
    `
SELECT
  COUNT(DISTINCT s.id) FILTER (
    WHERE s.student_status = 'active'
  ) AS total_students,

  COUNT(DISTINCT s.id) FILTER (
    WHERE s.student_status = 'active'
  ) AS active_students,

  COUNT(DISTINCT s.id) FILTER (
    WHERE s.student_status = 'non_active'
  ) AS non_active_students,

COUNT(DISTINCT s.id) FILTER (
  WHERE latest_cycle.status = 'paid'
    AND s.student_status = 'active'
) AS paid_students,

COUNT(DISTINCT s.id) FILTER (
  WHERE latest_cycle.status = 'pending'
    AND s.student_status = 'active'
) AS pending_students,

      COALESCE((
        SELECT SUM(p.amount)
        FROM payments p
        WHERE ($1::INT IS NULL OR p.branch_id = $1)
      ), 0) AS total_revenue,

COALESCE((
  SELECT SUM(s2.paid_fee)
  FROM students s2
  WHERE ($1::INT IS NULL OR s2.branch_id = $1)
    AND s2.student_status = 'active'
    AND s2.fee_status = 'paid'
    AND DATE_TRUNC('month', s2.admission_date) = DATE_TRUNC('month', CURRENT_DATE)
), 0) AS monthly_revenue,

      COALESCE((
        SELECT SUM(e.amount)
        FROM expenses e
        WHERE ($1::INT IS NULL OR e.branch_id = $1)
        AND e.expense_type = 'branch'
      ), 0) AS total_expenses,

      COALESCE((
        SELECT SUM(e.amount)
        FROM expenses e
        WHERE ($1::INT IS NULL OR e.branch_id = $1)
        AND e.expense_type = 'branch'
        AND DATE_TRUNC('month', e.expense_date) = DATE_TRUNC('month', CURRENT_DATE)
      ), 0) AS monthly_expenses

    FROM students s
    LEFT JOIN LATERAL (
  SELECT fc.status
  FROM student_fee_cycles fc
  WHERE fc.student_id = s.id
    AND fc.fee_date <= CURRENT_DATE
  ORDER BY fc.fee_date DESC
  LIMIT 1
) latest_cycle ON TRUE
    WHERE ($1::INT IS NULL OR s.branch_id = $1)
    `,
    [branchId]
  );

  const data = result.rows[0];

  const monthlyRevenue = Number(data.monthly_revenue) || 0;
  const monthlyExpenses = Number(data.monthly_expenses) || 0;

  return {
    totalStudents: Number(data.total_students) || 0,
    activeStudents: Number(data.active_students) || 0,
    nonActiveStudents: Number(data.non_active_students) || 0,
    paidStudents: Number(data.paid_students) || 0,
    pendingStudents: Number(data.pending_students) || 0,
    totalRevenue: Number(data.total_revenue) || 0,
    monthlyRevenue,
    totalExpenses: Number(data.total_expenses) || 0,
    monthlyExpenses,
    monthlyBalance: monthlyRevenue - monthlyExpenses,
  };
};

const getRecentPayments = async (query, currentUser) => {
  const branchId = getBranchIdForUser(query.branchId, currentUser);

  if (query.branchId && !canAccessBranch(currentUser, query.branchId)) {
    throw new ApiError(403, "You cannot view payments for this branch");
  }

  const limit = Number(query.limit) || 10;

  const result = await pool.query(
    `
    SELECT
      p.id,
      p.amount,
      p.payment_date,
      s.full_name AS student_name,
      b.name AS branch_name,
      pm.method_name AS payment_method
    FROM payments p
    LEFT JOIN students s ON s.id = p.student_id
    LEFT JOIN branches b ON b.id = p.branch_id
    LEFT JOIN payment_methods pm ON pm.id = p.payment_method_id
    WHERE ($1::INT IS NULL OR p.branch_id = $1)
    ORDER BY p.id DESC
    LIMIT $2
    `,
    [branchId, limit]
  );

  return result.rows;
};

const getRevenueAnalytics = async (query, currentUser) => {
  const branchId = getBranchIdForUser(query.branchId, currentUser);

  if (query.branchId && !canAccessBranch(currentUser, query.branchId)) {
    throw new ApiError(403, "You cannot view analytics for this branch");
  }

  const result = await pool.query(
    `
    SELECT
      TO_CHAR(months.month, 'Mon') AS month,
      COALESCE(SUM(p.amount), 0) AS revenue
    FROM (
      SELECT generate_series(
        DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months',
        DATE_TRUNC('month', CURRENT_DATE),
        INTERVAL '1 month'
      ) AS month
    ) months
    LEFT JOIN payments p
      ON DATE_TRUNC('month', p.payment_date) = months.month
      AND ($1::INT IS NULL OR p.branch_id = $1)
    GROUP BY months.month
    ORDER BY months.month ASC
    `,
    [branchId]
  );

  return result.rows.map((row) => ({
    month: row.month,
    revenue: Number(row.revenue) || 0,
  }));
};

const getExpenseAnalytics = async (query, currentUser) => {
  const branchId = getBranchIdForUser(query.branchId, currentUser);

  if (query.branchId && !canAccessBranch(currentUser, query.branchId)) {
    throw new ApiError(403, "You cannot view expense analytics for this branch");
  }

  const result = await pool.query(
    `
    SELECT
      TO_CHAR(months.month, 'Mon') AS month,
      COALESCE(SUM(e.amount), 0) AS expenses
    FROM (
      SELECT generate_series(
        DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months',
        DATE_TRUNC('month', CURRENT_DATE),
        INTERVAL '1 month'
      ) AS month
    ) months
    LEFT JOIN expenses e
      ON DATE_TRUNC('month', e.expense_date) = months.month
      AND e.expense_type = 'branch'
      AND ($1::INT IS NULL OR e.branch_id = $1)
    GROUP BY months.month
    ORDER BY months.month ASC
    `,
    [branchId]
  );

  return result.rows.map((row) => ({
    month: row.month,
    expenses: Number(row.expenses) || 0,
  }));
};

const getStudentStats = async (query, currentUser) => {
  const branchId = getBranchIdForUser(query.branchId, currentUser);

  if (query.branchId && !canAccessBranch(currentUser, query.branchId)) {
    throw new ApiError(403, "You cannot view student stats for this branch");
  }

  const result = await pool.query(
    `
SELECT
  fee_status,
  COUNT(*) AS total
FROM students
WHERE
  ($1::INT IS NULL OR branch_id = $1)
  AND student_status = 'active'
  AND fee_status IN ('paid', 'pending')
GROUP BY fee_status
ORDER BY fee_status ASC
    `,
    [branchId]
  );

  return result.rows.map((row) => ({
    feeStatus: row.fee_status,
    total: Number(row.total) || 0,
  }));
};

const getCoursePopularity = async (query, currentUser) => {
  const branchId = getBranchIdForUser(query.branchId, currentUser);

  if (query.branchId && !canAccessBranch(currentUser, query.branchId)) {
    throw new ApiError(403, "You cannot view course stats for this branch");
  }

  const result = await pool.query(
    `
SELECT
  c.id,
  c.course_name,
  COUNT(s.id) AS total_students
FROM courses c
LEFT JOIN student_courses sc ON sc.course_id = c.id
LEFT JOIN students s
  ON s.id = sc.student_id
  AND s.student_status = 'active'
WHERE ($1::INT IS NULL OR c.branch_id = $1)
GROUP BY c.id, c.course_name
ORDER BY total_students DESC
LIMIT 10
    `,
    [branchId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    courseName: row.course_name,
    totalStudents: Number(row.total_students) || 0,
  }));
};

const getDashboardOverview = async (query, currentUser) => {
  const [
    summary,
    recentPayments,
    revenueAnalytics,
    expenseAnalytics,
    studentStats,
    coursePopularity,
  ] = await Promise.all([
    getDashboardSummary(query, currentUser),
    getRecentPayments(query, currentUser),
    getRevenueAnalytics(query, currentUser),
    getExpenseAnalytics(query, currentUser),
    getStudentStats(query, currentUser),
    getCoursePopularity(query, currentUser),
  ]);

  return {
    summary,
    recentPayments,
    revenueAnalytics,
    expenseAnalytics,
    studentStats,
    coursePopularity,
  };
};

module.exports = {
  getDashboardSummary,
  getRecentPayments,
  getRevenueAnalytics,
  getExpenseAnalytics,
  getStudentStats,
  getCoursePopularity,
  getDashboardOverview,
};