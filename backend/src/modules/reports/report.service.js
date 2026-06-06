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

const getReportRange = (query) => {
  const filterType = query.reportFilterType || query.filterType || "month";

  if (filterType === "date_range") {
    if (!query.fromDate || !query.toDate) {
      throw new ApiError(400, "From date and to date are required");
    }

    const fromDate = new Date(`${query.fromDate}T00:00:00`);
    const toDate = new Date(`${query.toDate}T00:00:00`);

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      throw new ApiError(400, "Invalid date range");
    }

    if (fromDate > toDate) {
      throw new ApiError(400, "From date cannot be after to date");
    }

    const previousEnd = new Date(fromDate);
    previousEnd.setDate(previousEnd.getDate() - 1);

    return {
      reportFilterType: "date_range",
      monthStart: query.fromDate,
      monthEnd: query.toDate,
      previousEnd: previousEnd.toISOString().split("T")[0],
      fromDate: query.fromDate,
      toDate: query.toDate,
      reportMonth: null,
      reportYear: null,
    };
  }

  const selectedMonth = Number(query.month);
  const selectedYear = Number(query.year);

  if (!selectedMonth || !selectedYear) {
    throw new ApiError(400, "Month and year are required");
  }

  const monthStart = new Date(selectedYear, selectedMonth - 1, 1);
  const monthEnd = new Date(selectedYear, selectedMonth, 0);
  const previousEnd = new Date(selectedYear, selectedMonth - 1, 0);

  return {
    reportFilterType: "month",
    monthStart: monthStart.toISOString().split("T")[0],
    monthEnd: monthEnd.toISOString().split("T")[0],
    previousEnd: previousEnd.toISOString().split("T")[0],
    fromDate: null,
    toDate: null,
    reportMonth: selectedMonth,
    reportYear: selectedYear,
  };
};

const generateReportNo = (portalType) => {
  const prefix = portalType === "welfare" ? "WMR" : "VMR";
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);

  return `${prefix}-${year}-${random}`;
};

const getUserFullName = async (userId) => {
  const result = await pool.query(
    `
    SELECT full_name
    FROM users
    WHERE id = $1
    `,
    [userId]
  );

  return result.rows[0]?.full_name || "User";
};

const getBranchManagerName = async (branchId) => {
  const result = await pool.query(
    `
    SELECT u.full_name
    FROM users u
    LEFT JOIN roles r ON r.id = u.role_id
    WHERE u.branch_id = $1
      AND (
        LOWER(r.name) LIKE '%manager%'
        OR LOWER(r.name) LIKE '%admin%'
      )
    ORDER BY
      CASE
        WHEN LOWER(r.name) LIKE '%manager%' THEN 1
        WHEN LOWER(r.name) LIKE '%admin%' THEN 2
        ELSE 3
      END,
      u.id ASC
    LIMIT 1
    `,
    [branchId]
  );

  return result.rows[0]?.full_name || "-";
};

const getOpeningBalance = async (query, currentUser) => {
  const branchId = getBranchIdForUser(query.branchId, currentUser);

  if (!branchId) {
    throw new ApiError(400, "Branch is required");
  }

  checkBranchAccess(branchId, currentUser);

  const result = await pool.query(
    `
    SELECT
      id,
      branch_id,
      portal_type,
      opening_balance,
      opening_date,
      note
    FROM financial_opening_balances
    WHERE branch_id = $1
      AND portal_type = 'vocational'
    LIMIT 1
    `,
    [branchId]
  );

  return result.rows[0] || null;
};

const upsertOpeningBalance = async (data, currentUser) => {
  if (currentUser.role !== "super_admin") {
    throw new ApiError(403, "Only super admin can set opening balance");
  }

  const { branchId, openingBalance, openingDate, note } = data;

  if (!branchId || openingBalance === undefined || !openingDate) {
    throw new ApiError(400, "Branch, opening balance and opening date are required");
  }

  const result = await pool.query(
    `
    INSERT INTO financial_opening_balances
    (
      branch_id,
      portal_type,
      opening_balance,
      opening_date,
      note,
      created_by
    )
    VALUES ($1, 'vocational', $2, $3, $4, $5)
    ON CONFLICT (branch_id, portal_type)
    DO UPDATE SET
      opening_balance = EXCLUDED.opening_balance,
      opening_date = EXCLUDED.opening_date,
      note = EXCLUDED.note,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
    `,
    [
      branchId,
      Number(openingBalance || 0),
      openingDate,
      note || null,
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
      "UPSERT_OPENING_BALANCE",
      "reports",
      `Set opening balance for branch ID ${branchId}`,
    ]
  );

  return result.rows[0];
};

const getVocationalMonthlyReport = async (query, currentUser) => {
  const branchId = getBranchIdForUser(query.branchId, currentUser);

  if (!branchId) {
    throw new ApiError(400, "Branch is required");
  }

  checkBranchAccess(branchId, currentUser);

  const {
    reportFilterType,
    monthStart,
    monthEnd,
    previousEnd,
    fromDate,
    toDate,
    reportMonth,
    reportYear,
  } = getReportRange(query);

  const openingResult = await pool.query(
    `
    SELECT opening_balance, opening_date
    FROM financial_opening_balances
    WHERE branch_id = $1
      AND portal_type = 'vocational'
    LIMIT 1
    `,
    [branchId]
  );

  if (openingResult.rows.length === 0) {
    throw new ApiError(400, "Please set opening balance first");
  }

  const openingBalance = Number(openingResult.rows[0].opening_balance) || 0;
  const openingDate = openingResult.rows[0].opening_date;

  const branchResult = await pool.query(
    `
    SELECT name
    FROM branches
    WHERE id = $1
    `,
    [branchId]
  );

  const previousFeesResult = await pool.query(
    `
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM student_fee_cycles
    WHERE branch_id = $1
      AND status = 'paid'
      AND paid_date IS NOT NULL
      AND paid_date >= $2
      AND paid_date <= $3
    `,
    [branchId, openingDate, previousEnd]
  );

  const previousExpensesResult = await pool.query(
    `
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM expenses
    WHERE branch_id = $1
      AND expense_type IN ('vocational', 'branch')
      AND expense_date >= $2
      AND expense_date <= $3
    `,
    [branchId, openingDate, previousEnd]
  );

  const monthlyFeesResult = await pool.query(
    `
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM student_fee_cycles
    WHERE branch_id = $1
      AND status = 'paid'
      AND paid_date IS NOT NULL
      AND paid_date >= $2
      AND paid_date <= $3
    `,
    [branchId, monthStart, monthEnd]
  );

  const monthlyExpensesResult = await pool.query(
    `
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM expenses
    WHERE branch_id = $1
      AND expense_type IN ('vocational', 'branch')
      AND expense_date >= $2
      AND expense_date <= $3
    `,
    [branchId, monthStart, monthEnd]
  );

  const previousFees = Number(previousFeesResult.rows[0].total) || 0;
  const previousExpenses = Number(previousExpensesResult.rows[0].total) || 0;
  const collectedFees = Number(monthlyFeesResult.rows[0].total) || 0;
  const expenses = Number(monthlyExpensesResult.rows[0].total) || 0;

  const previousBalance = openingBalance + previousFees - previousExpenses;
  const currentBalance = previousBalance + collectedFees - expenses;

  return {
    branchId,
    branchName: branchResult.rows[0]?.name || "-",
    branchManagerName: await getBranchManagerName(branchId),
    generatedBy: await getUserFullName(currentUser.id),
    reportFilterType,
    month: reportMonth,
    year: reportYear,
    fromDate,
    toDate,
    monthStart,
    monthEnd,
    openingBalance,
    openingDate,
    previousBalance,
    collectedFees,
    expenses,
    currentBalance,
  };
};

const getWelfareOpeningBalance = async () => {
  const result = await pool.query(
    `
    SELECT
      id,
      branch_id,
      portal_type,
      opening_balance,
      opening_date,
      note
    FROM financial_opening_balances
    WHERE branch_id IS NULL
      AND portal_type = 'welfare'
    LIMIT 1
    `
  );

  return result.rows[0] || null;
};

const upsertWelfareOpeningBalance = async (data, currentUser) => {
  if (currentUser.role !== "super_admin") {
    throw new ApiError(403, "Only super admin can set opening balance");
  }

  const { openingBalance, openingDate, note } = data;

  if (openingBalance === undefined || !openingDate) {
    throw new ApiError(400, "Opening balance and opening date are required");
  }

  const existing = await pool.query(
    `
    SELECT id
    FROM financial_opening_balances
    WHERE branch_id IS NULL
      AND portal_type = 'welfare'
    LIMIT 1
    `
  );

  let result;

  if (existing.rows.length > 0) {
    result = await pool.query(
      `
      UPDATE financial_opening_balances
      SET
        opening_balance = $1,
        opening_date = $2,
        note = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
      `,
      [
        Number(openingBalance || 0),
        openingDate,
        note || null,
        existing.rows[0].id,
      ]
    );
  } else {
    result = await pool.query(
      `
      INSERT INTO financial_opening_balances
      (
        branch_id,
        portal_type,
        opening_balance,
        opening_date,
        note,
        created_by
      )
      VALUES (NULL, 'welfare', $1, $2, $3, $4)
      RETURNING *
      `,
      [
        Number(openingBalance || 0),
        openingDate,
        note || null,
        currentUser.id,
      ]
    );
  }

  await pool.query(
    `
    INSERT INTO audit_logs (user_id, action, module_name, description)
    VALUES ($1, $2, $3, $4)
    `,
    [
      currentUser.id,
      "UPSERT_WELFARE_OPENING_BALANCE",
      "reports",
      "Set welfare opening balance",
    ]
  );

  return result.rows[0];
};

const getWelfareMonthlyReport = async (query, currentUser) => {
  const {
    reportFilterType,
    monthStart,
    monthEnd,
    previousEnd,
    fromDate,
    toDate,
    reportMonth,
    reportYear,
  } = getReportRange(query);

  const openingResult = await pool.query(
    `
    SELECT opening_balance, opening_date
    FROM financial_opening_balances
    WHERE branch_id IS NULL
      AND portal_type = 'welfare'
    LIMIT 1
    `
  );

  if (openingResult.rows.length === 0) {
    throw new ApiError(400, "Please set opening balance first");
  }

  const openingBalance = Number(openingResult.rows[0].opening_balance) || 0;
  const openingDate = openingResult.rows[0].opening_date;

  const previousDonationsResult = await pool.query(
    `
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM donations
    WHERE donation_date >= $1
      AND donation_date <= $2
    `,
    [openingDate, previousEnd]
  );

  const previousCharityResult = await pool.query(
    `
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM charity_records
    WHERE charity_date >= $1
      AND charity_date <= $2
    `,
    [openingDate, previousEnd]
  );

  const previousExpensesResult = await pool.query(
    `
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM expenses
    WHERE expense_type = 'welfare'
      AND expense_date >= $1
      AND expense_date <= $2
    `,
    [openingDate, previousEnd]
  );

  const monthlyDonationsResult = await pool.query(
    `
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM donations
    WHERE donation_date >= $1
      AND donation_date <= $2
    `,
    [monthStart, monthEnd]
  );

  const monthlyCharityResult = await pool.query(
    `
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM charity_records
    WHERE charity_date >= $1
      AND charity_date <= $2
    `,
    [monthStart, monthEnd]
  );

  const monthlyExpensesResult = await pool.query(
    `
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM expenses
    WHERE expense_type = 'welfare'
      AND expense_date >= $1
      AND expense_date <= $2
    `,
    [monthStart, monthEnd]
  );

  const previousDonations = Number(previousDonationsResult.rows[0].total) || 0;
  const previousCharity = Number(previousCharityResult.rows[0].total) || 0;
  const previousExpenses = Number(previousExpensesResult.rows[0].total) || 0;

  const donations = Number(monthlyDonationsResult.rows[0].total) || 0;
  const charity = Number(monthlyCharityResult.rows[0].total) || 0;
  const expenses = Number(monthlyExpensesResult.rows[0].total) || 0;

  const previousBalance =
    openingBalance + previousDonations - previousCharity - previousExpenses;

  const currentBalance = previousBalance + donations - charity - expenses;

  return {
    generatedBy: await getUserFullName(currentUser.id),
    reportFilterType,
    month: reportMonth,
    year: reportYear,
    fromDate,
    toDate,
    monthStart,
    monthEnd,
    openingBalance,
    openingDate,
    previousBalance,
    donations,
    charity,
    expenses,
    currentBalance,
  };
};

const getSavedMonthlyReports = async (query, currentUser) => {
  const portalType = query.portalType === "welfare" ? "welfare" : "vocational";

  let branchId = query.branchId || null;

  if (portalType === "vocational") {
    branchId = getBranchIdForUser(query.branchId, currentUser);

    if (!branchId) {
      throw new ApiError(400, "Branch is required");
    }

    checkBranchAccess(branchId, currentUser);
  }

  const result = await pool.query(
    `
    SELECT
      r.id,
      r.report_no,
      r.branch_id,
      r.portal_type,
r.report_filter_type,
r.report_month,
r.report_year,
r.from_date,
r.to_date,
      r.previous_balance,
      r.collected_fees,
      r.donations,
      r.charity_amount,
      r.expenses,
      r.current_balance,
      r.generated_at,
      u.full_name AS generated_by_name
    FROM monthly_financial_reports r
    LEFT JOIN users u ON u.id = r.generated_by
    WHERE
      r.portal_type = $1
      AND (
        ($1 = 'welfare' AND r.branch_id IS NULL)
        OR
        ($1 = 'vocational' AND r.branch_id = $2)
      )
    ORDER BY r.generated_at DESC, r.id DESC
    `,
    [portalType, branchId]
  );

  return result.rows;
};

const createSavedMonthlyReport = async (data, currentUser) => {
  const portalType = data.portalType === "welfare" ? "welfare" : "vocational";

  let reportData;
  let branchId = null;

  if (portalType === "welfare") {
    reportData = await getWelfareMonthlyReport(data, currentUser);
  } else {
    branchId = getBranchIdForUser(data.branchId, currentUser);

    if (!branchId) {
      throw new ApiError(400, "Branch is required");
    }

    reportData = await getVocationalMonthlyReport(
      {
        ...data,
        branchId,
      },
      currentUser
    );
  }

  const result = await pool.query(
    `
INSERT INTO monthly_financial_reports
(
  report_no,
  branch_id,
  portal_type,
  report_filter_type,
  report_month,
  report_year,
  from_date,
  to_date,
  previous_balance,
  collected_fees,
  donations,
  charity_amount,
  expenses,
  current_balance,
  generated_by
)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
RETURNING *
    `,
    [
      generateReportNo(portalType),
      portalType === "welfare" ? null : branchId,
      portalType,
      reportData.reportFilterType,
      reportData.month,
      reportData.year,
      reportData.fromDate,
      reportData.toDate,
      reportData.previousBalance,
      reportData.collectedFees || 0,
      reportData.donations || 0,
      reportData.charity || 0,
      reportData.expenses || 0,
      reportData.currentBalance,
      currentUser.id,
    ]
  );

  return result.rows[0];
};

const getSavedMonthlyReportById = async (id, currentUser) => {
  const result = await pool.query(
    `
    SELECT
      r.*,
      u.full_name AS generated_by_name,
      b.name AS branch_name
    FROM monthly_financial_reports r
    LEFT JOIN users u ON u.id = r.generated_by
    LEFT JOIN branches b ON b.id = r.branch_id
    WHERE r.id = $1
    `,
    [id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, "Report not found");
  }

  const report = result.rows[0];

  if (report.portal_type === "vocational") {
    checkBranchAccess(report.branch_id, currentUser);
  }

  return report;
};

const deleteSavedMonthlyReport = async (id, currentUser) => {
  const report = await getSavedMonthlyReportById(id, currentUser);

  const result = await pool.query(
    `
    DELETE FROM monthly_financial_reports
    WHERE id = $1
    RETURNING id
    `,
    [id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, "Report not found");
  }

  await pool.query(
    `
    INSERT INTO audit_logs (user_id, action, module_name, description)
    VALUES ($1, $2, $3, $4)
    `,
    [
      currentUser.id,
      "DELETE_MONTHLY_FINANCIAL_REPORT",
      "reports",
      `Deleted ${report.portal_type} report ${report.report_no}`,
    ]
  );

  return true;
};

module.exports = {
  getStudentReport,
  getFinancialReport,
  getWelfareReport,
  getOpeningBalance,
  upsertOpeningBalance,
  getVocationalMonthlyReport,
  getWelfareOpeningBalance,
  upsertWelfareOpeningBalance,
  getWelfareMonthlyReport,
  getSavedMonthlyReports,
  createSavedMonthlyReport,
  getSavedMonthlyReportById,
  deleteSavedMonthlyReport,
};