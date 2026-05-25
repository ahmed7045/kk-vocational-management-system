-- INSERT INTO roles (name, description)
-- VALUES 
-- ('super_admin', 'Full system access'),
-- ('branch_admin', 'Branch specific admin access'),
-- ('welfare_staff', 'Welfare module access'),
-- ('employee', 'Limited employee access')
-- ON CONFLICT (name) DO NOTHING;


-- INSERT INTO permissions (name, description)
-- VALUES
-- ('dashboard.view', 'Can view dashboard'),

-- ('branches.view', 'Can view branches'),
-- ('branches.create', 'Can create branches'),
-- ('branches.update', 'Can update branches'),
-- ('branches.delete', 'Can delete branches'),

-- ('students.view', 'Can view students'),
-- ('students.create', 'Can create students'),
-- ('students.update', 'Can update students'),
-- ('students.delete', 'Can delete students'),
-- ('students.export', 'Can export students'),

-- ('employees.view', 'Can view employees'),
-- ('employees.create', 'Can create employees'),
-- ('employees.update', 'Can update employees'),
-- ('employees.delete', 'Can delete employees'),
-- ('employees.create_account', 'Can create employee login account'),

-- ('courses.view', 'Can view courses'),
-- ('courses.create', 'Can create courses'),
-- ('courses.update', 'Can update courses'),
-- ('courses.delete', 'Can delete courses'),

-- ('payments.view', 'Can view payments'),
-- ('payments.create', 'Can create payments'),
-- ('payments.update', 'Can update payments'),

-- ('expenses.view', 'Can view expenses'),
-- ('expenses.create', 'Can create expenses'),
-- ('expenses.update', 'Can update expenses'),
-- ('expenses.delete', 'Can delete expenses'),

-- ('reports.view', 'Can view reports'),
-- ('reports.export_pdf', 'Can export PDF reports'),
-- ('reports.export_excel', 'Can export Excel reports'),

-- ('certificates.view', 'Can view certificates'),
-- ('certificates.generate', 'Can generate certificates'),

-- ('welfare.view', 'Can view welfare module'),
-- ('welfare.charity.create', 'Can create charity'),
-- ('welfare.donation.create', 'Can create donation'),
-- ('welfare.application.create', 'Can create welfare application'),
-- ('welfare.application.approve', 'Can approve welfare application'),
-- ('welfare.expense.view', 'Can view welfare expenses'),
-- ('welfare.report.view', 'Can view welfare reports'),

-- ('amounts.view', 'Can view financial amounts')
-- ON CONFLICT (name) DO NOTHING;


-- INSERT INTO role_permissions (role_id, permission_id)
-- SELECT r.id, p.id
-- FROM roles r
-- CROSS JOIN permissions p
-- WHERE r.name = 'super_admin'
-- ON CONFLICT (role_id, permission_id) DO NOTHING;


-- INSERT INTO branches (name, location, status)
-- VALUES
-- ('Branch 1', 'Main Campus', 'active'),
-- ('Branch 2', 'Second Campus', 'active'),
-- ('Branch 3', 'Third Campus', 'active'),
-- ('Branch 4', 'Fourth Campus', 'maintenance')
-- ON CONFLICT DO NOTHING;

-- INSERT INTO users (full_name, email, password_hash, role_id, branch_id, is_active)
-- VALUES (
--     'Admin User',
--     'admin@kkcenter.edu',
--     '$2b$10$aCLgJvyeVa4oOEbggcs4/uFqAX1pgn68WxNUWtF1IgxdV55ZjFGCu',
--     (SELECT id FROM roles WHERE name = 'super_admin'),
--     NULL,
--     TRUE
-- )
-- ON CONFLICT (email) DO NOTHING;

-- INSERT INTO permissions (name, description)
-- VALUES
-- ('courses.view', 'Can view courses'),
-- ('courses.create', 'Can create courses'),
-- ('courses.update', 'Can update courses'),
-- ('courses.delete', 'Can delete courses'),

-- ('shifts.view', 'Can view shift timings'),
-- ('shifts.create', 'Can create shift timings'),
-- ('shifts.update', 'Can update shift timings'),
-- ('shifts.delete', 'Can delete shift timings')
-- ON CONFLICT (name) DO NOTHING;

-- INSERT INTO permissions (name, description)
-- VALUES
-- ('students.view', 'Can view students'),
-- ('students.create', 'Can create students'),
-- ('students.update', 'Can update students'),
-- ('students.delete', 'Can delete students'),
-- ('students.export', 'Can export students'),
-- ('students.view_paid', 'Can view paid students'),
-- ('students.view_pending', 'Can view pending students'),
-- ('students.view_non_active', 'Can view non-active students')
-- ON CONFLICT (name) DO NOTHING;

-- INSERT INTO permissions (name, description)
-- VALUES
-- ('payments.view', 'Can view payments'),
-- ('payments.create', 'Can create payments'),
-- ('payments.update', 'Can update payments'),
-- ('payment_methods.view', 'Can view payment methods'),
-- ('payment_methods.create', 'Can create payment methods')
-- ON CONFLICT (name) DO NOTHING;

-- INSERT INTO permissions (name, description)
-- VALUES
-- ('expenses.view', 'Can view expenses'),
-- ('expenses.create', 'Can create expenses'),
-- ('expenses.update', 'Can update expenses'),
-- ('expenses.delete', 'Can delete expenses'),
-- ('expense_categories.view', 'Can view expense categories'),
-- ('expense_categories.create', 'Can create expense categories')
-- ON CONFLICT (name) DO NOTHING;

-- INSERT INTO permissions (name, description)
-- VALUES
-- ('dashboard.view', 'Can view dashboard'),
-- ('dashboard.analytics.view', 'Can view dashboard analytics')
-- ON CONFLICT (name) DO NOTHING;

-- INSERT INTO permissions (name, description)
-- VALUES
-- ('welfare.view', 'Can view welfare module'),

-- ('welfare.donor.view', 'Can view donors'),
-- ('welfare.donor.create', 'Can create donors'),
-- ('welfare.donor.update', 'Can update donors'),

-- ('welfare.charity.view', 'Can view charities'),
-- ('welfare.charity.create', 'Can create charities'),
-- ('welfare.charity.update', 'Can update charities'),

-- ('welfare.donation.view', 'Can view donations'),
-- ('welfare.donation.create', 'Can create donations'),

-- ('welfare.application.view', 'Can view welfare applications'),
-- ('welfare.application.create', 'Can create welfare applications'),
-- ('welfare.application.update', 'Can update welfare applications'),
-- ('welfare.application.approve', 'Can approve welfare applications'),

-- ('welfare.expense.view', 'Can view welfare expenses'),
-- ('welfare.expense.create', 'Can create welfare expenses'),

-- ('welfare.report.view', 'Can view welfare reports'),
-- ('welfare.dashboard.view', 'Can view welfare dashboard'),

-- ('donation_methods.view', 'Can view donation methods'),
-- ('donation_methods.create', 'Can create donation methods')
-- ON CONFLICT (name) DO NOTHING;

-- INSERT INTO donation_methods (method_name)
-- VALUES
-- ('Cash'),
-- ('Bank Transfer'),
-- ('EasyPaisa'),
-- ('JazzCash'),
-- ('Cheque')
-- ON CONFLICT (method_name) DO NOTHING;

-- INSERT INTO permissions (name, description)
-- VALUES
-- ('certificates.view', 'Can view certificates'),
-- ('certificates.generate', 'Can generate certificates'),
-- ('certificates.download', 'Can download certificates'),

-- ('reports.view', 'Can view reports'),
-- ('reports.students.view', 'Can view student reports'),
-- ('reports.financial.view', 'Can view financial reports'),
-- ('reports.welfare.view', 'Can view welfare reports'),
-- ('reports.export_pdf', 'Can export PDF reports'),
-- ('reports.export_excel', 'Can export Excel reports')
-- ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- SEED DATA
-- KK Vocational Training Center & Welfare Management System
-- =====================================================


-- =====================================================
-- 1. ROLES
-- =====================================================

INSERT INTO roles (name, description)
VALUES 
('super_admin', 'Full system access'),
('branch_admin', 'Branch specific admin access'),
('welfare_staff', 'Welfare module access'),
('employee', 'Limited employee access')
ON CONFLICT (name) DO NOTHING;


-- =====================================================
-- 2. PERMISSIONS
-- =====================================================

INSERT INTO permissions (name, description)
VALUES

-- Dashboard
('dashboard.view', 'Can view dashboard'),
('dashboard.analytics.view', 'Can view dashboard analytics'),

-- Branches
('branches.view', 'Can view branches'),
('branches.create', 'Can create branches'),
('branches.update', 'Can update branches'),
('branches.delete', 'Can delete branches'),

-- Students
('students.view', 'Can view students'),
('students.create', 'Can create students'),
('students.update', 'Can update students'),
('students.delete', 'Can delete students'),
('students.export', 'Can export students'),
('students.view_paid', 'Can view paid students'),
('students.view_pending', 'Can view pending students'),
('students.view_non_active', 'Can view non-active students'),

-- Employees
('employees.view', 'Can view employees'),
('employees.create', 'Can create employees'),
('employees.update', 'Can update employees'),
('employees.delete', 'Can delete employees'),
('employees.create_account', 'Can create employee login account'),

-- Courses
('courses.view', 'Can view courses'),
('courses.create', 'Can create courses'),
('courses.update', 'Can update courses'),
('courses.delete', 'Can delete courses'),

-- Shifts
('shifts.view', 'Can view shift timings'),
('shifts.create', 'Can create shift timings'),
('shifts.update', 'Can update shift timings'),
('shifts.delete', 'Can delete shift timings'),

-- Payments
('payments.view', 'Can view payments'),
('payments.create', 'Can create payments'),
('payments.update', 'Can update payments'),

-- Payment Methods
('payment_methods.view', 'Can view payment methods'),
('payment_methods.create', 'Can create payment methods'),

-- Expenses
('expenses.view', 'Can view expenses'),
('expenses.create', 'Can create expenses'),
('expenses.update', 'Can update expenses'),
('expenses.delete', 'Can delete expenses'),

-- Expense Categories
('expense_categories.view', 'Can view expense categories'),
('expense_categories.create', 'Can create expense categories'),

-- Reports
('reports.view', 'Can view reports'),
('reports.students.view', 'Can view student reports'),
('reports.financial.view', 'Can view financial reports'),
('reports.welfare.view', 'Can view welfare reports'),
('reports.export_pdf', 'Can export PDF reports'),
('reports.export_excel', 'Can export Excel reports'),

-- Certificates
('certificates.view', 'Can view certificates'),
('certificates.generate', 'Can generate certificates'),
('certificates.download', 'Can download certificates'),

-- Welfare General
('welfare.view', 'Can view welfare module'),
('welfare.dashboard.view', 'Can view welfare dashboard'),

-- Welfare Donors
('welfare.donor.view', 'Can view donors'),
('welfare.donor.create', 'Can create donors'),
('welfare.donor.update', 'Can update donors'),
('welfare.donor.delete', 'Can delete donors'),

-- Welfare Charities
('welfare.charity.view', 'Can view charities'),
('welfare.charity.create', 'Can create charities'),
('welfare.charity.update', 'Can update charities'),
('welfare.charity.delete', 'Can delete charities'),

-- Welfare Donations
('welfare.donation.view', 'Can view donations'),
('welfare.donation.create', 'Can create donations'),
('welfare.donation.delete', 'Can delete donations'),

-- Welfare Applications / Cases
('welfare.application.view', 'Can view welfare applications'),
('welfare.application.create', 'Can create welfare applications'),
('welfare.application.update', 'Can update welfare applications'),
('welfare.application.delete', 'Can delete welfare applications'),
('welfare.application.approve', 'Can approve welfare applications'),

-- Welfare Expenses / Reports
('welfare.expense.view', 'Can view welfare expenses'),
('welfare.expense.create', 'Can create welfare expenses'),
('welfare.report.view', 'Can view welfare reports'),

-- Donation Methods
('donation_methods.view', 'Can view donation methods'),
('donation_methods.create', 'Can create donation methods'),

-- Financial Amount Visibility
('amounts.view', 'Can view financial amounts')

ON CONFLICT (name) DO NOTHING;


-- =====================================================
-- 3. DEFAULT BRANCHES
-- Note: Best if branches.name is UNIQUE in schema.sql
-- =====================================================
-- =====================================================
-- 3. DEFAULT BRANCHES
-- =====================================================

INSERT INTO branches (id, name, location, status)
VALUES
(1, 'Silai Centre', 'Ismail Kalhora Campus 1', 'active'),
(2, 'Mobile Repairing Centre', 'Dawood BD Campus 2', 'active'),
(3, 'Beautician Centre', 'Haji Bhudda Ganga Campus 3', 'active'),
(4, 'IT Centre', 'Haji Ali Muhammad Campus 4', 'active'),
(5, 'Silai Centre', 'Haji Abdullah Lota Campus 5 Baldia', 'active')
ON CONFLICT (id) DO UPDATE
SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  status = EXCLUDED.status;

SELECT setval(
  pg_get_serial_sequence('branches', 'id'),
  (SELECT MAX(id) FROM branches)
);


-- =====================================================
-- 4. DEFAULT PAYMENT METHODS
-- =====================================================

INSERT INTO payment_methods (method_name)
VALUES
('Cash'),
('Bank Transfer'),
('EasyPaisa'),
('JazzCash'),
('Cheque')
ON CONFLICT (method_name) DO NOTHING;


-- =====================================================
-- 5. DEFAULT EXPENSE CATEGORIES
-- =====================================================

INSERT INTO expense_categories (category_name)
VALUES
('Rent'),
('Salary'),
('Electricity Bill'),
('Internet Bill'),
('Maintenance'),
('Stationery'),
('Equipment'),
('Other')
ON CONFLICT (category_name) DO NOTHING;


-- =====================================================
-- 6. DEFAULT DONATION METHODS
-- =====================================================

INSERT INTO donation_methods (method_name)
VALUES
('Cash'),
('Bank Transfer'),
('EasyPaisa'),
('JazzCash'),
('Cheque')
ON CONFLICT (method_name) DO NOTHING;


-- =====================================================
-- 7. DEFAULT SUPER ADMIN USER
-- Email: admin@kkcenter.edu
-- Password: Admin@123
-- =====================================================

INSERT INTO users (full_name, email, password_hash, role_id, branch_id, is_active)
VALUES (
    'Admin User',
    'admin@kkcenter.edu',
    '$2b$10$aCLgJvyeVa4oOEbggcs4/uFqAX1pgn68WxNUWtF1IgxdV55ZjFGCu',
    (SELECT id FROM roles WHERE name = 'super_admin'),
    NULL,
    TRUE
)
ON CONFLICT (email) DO NOTHING;


-- =====================================================
-- 8. GIVE SUPER ADMIN ALL PERMISSIONS
-- IMPORTANT: Keep this block at the END.
-- =====================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;