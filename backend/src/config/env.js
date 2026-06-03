require("dotenv").config();

// const env = {
//   port: process.env.PORT || 5000,
//   nodeEnv: process.env.NODE_ENV || "development",
//   clientUrl: process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5173",
//   jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
//   jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
// };

const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5173",
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "24h",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
};

module.exports = env;