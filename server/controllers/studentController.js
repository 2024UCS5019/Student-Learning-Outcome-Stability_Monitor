const Student = require("../models/Student");
const User = require("../models/User");
const Mark = require("../models/Mark");
const Attendance = require("../models/Attendance");
const Stability = require("../models/Stability");
const NoteHistory = require("../models/NoteHistory");
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
  const feedbackNotes = await NoteHistory.find({ targetType: "Student", targetId: studentId }).select("status").lean();

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

  const feedbackSummary = { great: 0, average: 0, poor: 0, total: feedbackNotes.length };
  feedbackNotes.forEach((note) => {
    const status = note.status || "Average";
    if (status === "Great") feedbackSummary.great += 1;
    else if (status === "Poor") feedbackSummary.poor += 1;
    else feedbackSummary.average += 1;
  });

  const riskDrivers = [];
  let riskLevel = "Low";
  if (averageScore < 50) riskDrivers.push("Low marks");
  if (overallAttendance < 75) riskDrivers.push("Low attendance");
  if (feedbackSummary.poor >= 1) riskDrivers.push("Poor feedback");

  if (averageScore < 50 || overallAttendance < 75 || feedbackSummary.poor >= 2) {
    riskLevel = "High";
  } else if (averageScore < 70 || overallAttendance < 85 || feedbackSummary.poor >= 1) {
    riskLevel = "Medium";
  }

  return {
    averageScore,
    overallAttendance,
    stability: stability?.status || "Stable",
    riskLevel,
    riskDrivers,
    feedbackSummary,
    subjectMarks,
    subjectAttendance,
    performanceTrend
  };
};

exports.createStudent = asyncHandler(async (req, res) => {
  const { password, ...studentPayload } = req.body;
  const normalizedStudentEmail = String(studentPayload.email || "").toLowerCase().trim();
  const accountUsername = (normalizedStudentEmail || String(studentPayload.name || "").trim());
  const normalizedStudentId = String(studentPayload.studentId || "").trim();

  if (!normalizedStudentId) {
    return res.status(400).json({ message: "Student ID is required" });
  }

  const existingStudentById = await Student.findOne({ studentId: normalizedStudentId });
  if (existingStudentById) {
    return res.status(400).json({ message: "Student ID already exists" });
  }

  if (normalizedStudentEmail) {
    const existingStudentByEmail = await Student.findOne({ email: normalizedStudentEmail });
    if (existingStudentByEmail) {
      return res.status(400).json({ message: "Student email already exists" });
    }
  }

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
    studentId: normalizedStudentId,
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
  const { search, department, year, sort } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 10);
  const isPaged = Boolean(req.query.page || req.query.limit);
  const query = {};

  const trimmedSearch = String(search || "").trim();
  if (trimmedSearch) {
    const regex = new RegExp(escapeRegex(trimmedSearch), "i");
    const numericYear = Number(trimmedSearch);
    query.$or = [
      { studentId: regex },
      { name: regex },
      { department: regex }
    ];
    if (!Number.isNaN(numericYear)) {
      query.$or.push({ year: numericYear });
    }
  }
  if (department) query.department = department;
  if (year) query.year = Number(year);

  const sortQuery = sort === "id" ? { studentId: 1 } : { name: 1, studentId: 1 };

  if (!isPaged) {
    const students = await Student.find(query).sort(sortQuery).lean();
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
    return res.json(studentsWithStatus);
  }

  const total = await Student.countDocuments(query);
  const students = await Student.find(query)
    .sort(sortQuery)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

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

  res.json({
    items: studentsWithStatus,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit))
  });
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
  const existing = await Student.findById(req.params.id);
  if (!existing) return res.status(404).json({ message: "Student not found" });

  const nextStudentId = String(req.body.studentId || existing.studentId || "").trim();
  const nextEmail = String(req.body.email || existing.email || "").toLowerCase().trim();

  const duplicateById = await Student.findOne({
    _id: { $ne: req.params.id },
    studentId: nextStudentId
  });
  if (duplicateById) {
    return res.status(400).json({ message: "Student ID already exists" });
  }

  if (nextEmail) {
    const duplicateByEmail = await Student.findOne({
      _id: { $ne: req.params.id },
      email: nextEmail
    });
    if (duplicateByEmail) {
      return res.status(400).json({ message: "Student email already exists" });
    }
  }

  const payload = { ...req.body, studentId: nextStudentId, email: nextEmail || undefined };
  const student = await Student.findByIdAndUpdate(req.params.id, payload, { new: true });
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
