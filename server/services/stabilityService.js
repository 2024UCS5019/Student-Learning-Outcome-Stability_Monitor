const Mark = require("../models/Mark");
const Stability = require("../models/Stability");

const calculateTrend = (marks) => {
  if (marks.length < 2) return "Stable";
  const last = marks[marks.length - 1].marks;
  const prev = marks[marks.length - 2].marks;
  const diffPercent = prev === 0 ? 0 : ((last - prev) / prev) * 100;
  if (Math.abs(diffPercent) < 5) return "Stable";
  return diffPercent > 0 ? "Improving" : "Declining";
};

const updateStabilityForStudent = async (studentId) => {
  const marks = await Mark.find({ studentId }).sort({ date: 1 });
  if (!marks.length) return null;

  const average = marks.reduce((sum, m) => sum + m.marks, 0) / marks.length;
  const trend = calculateTrend(marks);

  const payload = {
    studentId,
    average: Number(average.toFixed(2)),
    trend,
    status: trend,
    lastUpdated: new Date()
  };

  const existing = await Stability.findOne({ studentId });
  if (existing) {
    return Stability.findOneAndUpdate({ studentId }, payload, { new: true });
  }
  return Stability.create(payload);
};

module.exports = { updateStabilityForStudent };
