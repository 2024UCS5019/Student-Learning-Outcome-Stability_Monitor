const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const asyncHandler = require("../utils/asyncHandler");

exports.recordAttendance = asyncHandler(async (req, res) => {
  const { studentId, subjectId } = req.body;
  if (!studentId || !subjectId) {
    return res.status(400).json({ message: "Student and subject are required" });
  }

  const duplicate = await Attendance.findOne({ studentId, subjectId });
  if (duplicate) {
    return res.status(400).json({ message: "Attendance already exists for this student and subject" });
  }

  const record = await Attendance.create(req.body);
  const io = req.app.get("io");
  if (io) io.emit("attendance:created", record);
  res.status(201).json(record);
});

exports.getAttendance = asyncHandler(async (req, res) => {
  const { studentId, subjectId } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 10);
  const isPaged = Boolean(req.query.page || req.query.limit);
  const query = {};
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
  if (subjectId) query.subjectId = subjectId;

  if (!isPaged) {
    const records = await Attendance.find(query).populate("studentId subjectId");
    return res.json(records);
  }

  const total = await Attendance.countDocuments(query);
  const records = await Attendance.find(query)
    .populate("studentId subjectId")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({
    items: records,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit))
  });
});

exports.updateAttendance = asyncHandler(async (req, res) => {
  const existing = await Attendance.findById(req.params.id);
  if (!existing) return res.status(404).json({ message: "Attendance not found" });

  const nextStudentId = req.body.studentId || existing.studentId;
  const nextSubjectId = req.body.subjectId || existing.subjectId;
  const duplicate = await Attendance.findOne({
    _id: { $ne: req.params.id },
    studentId: nextStudentId,
    subjectId: nextSubjectId
  });
  if (duplicate) {
    return res.status(400).json({ message: "Another attendance record already exists for this student and subject" });
  }

  const record = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true });
  const io = req.app.get("io");
  if (io) io.emit("attendance:updated", record);
  res.json(record);
});

exports.deleteAttendance = asyncHandler(async (req, res) => {
  const record = await Attendance.findByIdAndDelete(req.params.id);
  if (!record) return res.status(404).json({ message: "Attendance not found" });
  const io = req.app.get("io");
  if (io) io.emit("attendance:deleted", { id: req.params.id });
  res.json({ message: "Attendance deleted" });
});
