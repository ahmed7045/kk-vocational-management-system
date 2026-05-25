
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role_id INT REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE(role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS branches (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    location TEXT,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role_id INT REFERENCES roles(id),
    branch_id INT REFERENCES branches(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_logs (
    id SERIAL PRIMARY KEY,
    user_id INT NULL REFERENCES users(id) ON DELETE SET NULL,
    method VARCHAR(10),
    endpoint TEXT,
    status_code INT,
    ip_address VARCHAR(100),
    user_agent TEXT,
    response_time_ms INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INT NULL REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(150),
    module_name VARCHAR(100),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    permission_id INT REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE(user_id, permission_id)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    device_info TEXT,
    ip_address VARCHAR(100),
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    branch_id INT REFERENCES branches(id) ON DELETE SET NULL,
    full_name VARCHAR(150) NOT NULL,
    designation VARCHAR(100),
    phone VARCHAR(50),
    email VARCHAR(150),
    salary NUMERIC(12,2) DEFAULT 0,
    gender VARCHAR(20),
    has_login_account BOOLEAN DEFAULT FALSE,
    user_id INT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
    gender_visibility VARCHAR(30) DEFAULT 'both',
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS employee_id INT REFERENCES employees(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS user_branches (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    branch_id INT REFERENCES branches(id) ON DELETE CASCADE,
    UNIQUE(user_id, branch_id)
);

CREATE TABLE IF NOT EXISTS courses (
    id SERIAL PRIMARY KEY,
    branch_id INT REFERENCES branches(id) ON DELETE CASCADE,
    course_name VARCHAR(150) NOT NULL,
    course_code VARCHAR(50),
    duration VARCHAR(100),
    fee NUMERIC(12,2) DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shift_timings (
    id SERIAL PRIMARY KEY,
    branch_id INT REFERENCES branches(id) ON DELETE CASCADE,
    shift_name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    branch_id INT REFERENCES branches(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    father_name VARCHAR(150),
    phone VARCHAR(50),
    city VARCHAR(100),
    address TEXT,
    photo_url TEXT,

    assigned_teacher_id INT REFERENCES employees(id) ON DELETE SET NULL,
    shift_id INT REFERENCES shift_timings(id) ON DELETE SET NULL,

    admission_date DATE,
    admission_status VARCHAR(50) DEFAULT 'draft',
    student_status VARCHAR(50) DEFAULT 'active',
    fee_status VARCHAR(50) DEFAULT 'pending',

    total_fee NUMERIC(12,2) DEFAULT 0,
    paid_fee NUMERIC(12,2) DEFAULT 0,
    remaining_fee NUMERIC(12,2) DEFAULT 0,

    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_courses (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    course_id INT REFERENCES courses(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id)
);

CREATE TABLE IF NOT EXISTS student_documents (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    document_name VARCHAR(150),
    document_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_methods (
    id SERIAL PRIMARY KEY,
    method_name VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    branch_id INT REFERENCES branches(id) ON DELETE CASCADE,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    amount NUMERIC(12,2) NOT NULL,
    payment_method_id INT REFERENCES payment_methods(id) ON DELETE SET NULL,
    payment_date DATE DEFAULT CURRENT_DATE,
    reference_no VARCHAR(100),
    note TEXT,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expense_categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    branch_id INT REFERENCES branches(id) ON DELETE CASCADE,
    category_id INT REFERENCES expense_categories(id) ON DELETE SET NULL,
    title VARCHAR(150) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    expense_date DATE DEFAULT CURRENT_DATE,
    description TEXT,
    receipt_url TEXT,
    expense_type VARCHAR(50) DEFAULT 'branch',
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS donation_methods (
    id SERIAL PRIMARY KEY,
    method_name VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS donors (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(150),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS charities (
    id SERIAL PRIMARY KEY,
    charity_name VARCHAR(150) NOT NULL,
    charity_type VARCHAR(100),
    contact_person VARCHAR(150),
    phone VARCHAR(50),
    address TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS donations (
    id SERIAL PRIMARY KEY,
    donor_id INT REFERENCES donors(id) ON DELETE SET NULL,
    charity_id INT REFERENCES charities(id) ON DELETE SET NULL,
    donation_method_id INT REFERENCES donation_methods(id) ON DELETE SET NULL,
    amount NUMERIC(12,2) NOT NULL,
    donation_date DATE DEFAULT CURRENT_DATE,
    purpose VARCHAR(150),
    note TEXT,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS welfare_applications (
    id SERIAL PRIMARY KEY,
    applicant_name VARCHAR(150) NOT NULL,
    father_name VARCHAR(150),
    phone VARCHAR(50),
    cnic VARCHAR(30),
    gender VARCHAR(30),
    marital_status VARCHAR(50),
    family_members INT DEFAULT 0,
    residence_type VARCHAR(50),
    education_level VARCHAR(100),
    monthly_income NUMERIC(12,2) DEFAULT 0,
    monthly_expense NUMERIC(12,2) DEFAULT 0,
    support_type VARCHAR(150),
    requested_amount NUMERIC(12,2) DEFAULT 0,
    approved_amount NUMERIC(12,2) DEFAULT 0,
    address TEXT,
    case_status VARCHAR(50) DEFAULT 'pending',
    verification_notes TEXT,
    approved_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS welfare_impact_records (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    lives_touched INT DEFAULT 0,
    urban_reach INT DEFAULT 0,
    rural_reach INT DEFAULT 0,
    active_grants INT DEFAULT 0,
    note TEXT,
    created_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS certificates (
    id SERIAL PRIMARY KEY,
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    course_id INT REFERENCES courses(id) ON DELETE SET NULL,

    certificate_no VARCHAR(100) UNIQUE NOT NULL,
    certificate_title VARCHAR(150) DEFAULT 'Certificate of Achievement',

    association_name VARCHAR(250) DEFAULT 'KUTCHI KUMBHAR KHIDMAT-E-KHALQ WELFARE ASSOCIATION',
    registration_text VARCHAR(50) DEFAULT '(Regd)',
    institute_name VARCHAR(200) DEFAULT 'Khidmat-e-Khalq Vocational IT Center',

    student_name VARCHAR(150) NOT NULL,
    course_name VARCHAR(150) NOT NULL,
    course_duration VARCHAR(100),

    achievement_text TEXT,
    issue_date DATE DEFAULT CURRENT_DATE,

    secretary_name VARCHAR(150) DEFAULT 'Aftab Ahmed',
    president_name VARCHAR(150) DEFAULT 'Muhammad Rafiq Mara',

    generated_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS report_exports (
    id SERIAL PRIMARY KEY,
    report_type VARCHAR(100) NOT NULL,
    export_type VARCHAR(50) NOT NULL,
    filters JSONB,
    generated_by INT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE charities
ADD COLUMN IF NOT EXISTS father_name VARCHAR(150),
ADD COLUMN IF NOT EXISTS cnic VARCHAR(50),
ADD COLUMN IF NOT EXISTS family_members INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_income NUMERIC(12,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE TABLE IF NOT EXISTS charity_records (
  id SERIAL PRIMARY KEY,
  charity_id INT NOT NULL REFERENCES charities(id) ON DELETE CASCADE,
  charity_type VARCHAR(100),
  amount NUMERIC(12,2) DEFAULT 0,
  item_name VARCHAR(150),
  quantity INT DEFAULT 0,
  charity_date DATE DEFAULT CURRENT_DATE,
  note TEXT,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE welfare_applications
ADD COLUMN IF NOT EXISTS area TEXT,
ADD COLUMN IF NOT EXISTS house_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS community TEXT,
ADD COLUMN IF NOT EXISTS need_description TEXT,
ADD COLUMN IF NOT EXISTS school_name TEXT,
ADD COLUMN IF NOT EXISTS verifier_name TEXT,
ADD COLUMN IF NOT EXISTS office_remarks TEXT,
ADD COLUMN IF NOT EXISTS needs_school_fee BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS needs_school_dress BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS needs_school_uniform BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS needs_school_bag BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS needs_school_shoes BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS needs_university_fee BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS needs_other_education_help BOOLEAN DEFAULT FALSE;

-- =====================================================
-- PRODUCTION SAFETY PATCHES
-- =====================================================

-- Keep student statuses clean
ALTER TABLE students
DROP CONSTRAINT IF EXISTS chk_students_fee_status;

ALTER TABLE students
ADD CONSTRAINT chk_students_fee_status
CHECK (fee_status IN ('paid', 'pending'));

ALTER TABLE students
DROP CONSTRAINT IF EXISTS chk_students_status;

ALTER TABLE students
ADD CONSTRAINT chk_students_status
CHECK (student_status IN ('active', 'non_active'));

-- Helpful timestamps
ALTER TABLE users
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE branches
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE courses
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE shift_timings
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE employees
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE donors
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE donations
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE payment_methods
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE expense_categories
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE donation_methods
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- // INDEXING BLOCK
-- =====================================================
-- SAFE INDEXING SCRIPT FOR KK VOCATIONAL DATABASE
-- This script checks table/column before creating index
-- =====================================================

-- Helper function: single-column index
CREATE OR REPLACE FUNCTION create_index_if_column_exists(
  p_index_name TEXT,
  p_table_name TEXT,
  p_column_name TEXT
)
RETURNS void AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = p_table_name
      AND column_name = p_column_name
  ) THEN
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON %I(%I)',
      p_index_name,
      p_table_name,
      p_column_name
    );
  END IF;
END;
$$ LANGUAGE plpgsql;


-- Helper function: two-column composite index
CREATE OR REPLACE FUNCTION create_index_if_two_columns_exist(
  p_index_name TEXT,
  p_table_name TEXT,
  p_column_one TEXT,
  p_column_two TEXT
)
RETURNS void AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = p_table_name
      AND column_name = p_column_one
  )
  AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = p_table_name
      AND column_name = p_column_two
  ) THEN
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON %I(%I, %I)',
      p_index_name,
      p_table_name,
      p_column_one,
      p_column_two
    );
  END IF;
END;
$$ LANGUAGE plpgsql;


-- Helper function: three-column composite index
CREATE OR REPLACE FUNCTION create_index_if_three_columns_exist(
  p_index_name TEXT,
  p_table_name TEXT,
  p_column_one TEXT,
  p_column_two TEXT,
  p_column_three TEXT
)
RETURNS void AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = p_table_name
      AND column_name = p_column_one
  )
  AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = p_table_name
      AND column_name = p_column_two
  )
  AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = p_table_name
      AND column_name = p_column_three
  ) THEN
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS %I ON %I(%I, %I, %I)',
      p_index_name,
      p_table_name,
      p_column_one,
      p_column_two,
      p_column_three
    );
  END IF;
END;
$$ LANGUAGE plpgsql;


-- =========================
-- USERS / AUTH
-- =========================
SELECT create_index_if_column_exists('idx_users_email', 'users', 'email');
SELECT create_index_if_column_exists('idx_users_role_id', 'users', 'role_id');
SELECT create_index_if_column_exists('idx_users_branch_id', 'users', 'branch_id');
SELECT create_index_if_column_exists('idx_users_is_active', 'users', 'is_active');

SELECT create_index_if_column_exists('idx_refresh_tokens_user_id', 'refresh_tokens', 'user_id');
SELECT create_index_if_column_exists('idx_refresh_tokens_token_hash', 'refresh_tokens', 'token_hash');
SELECT create_index_if_column_exists('idx_refresh_tokens_expires_at', 'refresh_tokens', 'expires_at');


-- =========================
-- BRANCHES
-- =========================
SELECT create_index_if_column_exists('idx_branches_status', 'branches', 'status');
SELECT create_index_if_column_exists('idx_branches_name', 'branches', 'name');


-- =========================
-- STUDENTS
-- =========================
SELECT create_index_if_column_exists('idx_students_branch_id', 'students', 'branch_id');
SELECT create_index_if_column_exists('idx_students_full_name', 'students', 'full_name');
SELECT create_index_if_column_exists('idx_students_father_name', 'students', 'father_name');
SELECT create_index_if_column_exists('idx_students_phone', 'students', 'phone');
SELECT create_index_if_column_exists('idx_students_cnic', 'students', 'cnic');
SELECT create_index_if_column_exists('idx_students_fee_status', 'students', 'fee_status');
SELECT create_index_if_column_exists('idx_students_student_status', 'students', 'student_status');
SELECT create_index_if_column_exists('idx_students_admission_date', 'students', 'admission_date');
SELECT create_index_if_two_columns_exist('idx_students_branch_status', 'students', 'branch_id', 'student_status');
SELECT create_index_if_two_columns_exist('idx_students_branch_fee_status', 'students', 'branch_id', 'fee_status');


-- =========================
-- STUDENT COURSES
-- =========================
SELECT create_index_if_column_exists('idx_student_courses_student_id', 'student_courses', 'student_id');
SELECT create_index_if_column_exists('idx_student_courses_course_id', 'student_courses', 'course_id');
SELECT create_index_if_two_columns_exist('idx_student_courses_student_course', 'student_courses', 'student_id', 'course_id');


-- =========================
-- STUDENT DOCUMENTS
-- =========================
SELECT create_index_if_column_exists('idx_student_documents_student_id', 'student_documents', 'student_id');
SELECT create_index_if_column_exists('idx_student_documents_document_type', 'student_documents', 'document_type');


-- =========================
-- COURSES
-- =========================
SELECT create_index_if_column_exists('idx_courses_branch_id', 'courses', 'branch_id');
SELECT create_index_if_column_exists('idx_courses_course_name', 'courses', 'course_name');
SELECT create_index_if_column_exists('idx_courses_course_code', 'courses', 'course_code');
SELECT create_index_if_column_exists('idx_courses_is_active', 'courses', 'is_active');
SELECT create_index_if_two_columns_exist('idx_courses_branch_active', 'courses', 'branch_id', 'is_active');


-- =========================
-- SHIFT TIMINGS
-- =========================
SELECT create_index_if_column_exists('idx_shift_timings_branch_id', 'shift_timings', 'branch_id');
SELECT create_index_if_column_exists('idx_shift_timings_shift_name', 'shift_timings', 'shift_name');
SELECT create_index_if_column_exists('idx_shift_timings_is_active', 'shift_timings', 'is_active');
SELECT create_index_if_column_exists('idx_shift_timings_created_by', 'shift_timings', 'created_by');
SELECT create_index_if_two_columns_exist('idx_shift_timings_branch_active', 'shift_timings', 'branch_id', 'is_active');


-- =========================
-- EMPLOYEES
-- =========================
SELECT create_index_if_column_exists('idx_employees_branch_id', 'employees', 'branch_id');
SELECT create_index_if_column_exists('idx_employees_full_name', 'employees', 'full_name');
SELECT create_index_if_column_exists('idx_employees_phone', 'employees', 'phone');
SELECT create_index_if_column_exists('idx_employees_designation', 'employees', 'designation');
SELECT create_index_if_column_exists('idx_employees_has_login_account', 'employees', 'has_login_account');
SELECT create_index_if_column_exists('idx_employees_is_active', 'employees', 'is_active');
SELECT create_index_if_two_columns_exist('idx_employees_branch_active', 'employees', 'branch_id', 'is_active');


-- =========================
-- PAYMENTS
-- =========================
SELECT create_index_if_column_exists('idx_payments_branch_id', 'payments', 'branch_id');
SELECT create_index_if_column_exists('idx_payments_student_id', 'payments', 'student_id');
SELECT create_index_if_column_exists('idx_payments_payment_method_id', 'payments', 'payment_method_id');
SELECT create_index_if_column_exists('idx_payments_payment_date', 'payments', 'payment_date');
SELECT create_index_if_column_exists('idx_payments_created_by', 'payments', 'created_by');
SELECT create_index_if_two_columns_exist('idx_payments_student_date', 'payments', 'student_id', 'payment_date');
SELECT create_index_if_three_columns_exist('idx_payments_branch_method_date', 'payments', 'branch_id', 'payment_method_id', 'payment_date');


-- =========================
-- PAYMENT METHODS
-- =========================
SELECT create_index_if_column_exists('idx_payment_methods_method_name', 'payment_methods', 'method_name');
SELECT create_index_if_column_exists('idx_payment_methods_is_active', 'payment_methods', 'is_active');


-- =========================
-- EXPENSES
-- =========================
SELECT create_index_if_column_exists('idx_expenses_branch_id', 'expenses', 'branch_id');
SELECT create_index_if_column_exists('idx_expenses_expense_type', 'expenses', 'expense_type');
SELECT create_index_if_column_exists('idx_expenses_expense_date', 'expenses', 'expense_date');
SELECT create_index_if_column_exists('idx_expenses_created_by', 'expenses', 'created_by');
SELECT create_index_if_column_exists('idx_expenses_category_id', 'expenses', 'category_id');
SELECT create_index_if_three_columns_exist('idx_expenses_branch_type_date', 'expenses', 'branch_id', 'expense_type', 'expense_date');


-- =========================
-- EXPENSE CATEGORIES
-- =========================
SELECT create_index_if_column_exists('idx_expense_categories_category_name', 'expense_categories', 'category_name');
SELECT create_index_if_column_exists('idx_expense_categories_is_active', 'expense_categories', 'is_active');


-- =========================
-- DONORS
-- =========================
SELECT create_index_if_column_exists('idx_donors_full_name', 'donors', 'full_name');
SELECT create_index_if_column_exists('idx_donors_phone', 'donors', 'phone');
SELECT create_index_if_column_exists('idx_donors_email', 'donors', 'email');
SELECT create_index_if_column_exists('idx_donors_is_active', 'donors', 'is_active');


-- =========================
-- DONATIONS
-- =========================
SELECT create_index_if_column_exists('idx_donations_donor_id', 'donations', 'donor_id');
SELECT create_index_if_column_exists('idx_donations_donation_method_id', 'donations', 'donation_method_id');
SELECT create_index_if_column_exists('idx_donations_donation_date', 'donations', 'donation_date');
SELECT create_index_if_column_exists('idx_donations_created_by', 'donations', 'created_by');
SELECT create_index_if_two_columns_exist('idx_donations_donor_date', 'donations', 'donor_id', 'donation_date');
SELECT create_index_if_two_columns_exist('idx_donations_method_date', 'donations', 'donation_method_id', 'donation_date');


-- =========================
-- DONATION METHODS
-- =========================
SELECT create_index_if_column_exists('idx_donation_methods_method_name', 'donation_methods', 'method_name');
SELECT create_index_if_column_exists('idx_donation_methods_is_active', 'donation_methods', 'is_active');


-- =========================
-- CHARITIES / BENEFICIARIES
-- =========================
SELECT create_index_if_column_exists('idx_charities_charity_name', 'charities', 'charity_name');
SELECT create_index_if_column_exists('idx_charities_father_name', 'charities', 'father_name');
SELECT create_index_if_column_exists('idx_charities_phone', 'charities', 'phone');
SELECT create_index_if_column_exists('idx_charities_cnic', 'charities', 'cnic');
SELECT create_index_if_column_exists('idx_charities_is_active', 'charities', 'is_active');


-- =========================
-- CHARITY RECORDS
-- =========================
SELECT create_index_if_column_exists('idx_charity_records_charity_id', 'charity_records', 'charity_id');
SELECT create_index_if_column_exists('idx_charity_records_charity_type', 'charity_records', 'charity_type');
SELECT create_index_if_column_exists('idx_charity_records_charity_date', 'charity_records', 'charity_date');
SELECT create_index_if_column_exists('idx_charity_records_created_by', 'charity_records', 'created_by');
SELECT create_index_if_two_columns_exist('idx_charity_records_charity_id_date', 'charity_records', 'charity_id', 'charity_date');
SELECT create_index_if_two_columns_exist('idx_charity_records_type_date', 'charity_records', 'charity_type', 'charity_date');


-- =========================
-- WELFARE APPLICATIONS
-- =========================
SELECT create_index_if_column_exists('idx_welfare_applications_applicant_name', 'welfare_applications', 'applicant_name');
SELECT create_index_if_column_exists('idx_welfare_applications_father_name', 'welfare_applications', 'father_name');
SELECT create_index_if_column_exists('idx_welfare_applications_phone', 'welfare_applications', 'phone');
SELECT create_index_if_column_exists('idx_welfare_applications_cnic', 'welfare_applications', 'cnic');
SELECT create_index_if_column_exists('idx_welfare_applications_case_status', 'welfare_applications', 'case_status');
SELECT create_index_if_column_exists('idx_welfare_applications_support_type', 'welfare_applications', 'support_type');
SELECT create_index_if_column_exists('idx_welfare_applications_created_by', 'welfare_applications', 'created_by');
SELECT create_index_if_two_columns_exist('idx_welfare_applications_status_support', 'welfare_applications', 'case_status', 'support_type');


-- =========================
-- WELFARE IMPACT RECORDS
-- =========================
SELECT create_index_if_column_exists('idx_welfare_impact_records_created_by', 'welfare_impact_records', 'created_by');
SELECT create_index_if_column_exists('idx_welfare_impact_records_created_at', 'welfare_impact_records', 'created_at');


-- =========================
-- CERTIFICATES
-- Note: branch_id skipped automatically if not exists
-- =========================
SELECT create_index_if_column_exists('idx_certificates_branch_id', 'certificates', 'branch_id');
SELECT create_index_if_column_exists('idx_certificates_student_id', 'certificates', 'student_id');
SELECT create_index_if_column_exists('idx_certificates_certificate_no', 'certificates', 'certificate_no');
SELECT create_index_if_column_exists('idx_certificates_student_name', 'certificates', 'student_name');
SELECT create_index_if_column_exists('idx_certificates_course_name', 'certificates', 'course_name');
SELECT create_index_if_column_exists('idx_certificates_issue_date', 'certificates', 'issue_date');
SELECT create_index_if_column_exists('idx_certificates_generated_by', 'certificates', 'generated_by');


-- =========================
-- ROLES / PERMISSIONS
-- =========================
SELECT create_index_if_column_exists('idx_roles_name', 'roles', 'name');
SELECT create_index_if_column_exists('idx_permissions_name', 'permissions', 'name');

SELECT create_index_if_column_exists('idx_role_permissions_role_id', 'role_permissions', 'role_id');
SELECT create_index_if_column_exists('idx_role_permissions_permission_id', 'role_permissions', 'permission_id');

SELECT create_index_if_column_exists('idx_user_permissions_user_id', 'user_permissions', 'user_id');
SELECT create_index_if_column_exists('idx_user_permissions_permission_id', 'user_permissions', 'permission_id');

SELECT create_index_if_column_exists('idx_user_branches_user_id', 'user_branches', 'user_id');
SELECT create_index_if_column_exists('idx_user_branches_branch_id', 'user_branches', 'branch_id');


-- =========================
-- AUDIT / API / REPORT LOGS
-- =========================
SELECT create_index_if_column_exists('idx_audit_logs_user_id', 'audit_logs', 'user_id');
SELECT create_index_if_column_exists('idx_audit_logs_module_name', 'audit_logs', 'module_name');
SELECT create_index_if_column_exists('idx_audit_logs_created_at', 'audit_logs', 'created_at');

SELECT create_index_if_column_exists('idx_api_logs_user_id', 'api_logs', 'user_id');
SELECT create_index_if_column_exists('idx_api_logs_method', 'api_logs', 'method');
SELECT create_index_if_column_exists('idx_api_logs_endpoint', 'api_logs', 'endpoint');
SELECT create_index_if_column_exists('idx_api_logs_created_at', 'api_logs', 'created_at');

SELECT create_index_if_column_exists('idx_report_exports_generated_by', 'report_exports', 'generated_by');
SELECT create_index_if_column_exists('idx_report_exports_report_type', 'report_exports', 'report_type');
SELECT create_index_if_column_exists('idx_report_exports_created_at', 'report_exports', 'created_at');


-- =========================
-- UPDATE QUERY PLANNER STATS
-- =========================
ANALYZE;


-- =========================
-- OPTIONAL: remove helper functions after use
-- =========================
DROP FUNCTION IF EXISTS create_index_if_column_exists(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_index_if_two_columns_exist(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_index_if_three_columns_exist(TEXT, TEXT, TEXT, TEXT, TEXT);
-- //
