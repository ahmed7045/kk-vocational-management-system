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
  } = data;

  if (!branchId || !fullName) {
    throw new ApiError(400, "Branch and student name are required");
  }

  if (!canAccessBranch(currentUser, branchId)) {
    throw new ApiError(403, "You cannot create student for this branch");
  }

  const total = Number(totalFee) || 0;
  const paid = Number(paidFee) || 0;
  const remaining = total - paid;
  const feeStatus = calculateFeeStatus(total, paid);

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
        feeStatus,
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

const getStudents = async (query, currentUser) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const offset = (page - 1) * limit;

  const search = query.search || "";
  const feeStatus = query.feeStatus || null;
  const studentStatus = query.studentStatus || null;
  const courseId = query.courseId || null;

  let branchId = query.branchId;

  if (currentUser.role !== "super_admin") {
    branchId = currentUser.branchId;
  }

  const result = await pool.query(
    `
    SELECT
      s.id,
      s.full_name,
      s.father_name,
      s.phone,
      s.city,
      s.address,
      s.photo_url,
      s.admission_date,
      s.admission_status,
      s.student_status,
      s.fee_status,
      s.total_fee,
      s.paid_fee,
      s.remaining_fee,
      s.created_at,
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
    WHERE
      ($1::INT IS NULL OR s.branch_id = $1)
      AND
      (
        s.full_name ILIKE $2
        OR s.father_name ILIKE $2
        OR s.phone ILIKE $2
      )
      AND ($3::VARCHAR IS NULL OR s.fee_status = $3)
      AND ($4::VARCHAR IS NULL OR s.student_status = $4)
      AND ($5::INT IS NULL OR sc.course_id = $5)
    GROUP BY s.id, b.name, st.shift_name, e.full_name
    ORDER BY s.id DESC
    LIMIT $6 OFFSET $7
    `,
    [
      branchId || null,
      `%${search}%`,
      feeStatus,
      studentStatus,
      courseId,
      limit,
      offset,
    ]
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
    courseIds,
  } = data;

  const finalTotalFee = totalFee !== undefined ? Number(totalFee) : Number(oldStudent.total_fee);
  const finalPaidFee = paidFee !== undefined ? Number(paidFee) : Number(oldStudent.paid_fee);
  const finalRemainingFee = finalTotalFee - finalPaidFee;
  const finalFeeStatus = calculateFeeStatus(finalTotalFee, finalPaidFee);

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
        studentStatus || null,
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

module.exports = {
  createStudent,
  getStudents,
  getStudentById,
  updateStudent,
  updateStudentStatus,
};