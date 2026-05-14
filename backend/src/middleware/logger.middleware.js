const pool = require("../config/db");

const apiLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", async () => {
    try {
      const responseTime = Date.now() - start;

      await pool.query(
        `INSERT INTO api_logs 
        (user_id, method, endpoint, status_code, ip_address, user_agent, response_time_ms)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          req.user?.id || null,
          req.method,
          req.originalUrl,
          res.statusCode,
          req.ip,
          req.headers["user-agent"] || null,
          responseTime,
        ]
      );
    } catch (error) {
      console.error("API logger error:", error.message);
    }
  });

  next();
};

module.exports = apiLogger;