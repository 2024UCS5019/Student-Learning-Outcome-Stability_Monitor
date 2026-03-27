const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const securityHeaders = require("./middleware/securityHeaders");
const sanitizeRequest = require("./middleware/sanitizeRequest");
const createRateLimiter = require("./middleware/rateLimiter");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const markRoutes = require("./routes/markRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const stabilityRoutes = require("./routes/stabilityRoutes");
const reportRoutes = require("./routes/reportRoutes");
const noteHistoryRoutes = require("./routes/noteHistoryRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", 1);

const expandLocalOrigins = (origins) => {
  const expanded = new Set(origins);
  for (const origin of origins) {
    if (origin.includes("localhost")) expanded.add(origin.replace("localhost", "127.0.0.1"));
    if (origin.includes("127.0.0.1")) expanded.add(origin.replace("127.0.0.1", "localhost"));
  }
  return [...expanded];
};

const allowedOrigins = expandLocalOrigins(
  (process.env.CLIENT_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);

app.use(securityHeaders);
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: false, limit: "10kb" }));
app.use(sanitizeRequest);
app.use(createRateLimiter({ windowMs: 15 * 60 * 1000, max: 500, message: "Too many API requests" }));

app.get("/", (req, res) => res.send("Student Outcome Monitor API Running"));

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/marks", markRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/stability", stabilityRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notes", noteHistoryRoutes);
app.use("/api/note-history", noteHistoryRoutes);

// Serve built frontend in production (avoids serving raw /src/*.jsx which triggers MIME errors in browsers).
// Build the client with: `cd client && npm run build` (outputs `client/dist`).
if (process.env.SERVE_CLIENT === "true" || process.env.NODE_ENV === "production") {
  const distDir = process.env.CLIENT_DIST_DIR
    ? path.resolve(process.env.CLIENT_DIST_DIR)
    : path.join(__dirname, "..", "client", "dist");

  if (fs.existsSync(path.join(distDir, "index.html"))) {
    app.use(express.static(distDir));

    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) return next();
      return res.sendFile(path.join(distDir, "index.html"));
    });
  } else {
    console.warn(`Client dist not found at ${distDir}. Skipping static frontend serving.`);
  }
}

app.use(errorHandler);

module.exports = app;
