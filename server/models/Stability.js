const mongoose = require("mongoose");

const stabilitySchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    average: { type: Number, required: true },
    trend: { type: String, enum: ["Stable", "Improving", "Declining"], required: true },
    status: { type: String, enum: ["Stable", "Improving", "Declining"], required: true },
    lastUpdated: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Stability", stabilitySchema);
