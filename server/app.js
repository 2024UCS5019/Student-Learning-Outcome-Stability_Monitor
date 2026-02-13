const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const subjectRoutes = require("./routes/subjectRoutes");
const markRoutes = require("./routes/markRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const stabilityRoutes = require("./routes/stabilityRoutes");
const reportRoutes = require("./routes/reportRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

connectDB();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("Student Outcome Monitor API Running"));

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/subjects", subjectRoutes);
app.use("/api/marks", markRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/stability", stabilityRoutes);
app.use("/api/reports", reportRoutes);

app.use(errorHandler);

module.exports = app;
