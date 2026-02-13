const Subject = require("../models/Subject");
const asyncHandler = require("../utils/asyncHandler");

exports.createSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.create(req.body);
  const io = req.app.get("io");
  if (io) io.emit("subjects:updated");
  res.status(201).json(subject);
});

exports.getSubjects = asyncHandler(async (req, res) => {
  const subjects = await Subject.find().populate("facultyId", "name email");
  res.json(subjects);
});

exports.updateSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!subject) return res.status(404).json({ message: "Subject not found" });
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
