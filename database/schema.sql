
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

-- // INDEXING BLOCK
CREATE INDEX IF NOT EXISTS idx_students_branch_id ON students(branch_id);
CREATE INDEX IF NOT EXISTS idx_students_fee_status ON students(fee_status);
CREATE INDEX IF NOT EXISTS idx_payments_branch_id ON payments(branch_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_expenses_branch_id ON expenses(branch_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);

-- //