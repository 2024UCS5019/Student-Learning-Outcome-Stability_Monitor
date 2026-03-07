require("dotenv").config();
const mongoose = require("mongoose");
const Student = require("../models/Student");

const updateStudent = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Update Tharun's email
    const result = await Student.findOneAndUpdate(
      { studentId: "AI&DS2026-001" },
      { email: "tharun@example.com" },
      { new: true }
    );

    if (result) {
      console.log("Updated student:", result);
      console.log("\nNow register a user with email: tharun@example.com");
    } else {
      console.log("Student not found");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

updateStudent();
