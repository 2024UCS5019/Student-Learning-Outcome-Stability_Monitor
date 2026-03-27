require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Attendance = require("../models/Attendance");

const run = async () => {
  await connectDB();

  const groups = await Attendance.aggregate([
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: { studentId: "$studentId", subjectId: "$subjectId" },
        ids: { $push: "$_id" },
        count: { $sum: 1 }
      }
    },
    { $match: { count: { $gt: 1 } } }
  ]);

  let removed = 0;
  for (const g of groups) {
    const idsToDelete = (g.ids || []).slice(1);
    if (!idsToDelete.length) continue;
    const result = await Attendance.deleteMany({ _id: { $in: idsToDelete } });
    removed += result.deletedCount || 0;
  }

  await Attendance.collection.createIndex({ studentId: 1, subjectId: 1 }, { unique: true });

  console.log(`Duplicate groups: ${groups.length}`);
  console.log(`Removed attendance records: ${removed}`);
  console.log("Unique index ensured: { studentId: 1, subjectId: 1 }");

  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error(err?.message || err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});

