const Attendance = require("../models/Attendance");
const asyncHandler = require("../utils/asyncHandler");

exports.recordAttendance = asyncHandler(async (req, res) => {
  const record = await Attendance.create(req.body);
  const io = req.app.get("io");
  if (io) io.emit("attendance:created", record);
  res.status(201).json(record);
});

exports.getAttendance = asyncHandler(async (req, res) => {
  const { studentId, subjectId } = req.query;
  const query = {};
  if (studentId) query.studentId = studentId;
  if (subjectId) query.subjectId = subjectId;

  const records = await Attendance.find(query).populate("studentId subjectId");
  res.json(records);
});

exports.updateAttendance = asyncHandler(async (req, res) => {
  const record = await Attendance.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!record) return res.status(404).json({ message: "Attendance not found" });
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
