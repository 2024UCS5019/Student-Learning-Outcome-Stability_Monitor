const Mark = require("../models/Mark");
const asyncHandler = require("../utils/asyncHandler");
const { updateStabilityForStudent } = require("../services/stabilityService");

exports.createMark = asyncHandler(async (req, res) => {
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
  const query = {};
  if (studentId) query.studentId = studentId;
  if (subjectId) query.subjectId = subjectId;

  const marks = await Mark.find(query).populate("studentId subjectId");
  res.json(marks);
});

exports.updateMark = asyncHandler(async (req, res) => {
  const mark = await Mark.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!mark) return res.status(404).json({ message: "Mark not found" });
  const stability = await updateStabilityForStudent(mark.studentId);

  const io = req.app.get("io");
  if (io) {
    io.emit("marks:updated", mark);
    if (stability) io.emit("stability:updated", stability);
  }

  res.json(mark);
});

exports.deleteMark = asyncHandler(async (req, res) => {
  const mark = await Mark.findByIdAndDelete(req.params.id);
  if (!mark) return res.status(404).json({ message: "Mark not found" });
  const stability = await updateStabilityForStudent(mark.studentId);

  const io = req.app.get("io");
  if (io) {
    io.emit("marks:deleted", { id: req.params.id });
    if (stability) io.emit("stability:updated", stability);
  }

  res.json({ message: "Mark deleted" });
});
