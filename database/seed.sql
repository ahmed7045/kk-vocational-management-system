INSERT INTO roles (name, description)
VALUES 
('super_admin', 'Full system access'),
('branch_admin', 'Branch specific admin access'),
('welfare_staff', 'Welfare module access'),
('employee', 'Limited employee access')
ON CONFLICT (name) DO NOTHING;


INSERT INTO permissions (name, description)
VALUES
('dashboard.view', 'Can view dashboard'),

('branches.view', 'Can view branches'),
('branches.create', 'Can create branches'),
('branches.update', 'Can update branches'),
('branches.delete', 'Can delete branches'),

('students.view', 'Can view students'),
('students.create', 'Can create students'),
('students.update', 'Can update students'),
('students.delete', 'Can delete students'),
('students.export', 'Can export students'),

('employees.view', 'Can view employees'),
('employees.create', 'Can create employees'),
('employees.update', 'Can update employees'),
('employees.delete', 'Can delete employees'),
('employees.create_account', 'Can create employee login account'),

('courses.view', 'Can view courses'),
('courses.create', 'Can create courses'),
('courses.update', 'Can update courses'),
('courses.delete', 'Can delete courses'),

('payments.view', 'Can view payments'),
('payments.create', 'Can create payments'),
('payments.update', 'Can update payments'),

('expenses.view', 'Can view expenses'),
('expenses.create', 'Can create expenses'),
('expenses.update', 'Can update expenses'),
('expenses.delete', 'Can delete expenses'),

('reports.view', 'Can view reports'),
('reports.export_pdf', 'Can export PDF reports'),
('reports.export_excel', 'Can export Excel reports'),

('certificates.view', 'Can view certificates'),
('certificates.generate', 'Can generate certificates'),

('welfare.view', 'Can view welfare module'),
('welfare.charity.create', 'Can create charity'),
('welfare.donation.create', 'Can create donation'),
('welfare.application.create', 'Can create welfare application'),
('welfare.application.approve', 'Can approve welfare application'),
('welfare.expense.view', 'Can view welfare expenses'),
('welfare.report.view', 'Can view welfare reports'),

('amounts.view', 'Can view financial amounts')
ON CONFLICT (name) DO NOTHING;


INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin'
ON CONFLICT (role_id, permission_id) DO NOTHING;


INSERT INTO branches (name, location, status)
VALUES
('Branch 1', 'Main Campus', 'active'),
('Branch 2', 'Second Campus', 'active'),
('Branch 3', 'Third Campus', 'active'),
('Branch 4', 'Fourth Campus', 'maintenance')
ON CONFLICT DO NOTHING;

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