const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");

const pool = require("../../config/db");
const ApiError = require("../../utils/ApiError");

const canAccessBranch = (user, branchId) => {
  if (user.role === "super_admin") return true;
  return Number(user.branchId) === Number(branchId);
};

const normalizePortalType = (value) => {
  if (value === "welfare") return "welfare";
  if (value === "vocational") return "vocational";
  if (value === "branch") return "vocational";

  return "vocational";
};

const createExpense = async (data, currentUser) => {
  const branchId = data.branchId;
  const name = data.name || data.title;
  const amount = data.amount;
  const date = data.date || data.expenseDate;
  const note = data.note || data.description;
  const portalType = normalizePortalType(data.portalType || data.expenseType);

  if (!branchId || !name || !amount) {
    throw new ApiError(400, "Branch, name and amount are required");
  }

  if (Number(amount) <= 0) {
    throw new ApiError(400, "Expense amount must be greater than zero");
  }

  if (!canAccessBranch(currentUser, branchId)) {
    throw new ApiError(403, "You cannot create expense for this branch");
  }

  const result = await pool.query(
    `
    INSERT INTO expenses
    (
      branch_id,
      category_id,
      title,
      amount,
      expense_date,
      description,
      receipt_url,
      expense_type,
      created_by
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *
    `,
    [
      branchId,
      data.categoryId || null,
      name,
      Number(amount),
      date || new Date(),
      note || null,
      data.receiptUrl || null,
      portalType,
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
      "CREATE_EXPENSE",
      "expenses",
      `Created ${portalType} expense ${name} with amount ${amount}`,
    ]
  );

  return result.rows[0];
};

const getExpenses = async (query, currentUser) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const offset = (page - 1) * limit;

  const search = query.search || "";
  const categoryId = query.categoryId || null;
  const fromDate = query.fromDate || null;
  const toDate = query.toDate || null;
  const portalType = normalizePortalType(query.portalType || query.expenseType);

  let branchId = query.branchId;

  if (currentUser.role !== "super_admin") {
    branchId = currentUser.branchId;
  }

  const result = await pool.query(
    `
    SELECT
      e.id,
      e.branch_id,
      b.name AS branch_name,
      e.category_id,
      ec.category_name,
      e.title,
      e.title AS name,
      e.amount,
      e.expense_date,
      e.expense_date AS date,
      e.description,
      e.description AS note,
      e.receipt_url,
      e.expense_type,
      e.expense_type AS portal_type,
      e.created_at,
      u.full_name AS created_by_name
    FROM expenses e
    LEFT JOIN branches b ON b.id = e.branch_id
    LEFT JOIN expense_categories ec ON ec.id = e.category_id
    LEFT JOIN users u ON u.id = e.created_by
    WHERE
      ($1::INT IS NULL OR e.branch_id = $1)
      AND ($2::INT IS NULL OR e.category_id = $2)
      AND ($3::DATE IS NULL OR e.expense_date >= $3)
      AND ($4::DATE IS NULL OR e.expense_date <= $4)
      AND e.expense_type = $5
      AND (
        e.title ILIKE $6
        OR e.description ILIKE $6
        OR ec.category_name ILIKE $6
      )
    ORDER BY e.id DESC
    LIMIT $7 OFFSET $8
    `,
    [
      branchId || null,
      categoryId,
      fromDate,
      toDate,
      portalType,
      `%${search}%`,
      limit,
      offset,
    ]
  );

  return result.rows;
};

const getExpenseById = async (id, currentUser) => {
  const result = await pool.query(
    `
    SELECT
      e.*,
      e.title AS name,
      e.expense_date AS date,
      e.description AS note,
      e.expense_type AS portal_type,
      b.name AS branch_name,
      ec.category_name,
      u.full_name AS created_by_name
    FROM expenses e
    LEFT JOIN branches b ON b.id = e.branch_id
    LEFT JOIN expense_categories ec ON ec.id = e.category_id
    LEFT JOIN users u ON u.id = e.created_by
    WHERE e.id = $1
    `,
    [id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, "Expense not found");
  }

  const expense = result.rows[0];

  if (!canAccessBranch(currentUser, expense.branch_id)) {
    throw new ApiError(403, "You cannot view this expense");
  }

  return expense;
};

const updateExpense = async (id, data, currentUser) => {
  const existing = await pool.query(
    `SELECT * FROM expenses WHERE id = $1`,
    [id]
  );

  if (existing.rows.length === 0) {
    throw new ApiError(404, "Expense not found");
  }

  const oldExpense = existing.rows[0];

  if (!canAccessBranch(currentUser, oldExpense.branch_id)) {
    throw new ApiError(403, "You cannot update this expense");
  }

  const name = data.name || data.title;
  const amount = data.amount;
  const date = data.date || data.expenseDate;
  const note = data.note || data.description;
  const portalType = data.portalType || data.expenseType;

  if (amount !== undefined && Number(amount) <= 0) {
    throw new ApiError(400, "Expense amount must be greater than zero");
  }

  const result = await pool.query(
    `
    UPDATE expenses
    SET
      category_id = COALESCE($1, category_id),
      title = COALESCE($2, title),
      amount = COALESCE($3, amount),
      expense_date = COALESCE($4, expense_date),
      description = $5,
      receipt_url = COALESCE($6, receipt_url),
      expense_type = COALESCE($7, expense_type),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $8
    RETURNING *
    `,
    [
      data.categoryId || null,
      name || null,
      amount !== undefined ? Number(amount) : null,
      date || null,
      note || null,
      data.receiptUrl || null,
      portalType ? normalizePortalType(portalType) : null,
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
      "UPDATE_EXPENSE",
      "expenses",
      `Updated expense ID ${id}`,
    ]
  );

  return result.rows[0];
};

const deleteExpense = async (id, currentUser) => {
  const expense = await getExpenseById(id, currentUser);

  const result = await pool.query(
    `
    DELETE FROM expenses
    WHERE id = $1
    RETURNING id
    `,
    [id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, "Expense not found");
  }

  await pool.query(
    `
    INSERT INTO audit_logs (user_id, action, module_name, description)
    VALUES ($1, $2, $3, $4)
    `,
    [
      currentUser.id,
      "DELETE_EXPENSE",
      "expenses",
      `Deleted expense ${expense.title}`,
    ]
  );

  return result.rows[0];
};

const getExpenseCategories = async () => {
  const result = await pool.query(
    `
    SELECT id, category_name, is_active
    FROM expense_categories
    WHERE is_active = TRUE
    ORDER BY category_name ASC
    `
  );

  return result.rows;
};

const createExpenseCategory = async (data) => {
  const { categoryName } = data;

  if (!categoryName) {
    throw new ApiError(400, "Category name is required");
  }

  const result = await pool.query(
    `
    INSERT INTO expense_categories (category_name)
    VALUES ($1)
    ON CONFLICT (category_name) DO NOTHING
    RETURNING *
    `,
    [categoryName]
  );

  if (result.rows.length === 0) {
    throw new ApiError(409, "Expense category already exists");
  }

  return result.rows[0];
};

const generateExpensePdf = async (
  { branchId, categoryId, fromDate, toDate, portalType },
  currentUser
) => {
  const result = await pool.query(
    `
    SELECT
      e.title,
      e.amount,
      e.expense_date,
      ec.category_name
    FROM expenses e
    LEFT JOIN expense_categories ec ON ec.id = e.category_id
    WHERE
      ($1::INT IS NULL OR e.branch_id = $1)
      AND ($2::INT IS NULL OR e.category_id = $2)
      AND e.expense_type = $3
      AND ($4::DATE IS NULL OR e.expense_date >= $4)
      AND ($5::DATE IS NULL OR e.expense_date <= $5)
    ORDER BY e.expense_date ASC
    `,
    [
      branchId || null,
      categoryId || null,
      normalizePortalType(portalType),
      fromDate || null,
      toDate || null,
    ]
  );

  return result.rows;
};

const generateExpenseExcel = async (
  { branchId, categoryId, fromDate, toDate, portalType },
  currentUser
) => {
  const result = await pool.query(
    `
    SELECT
      e.title,
      e.amount,
      e.expense_date,
      ec.category_name
    FROM expenses e
    LEFT JOIN expense_categories ec ON ec.id = e.category_id
    WHERE
      ($1::INT IS NULL OR e.branch_id = $1)
      AND ($2::INT IS NULL OR e.category_id = $2)
      AND e.expense_type = $3
      AND ($4::DATE IS NULL OR e.expense_date >= $4)
      AND ($5::DATE IS NULL OR e.expense_date <= $5)
    ORDER BY e.expense_date ASC
    `,
    [
      branchId || null,
      categoryId || null,
      normalizePortalType(portalType),
      fromDate || null,
      toDate || null,
    ]
  );

  return result.rows;
};

module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpenseCategories,
  createExpenseCategory,
  generateExpensePdf,
generateExpenseExcel,
};