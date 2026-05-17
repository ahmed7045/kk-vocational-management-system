const expenseRoutes = require("./modules/expenses/expense.routes");
const paymentRoutes = require("./modules/payments/payment.routes");
const studentRoutes = require("./modules/students/student.routes");
const shiftRoutes = require("./modules/shifts/shift.routes");
const courseRoutes = require("./modules/courses/course.routes");
const branchRoutes = require("./modules/branches/branch.routes");
const employeeRoutes = require("./modules/employees/employee.routes");
const portalRoutes = require("./modules/portal/portal.routes");
const authRoutes = require("./modules/auth/auth.routes");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");

const env = require("./config/env");
const apiLogger = require("./middleware/logger.middleware");
const errorMiddleware = require("./middleware/error.middleware");

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);

app.use(helmet());
app.use(cookieParser());
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.use(limiter);

// Custom API logger for every API hit
app.use(apiLogger);
app.use("/api/auth", authRoutes);
app.use("/api/portal", portalRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/expenses", expenseRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "KK Vocational Backend API is running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server health is good",
    timestamp: new Date(),
  });
});

app.use(errorMiddleware);

module.exports = app;