const Student = require("../models/Student");
const Mark = require("../models/Mark");
const Attendance = require("../models/Attendance");
const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");
const asyncHandler = require("../utils/asyncHandler");

exports.studentReport = asyncHandler(async (req, res) => {
  const studentId = req.params.studentId;
  const format = req.query.format || "json";

  const student = await Student.findById(studentId);
  if (!student) return res.status(404).json({ message: "Student not found" });

  const marks = await Mark.find({ studentId }).populate("subjectId", "subjectName");
  const attendance = await Attendance.find({ studentId }).populate("subjectId", "subjectName");

  const report = { student, marks, attendance };

  if (format === "csv") {
    const parser = new Parser();
    const csv = parser.parse(
      marks.map((m) => ({
        testName: m.testName,
        marks: m.marks,
        subject: m.subjectId?.subjectName
      }))
    );
    res.header("Content-Type", "text/csv");
    return res.send(csv);
  }

  if (format === "pdf") {
    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);
    doc.fontSize(18).text(`Student Report: ${student.name}`);
    doc.moveDown();
    marks.forEach((m) => {
      doc.text(`${m.testName} - ${m.subjectId?.subjectName}: ${m.marks}`);
    });
    doc.end();
    return;
  }

  res.json(report);
});

exports.classReport = asyncHandler(async (req, res) => {
  const { department, year } = req.query;
  const format = req.query.format || "json";
  const query = {};
  if (department) query.department = department;
  if (year) query.year = Number(year);

  const students = await Student.find(query);
  if (format === "csv") {
    const parser = new Parser();
    const csv = parser.parse(students);
    res.header("Content-Type", "text/csv");
    return res.send(csv);
  }

  res.json({ total: students.length, students });
});
