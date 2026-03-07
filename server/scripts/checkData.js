require("dotenv").config();
const mongoose = require("mongoose");
const Student = require("../models/Student");
const Mark = require("../models/Mark");
const Stability = require("../models/Stability");

const checkData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const students = await Student.find();
    console.log("\nStudents:", students.length);
    students.forEach(s => console.log(`  - ${s.name} (${s.studentId})`));

    const marks = await Mark.find().populate("studentId");
    console.log("\nMarks:", marks.length);
    marks.forEach(m => console.log(`  - ${m.studentId?.name || "DELETED"} - ${m.marks}`));

    const stability = await Stability.find().populate("studentId");
    console.log("\nStability:", stability.length);
    stability.forEach(s => console.log(`  - ${s.studentId?.name || "DELETED"} - ${s.average}`));

    // Find orphaned marks
    const orphanedMarks = marks.filter(m => !m.studentId);
    if (orphanedMarks.length > 0) {
      console.log("\nDeleting orphaned marks...");
      await Mark.deleteMany({ studentId: { $in: orphanedMarks.map(m => m._id) } });
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

checkData();
