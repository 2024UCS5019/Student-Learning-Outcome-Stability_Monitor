const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    department: { type: String, required: true },
    year: { type: Number, required: true },
    email: { type: String, lowercase: true, sparse: true }
  },
  { timestamps: true }
);

studentSchema.index({ studentId: 1 });
studentSchema.index({ department: 1, year: 1 });

module.exports = mongoose.model("Student", studentSchema);
