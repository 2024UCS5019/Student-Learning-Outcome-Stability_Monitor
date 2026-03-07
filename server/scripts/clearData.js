require("dotenv").config();
const mongoose = require("mongoose");
const Student = require("../models/Student");
const Subject = require("../models/Subject");
const Mark = require("../models/Mark");
const Attendance = require("../models/Attendance");
const Stability = require("../models/Stability");

const clearData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    await Student.deleteMany({});
    await Subject.deleteMany({});
    await Mark.deleteMany({});
    await Attendance.deleteMany({});
    await Stability.deleteMany({});

    console.log("Sample data cleared. You can now add your own data.");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

clearData();
