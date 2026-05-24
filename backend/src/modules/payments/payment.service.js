const pool = require("../../config/db");
const ApiError = require("../../utils/ApiError");

const canAccessBranch = (user, branchId) => {
  if (user.role === "super_admin") return true;
  return Number(user.branchId) === Number(branchId);
};

const calculateFeeStatus = (totalFee, paidFee) => {
  const total = Number(totalFee) || 0;
  const paid = Number(paidFee) || 0;

  if (paid <= 0) return "pending";
  if (paid >= total) return "paid";
  return "partial";
};

// const recalculateStudentFee = async (client, studentId) => {
//   const paymentResult = await client.query(
//     `
//     SELECT COALESCE(SUM(amount), 0) AS total_paid
//     FROM payments
//     WHERE student_id = $1
//     `,
//     [studentId]
//   );

//   const paidFee = Number(paymentResult.rows[0].total_paid) || 0;

//   const studentResult = await client.query(
//     `
//     SELECT total_fee
//     FROM students
//     WHERE id = $1
//     `,
//     [studentId]
//   );

//   if (studentResult.rows.length === 0) {
//     throw new ApiError(404, "Student not found");
//   }

//   const totalFee = Number(studentResult.rows[0].total_fee) || 0;
//   const remainingFee = totalFee - paidFee;
//   const feeStatus = calculateFeeStatus(totalFee, paidFee);

//   const updatedStudent = await client.query(
//     `
//     UPDATE students
//     SET 
//       paid_fee = $1,
//       remaining_fee = $2,
//       fee_status = $3,
//       updated_at = CURRENT_TIMESTAMP
//     WHERE id = $4
//     RETURNING *
//     `,
//     [paidFee, remainingFee, feeStatus, studentId]
//   );

//   return updatedStudent.rows[0];
// };


// const calculateFeeStatus = (totalFee, paidFee) => {
//   const total = Number(totalFee) || 0;
//   const paid = Number(paidFee) || 0;

//   if (paid <= 0) return "pending";
//   if (paid >= total) return "paid";
//   return "partial";
// };

const recalculateStudentFee = async (client, studentId) => {
  const studentResult = await client.query(
    `
    SELECT id, total_fee
    FROM students
    WHERE id = $1
    `,
    [studentId]
  );

  if (studentResult.rows.length === 0) {
    throw new ApiError(404, "Student not found");
  }

  const totalFee = Number(studentResult.rows[0].total_fee) || 0;

  const paymentResult = await client.query(
    `
    SELECT COALESCE(SUM(amount), 0) AS total_paid
    FROM payments
    WHERE student_id = $1
    `,
    [studentId]
  );

  const paidFee = Number(paymentResult.rows[0].total_paid) || 0;
  const remainingFee = Math.max(totalFee - paidFee, 0);
  const feeStatus = calculateFeeStatus(totalFee, paidFee);

  const updatedStudent = await client.query(
    `
    UPDATE students
    SET
      paid_fee = $1,
      remaining_fee = $2,
      fee_status = $3,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
    RETURNING *
    `,
    [paidFee, remainingFee, feeStatus, studentId]
  );

  return updatedStudent.rows[0];
};

const deletePayment = async (paymentId, currentUser) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const paymentResult = await client.query(
      `
      SELECT
        p.id,
        p.student_id,
        p.branch_id,
        p.amount,
        s.full_name AS student_name
      FROM payments p
      LEFT JOIN students s ON s.id = p.student_id
      WHERE p.id = $1
      `,
      [paymentId]
    );

    if (paymentResult.rows.length === 0) {
      throw new ApiError(404, "Payment not found");
    }

    const payment = paymentResult.rows[0];

    if (!canAccessBranch(currentUser, payment.branch_id)) {
      throw new ApiError(403, "You cannot delete payment for this branch");
    }

    await client.query(
      `
      DELETE FROM payments
      WHERE id = $1
      `,
      [paymentId]
    );

    const updatedStudent = await recalculateStudentFee(
      client,
      payment.student_id
    );

    await client.query(
      `
      INSERT INTO audit_logs (user_id, action, module_name, description)
      VALUES ($1, $2, $3, $4)
      `,
      [
        currentUser.id,
        "DELETE_PAYMENT",
        "payments",
        `Deleted payment of ${payment.amount} for student ${payment.student_name}`,
      ]
    );

    await client.query("COMMIT");

    return {
      deletedPaymentId: payment.id,
      studentFee: {
        totalFee: updatedStudent.total_fee,
        paidFee: updatedStudent.paid_fee,
        remainingFee: updatedStudent.remaining_fee,
        feeStatus: updatedStudent.fee_status,
      },
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const createPayment = async (data, currentUser) => {
  const {
    studentId,
    amount,
    paymentMethodId,
    paymentDate,
    referenceNo,
    note,
  } = data;

  if (!studentId || !amount) {
    throw new ApiError(400, "Student and amount are required");
  }

  if (Number(amount) <= 0) {
    throw new ApiError(400, "Payment amount must be greater than zero");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const studentResult = await client.query(
      `
      SELECT id, branch_id, full_name, total_fee
      FROM students
      WHERE id = $1
      `,
      [studentId]
    );

    if (studentResult.rows.length === 0) {
      throw new ApiError(404, "Student not found");
    }

    const student = studentResult.rows[0];

    if (!canAccessBranch(currentUser, student.branch_id)) {
      throw new ApiError(403, "You cannot add payment for this branch");
    }

    const paymentResult = await client.query(
      `
      INSERT INTO payments
      (
        branch_id,
        student_id,
        amount,
        payment_method_id,
        payment_date,
        reference_no,
        note,
        created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
      `,
      [
        student.branch_id,
        studentId,
        Number(amount),
        paymentMethodId || null,
        paymentDate || new Date(),
        referenceNo || null,
        note || null,
        currentUser.id,
      ]
    );

    const updatedStudent = await recalculateStudentFee(client, studentId);

    await client.query(
      `
      INSERT INTO audit_logs (user_id, action, module_name, description)
      VALUES ($1, $2, $3, $4)
      `,
      [
        currentUser.id,
        "CREATE_PAYMENT",
        "payments",
        `Added payment of ${amount} for student ${student.full_name}`,
      ]
    );

    await client.query("COMMIT");

    return {
    payment: paymentResult.rows[0],
    studentFee: {
    totalFee: updatedStudent.total_fee,
    paidFee: updatedStudent.paid_fee,
    remainingFee: updatedStudent.remaining_fee,
    feeStatus: updatedStudent.fee_status,
  },
};
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getPayments = async (query, currentUser) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const offset = (page - 1) * limit;

  const studentId = query.studentId || null;
  const fromDate = query.fromDate || null;
  const toDate = query.toDate || null;

  let branchId = query.branchId;

  if (currentUser.role !== "super_admin") {
    branchId = currentUser.branchId;
  }

  const result = await pool.query(
    `
    SELECT
      p.id,
      p.branch_id,
      b.name AS branch_name,
      p.student_id,
      s.full_name AS student_name,
      p.amount,
      pm.method_name AS payment_method,
      p.payment_date,
      p.reference_no,
      p.note,
      p.created_at,
      u.full_name AS created_by_name
    FROM payments p
    LEFT JOIN branches b ON b.id = p.branch_id
    LEFT JOIN students s ON s.id = p.student_id
    LEFT JOIN payment_methods pm ON pm.id = p.payment_method_id
    LEFT JOIN users u ON u.id = p.created_by
    WHERE
      ($1::INT IS NULL OR p.branch_id = $1)
      AND ($2::INT IS NULL OR p.student_id = $2)
      AND ($3::DATE IS NULL OR p.payment_date >= $3)
      AND ($4::DATE IS NULL OR p.payment_date <= $4)
    ORDER BY p.id DESC
    LIMIT $5 OFFSET $6
    `,
    [
      branchId || null,
      studentId,
      fromDate,
      toDate,
      limit,
      offset,
    ]
  );

  return result.rows;
};

const getStudentPaymentHistory = async (studentId, currentUser) => {
  const studentResult = await pool.query(
    `
    SELECT id, branch_id, full_name, total_fee, paid_fee, remaining_fee, fee_status
    FROM students
    WHERE id = $1
    `,
    [studentId]
  );

  if (studentResult.rows.length === 0) {
    throw new ApiError(404, "Student not found");
  }

  const student = studentResult.rows[0];

  if (!canAccessBranch(currentUser, student.branch_id)) {
    throw new ApiError(403, "You cannot view this student's payments");
  }

  const paymentsResult = await pool.query(
    `
    SELECT
      p.id,
      p.amount,
      pm.method_name AS payment_method,
      p.payment_date,
      p.reference_no,
      p.note,
      p.created_at,
      u.full_name AS created_by_name
    FROM payments p
    LEFT JOIN payment_methods pm ON pm.id = p.payment_method_id
    LEFT JOIN users u ON u.id = p.created_by
    WHERE p.student_id = $1
    ORDER BY p.payment_date DESC, p.id DESC
    `,
    [studentId]
  );

  return {
    student,
    payments: paymentsResult.rows,
  };
};

const getRecentPayments = async (query, currentUser) => {
  let branchId = query.branchId;

  if (currentUser.role !== "super_admin") {
    branchId = currentUser.branchId;
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
    [branchId || null, limit]
  );

  return result.rows;
};

const getPaymentMethods = async () => {
  const result = await pool.query(
    `
    SELECT id, method_name, is_active
    FROM payment_methods
    WHERE is_active = TRUE
    ORDER BY method_name ASC
    `
  );

  return result.rows;
};

const createPaymentMethod = async (data) => {
  const { methodName } = data;

  if (!methodName) {
    throw new ApiError(400, "Payment method name is required");
  }

  const result = await pool.query(
    `
    INSERT INTO payment_methods (method_name)
    VALUES ($1)
    ON CONFLICT (method_name) DO NOTHING
    RETURNING *
    `,
    [methodName]
  );

  if (result.rows.length === 0) {
    throw new ApiError(409, "Payment method already exists");
  }

  return result.rows[0];
};

module.exports = {
  createPayment,
  getPayments,
  getStudentPaymentHistory,
  getRecentPayments,
  getPaymentMethods,
  createPaymentMethod,
  deletePayment,
};