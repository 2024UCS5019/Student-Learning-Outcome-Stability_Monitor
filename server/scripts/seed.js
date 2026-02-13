require("dotenv").config();
const mongoose = require("mongoose");

const User = require("../models/User");
const Student = require("../models/Student");
const Subject = require("../models/Subject");
const Mark = require("../models/Mark");
const Attendance = require("../models/Attendance");
const Stability = require("../models/Stability");
const { updateStabilityForStudent } = require("../services/stabilityService");

const connect = async () => {
  await mongoose.connect(process.env.MONGO_URI);
};

const seed = async () => {
  await connect();

  await Promise.all([
    User.deleteMany({}),
    Student.deleteMany({}),
    Subject.deleteMany({}),
    Mark.deleteMany({}),
    Attendance.deleteMany({}),
    Stability.deleteMany({})
  ]);

  const admin = await User.create({
    name: "Admin User",
    email: "admin@example.com",
    password: "Admin@123",
    role: "Admin"
  });

  const faculty = await User.create({
    name: "Faculty User",
    email: "faculty@example.com",
    password: "Faculty@123",
    role: "Faculty"
  });

  const s1 = await Student.create({
    studentId: "CSE2026-001",
    name: "Karthik R",
    department: "CSE",
    year: 3
  });
  const s2 = await Student.create({
    studentId: "CSE2026-002",
    name: "Priya M",
    department: "CSE",
    year: 3
  });

  const sub1 = await Subject.create({
    subjectId: "CS301",
    subjectName: "Data Structures",
    facultyId: faculty._id
  });
  const sub2 = await Subject.create({
    subjectId: "CS302",
    subjectName: "Operating Systems",
    facultyId: faculty._id
  });

  await Mark.insertMany([
    { studentId: s1._id, subjectId: sub1._id, testName: "Test 1", marks: 72 },
    { studentId: s1._id, subjectId: sub1._id, testName: "Test 2", marks: 78 },
    { studentId: s1._id, subjectId: sub2._id, testName: "Test 1", marks: 68 },
    { studentId: s1._id, subjectId: sub2._id, testName: "Test 2", marks: 74 },
    { studentId: s2._id, subjectId: sub1._id, testName: "Test 1", marks: 88 },
    { studentId: s2._id, subjectId: sub1._id, testName: "Test 2", marks: 92 },
    { studentId: s2._id, subjectId: sub2._id, testName: "Test 1", marks: 81 },
    { studentId: s2._id, subjectId: sub2._id, testName: "Test 2", marks: 79 }
  ]);

  await Attendance.insertMany([
    { studentId: s1._id, subjectId: sub1._id, percentage: 84 },
    { studentId: s1._id, subjectId: sub2._id, percentage: 79 },
    { studentId: s2._id, subjectId: sub1._id, percentage: 92 },
    { studentId: s2._id, subjectId: sub2._id, percentage: 88 }
  ]);

  await updateStabilityForStudent(s1._id);
  await updateStabilityForStudent(s2._id);

  console.log("Seed complete:");
  console.log(`Admin: ${admin.email} / Admin@123`);
  console.log(`Faculty: ${faculty.email} / Faculty@123`);

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
