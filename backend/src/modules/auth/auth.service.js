const bcrypt = require("bcrypt");
const crypto = require("crypto");
const pool = require("../../config/db");
const ApiError = require("../../utils/ApiError");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require("../../utils/jwt");

const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const getUserPermissions = async (userId, roleId) => {
  const result = await pool.query(
    `
    SELECT DISTINCT p.name
    FROM permissions p
    LEFT JOIN role_permissions rp ON rp.permission_id = p.id AND rp.role_id = $1
    LEFT JOIN user_permissions up ON up.permission_id = p.id AND up.user_id = $2
    WHERE rp.permission_id IS NOT NULL OR up.permission_id IS NOT NULL
    ORDER BY p.name
    `,
    [roleId, userId]
  );

  return result.rows.map((row) => row.name);
};

const loginUser = async ({ email, password, deviceInfo, ipAddress }) => {
  const userResult = await pool.query(
    `
    SELECT 
      u.id,
      u.full_name,
      u.email,
      u.password_hash,
      u.role_id,
u.branch_id,
u.portal_access,
b.name AS branch_name,
u.is_active,
r.name AS role_name
FROM users u
JOIN roles r ON r.id = u.role_id
LEFT JOIN branches b ON b.id = u.branch_id
WHERE u.email = $1
    `,
    [email]
  );

  const user = userResult.rows[0];

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.is_active) {
    throw new ApiError(403, "Your account is inactive");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const permissions = await getUserPermissions(user.id, user.role_id);

  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role_name,
    roleId: user.role_id,
    branchId: user.branch_id,
    branchName: user.branch_name,
    portalAccess: user.portal_access,
    permissions,
  };

  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken({
    id: user.id,
    email: user.email,
  });

  const refreshTokenHash = hashToken(refreshToken);

  await pool.query(
    `
    INSERT INTO refresh_tokens
    (user_id, token_hash, device_info, ip_address, expires_at)
    VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')
    `,
    [user.id, refreshTokenHash, deviceInfo || null, ipAddress || null]
  );

return {
  user: {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    role: user.role_name,
    branchId: user.branch_id,
    branchName: user.branch_name,
    portalAccess: user.portal_access,
    permissions,
  },
  accessToken,
  refreshToken,
};
};

const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new ApiError(401, "Refresh token missing");
  }

  const decoded = verifyRefreshToken(refreshToken);
  const tokenHash = hashToken(refreshToken);

  const tokenResult = await pool.query(
    `
    SELECT *
    FROM refresh_tokens
    WHERE user_id = $1
    AND token_hash = $2
    AND revoked = FALSE
    AND expires_at > NOW()
    `,
    [decoded.id, tokenHash]
  );

  if (tokenResult.rows.length === 0) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const userResult = await pool.query(
    `
    SELECT 
      u.id,
      u.full_name,
      u.email,
      u.role_id,
      u.branch_id,
      u.is_active,
      r.name AS role_name
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.id = $1
    `,
    [decoded.id]
  );

  const user = userResult.rows[0];

  if (!user || !user.is_active) {
    throw new ApiError(401, "Invalid user");
  }

  const permissions = await getUserPermissions(user.id, user.role_id);

  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role_name,
    roleId: user.role_id,
    branchId: user.branch_id,
    permissions,
  });

  return { accessToken };
};

const logoutUser = async (refreshToken) => {
  if (!refreshToken) return;

  const tokenHash = hashToken(refreshToken);

  await pool.query(
    `
    UPDATE refresh_tokens
    SET revoked = TRUE
    WHERE token_hash = $1
    `,
    [tokenHash]
  );
};

const getMe = async (userId) => {
  const result = await pool.query(
    `
    SELECT 
      u.id,
      u.full_name,
      u.email,
      u.branch_id,
      r.name AS role_name
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.id = $1
    `,
    [userId]
  );

  return result.rows[0];
};

module.exports = {
  loginUser,
  refreshAccessToken,
  logoutUser,
  getMe,
  getUserPermissions,
};