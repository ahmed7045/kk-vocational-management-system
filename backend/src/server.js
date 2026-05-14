const app = require("./app");
const env = require("./config/env");
const pool = require("./config/db");

const startServer = async () => {
  try {
    await pool.query("SELECT NOW()");
    console.log("Database test query successful");

    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();