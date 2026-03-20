const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

attendanceSchema.index({ studentId: 1, subjectId: 1 });
attendanceSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Attendance", attendanceSchema);
