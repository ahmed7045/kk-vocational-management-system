const pool = require("../../config/db");
const ApiError = require("../../utils/ApiError");

const generateCertificateNo = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000);
  return `KKV-${year}-${random}`;
};

const generateCertificate = async (data, currentUser) => {
  const {
    studentId,
    courseId,
    issueDate,
    certificateTitle,
    associationName,
    registrationText,
    instituteName,
    studentName,
    courseName,
    courseDuration,
    achievementText,
    secretaryName,
    presidentName,
  } = data;

  if (!studentId) {
    throw new ApiError(400, "Student ID is required");
  }

  const studentResult = await pool.query(
    `
    SELECT 
      s.id,
      s.full_name,
      s.branch_id,
      c.id AS course_id,
      c.course_name,
      c.duration
    FROM students s
    LEFT JOIN student_courses sc ON sc.student_id = s.id
    LEFT JOIN courses c ON c.id = sc.course_id
    WHERE s.id = $1
    LIMIT 1
    `,
    [studentId]
  );

  if (studentResult.rows.length === 0) {
    throw new ApiError(404, "Student not found");
  }

  const student = studentResult.rows[0];

  if (
    currentUser.role !== "super_admin" &&
    Number(currentUser.branchId) !== Number(student.branch_id)
  ) {
    throw new ApiError(403, "You cannot generate certificate for this student");
  }

  const certificateNo = generateCertificateNo();

  const result = await pool.query(
    `
    INSERT INTO certificates
    (
      student_id,
      course_id,
      certificate_no,
      certificate_title,
      association_name,
      registration_text,
      institute_name,
      student_name,
      course_name,
      course_duration,
      achievement_text,
      issue_date,
      secretary_name,
      president_name,
      generated_by
    )
    VALUES
    ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    RETURNING *
    `,
    [
      studentId,
      courseId || student.course_id || null,
      certificateNo,
      certificateTitle || "Certificate of Achievement",
      associationName || "KUTCHI KUMBHAR KHIDMAT-E-KHALQ WELFARE ASSOCIATION",
      registrationText || "(Regd)",
      instituteName || "Khidmat-e-Khalq Vocational IT Center",
      studentName || student.full_name,
      courseName || student.course_name || "Vocational Training",
      courseDuration || student.duration || "6 months",
      achievementText ||
      "Furthermore, the student has achieved a Distinguished Position in recognition of outstanding performance, dedication, and hard work. This certificate is proudly awarded in appreciation of their commitment and excellence.",
      issueDate || new Date(),
      secretaryName || "Aftab Ahmed",
      presidentName || "Muhammad Rafiq Mara",
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
      "GENERATE_CERTIFICATE",
      "certificates",
      `Generated certificate for ${studentName || student.full_name}`,
    ]
  );

  return result.rows[0];
};

const getCertificates = async (query, currentUser) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  const offset = (page - 1) * limit;
  const search = query.search || "";

  const branchId =
    currentUser.role === "super_admin"
      ? query.branchId || null
      : currentUser.branchId;

  const result = await pool.query(
    `
SELECT
  cert.id,
  cert.student_id,
  s.student_code,
  cert.certificate_no,
  cert.student_name,
      cert.course_name,
      cert.course_duration,
      cert.issue_date,
      cert.created_at,
      s.branch_id,
      b.name AS branch_name,
      u.full_name AS generated_by_name
    FROM certificates cert
    LEFT JOIN students s ON s.id = cert.student_id
    LEFT JOIN branches b ON b.id = s.branch_id
    LEFT JOIN users u ON u.id = cert.generated_by
    WHERE
      ($1::INT IS NULL OR s.branch_id = $1)
      AND (
        cert.student_name ILIKE $2
        OR cert.course_name ILIKE $2
        OR cert.certificate_no ILIKE $2
      )
    ORDER BY cert.id DESC
    LIMIT $3 OFFSET $4
    `,
    [branchId, `%${search}%`, limit, offset]
  );

  return result.rows;
};

const getCertificateById = async (id, currentUser) => {
  const result = await pool.query(
    `
SELECT
  cert.*,
  s.student_code,
  s.branch_id,
      b.name AS branch_name
    FROM certificates cert
    LEFT JOIN students s ON s.id = cert.student_id
    LEFT JOIN branches b ON b.id = s.branch_id
    WHERE cert.id = $1
    `,
    [id]
  );

  if (result.rows.length === 0) {
    throw new ApiError(404, "Certificate not found");
  }

  const certificate = result.rows[0];

  if (
    currentUser.role !== "super_admin" &&
    Number(currentUser.branch_id) !== Number(certificate.branch_id) &&
    Number(currentUser.branchId) !== Number(certificate.branch_id)
  ) {
    throw new ApiError(403, "You cannot view this certificate");
  }

  return certificate;
};

module.exports = {
  generateCertificate,
  getCertificates,
  getCertificateById,
};