const Student = require("../models/Student");
const Mark = require("../models/Mark");
const Attendance = require("../models/Attendance");
const Stability = require("../models/Stability");
const asyncHandler = require("../utils/asyncHandler");

exports.createStudent = asyncHandler(async (req, res) => {
  const student = await Student.create(req.body);
  const io = req.app.get("io");
  if (io) io.emit("students:updated");
  res.status(201).json(student);
});

exports.getStudents = asyncHandler(async (req, res) => {
  const { search, department, year } = req.query;
  const query = {};
  if (search) query.name = { $regex: search, $options: "i" };
  if (department) query.department = department;
  if (year) query.year = Number(year);
  const students = await Student.find(query);
  res.json(students);
});

exports.getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found" });
  res.json(student);
});

exports.getStudentDashboard = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found" });

  const marks = await Mark.find({ studentId: req.params.id }).populate("subjectId");
  const attendance = await Attendance.find({ studentId: req.params.id }).populate("subjectId");
  const stability = await Stability.findOne({ studentId: req.params.id });

  const averageScore = marks.length > 0 ? marks.reduce((sum, m) => sum + m.marks, 0) / marks.length : 0;
  const overallAttendance = attendance.length > 0 ? attendance.reduce((sum, a) => sum + a.percentage, 0) / attendance.length : 0;

  const subjectMarksMap = {};
  marks.forEach(m => {
    const subName = m.subjectId?.subjectName || "Unknown";
    if (!subjectMarksMap[subName]) subjectMarksMap[subName] = [];
    subjectMarksMap[subName].push(m.marks);
  });

  const subjectMarks = Object.keys(subjectMarksMap).map(subject => ({
    subject,
    average: (subjectMarksMap[subject].reduce((a, b) => a + b, 0) / subjectMarksMap[subject].length).toFixed(1)
  }));

  const subjectAttendance = attendance.map(a => ({
    subject: a.subjectId?.subjectName || "Unknown",
    percentage: a.percentage
  }));

  const performanceTrend = marks.map((m, idx) => ({
    test: m.testName || `Test ${idx + 1}`,
    marks: m.marks
  }));

  let riskLevel = "Low";
  if (averageScore < 50 || overallAttendance < 75) riskLevel = "High";
  else if (averageScore < 70 || overallAttendance < 85) riskLevel = "Medium";

  const stabilityStatus = stability?.status || "Stable";

  res.json({
    student,
    averageScore,
    overallAttendance,
    stability: stabilityStatus,
    riskLevel,
    subjectMarks,
    subjectAttendance,
    performanceTrend
  });
});

exports.updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!student) return res.status(404).json({ message: "Student not found" });
  const io = req.app.get("io");
  if (io) io.emit("students:updated");
  res.json(student);
});

exports.deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndDelete(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found" });
  const io = req.app.get("io");
  if (io) io.emit("students:updated");
  res.json({ message: "Student deleted" });
});
