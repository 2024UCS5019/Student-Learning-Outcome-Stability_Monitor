const Stability = require("../models/Stability");
const asyncHandler = require("../utils/asyncHandler");
const { updateStabilityForStudent } = require("../services/stabilityService");

exports.getStability = asyncHandler(async (req, res) => {
  const stability = await Stability.find().populate("studentId", "name studentId");
  res.json(stability);
});

exports.recalculate = asyncHandler(async (req, res) => {
  const { studentId } = req.body;
  const updated = await updateStabilityForStudent(studentId);
  if (!updated) return res.status(404).json({ message: "No marks found for student" });

  const io = req.app.get("io");
  if (io) io.emit("stability:updated", updated);

  res.json(updated);
});
