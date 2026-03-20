const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    subjectId: { type: String, required: true, unique: true },
    subjectName: { type: String, required: true },
    facultyId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

subjectSchema.index({ subjectId: 1 });
subjectSchema.index({ facultyId: 1 });

module.exports = mongoose.model("Subject", subjectSchema);
