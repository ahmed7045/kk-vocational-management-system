const pool = require("../../config/db");
const ApiError = require("../../utils/ApiError");

const canAccessBranch = (user, branchId) => {
  if (user.role === "super_admin") return true;
  return Number(user.branchId) === Number(branchId);
};

// const calculateFeeStatus = (totalFee, paidFee) => {
//   const total = Number(totalFee) || 0;
//   const paid = Number(paidFee) || 0;

//   if (paid <= 0) return "pending";
//   if (paid >= total) return "paid";
//   return "partial";
// };

// const calculateFeeStatus = () => {
//   return "paid";
// };

const updateCompletedStudentsStatus = async (branchId = null) => {
  const values = [];
  let branchCondition = "";

  if (branchId) {
    values.push(branchId);
    branchCondition = `AND s.branch_id = $${values.length}`;
  }

  await pool.query(
    `
    UPDATE students s
    SET student_status = 'non_active',
        updated_at = CURRENT_TIMESTAMP
    WHERE s.student_status = 'active'
      AND s.admission_date IS NOT NULL
      ${branchCondition}
      AND EXISTS (
        SELECT 1
        FROM student_courses sc
        JOIN courses c ON c.id = sc.course_id
        WHERE sc.student_id = s.id
          AND c.duration IS NOT NULL
          AND c.duration <> ''
          AND CURRENT_DATE >= (
            s.admission_date::DATE +
            CASE
              WHEN LOWER(c.duration) LIKE '%year%' THEN
                (COALESCE(NULLIF(SUBSTRING(c.duration FROM '([0-9]+)'), ''), '0')::INT || ' years')::INTERVAL

              WHEN LOWER(c.duration) LIKE '%month%' THEN
                (COALESCE(NULLIF(SUBSTRING(c.duration FROM '([0-9]+)'), ''), '0')::INT || ' months')::INTERVAL

              WHEN LOWER(c.duration) LIKE '%week%' THEN
                (COALESCE(NULLIF(SUBSTRING(c.duration FROM '([0-9]+)'), ''), '0')::INT || ' weeks')::INTERVAL

              WHEN LOWER(c.duration) LIKE '%day%' THEN
                (COALESCE(NULLIF(SUBSTRING(c.duration FROM '([0-9]+)'), ''), '0')::INT || ' days')::INTERVAL

              ELSE
                INTERVAL '0 days'
            END
          )::DATE
      )
    `,
    values
  );
};
const createStudent = async (data, currentUser) => {
const {
  branchId,
  fullName,
  fatherName,
  phone,
  city,
  address,
  photoUrl,
  courseIds,
  assignedTeacherId,
  shiftId,
  admissionDate,
  admissionStatus,
  totalFee,
  paidFee,
  remainingFee,
  feeStatus,
} = data;

  if (!branchId || !fullName) {
    throw new ApiError(400, "Branch and student name are required");
  }

  if (!canAccessBranch(currentUser, branchId)) {
    throw new ApiError(403, "You cannot create student for this branch");
  }

const total = Number(totalFee) || Number(paidFee) || 0;
const paid = Number(paidFee) || 0;
const remaining =
  remainingFee !== undefined
    ? Number(remainingFee)
    : Math.max(total - paid, 0);

const finalFeeStatus = feeStatus || (paid >= total ? "paid" : "pending");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const studentResult = await client.query(
      `
      INSERT INTO students
      (
        branch_id,
        full_name,
        father_name,
        phone,
        city,
        address,
        photo_url,
        assigned_teacher_id,
        shift_id,
        admission_date,
        admission_status,
        student_status,
        fee_status,
        total_fee,
        paid_fee,
        remaining_fee,
        created_by
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'active',$12,$13,$14,$15,$16)
      RETURNING *
      `,
      [
        branchId,
        fullName,
        fatherName || null,
        phone || null,
        city || null,
        address || null,
        photoUrl || null,
        assignedTeacherId || null,
        shiftId || null,
        admissionDate || null,
        admissionStatus || "draft",
        finalFeeStatus,
        total,
        paid,
        remaining,
        currentUser.id,
      ]
    );

    const student = studentResult.rows[0];

    if (courseIds && courseIds.length > 0) {
      for (const courseId of courseIds) {
        await client.query(
          `
          INSERT INTO student_courses (student_id, course_id)
          VALUES ($1, $2)
          ON CONFLICT (student_id, course_id) DO NOTHING
          `,
          [student.id, courseId]
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
        "CREATE_STUDENT",
        "students",
        `Created student ${fullName}`,
      ]
    );

    await client.query("COMMIT");

    return student;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const upsertStudentPaymentDate = async (data, currentUser) => {
  const { studentId, feeDate, paidDate } = data;

  if (!studentId || !feeDate || !paidDate) {
    throw new ApiError(400, "Student, fees date and paid date are required");
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
      throw new ApiError(403, "You cannot update payment for this student");
    }

    const existingPayment = await client.query(
      `
      SELECT id
      FROM payments
      WHERE student_id = $1
        AND fee_date = $2
      LIMIT 1
      `,
      [studentId, feeDate]
    );

    if (existingPayment.rows.length > 0) {
      await client.query(
        `
        UPDATE payments
        SET payment_date = $1
        WHERE id = $2
        `,
        [paidDate, existingPayment.rows[0].id]
      );
    } else {
      await client.query(
        `
        INSERT INTO payments
        (
          branch_id,
          student_id,
          amount,
          payment_method_id,
          payment_date,
          fee_date,
          reference_no,
          note,
          created_by
        )
        VALUES ($1,$2,$3,NULL,$4,$5,$6,$7,$8)
        `,
        [
          student.branch_id,
          studentId,
          Number(student.total_fee) || 0,
          paidDate,
          feeDate,
          `AUTO-${studentId}-${feeDate}`,
          "Paid date added from fee list",
          currentUser.id,
        ]
      );
    }

    await client.query(
      `
      UPDATE students
      SET
        paid_fee = total_fee,
        remaining_fee = 0,
        fee_status = 'paid',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [studentId]
    );

    await client.query("COMMIT");

    return {
      studentId,
      feeDate,
      paidDate,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getStudents = async (filters = {}) => {
const {
  branchId,
  search,
  feeStatus,
  studentStatus,
  fromDate,
  toDate,
  month,
  year,
  page = 1,
  limit = 50,
} = filters;
  await updateCompletedStudentsStatus(branchId);

  const values = [];
  const conditions = [];

  if (branchId) {
    values.push(branchId);
    conditions.push(`s.branch_id = $${values.length}`);
  }

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`
      (
        s.full_name ILIKE $${values.length}
        OR s.father_name ILIKE $${values.length}
        OR s.phone ILIKE $${values.length}
      )
    `);
  }

  if (feeStatus) {
    values.push(feeStatus);
    conditions.push(`s.fee_status = $${values.length}`);
  }

  if (studentStatus) {
    values.push(studentStatus);
    conditions.push(`s.student_status = $${values.length}`);
  }

const listDateExpression = `s.admission_date::DATE`;

if (fromDate && toDate) {
  values.push(fromDate);
  conditions.push(`${listDateExpression} >= $${values.length}`);

  values.push(toDate);
  conditions.push(`${listDateExpression} <= $${values.length}`);
} else if (month && year) {
  values.push(Number(month));
  conditions.push(`EXTRACT(MONTH FROM ${listDateExpression}) = $${values.length}`);

  values.push(Number(year));
  conditions.push(`EXTRACT(YEAR FROM ${listDateExpression}) = $${values.length}`);
}
  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const offset = (Number(page) - 1) * Number(limit);

  values.push(Number(limit));
  const limitIndex = values.length;

  values.push(offset);
  const offsetIndex = values.length;

const result = await pool.query(
  `
  SELECT 
    s.*,
    b.name AS branch_name,
    (s.admission_date::DATE + INTERVAL '1 month')::DATE AS fees_date,
    MAX(p.payment_date) AS paid_date,
    COALESCE(
      json_agg(
        DISTINCT jsonb_build_object(
          'id', c.id,
          'courseName', c.course_name,
          'duration', c.duration
        )
      ) FILTER (WHERE c.id IS NOT NULL),
      '[]'
    ) AS courses
  FROM students s
  LEFT JOIN branches b ON b.id = s.branch_id
  LEFT JOIN student_courses sc ON sc.student_id = s.id
  LEFT JOIN courses c ON c.id = sc.course_id
  LEFT JOIN payments p
    ON p.student_id = s.id
    AND p.fee_date = (s.admission_date::DATE + INTERVAL '1 month')::DATE
  ${whereClause}
  GROUP BY s.id, b.name
  ORDER BY s.created_at DESC
  LIMIT $${limitIndex}
  OFFSET $${offsetIndex}
  `,
  values
);

return result.rows;
};

const getStudentById = async (id, currentUser) => {
  const result = await pool.query(
    `
      SELECT
        s.*,
        b.name AS branch_name,
        st.shift_name,
        e.full_name AS teacher_name,
        COALESCE(
          JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
              'id', c.id,
              'courseName', c.course_name,
              'courseCode', c.course_code
            )
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'
        ) AS courses
      FROM students s
      LEFT JOIN branches b ON b.id = s.branch_id
      LEFT JOIN shift_timings st ON st.id = s.shift_id
      LEFT JOIN employees e ON e.id = s.assigned_teacher_id
      LEFT JOIN student_courses sc ON sc.student_id = s.id
      LEFT JOIN courses c ON c.id = sc.course_id
      WHERE s.id = $1
      GROUP BY s.id, b.name, st.shift_name, e.full_name
      `,
    [id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, "Student not found");
  }

  const student = result.rows[0];

  if (!canAccessBranch(currentUser, student.branch_id)) {
    throw new ApiError(403, "You cannot view this student");
  }

  return student;
};

const updateStudent = async (id, data, currentUser) => {
  const existing = await pool.query(
    `SELECT * FROM students WHERE id = $1`,
    [id]
  );

  if (existing.rows.length === 0) {
    throw new ApiError(404, "Student not found");
  }

  const oldStudent = existing.rows[0];

  if (!canAccessBranch(currentUser, oldStudent.branch_id)) {
    throw new ApiError(403, "You cannot update this student");
  }

const {
  fullName,
  fatherName,
  phone,
  city,
  address,
  photoUrl,
  assignedTeacherId,
  shiftId,
  admissionDate,
  admissionStatus,
  studentStatus,
  totalFee,
  paidFee,
  remainingFee,
  feeStatus,
  courseIds,
} = data;

const finalTotalFee =
  totalFee !== undefined ? Number(totalFee) : Number(oldStudent.total_fee);

const finalPaidFee =
  paidFee !== undefined ? Number(paidFee) : Number(oldStudent.paid_fee);

const finalRemainingFee =
  remainingFee !== undefined
    ? Number(remainingFee)
    : Math.max(finalTotalFee - finalPaidFee, 0);

const finalFeeStatus =
  feeStatus || (finalPaidFee >= finalTotalFee ? "paid" : "pending");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `
      UPDATE students
      SET
        full_name = COALESCE($1, full_name),
        father_name = COALESCE($2, father_name),
        phone = COALESCE($3, phone),
        city = COALESCE($4, city),
        address = COALESCE($5, address),
        photo_url = COALESCE($6, photo_url),
        assigned_teacher_id = COALESCE($7, assigned_teacher_id),
        shift_id = COALESCE($8, shift_id),
        admission_date = COALESCE($9, admission_date),
        admission_status = COALESCE($10, admission_status),
        student_status = COALESCE($11, student_status),
        total_fee = $12,
        paid_fee = $13,
        remaining_fee = $14,
        fee_status = $15,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $16
      RETURNING *
      `,
      [
        fullName || null,
        fatherName || null,
        phone || null,
        city || null,
        address || null,
        photoUrl || null,
        assignedTeacherId || null,
        shiftId || null,
        admissionDate || null,
        admissionStatus || null,
        studentStatus || oldStudent.student_status || "active",
        finalTotalFee,
        finalPaidFee,
        finalRemainingFee,
        finalFeeStatus,
        id,
      ]
    );

    if (courseIds && Array.isArray(courseIds)) {
      await client.query(
        `DELETE FROM student_courses WHERE student_id = $1`,
        [id]
      );

      for (const courseId of courseIds) {
        await client.query(
          `
          INSERT INTO student_courses (student_id, course_id)
          VALUES ($1, $2)
          ON CONFLICT (student_id, course_id) DO NOTHING
          `,
          [id, courseId]
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
        "UPDATE_STUDENT",
        "students",
        `Updated student ID ${id}`,
      ]
    );

    await client.query("COMMIT");

    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const updateStudentStatus = async (id, data, currentUser) => {
  const { studentStatus } = data;

  if (!studentStatus) {
    throw new ApiError(400, "Student status is required");
  }

  const student = await getStudentById(id, currentUser);

  const result = await pool.query(
    `
    UPDATE students
    SET student_status = $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *
    `,
    [studentStatus, student.id]
  );

  await pool.query(
    `
    INSERT INTO audit_logs (user_id, action, module_name, description)
    VALUES ($1, $2, $3, $4)
    `,
    [
      currentUser.id,
      "UPDATE_STUDENT_STATUS",
      "students",
      `Updated student status ID ${id} to ${studentStatus}`,
    ]
  );

  return result.rows[0];
};

const deleteStudent = async (studentId, currentUser) => {
  const student = await getStudentById(studentId, currentUser);

  const paymentCheck = await pool.query(
    `
    SELECT COUNT(*) AS total_payments
    FROM payments
    WHERE student_id = $1
    `,
    [studentId]
  );

  const totalPayments = Number(paymentCheck.rows[0].total_payments);

  if (totalPayments > 0) {
    throw new ApiError(
      400,
      "This student has payment records. You cannot delete this student."
    );
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
      DELETE FROM student_courses
      WHERE student_id = $1
      `,
      [studentId]
    );

    const result = await client.query(
      `
      DELETE FROM students
      WHERE id = $1
      RETURNING id, full_name
      `,
      [studentId]
    );

    await client.query(
      `
      INSERT INTO audit_logs (user_id, action, module_name, description)
      VALUES ($1, $2, $3, $4)
      `,
      [
        currentUser.id,
        "DELETE_STUDENT",
        "students",
        `Deleted student ${student.full_name}`,
      ]
    );

    await client.query("COMMIT");

    return result.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  updateStudentStatus,
  upsertStudentPaymentDate,
  deleteStudent,
};