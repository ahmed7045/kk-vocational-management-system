const pool = require("../../config/db");
const ApiError = require("../../utils/ApiError");

const getBranchIdForUser = (queryBranchId, currentUser) => {
  if (currentUser.role === "super_admin") {
    return queryBranchId || null;
  }

  return currentUser.branchId;
};

const checkBranchAccess = (queryBranchId, currentUser) => {
  if (!queryBranchId) return;

  if (
    currentUser.role !== "super_admin" &&
    Number(currentUser.branchId) !== Number(queryBranchId)
  ) {
    throw new ApiError(403, "You cannot access this branch report");
  }
};

const getStudentReport = async (query, currentUser) => {
  checkBranchAccess(query.branchId, currentUser);

  const branchId = getBranchIdForUser(query.branchId, currentUser);
  const feeStatus = query.feeStatus || null;
  const studentStatus = query.studentStatus || null;

  const result = await pool.query(
    `
    SELECT
      s.id,
      s.full_name,
      s.father_name,
      s.phone,
      s.city,
      s.admission_date,
      s.student_status,
      s.fee_status,
      s.total_fee,
      s.paid_fee,
      s.remaining_fee,
      b.name AS branch_name,
      COALESCE(
        JSON_AGG(DISTINCT c.course_name) FILTER (WHERE c.id IS NOT NULL),
        '[]'
      ) AS courses
    FROM students s
    LEFT JOIN branches b ON b.id = s.branch_id
    LEFT JOIN student_courses sc ON sc.student_id = s.id
    LEFT JOIN courses c ON c.id = sc.course_id
    WHERE
      ($1::INT IS NULL OR s.branch_id = $1)
      AND ($2::VARCHAR IS NULL OR s.fee_status = $2)
      AND ($3::VARCHAR IS NULL OR s.student_status = $3)
    GROUP BY s.id, b.name
    ORDER BY s.id DESC
    `,
    [branchId, feeStatus, studentStatus]
  );

  return result.rows;
};

const getFinancialReport = async (query, currentUser) => {
  checkBranchAccess(query.branchId, currentUser);

  const branchId = getBranchIdForUser(query.branchId, currentUser);
  const fromDate = query.fromDate || null;
  const toDate = query.toDate || null;

  const revenueResult = await pool.query(
    `
    SELECT COALESCE(SUM(amount), 0) AS total_revenue
    FROM payments
    WHERE
      ($1::INT IS NULL OR branch_id = $1)
      AND ($2::DATE IS NULL OR payment_date >= $2)
      AND ($3::DATE IS NULL OR payment_date <= $3)
    `,
    [branchId, fromDate, toDate]
  );

  const expenseResult = await pool.query(
    `
    SELECT COALESCE(SUM(amount), 0) AS total_expenses
    FROM expenses
    WHERE
      expense_type = 'branch'
      AND ($1::INT IS NULL OR branch_id = $1)
      AND ($2::DATE IS NULL OR expense_date >= $2)
      AND ($3::DATE IS NULL OR expense_date <= $3)
    `,
    [branchId, fromDate, toDate]
  );

  const paymentsResult = await pool.query(
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
    WHERE
      ($1::INT IS NULL OR p.branch_id = $1)
      AND ($2::DATE IS NULL OR p.payment_date >= $2)
      AND ($3::DATE IS NULL OR p.payment_date <= $3)
    ORDER BY p.payment_date DESC
    `,
    [branchId, fromDate, toDate]
  );

  const expensesResult = await pool.query(
    `
    SELECT
      e.id,
      e.title,
      e.amount,
      e.expense_date,
      b.name AS branch_name,
      ec.category_name
    FROM expenses e
    LEFT JOIN branches b ON b.id = e.branch_id
    LEFT JOIN expense_categories ec ON ec.id = e.category_id
    WHERE
      e.expense_type = 'branch'
      AND ($1::INT IS NULL OR e.branch_id = $1)
      AND ($2::DATE IS NULL OR e.expense_date >= $2)
      AND ($3::DATE IS NULL OR e.expense_date <= $3)
    ORDER BY e.expense_date DESC
    `,
    [branchId, fromDate, toDate]
  );

  const totalRevenue = Number(revenueResult.rows[0].total_revenue) || 0;
  const totalExpenses = Number(expenseResult.rows[0].total_expenses) || 0;

  return {
    summary: {
      totalRevenue,
      totalExpenses,
      profit: totalRevenue - totalExpenses,
    },
    payments: paymentsResult.rows,
    expenses: expensesResult.rows,
  };
};

const getWelfareReport = async (query) => {
  const fromDate = query.fromDate || null;
  const toDate = query.toDate || null;

  const donationsResult = await pool.query(
    `
    SELECT
      d.id,
      d.amount,
      d.donation_date,
      d.purpose,
      dn.full_name AS donor_name,
      c.charity_name,
      dm.method_name AS donation_method
    FROM donations d
    LEFT JOIN donors dn ON dn.id = d.donor_id
    LEFT JOIN charities c ON c.id = d.charity_id
    LEFT JOIN donation_methods dm ON dm.id = d.donation_method_id
    WHERE
      ($1::DATE IS NULL OR d.donation_date >= $1)
      AND ($2::DATE IS NULL OR d.donation_date <= $2)
    ORDER BY d.donation_date DESC
    `,
    [fromDate, toDate]
  );

  const applicationsResult = await pool.query(
    `
    SELECT
      id,
      applicant_name,
      phone,
      cnic,
      support_type,
      requested_amount,
      approved_amount,
      case_status,
      created_at
    FROM welfare_applications
    WHERE
      ($1::DATE IS NULL OR created_at::DATE >= $1)
      AND ($2::DATE IS NULL OR created_at::DATE <= $2)
    ORDER BY id DESC
    `,
    [fromDate, toDate]
  );

  const totalDonations = donationsResult.rows.reduce(
    (sum, row) => sum + Number(row.amount || 0),
    0
  );

  const totalApprovedSupport = applicationsResult.rows.reduce(
    (sum, row) => sum + Number(row.approved_amount || 0),
    0
  );

  return {
    summary: {
      totalDonations,
      totalApprovedSupport,
      balanceAfterApprovedSupport: totalDonations - totalApprovedSupport,
      totalApplications: applicationsResult.rows.length,
    },
    donations: donationsResult.rows,
    applications: applicationsResult.rows,
  };
};

module.exports = {
  getStudentReport,
  getFinancialReport,
  getWelfareReport,
};