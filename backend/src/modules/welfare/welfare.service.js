const pool = require("../../config/db");
const ApiError = require("../../utils/ApiError");

const createDonor = async (data) => {
  const { fullName, phone, email, address } = data;

  if (!fullName) {
    throw new ApiError(400, "Donor name is required");
  }

  const result = await pool.query(
    `
    INSERT INTO donors (full_name, phone, email, address)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [fullName, phone || null, email || null, address || null]
  );

  return result.rows[0];
};

const getDonors = async (query) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const offset = (page - 1) * limit;
  const search = query.search || "";

  const result = await pool.query(
    `
    SELECT id, full_name, phone, email, address, created_at
    FROM donors
    WHERE 
      full_name ILIKE $1
      OR phone ILIKE $1
      OR email ILIKE $1
    ORDER BY id DESC
    LIMIT $2 OFFSET $3
    `,
    [`%${search}%`, limit, offset]
  );

  return result.rows;
};

const createCharity = async (data, currentUser) => {
  const {
    charityName,
    charityType,
    contactPerson,
    phone,
    address,
    description,
  } = data;

  if (!charityName) {
    throw new ApiError(400, "Charity name is required");
  }

  const result = await pool.query(
    `
    INSERT INTO charities
    (
      charity_name,
      charity_type,
      contact_person,
      phone,
      address,
      description,
      created_by
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *
    `,
    [
      charityName,
      charityType || null,
      contactPerson || null,
      phone || null,
      address || null,
      description || null,
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
      "CREATE_CHARITY",
      "welfare",
      `Created charity ${charityName}`,
    ]
  );

  return result.rows[0];
};

const getCharities = async (query) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const offset = (page - 1) * limit;
  const search = query.search || "";

  const result = await pool.query(
    `
    SELECT
      id,
      charity_name,
      charity_type,
      contact_person,
      phone,
      address,
      description,
      is_active,
      created_at
    FROM charities
    WHERE 
      charity_name ILIKE $1
      OR charity_type ILIKE $1
      OR phone ILIKE $1
    ORDER BY id DESC
    LIMIT $2 OFFSET $3
    `,
    [`%${search}%`, limit, offset]
  );

  return result.rows;
};

const createDonation = async (data, currentUser) => {
  const {
    donorId,
    charityId,
    donationMethodId,
    amount,
    donationDate,
    purpose,
    note,
  } = data;

  if (!amount || Number(amount) <= 0) {
    throw new ApiError(400, "Donation amount must be greater than zero");
  }

  const result = await pool.query(
    `
    INSERT INTO donations
    (
      donor_id,
      charity_id,
      donation_method_id,
      amount,
      donation_date,
      purpose,
      note,
      created_by
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *
    `,
    [
      donorId || null,
      charityId || null,
      donationMethodId || null,
      Number(amount),
      donationDate || new Date(),
      purpose || null,
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
      "CREATE_DONATION",
      "welfare",
      `Created donation amount ${amount}`,
    ]
  );

  return result.rows[0];
};

const getDonations = async (query) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const offset = (page - 1) * limit;

  const fromDate = query.fromDate || null;
  const toDate = query.toDate || null;
  const charityId = query.charityId || null;
  const donorId = query.donorId || null;

  const result = await pool.query(
    `
    SELECT
      d.id,
      d.amount,
      d.donation_date,
      d.purpose,
      d.note,
      d.created_at,
      dn.full_name AS donor_name,
      c.charity_name,
      dm.method_name AS donation_method,
      u.full_name AS created_by_name
    FROM donations d
    LEFT JOIN donors dn ON dn.id = d.donor_id
    LEFT JOIN charities c ON c.id = d.charity_id
    LEFT JOIN donation_methods dm ON dm.id = d.donation_method_id
    LEFT JOIN users u ON u.id = d.created_by
    WHERE
      ($1::DATE IS NULL OR d.donation_date >= $1)
      AND ($2::DATE IS NULL OR d.donation_date <= $2)
      AND ($3::INT IS NULL OR d.charity_id = $3)
      AND ($4::INT IS NULL OR d.donor_id = $4)
    ORDER BY d.id DESC
    LIMIT $5 OFFSET $6
    `,
    [fromDate, toDate, charityId, donorId, limit, offset]
  );

  return result.rows;
};

const createWelfareApplication = async (data, currentUser) => {
  const {
    applicantName,
    fatherName,
    phone,
    cnic,
    gender,
    maritalStatus,
    familyMembers,
    residenceType,
    educationLevel,
    monthlyIncome,
    monthlyExpense,
    supportType,
    requestedAmount,
    address,
    verificationNotes,
  } = data;

  if (!applicantName) {
    throw new ApiError(400, "Applicant name is required");
  }

  const result = await pool.query(
    `
    INSERT INTO welfare_applications
    (
      applicant_name,
      father_name,
      phone,
      cnic,
      gender,
      marital_status,
      family_members,
      residence_type,
      education_level,
      monthly_income,
      monthly_expense,
      support_type,
      requested_amount,
      address,
      verification_notes,
      created_by
    )
    VALUES
    ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
    RETURNING *
    `,
    [
      applicantName,
      fatherName || null,
      phone || null,
      cnic || null,
      gender || null,
      maritalStatus || null,
      familyMembers || 0,
      residenceType || null,
      educationLevel || null,
      monthlyIncome || 0,
      monthlyExpense || 0,
      supportType || null,
      requestedAmount || 0,
      address || null,
      verificationNotes || null,
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
      "CREATE_WELFARE_APPLICATION",
      "welfare",
      `Created welfare application for ${applicantName}`,
    ]
  );

  return result.rows[0];
};

const getWelfareApplications = async (query) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const offset = (page - 1) * limit;

  const search = query.search || "";
  const caseStatus = query.caseStatus || null;
  const supportType = query.supportType || null;

  const result = await pool.query(
    `
    SELECT
      id,
      applicant_name,
      father_name,
      phone,
      cnic,
      gender,
      marital_status,
      family_members,
      monthly_income,
      monthly_expense,
      support_type,
      requested_amount,
      approved_amount,
      case_status,
      created_at
    FROM welfare_applications
    WHERE
      (
        applicant_name ILIKE $1
        OR father_name ILIKE $1
        OR phone ILIKE $1
        OR cnic ILIKE $1
      )
      AND ($2::VARCHAR IS NULL OR case_status = $2)
      AND ($3::VARCHAR IS NULL OR support_type = $3)
    ORDER BY id DESC
    LIMIT $4 OFFSET $5
    `,
    [`%${search}%`, caseStatus, supportType, limit, offset]
  );

  return result.rows;
};

const getWelfareApplicationById = async (id) => {
  const result = await pool.query(
    `
    SELECT
      wa.*,
      created_user.full_name AS created_by_name,
      approved_user.full_name AS approved_by_name
    FROM welfare_applications wa
    LEFT JOIN users created_user ON created_user.id = wa.created_by
    LEFT JOIN users approved_user ON approved_user.id = wa.approved_by
    WHERE wa.id = $1
    `,
    [id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, "Welfare application not found");
  }

  return result.rows[0];
};

const updateWelfareApplicationStatus = async (id, data, currentUser) => {
  const { caseStatus, approvedAmount, verificationNotes } = data;

  if (!caseStatus) {
    throw new ApiError(400, "Case status is required");
  }

const result = await pool.query(
  `
  UPDATE welfare_applications
  SET
    case_status = $1::VARCHAR,
    approved_amount = COALESCE($2::NUMERIC, approved_amount),
    verification_notes = COALESCE($3::TEXT, verification_notes),
    approved_by = CASE 
      WHEN $1::VARCHAR IN ('approved', 'rejected', 'completed') THEN $4::INT
      ELSE approved_by
    END,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = $5::INT
  RETURNING *
  `,
  [
    caseStatus,
    approvedAmount !== undefined ? Number(approvedAmount) : null,
    verificationNotes || null,
    currentUser.id,
    id,
  ]
);

  if (result.rows.length === 0) {
    throw new ApiError(404, "Welfare application not found");
  }

  await pool.query(
    `
    INSERT INTO audit_logs (user_id, action, module_name, description)
    VALUES ($1, $2, $3, $4)
    `,
    [
      currentUser.id,
      "UPDATE_WELFARE_APPLICATION_STATUS",
      "welfare",
      `Updated welfare application ID ${id} to ${caseStatus}`,
    ]
  );

  return result.rows[0];
};

const getDonationMethods = async () => {
  const result = await pool.query(
    `
    SELECT id, method_name, is_active
    FROM donation_methods
    WHERE is_active = TRUE
    ORDER BY method_name ASC
    `
  );

  return result.rows;
};

const createDonationMethod = async (data) => {
  const { methodName } = data;

  if (!methodName) {
    throw new ApiError(400, "Donation method name is required");
  }

  const result = await pool.query(
    `
    INSERT INTO donation_methods (method_name)
    VALUES ($1)
    ON CONFLICT (method_name) DO NOTHING
    RETURNING *
    `,
    [methodName]
  );

  if (result.rows.length === 0) {
    throw new ApiError(409, "Donation method already exists");
  }

  return result.rows[0];
};

const createWelfareImpact = async (data, currentUser) => {
  const {
    title,
    livesTouched,
    urbanReach,
    ruralReach,
    activeGrants,
    note,
  } = data;

  if (!title) {
    throw new ApiError(400, "Impact title is required");
  }

  const result = await pool.query(
    `
    INSERT INTO welfare_impact_records
    (
      title,
      lives_touched,
      urban_reach,
      rural_reach,
      active_grants,
      note,
      created_by
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING *
    `,
    [
      title,
      livesTouched || 0,
      urbanReach || 0,
      ruralReach || 0,
      activeGrants || 0,
      note || null,
      currentUser.id,
    ]
  );

  return result.rows[0];
};

const getWelfareDashboard = async () => {
  const result = await pool.query(
    `
    SELECT
      COALESCE((SELECT SUM(amount) FROM donations), 0) AS total_donations,

      COALESCE((
        SELECT SUM(amount)
        FROM expenses
        WHERE expense_type = 'welfare'
      ), 0) AS total_welfare_expenses,

      COUNT(*) FILTER (
        WHERE case_status = 'pending'
      ) AS pending_cases,

      COUNT(*) FILTER (
        WHERE case_status = 'approved'
      ) AS approved_cases,

      COUNT(*) FILTER (
        WHERE case_status = 'completed'
      ) AS completed_cases,

      COUNT(*) AS total_cases
    FROM welfare_applications
    `
  );

  const impactResult = await pool.query(
    `
    SELECT
      COALESCE(SUM(lives_touched), 0) AS lives_touched,
      COALESCE(SUM(urban_reach), 0) AS urban_reach,
      COALESCE(SUM(rural_reach), 0) AS rural_reach,
      COALESCE(SUM(active_grants), 0) AS active_grants
    FROM welfare_impact_records
    `
  );

  const recentActivities = await pool.query(
    `
    SELECT
      'donation' AS type,
      amount::TEXT AS title,
      donation_date AS activity_date,
      purpose AS description
    FROM donations

    UNION ALL

    SELECT
      'application' AS type,
      applicant_name AS title,
      created_at::DATE AS activity_date,
      support_type AS description
    FROM welfare_applications

    ORDER BY activity_date DESC
    LIMIT 10
    `
  );

  const data = result.rows[0];
  const impact = impactResult.rows[0];

  const totalDonations = Number(data.total_donations) || 0;
  const totalExpenses = Number(data.total_welfare_expenses) || 0;

  return {
    totalDonations,
    totalWelfareExpenses: totalExpenses,
    availableBalance: totalDonations - totalExpenses,
    totalCases: Number(data.total_cases) || 0,
    pendingCases: Number(data.pending_cases) || 0,
    approvedCases: Number(data.approved_cases) || 0,
    completedCases: Number(data.completed_cases) || 0,
    livesTouched: Number(impact.lives_touched) || 0,
    urbanReach: Number(impact.urban_reach) || 0,
    ruralReach: Number(impact.rural_reach) || 0,
    activeGrants: Number(impact.active_grants) || 0,
    recentActivities: recentActivities.rows,
  };
};

module.exports = {
  createDonor,
  getDonors,
  createCharity,
  getCharities,
  createDonation,
  getDonations,
  createWelfareApplication,
  getWelfareApplications,
  getWelfareApplicationById,
  updateWelfareApplicationStatus,
  getDonationMethods,
  createDonationMethod,
  createWelfareImpact,
  getWelfareDashboard,
};