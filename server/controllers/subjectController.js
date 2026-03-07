const Subject = require("../models/Subject");
const User = require("../models/User");
const Student = require("../models/Student");
const Mark = require("../models/Mark");
const Attendance = require("../models/Attendance");
const asyncHandler = require("../utils/asyncHandler");
const { isStrongPassword, PASSWORD_POLICY_MESSAGE } = require("../utils/passwordPolicy");

const parseFacultyPayload = (payload = {}) => {
  const facultyPayload = payload.faculty || {};
  return {
    facultyCode: String(facultyPayload.facultyId || "").trim(),
    facultyName: String(facultyPayload.name || "").trim(),
    facultyEmail: String(facultyPayload.email || "").toLowerCase().trim(),
    facultyPassword: String(facultyPayload.password || "")
  };
};

const resolveFacultyUser = async ({ facultyCode, facultyName, facultyEmail, facultyPassword }) => {
  if (!facultyName || !facultyEmail) {
    throw new Error("Faculty name and email are required");
  }

  let facultyUser = await User.findOne({ email: facultyEmail });
  if (facultyUser) {
    if (facultyUser.role !== "Faculty") {
      throw new Error("This email is already used by a non-faculty account");
    }
    if (facultyCode && facultyUser.facultyCode !== facultyCode) {
      const codeOwner = await User.findOne({ facultyCode });
      if (codeOwner && String(codeOwner._id) !== String(facultyUser._id)) {
        throw new Error("Faculty ID already exists");
      }
      facultyUser.facultyCode = facultyCode;
      facultyUser.name = facultyName || facultyUser.name;
      await facultyUser.save();
    } else if (facultyName && facultyName !== facultyUser.name) {
      facultyUser.name = facultyName;
      await facultyUser.save();
    }
  } else {
    if (!facultyPassword) {
      throw new Error("Password is required to create a new faculty account");
    }
    if (!isStrongPassword(facultyPassword)) {
      throw new Error(PASSWORD_POLICY_MESSAGE);
    }
    facultyUser = await User.create({
      name: facultyName,
      email: facultyEmail,
      password: facultyPassword,
      facultyCode: facultyCode || undefined,
      role: "Faculty"
    });
  }

  return facultyUser;
};

exports.createSubject = asyncHandler(async (req, res) => {
  const subjectId = String(req.body.subjectId || "").trim();
  const subjectName = String(req.body.subjectName || "").trim();
  const facultyInput = parseFacultyPayload(req.body);

  if (!subjectId || !subjectName) {
    return res.status(400).json({ message: "Subject ID and Subject Name are required" });
  }

  let facultyUser;
  try {
    facultyUser = await resolveFacultyUser(facultyInput);
  } catch (error) {
    return res.status(400).json({ message: error.message || "Invalid faculty details" });
  }

  const subject = await Subject.create({
    subjectId,
    subjectName,
    facultyId: facultyUser._id
  });
  const io = req.app.get("io");
  if (io) io.emit("subjects:updated");
  res.status(201).json(subject);
});

exports.getSubjects = asyncHandler(async (req, res) => {
  if (req.user?.role === "Student") {
    let student = await Student.findOne({ email: req.user.email?.toLowerCase() });
    if (!student && req.user?.name) {
      student = await Student.findOne({ name: new RegExp(`^${req.user.name}$`, "i") });
    }
    if (!student) return res.json([]);

    const [markSubjectIds, attendanceSubjectIds] = await Promise.all([
      Mark.distinct("subjectId", { studentId: student._id }),
      Attendance.distinct("subjectId", { studentId: student._id })
    ]);

    const subjectIds = [...new Set([...markSubjectIds, ...attendanceSubjectIds].map((id) => String(id)))];
    if (subjectIds.length === 0) return res.json([]);

    const subjects = await Subject.find({ _id: { $in: subjectIds } })
      .populate("facultyId", "name email facultyCode")
      .sort({ subjectName: 1 });
    return res.json(subjects);
  }

  const subjects = await Subject.find().populate("facultyId", "name email facultyCode");
  res.json(subjects);
});

exports.updateSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) return res.status(404).json({ message: "Subject not found" });

  const nextSubjectId = String(req.body.subjectId || subject.subjectId).trim();
  const nextSubjectName = String(req.body.subjectName || subject.subjectName).trim();
  let nextFacultyId = subject.facultyId;

  if (req.body.faculty) {
    let facultyUser;
    try {
      facultyUser = await resolveFacultyUser(parseFacultyPayload(req.body));
    } catch (error) {
      return res.status(400).json({ message: error.message || "Invalid faculty details" });
    }
    nextFacultyId = facultyUser._id;
  } else if (req.body.facultyId) {
    nextFacultyId = req.body.facultyId;
  }

  subject.subjectId = nextSubjectId;
  subject.subjectName = nextSubjectName;
  subject.facultyId = nextFacultyId;
  await subject.save();

  const io = req.app.get("io");
  if (io) io.emit("subjects:updated");
  res.json(subject);
});

exports.deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findByIdAndDelete(req.params.id);
  if (!subject) return res.status(404).json({ message: "Subject not found" });
  const io = req.app.get("io");
  if (io) io.emit("subjects:updated");
  res.json({ message: "Subject deleted" });
});
