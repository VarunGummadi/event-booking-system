
const express = require("express");
const { connectMongoDB } = require("./config/dbconfig");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const setupSwagger = require("./config/swagger");
const client = require("prom-client");

require("dotenv").config();

const app = express();

// Prometheus Monitoring Configuration
const register = new client.Registry();

client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

// Connect to MongoDB
connectMongoDB();

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

// Monitor HTTP requests
app.use((req, res, next) => {
  if (req.path === "/metrics") {
    return next();
  }

  const startTime = process.hrtime();

  res.on("finish", () => {
    const duration = process.hrtime(startTime);
    const durationSeconds = duration[0] + duration[1] / 1e9;

    const route = req.route
      ? `${req.baseUrl}${req.route.path}`
      : "unmatched";

    const labels = {
      method: req.method,
      route,
      status_code: String(res.statusCode),
    };

    httpRequestsTotal.inc(labels);
    httpRequestDuration.observe(labels, durationSeconds);
  });

  next();
});

// Serve uploaded media files
app.use(
  "/assets/media",
  express.static(path.join(__dirname, "assets/media"))
);

// Health Check
app.get("/", (req, res) => {
  res.json({
    message: "Event Booking System API is running",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
    documentation: "/api-docs",
  });
});

// API Routes
app.use("/api/users", require("./routes/userRoute"));
app.use("/api/events", require("./routes/eventRoute"));
app.use("/api/bookings", require("./routes/bookingRoute"));
app.use("/api/reports", require("./routes/reportRoute"));

// Swagger Documentation
setupSwagger(app);

// Prometheus Metrics Endpoint
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error.message);
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    message: "Route not found",
    availableRoutes: [
      "/api/users",
      "/api/events",
      "/api/bookings",
      "/api/reports",
      "/api-docs",
    ],
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development"
      ? err.message
      : undefined,
  });
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  console.log(`API Documentation: http://localhost:${port}/api-docs`);
});
