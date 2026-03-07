const Student = require("../models/Student");
const User = require("../models/User");
const Mark = require("../models/Mark");
const Attendance = require("../models/Attendance");
const Stability = require("../models/Stability");
const asyncHandler = require("../utils/asyncHandler");
const { isStrongPassword, PASSWORD_POLICY_MESSAGE } = require("../utils/passwordPolicy");

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const toEmailSlug = (value = "") => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const buildUniqueInternalEmail = async (username) => {
  const baseSlug = toEmailSlug(username) || "student";
  let candidate = `${baseSlug}@local.som`;
  let suffix = 1;

  while (await User.findOne({ email: candidate })) {
    candidate = `${baseSlug}${suffix}@local.som`;
    suffix += 1;
  }

  return candidate;
};

const findStudentUserForProfile = async (student) => {
  const studentEmail = String(student?.email || "").toLowerCase().trim();
  if (studentEmail) {
    const userByEmail = await User.findOne({ email: studentEmail, role: "Student" });
    if (userByEmail) return userByEmail;
  }

  const studentName = String(student?.name || "").trim();
  if (!studentName) return null;
  return User.findOne({ name: new RegExp(`^${escapeRegex(studentName)}$`, "i"), role: "Student" });
};

const buildStudentDashboard = async (studentId) => {
  const marks = await Mark.find({ studentId }).populate("subjectId");
  const attendance = await Attendance.find({ studentId }).populate("subjectId");
  const stability = await Stability.findOne({ studentId });

  const averageScore = marks.length > 0 ? marks.reduce((sum, m) => sum + m.marks, 0) / marks.length : 0;
  const overallAttendance = attendance.length > 0 ? attendance.reduce((sum, a) => sum + a.percentage, 0) / attendance.length : 0;

  const subjectMarksMap = {};
  marks.forEach((m) => {
    const subName = m.subjectId?.subjectName || "Unknown";
    if (!subjectMarksMap[subName]) subjectMarksMap[subName] = [];
    subjectMarksMap[subName].push(m.marks);
  });

  const subjectMarks = Object.keys(subjectMarksMap).map((subject) => ({
    subject,
    average: Number((subjectMarksMap[subject].reduce((a, b) => a + b, 0) / subjectMarksMap[subject].length).toFixed(1))
  }));

  const subjectAttendance = attendance.map((a) => ({
    subject: a.subjectId?.subjectName || "Unknown",
    percentage: a.percentage
  }));

  const performanceTrend = marks.map((m, idx) => ({
    test: m.testName || `Test ${idx + 1}`,
    marks: m.marks,
    subject: m.subjectId?.subjectName || "Unknown"
  }));

  let riskLevel = "Low";
  if (averageScore < 50 || overallAttendance < 75) riskLevel = "High";
  else if (averageScore < 70 || overallAttendance < 85) riskLevel = "Medium";

  return {
    averageScore,
    overallAttendance,
    stability: stability?.status || "Stable",
    riskLevel,
    subjectMarks,
    subjectAttendance,
    performanceTrend
  };
};

exports.createStudent = asyncHandler(async (req, res) => {
  const { password, ...studentPayload } = req.body;
  const normalizedStudentEmail = String(studentPayload.email || "").toLowerCase().trim();
  const accountUsername = (normalizedStudentEmail || String(studentPayload.name || "").trim());

  if (password && req.user?.role !== "Admin") {
    return res.status(403).json({ message: "Only Admin can set student account password" });
  }

  if (password) {
    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: PASSWORD_POLICY_MESSAGE });
    }

    if (!accountUsername) {
      return res.status(400).json({ message: "Student name or email is required for account creation" });
    }

    const existingByName = await User.findOne({ name: new RegExp(`^${escapeRegex(accountUsername)}$`, "i") });
    const existingByEmail = normalizedStudentEmail ? await User.findOne({ email: normalizedStudentEmail }) : null;
    if (existingByName || existingByEmail) {
      return res.status(400).json({ message: "A user account already exists for this student" });
    }
  }

  const student = await Student.create({
    ...studentPayload,
    email: normalizedStudentEmail || undefined
  });

  if (password) {
    let accountEmail = normalizedStudentEmail;
    if (!accountEmail) {
      accountEmail = await buildUniqueInternalEmail(accountUsername);
    }

    try {
      await User.create({
        name: accountUsername,
        email: accountEmail,
        password,
        role: "Student"
      });
    } catch (error) {
      await Student.findByIdAndDelete(student._id);
      throw error;
    }
  }

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
  const students = await Student.find(query).lean();

  const studentsWithStatus = await Promise.all(
    students.map(async (student) => {
      const linkedUser = await findStudentUserForProfile(student);
      return {
        ...student,
        hasAccount: Boolean(linkedUser),
        isBlocked: Boolean(linkedUser?.isBlocked)
      };
    })
  );

  res.json(studentsWithStatus);
});

exports.getStudentById = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found" });
  res.json(student);
});

exports.getCurrentStudent = asyncHandler(async (req, res) => {
  let student = await Student.findOne({ email: req.user.email.toLowerCase() });
  if (!student && req.user?.name) {
    student = await Student.findOne({ name: new RegExp(`^${req.user.name}$`, "i") });
  }
  if (!student) return res.status(404).json({ message: "Student profile not found for this account" });
  res.json(student);
});

exports.getStudentDashboard = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found" });
  if (
    req.user?.role === "Student" &&
    student.email?.toLowerCase() !== req.user.email?.toLowerCase() &&
    student.name?.toLowerCase() !== req.user.name?.toLowerCase()
  ) {
    return res.status(403).json({ message: "Access denied" });
  }

  const dashboard = await buildStudentDashboard(req.params.id);

  res.json({
    student,
    ...dashboard
  });
});

exports.getMyDashboard = asyncHandler(async (req, res) => {
  let student = await Student.findOne({ email: req.user.email.toLowerCase() });
  if (!student && req.user?.name) {
    student = await Student.findOne({ name: new RegExp(`^${req.user.name}$`, "i") });
  }
  if (!student) return res.status(404).json({ message: "Student profile not found for this account" });

  const dashboard = await buildStudentDashboard(student._id);

  res.json({
    student,
    ...dashboard
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
  
  // Delete related data
  await Mark.deleteMany({ studentId: req.params.id });
  await Attendance.deleteMany({ studentId: req.params.id });
  await Stability.deleteMany({ studentId: req.params.id });
  
  const io = req.app.get("io");
  if (io) io.emit("students:updated");
  res.json({ message: "Student deleted" });
});

exports.blockStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found" });

  const user = await findStudentUserForProfile(student);
  if (!user) return res.status(404).json({ message: "Student login account not found" });

  user.isBlocked = true;
  await user.save();

  const io = req.app.get("io");
  if (io) io.emit("students:updated");
  res.json({ message: "Student account blocked" });
});

exports.unblockStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ message: "Student not found" });

  const user = await findStudentUserForProfile(student);
  if (!user) return res.status(404).json({ message: "Student login account not found" });

  user.isBlocked = false;
  await user.save();

  const io = req.app.get("io");
  if (io) io.emit("students:updated");
  res.json({ message: "Student account unblocked" });
});
