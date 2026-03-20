const mongoose = require("mongoose");

const noteHistorySchema = new mongoose.Schema(
  {
    targetType: { type: String, enum: ["Student", "Staff"], required: true },
    targetRefType: { type: String, enum: ["Student", "User"], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: "targetRefType" },
    targetName: { type: String, required: true, trim: true },
    targetEmail: { type: String, trim: true, lowercase: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject" },
    subjectName: { type: String, trim: true },
    note: { type: String, required: true, trim: true, maxlength: 1000 },
    status: { type: String, enum: ["Great", "Average", "Poor"], default: "Average" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

noteHistorySchema.index({ targetType: 1, targetId: 1 });
noteHistorySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("NoteHistory", noteHistorySchema);
