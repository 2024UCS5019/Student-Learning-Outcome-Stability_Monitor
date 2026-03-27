require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");

const User = require("../models/User");
const Student = require("../models/Student");
const Subject = require("../models/Subject");
const Mark = require("../models/Mark");
const Attendance = require("../models/Attendance");
const Stability = require("../models/Stability");
const { updateStabilityForStudent } = require("../services/stabilityService");
const { isStrongPassword } = require("../utils/passwordPolicy");

const seed = async () => {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Student.deleteMany({}),
    Subject.deleteMany({}),
    Mark.deleteMany({}),
    Attendance.deleteMany({}),
    Stability.deleteMany({})
  ]);

  const seedAdminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@2026#Strong";
  const seedFacultyPassword = process.env.SEED_FACULTY_PASSWORD || "Faculty@2026#Strong";
  const seedStudentPassword = process.env.SEED_STUDENT_PASSWORD || "Student@2026#Strong";

  if (![seedAdminPassword, seedFacultyPassword, seedStudentPassword].every(isStrongPassword)) {
    throw new Error("Seed passwords must satisfy strong password policy.");
  }

  const admin = await User.create({ name: "Admin", email: "admin@gmail.com", password: seedAdminPassword, role: "Admin" });
  const faculty = await User.create({ name: "Mathi", email: "mathi@gmail.com", password: seedFacultyPassword, role: "Faculty" });
  const studentUser = await User.create({ name: "Abi", email: "abi@gmail.com", password: seedStudentPassword, role: "Student" });

  const demoFacultyId = faculty._id;

  const s1 = await Student.create({
    studentId: "CSE2026-001",
    name: "Abi",
    email: "abi@gmail.com",
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
    facultyId: demoFacultyId
  });
  const sub2 = await Subject.create({
    subjectId: "CS302",
    subjectName: "Operating Systems",
    facultyId: demoFacultyId
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

  console.log("Seed complete with default users:");
  console.log(`Admin: admin@gmail.com / ${seedAdminPassword}`);
  console.log(`Faculty: mathi@gmail.com / ${seedFacultyPassword}`);
  console.log(`Student: abi@gmail.com / ${seedStudentPassword}`);

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
