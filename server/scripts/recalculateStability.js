require("dotenv").config();
const mongoose = require("mongoose");
const Mark = require("../models/Mark");
const Stability = require("../models/Stability");
const { updateStabilityForStudent } = require("../services/stabilityService");

const recalculateAll = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear invalid stability records
    await Stability.deleteMany({});
    console.log("Cleared existing stability records");

    // Get all unique student IDs from marks
    const studentIds = await Mark.distinct("studentId");
    console.log(`Found ${studentIds.length} students with marks`);

    // Recalculate stability for each student
    for (const studentId of studentIds) {
      await updateStabilityForStudent(studentId);
      console.log(`Updated stability for student: ${studentId}`);
    }

    console.log("Stability recalculation complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

recalculateAll();
