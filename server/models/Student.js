const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    department: { type: String, required: true },
    year: { type: Number, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
