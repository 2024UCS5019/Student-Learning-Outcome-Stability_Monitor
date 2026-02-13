const mongoose = require("mongoose");

const markSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
    testName: { type: String, required: true },
    marks: { type: Number, required: true, min: 0, max: 100 },
    date: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Mark", markSchema);
