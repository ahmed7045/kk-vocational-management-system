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

const generateStudentCode = (studentId) => {
  return String(studentId).padStart(5, "0");
};

const getInitialFeeDate = (admissionDate) => {
  if (!admissionDate) return null;

  return new Date(admissionDate).toISOString().split("T")[0];
};

const checkStudentCodeInBranch = async (
  clientOrPool,
  branchId,
  studentCode,
  excludeStudentId = null
) => {
  if (!studentCode || !String(studentCode).trim()) return;

  const result = await clientOrPool.query(
    `
    SELECT id
    FROM students
    WHERE branch_id = $1
      AND LOWER(TRIM(student_code)) = LOWER(TRIM($2))
      AND ($3::INT IS NULL OR id <> $3)
    LIMIT 1
    `,
    [branchId, studentCode, excludeStudentId]
  );

  if (result.rows.length > 0) {
    throw new ApiError(409, "Student ID already exists in this branch");
  }
};

const syncStudentFeeStatusFromCycles = async (clientOrPool = pool, branchId = null) => {
  await clientOrPool.query(
    `
    UPDATE students s
    SET
      fee_status = COALESCE(
        (
          SELECT fc.status
          FROM student_fee_cycles fc
          WHERE fc.student_id = s.id
            AND fc.fee_date <= CURRENT_DATE
          ORDER BY fc.fee_date DESC
          LIMIT 1
        ),
        s.fee_status
      ),
      paid_fee = CASE
        WHEN (
          SELECT fc.status
          FROM student_fee_cycles fc
          WHERE fc.student_id = s.id
            AND fc.fee_date <= CURRENT_DATE
          ORDER BY fc.fee_date DESC
          LIMIT 1
        ) = 'paid'
        THEN s.total_fee
        ELSE 0
      END,
      remaining_fee = CASE
        WHEN (
          SELECT fc.status
          FROM student_fee_cycles fc
          WHERE fc.student_id = s.id
            AND fc.fee_date <= CURRENT_DATE
          ORDER BY fc.fee_date DESC
          LIMIT 1
        ) = 'pending'
        THEN s.total_fee
        ELSE 0
      END,
      updated_at = CURRENT_TIMESTAMP
    WHERE s.student_status = 'active'
      AND ($1::INT IS NULL OR s.branch_id = $1)
    `,
    [branchId || null]
  );
};

const ensureStudentFeeCycles = async (branchId = null) => {
  await pool.query(
    `
    INSERT INTO student_fee_cycles
    (
      student_id,
      branch_id,
      fee_date,
      amount,
      status,
      payment_id,
      paid_date
    )
    SELECT
      x.student_id,
      x.branch_id,
      x.fee_date,
      x.amount,
      CASE WHEN p.id IS NOT NULL THEN 'paid' ELSE x.default_status END,
      p.id,
      p.payment_date
    FROM (
      SELECT
        s.id AS student_id,
        s.branch_id,
        s.total_fee AS amount,
        CASE
          WHEN n = 0 THEN s.admission_date::DATE
          ELSE (s.admission_date::DATE + (n || ' months')::INTERVAL)::DATE
        END AS fee_date,
        CASE
          WHEN n = 0 AND s.fee_status = 'paid' THEN 'paid'
          ELSE 'pending'
        END AS default_status
      FROM students s
      JOIN LATERAL generate_series(
        0,
        GREATEST(
          (
            SELECT COALESCE(MAX(
              CASE
                WHEN LOWER(c.duration) LIKE '%year%' THEN
                  COALESCE(NULLIF(SUBSTRING(c.duration FROM '([0-9]+)'), ''), '0')::INT * 12
                WHEN LOWER(c.duration) LIKE '%month%' THEN
                  COALESCE(NULLIF(SUBSTRING(c.duration FROM '([0-9]+)'), ''), '0')::INT
                ELSE 1
              END
            ), 1)
            FROM student_courses sc
            JOIN courses c ON c.id = sc.course_id
            WHERE sc.student_id = s.id
          ) - 1,
          0
        )
      ) n ON TRUE
      WHERE s.student_status = 'active'
        AND s.admission_date IS NOT NULL
        AND ($1::INT IS NULL OR s.branch_id = $1)
    ) x
    LEFT JOIN payments p
      ON p.student_id = x.student_id
      AND p.fee_date = x.fee_date
    WHERE x.fee_date <= CURRENT_DATE
    ON CONFLICT (student_id, fee_date)
    DO UPDATE SET
      amount = EXCLUDED.amount,
      status = CASE
        WHEN student_fee_cycles.status = 'paid' THEN 'paid'
        ELSE EXCLUDED.status
      END,
      payment_id = COALESCE(EXCLUDED.payment_id, student_fee_cycles.payment_id),
      paid_date = COALESCE(EXCLUDED.paid_date, student_fee_cycles.paid_date),
      updated_at = CURRENT_TIMESTAMP
    `,
    [branchId || null]
  );
};

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
    studentCode,
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

    await checkStudentCodeInBranch(
      client,
      branchId,
      studentCode?.trim() || null
    );

    const studentResult = await client.query(
      `
  INSERT INTO students
  (
    branch_id,
    student_code,
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
  ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'active',$13,$14,$15,$16,$17)
  RETURNING *
  `,
      [
        branchId,
        studentCode?.trim() || null,
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

    let student = studentResult.rows[0];

    if (!student.student_code) {
      const codeResult = await client.query(
        `
    UPDATE students
    SET student_code = $1
    WHERE id = $2
    RETURNING *
    `,
        [generateStudentCode(student.id), student.id]
      );

      student = codeResult.rows[0];
    }
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

    let admissionPaymentId = null;

    if (finalFeeStatus === "paid" && paid > 0) {
      const paymentResult = await client.query(
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
    VALUES ($1,$2,$3,NULL,CURRENT_DATE,$4,$5,$6,$7)
    RETURNING id
    `,
        [
          branchId,
          student.id,
          paid,
          getInitialFeeDate(admissionDate),
          `AUTO-STUDENT-${student.id}`,
          "Auto payment created from student admission",
          currentUser.id,
        ]
      );

      admissionPaymentId = paymentResult.rows[0].id;
    }

    if (admissionDate) {
      await client.query(
        `
    INSERT INTO student_fee_cycles
    (
      student_id,
      branch_id,
      fee_date,
      amount,
      status,
      payment_id,
      paid_date
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    ON CONFLICT (student_id, fee_date)
    DO UPDATE SET
      amount = EXCLUDED.amount,
      status = EXCLUDED.status,
      payment_id = EXCLUDED.payment_id,
      paid_date = EXCLUDED.paid_date,
      updated_at = CURRENT_TIMESTAMP
    `,
        [
          student.id,
          branchId,
          getInitialFeeDate(admissionDate),
          total,
          finalFeeStatus === "paid" ? "paid" : "pending",
          admissionPaymentId,
          finalFeeStatus === "paid" ? new Date() : null,
        ]
      );
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

const markStudentPaid = async (data, currentUser) => {
  const {
    studentId,
    feeCycleId,
    feeDate,
    paidDate,
    amount,
    paymentMethodId,
  } = data;

  if (!studentId || !feeDate || !paidDate || !amount) {
    throw new ApiError(400, "Student, fees date, paid date and amount are required");
  }

  if (Number(amount) <= 0) {
    throw new ApiError(400, "Amount must be greater than zero");
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
      throw new ApiError(403, "You cannot mark paid for this student");
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
        fee_date,
        reference_no,
        note,
        created_by
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT DO NOTHING
      RETURNING *
      `,
      [
        student.branch_id,
        studentId,
        Number(amount),
        paymentMethodId || null,
        paidDate,
        feeDate,
        `MARK-PAID-${studentId}-${feeDate}`,
        "Payment marked from pending list",
        currentUser.id,
      ]
    );

    let payment = paymentResult.rows[0];

    if (!payment) {
      const existingPayment = await client.query(
        `
        SELECT *
        FROM payments
        WHERE student_id = $1
          AND fee_date = $2
        ORDER BY id DESC
        LIMIT 1
        `,
        [studentId, feeDate]
      );

      payment = existingPayment.rows[0];
    }

    if (feeCycleId) {
      await client.query(
        `
    UPDATE student_fee_cycles
    SET
      amount = $1,
      status = 'paid',
      payment_id = $2,
      paid_date = $3,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
      AND student_id = $5
    `,
        [
          Number(amount),
          payment?.id || null,
          paidDate,
          feeCycleId,
          studentId,
        ]
      );
    } else {
      await client.query(
        `
    INSERT INTO student_fee_cycles
    (
      student_id,
      branch_id,
      fee_date,
      amount,
      status,
      payment_id,
      paid_date
    )
    VALUES ($1,$2,$3,$4,'paid',$5,$6)
    ON CONFLICT (student_id, fee_date)
    DO UPDATE SET
      amount = EXCLUDED.amount,
      status = 'paid',
      payment_id = EXCLUDED.payment_id,
      paid_date = EXCLUDED.paid_date,
      updated_at = CURRENT_TIMESTAMP
    `,
        [
          studentId,
          student.branch_id,
          feeDate,
          Number(amount),
          payment?.id || null,
          paidDate,
        ]
      );
    }

    await syncStudentFeeStatusFromCycles(client, student.branch_id);

    await client.query(
      `
      INSERT INTO audit_logs (user_id, action, module_name, description)
      VALUES ($1, $2, $3, $4)
      `,
      [
        currentUser.id,
        "MARK_STUDENT_PAID",
        "students",
        `Marked ${student.full_name} as paid for ${feeDate}`,
      ]
    );

    await client.query("COMMIT");

    return payment;
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
  await ensureStudentFeeCycles(branchId);

  const offset = (Number(page) - 1) * Number(limit);

  if (feeStatus === "paid" || feeStatus === "pending") {
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
          OR s.student_code ILIKE $${values.length}
        )
      `);
    }

    values.push(feeStatus);
    conditions.push(`fc.status = $${values.length}`);

    if (studentStatus) {
      values.push(studentStatus);
      conditions.push(`s.student_status = $${values.length}`);
    }

    if (fromDate && toDate) {
      values.push(fromDate);
      conditions.push(`fc.fee_date >= $${values.length}`);

      values.push(toDate);
      conditions.push(`fc.fee_date <= $${values.length}`);
    } else if (month && year) {
      values.push(Number(month));
      conditions.push(`EXTRACT(MONTH FROM fc.fee_date) = $${values.length}`);

      values.push(Number(year));
      conditions.push(`EXTRACT(YEAR FROM fc.fee_date) = $${values.length}`);
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";

    values.push(Number(limit));
    const limitIndex = values.length;

    values.push(offset);
    const offsetIndex = values.length;

    const result = await pool.query(
      `
      SELECT
        s.*,
        b.name AS branch_name,
        fc.id AS fee_cycle_id,
        fc.fee_date AS fees_date,
        fc.amount AS cycle_amount,
        fc.status AS cycle_status,
        fc.paid_date,
        fc.payment_id,
        p.amount AS payment_amount,
        p.payment_method_id,
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
      FROM student_fee_cycles fc
      JOIN students s ON s.id = fc.student_id
      LEFT JOIN branches b ON b.id = s.branch_id
      LEFT JOIN payments p ON p.id = fc.payment_id
      LEFT JOIN student_courses sc ON sc.student_id = s.id
      LEFT JOIN courses c ON c.id = sc.course_id
      ${whereClause}
      GROUP BY s.id, b.name, fc.id, p.id
      ORDER BY fc.fee_date DESC, s.created_at DESC
      LIMIT $${limitIndex}
      OFFSET $${offsetIndex}
      `,
      values
    );

    return result.rows;
  }

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
        OR s.student_code ILIKE $${values.length}
      )
    `);
  }

  if (studentStatus) {
    values.push(studentStatus);
    conditions.push(`s.student_status = $${values.length}`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  values.push(Number(limit));
  const limitIndex = values.length;

  values.push(offset);
  const offsetIndex = values.length;

  const result = await pool.query(
    `
    SELECT
      s.*,
      b.name AS branch_name,
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
    studentCode,
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
    student_code = COALESCE($1, student_code),
    full_name = COALESCE($2, full_name),
    father_name = COALESCE($3, father_name),
    phone = COALESCE($4, phone),
    city = COALESCE($5, city),
    address = COALESCE($6, address),
    photo_url = COALESCE($7, photo_url),
    assigned_teacher_id = COALESCE($8, assigned_teacher_id),
    shift_id = COALESCE($9, shift_id),
    admission_date = COALESCE($10, admission_date),
    admission_status = COALESCE($11, admission_status),
    student_status = COALESCE($12, student_status),
    total_fee = $13,
    paid_fee = $14,
    remaining_fee = $15,
    fee_status = $16,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = $17
  RETURNING *
  `,
      [
        studentCode?.trim() || null,
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

    const admissionDateChanged =
      admissionDate &&
      oldStudent.admission_date &&
      new Date(admissionDate).toISOString().split("T")[0] !==
      new Date(oldStudent.admission_date).toISOString().split("T")[0];

    const feeChanged =
      totalFee !== undefined &&
      Number(totalFee) !== Number(oldStudent.total_fee);

    if (admissionDateChanged || feeChanged) {
      await client.query(
        `
    DELETE FROM student_fee_cycles
    WHERE student_id = $1
    `,
        [id]
      );

      await client.query(
        `
    DELETE FROM payments
    WHERE student_id = $1
      AND note IN (
        'Auto payment created from student admission',
        'Payment marked from pending list',
        'Paid date added from fee list'
      )
    `,
        [id]
      );
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

    await ensureStudentFeeCycles(oldStudent.branch_id);

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

  // const paymentCheck = await pool.query(
  //   `
  //   SELECT COUNT(*) AS total_payments
  //   FROM payments
  //   WHERE student_id = $1
  //   `,
  //   [studentId]
  // );

  // const totalPayments = Number(paymentCheck.rows[0].total_payments);

  // if (totalPayments > 0) {
  //   throw new ApiError(
  //     400,
  //     "This student has payment records. You cannot delete this student."
  //   );
  // }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
  DELETE FROM payments
  WHERE student_id = $1
  `,
      [studentId]
    );

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
  markStudentPaid,
  deleteStudent,
};