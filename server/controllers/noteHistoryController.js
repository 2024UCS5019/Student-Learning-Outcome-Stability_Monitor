const NoteHistory = require("../models/NoteHistory");
const Student = require("../models/Student");
const Subject = require("../models/Subject");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const mongoose = require("mongoose");

exports.getTargets = asyncHandler(async (req, res) => {
  const [students, staff] = await Promise.all([
    Student.find().select("name email studentId").sort({ name: 1 }),
    User.find({ role: { $in: ["Admin", "Faculty"] } }).select("name email role facultyCode").sort({ name: 1 })
  ]);

  res.json({
    students,
    staff
  });
});

exports.createNote = asyncHandler(async (req, res) => {
  const targetType = String(req.body.targetType || "").trim();
  const targetId = String(req.body.targetId || "").trim();
  const subjectId = String(req.body.subjectId || "").trim();
  const note = String(req.body.note || "").trim();
  const status = String(req.body.status || "").trim();

  if (!targetType || !targetId || !note) {
    return res.status(400).json({ message: "Target type, target and note are required" });
  }

  if (!["Student", "Staff"].includes(targetType)) {
    return res.status(400).json({ message: "Invalid target type" });
  }

  if (!mongoose.isValidObjectId(targetId)) {
    return res.status(400).json({ message: "Invalid target id" });
  }

  let targetDoc = null;
  let targetRefType = "Student";
  let subjectDoc = null;
  if (targetType === "Student") {
    targetDoc = await Student.findById(targetId);
    targetRefType = "Student";
    if (!subjectId) {
      return res.status(400).json({ message: "Subject is required for student notes" });
    }
    if (!mongoose.isValidObjectId(subjectId)) {
      return res.status(400).json({ message: "Invalid subject id" });
    }
    subjectDoc = await Subject.findById(subjectId);
    if (!subjectDoc) {
      return res.status(404).json({ message: "Subject not found" });
    }
  } else {
    targetDoc = await User.findOne({ _id: targetId, role: { $in: ["Admin", "Faculty"] } });
    targetRefType = "User";
  }

  if (!targetDoc) {
    return res.status(404).json({ message: "Target not found" });
  }

  if (status && !["Great", "Average", "Poor"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const created = await NoteHistory.create({
    targetType,
    targetRefType,
    targetId: targetDoc._id,
    targetName: targetDoc.name || "Unknown",
    targetEmail: targetDoc.email || "",
    subjectId: subjectDoc?._id,
    subjectName: subjectDoc?.subjectName || "",
    note,
    status: status || "Average",
    createdBy: req.user._id
  });

  const io = req.app.get("io");
  if (io) io.emit("notes:updated");

  res.status(201).json(created);
});

exports.updateNote = asyncHandler(async (req, res) => {
  const noteId = String(req.params.id || "").trim();
  if (!mongoose.isValidObjectId(noteId)) {
    return res.status(400).json({ message: "Invalid note id" });
  }

  const targetType = String(req.body.targetType || "").trim();
  const targetId = String(req.body.targetId || "").trim();
  const subjectId = String(req.body.subjectId || "").trim();
  const note = String(req.body.note || "").trim();
  const status = String(req.body.status || "").trim();

  if (!targetType || !targetId || !note) {
    return res.status(400).json({ message: "Target type, target and note are required" });
  }

  if (!["Student", "Staff"].includes(targetType)) {
    return res.status(400).json({ message: "Invalid target type" });
  }

  if (!mongoose.isValidObjectId(targetId)) {
    return res.status(400).json({ message: "Invalid target id" });
  }

  let targetDoc = null;
  let targetRefType = "Student";
  let subjectDoc = null;
  if (targetType === "Student") {
    targetDoc = await Student.findById(targetId);
    targetRefType = "Student";
    if (!subjectId) {
      return res.status(400).json({ message: "Subject is required for student notes" });
    }
    if (!mongoose.isValidObjectId(subjectId)) {
      return res.status(400).json({ message: "Invalid subject id" });
    }
    subjectDoc = await Subject.findById(subjectId);
    if (!subjectDoc) {
      return res.status(404).json({ message: "Subject not found" });
    }
  } else {
    targetDoc = await User.findOne({ _id: targetId, role: { $in: ["Admin", "Faculty"] } });
    targetRefType = "User";
  }

  if (!targetDoc) {
    return res.status(404).json({ message: "Target not found" });
  }

  if (status && !["Great", "Average", "Poor"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const updated = await NoteHistory.findByIdAndUpdate(
    noteId,
    {
      targetType,
      targetRefType,
      targetId: targetDoc._id,
      targetName: targetDoc.name || "Unknown",
      targetEmail: targetDoc.email || "",
      subjectId: subjectDoc?._id,
      subjectName: subjectDoc?.subjectName || "",
      note,
      status: status || "Average"
    },
    { new: true }
  );

  if (!updated) {
    return res.status(404).json({ message: "Note not found" });
  }

  const io = req.app.get("io");
  if (io) io.emit("notes:updated");

  res.json(updated);
});

exports.deleteNote = asyncHandler(async (req, res) => {
  const noteId = String(req.params.id || "").trim();
  if (!mongoose.isValidObjectId(noteId)) {
    return res.status(400).json({ message: "Invalid note id" });
  }

  const removed = await NoteHistory.findByIdAndDelete(noteId);
  if (!removed) {
    return res.status(404).json({ message: "Note not found" });
  }

  const io = req.app.get("io");
  if (io) io.emit("notes:updated");

  res.json({ message: "Note deleted" });
});

exports.getNotes = asyncHandler(async (req, res) => {
  const targetType = String(req.query.targetType || "").trim();
  const status = String(req.query.status || "").trim();
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 10);
  const isPaged = Boolean(req.query.page || req.query.limit);
  const query = {};
  if (targetType && ["Student", "Staff"].includes(targetType)) {
    query.targetType = targetType;
  }
  if (status && ["Great", "Average", "Poor"].includes(status)) {
    query.status = status;
  }

  if (req.user?.role === "Student") {
    let student = null;
    if (req.user?.email) {
      student = await Student.findOne({ email: String(req.user.email).toLowerCase().trim() }).select("_id");
    }
    if (!student && req.user?.name) {
      student = await Student.findOne({ name: new RegExp(`^${String(req.user.name).trim()}$`, "i") }).select("_id");
    }

    if (!student) {
      return res.json(isPaged ? { items: [], total: 0, page, totalPages: 1 } : []);
    }

    query.targetType = "Student";
    query.targetId = student._id;
  }

  if (!isPaged) {
    const notes = await NoteHistory.find(query)
      .populate("createdBy", "name role email")
      .sort({ createdAt: -1 });
    return res.json(notes);
  }

  const total = await NoteHistory.countDocuments(query);
  const notes = await NoteHistory.find(query)
    .populate("createdBy", "name role email")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.json({
    items: notes,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit))
  });
});
