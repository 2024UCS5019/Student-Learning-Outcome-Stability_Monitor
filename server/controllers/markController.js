const Mark = require("../models/Mark");
const Student = require("../models/Student");
const Subject = require("../models/Subject");
const asyncHandler = require("../utils/asyncHandler");
const { updateStabilityForStudent } = require("../services/stabilityService");

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const ensureFacultyOwnsSubject = async (req, subjectId) => {
  if (req.user?.role !== "Faculty") return;
  const subject = await Subject.findById(subjectId).select("facultyId").lean();
  if (!subject) {
    const error = new Error("Subject not found");
    error.statusCode = 404;
    throw error;
  }
  if (String(subject.facultyId) !== String(req.user._id)) {
    const error = new Error("Access denied");
    error.statusCode = 403;
    throw error;
  }
};

exports.createMark = asyncHandler(async (req, res) => {
  const studentId = req.body.studentId;
  const subjectId = req.body.subjectId;
  const testName = String(req.body.testName || "").trim();
  if (!studentId || !subjectId || !testName) {
    return res.status(400).json({ message: "Student, subject, and test name are required" });
  }

  await ensureFacultyOwnsSubject(req, subjectId);

  const duplicate = await Mark.findOne({
    studentId,
    subjectId,
    testName: new RegExp(`^${escapeRegex(testName)}$`, "i")
  });
  if (duplicate) {
    return res.status(400).json({ message: "Duplicate mark entry for this student, subject, and test name" });
  }

  const mark = await Mark.create(req.body);
  const stability = await updateStabilityForStudent(mark.studentId);

  const io = req.app.get("io");
  if (io) {
    io.emit("marks:created", mark);
    if (stability) io.emit("stability:updated", stability);
  }

  res.status(201).json(mark);
});

exports.getMarks = asyncHandler(async (req, res) => {
  const { studentId, subjectId } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 10);
  const isPaged = Boolean(req.query.page || req.query.limit);
  const query = {};
  if (req.user?.role === "Faculty") {
    const facultySubjects = await Subject.find({ facultyId: req.user._id }).select("_id").lean();
    const facultySubjectIds = facultySubjects.map((s) => s._id);
    query.subjectId = { $in: facultySubjectIds };
  }
  if (req.user?.role === "Student") {
    let student = await Student.findOne({ email: req.user.email?.toLowerCase() });
    if (!student && req.user?.name) {
      student = await Student.findOne({ name: new RegExp(`^${req.user.name}$`, "i") });
    }
    if (!student) {
      return res.json(isPaged ? { items: [], total: 0, page, totalPages: 1 } : []);
    }
    query.studentId = student._id;
  } else if (studentId) {
    query.studentId = studentId;
  }
  if (subjectId) {
    if (query.subjectId && query.subjectId.$in) {
      query.subjectId = { $in: query.subjectId.$in.filter((id) => String(id) === String(subjectId)) };
    } else {
      query.subjectId = subjectId;
    }
  }

  if (!isPaged) {
    const marks = await Mark.find(query).populate("studentId subjectId");
    return res.json(marks);
  }

  const total = await Mark.countDocuments(query);
  const marks = await Mark.find(query)
    .populate("studentId subjectId")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({
    items: marks,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit))
  });
});

exports.updateMark = asyncHandler(async (req, res) => {
  const existing = await Mark.findById(req.params.id);
  if (!existing) return res.status(404).json({ message: "Mark not found" });

  await ensureFacultyOwnsSubject(req, existing.subjectId);

  const nextStudentId = req.body.studentId || existing.studentId;
  const nextSubjectId = req.body.subjectId || existing.subjectId;
  await ensureFacultyOwnsSubject(req, nextSubjectId);
  const nextTestName = String(req.body.testName || existing.testName || "").trim();

  const duplicate = await Mark.findOne({
    _id: { $ne: req.params.id },
    studentId: nextStudentId,
    subjectId: nextSubjectId,
    testName: new RegExp(`^${escapeRegex(nextTestName)}$`, "i")
  });
  if (duplicate) {
    return res.status(400).json({ message: "Another mark already exists for this student, subject, and test name" });
  }

  const mark = await Mark.findByIdAndUpdate(req.params.id, req.body, { new: true });
  const stability = await updateStabilityForStudent(mark.studentId);

  const io = req.app.get("io");
  if (io) {
    io.emit("marks:updated", mark);
    if (stability) io.emit("stability:updated", stability);
  }

  res.json(mark);
});

exports.deleteMark = asyncHandler(async (req, res) => {
  const mark = await Mark.findById(req.params.id);
  if (!mark) return res.status(404).json({ message: "Mark not found" });
  await ensureFacultyOwnsSubject(req, mark.subjectId);

  await Mark.findByIdAndDelete(req.params.id);
  const stability = await updateStabilityForStudent(mark.studentId);

  const io = req.app.get("io");
  if (io) {
    io.emit("marks:deleted", { id: req.params.id });
    if (stability) io.emit("stability:updated", stability);
  }

  res.json({ message: "Mark deleted" });
});
