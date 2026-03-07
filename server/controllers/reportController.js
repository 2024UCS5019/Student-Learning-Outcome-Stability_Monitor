const Student = require("../models/Student");
const Mark = require("../models/Mark");
const Attendance = require("../models/Attendance");
const Stability = require("../models/Stability");
const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");
const asyncHandler = require("../utils/asyncHandler");

exports.studentReport = asyncHandler(async (req, res) => {
  const studentId = req.params.studentId;
  const format = req.query.format || "json";

  if (req.user?.role === "Student") {
    let myStudent = await Student.findOne({ email: req.user.email?.toLowerCase() });
    if (!myStudent && req.user?.name) {
      myStudent = await Student.findOne({ name: new RegExp(`^${req.user.name}$`, "i") });
    }
    if (!myStudent) return res.status(404).json({ message: "Student profile not found for this account" });
    if (String(myStudent._id) !== String(studentId)) {
      return res.status(403).json({ message: "Access denied" });
    }
  }

  const student = await Student.findById(studentId);
  if (!student) return res.status(404).json({ message: "Student not found" });

  const marks = await Mark.find({ studentId }).populate("subjectId", "subjectName").sort({ date: 1 });
  const attendance = await Attendance.find({ studentId }).populate("subjectId", "subjectName").sort({ date: 1 });
  const stability = await Stability.findOne({ studentId });
  const avgAttendance = attendance.length
    ? attendance.reduce((sum, item) => sum + Number(item.percentage || 0), 0) / attendance.length
    : 0;
  const avgMarks = marks.length
    ? marks.reduce((sum, item) => sum + Number(item.marks || 0), 0) / marks.length
    : 0;

  const report = { student, marks, attendance, stability, avgAttendance, avgMarks };

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
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${student.studentId || student._id}-report.pdf"`);
    doc.pipe(res);

    const generatedAt = new Date().toLocaleString("en-IN", { hour12: true });

    // Header (Times New Roman style fonts in PDFKit)
    doc.font("Times-Bold").fontSize(24).fillColor("#111827").text("Student Progress Report", { align: "left" });
    doc.moveDown(0.25);
    doc.font("Times-Roman").fontSize(11).fillColor("#4b5563").text(`Generated At: ${generatedAt}`);
    doc.moveDown(0.8);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#d1d5db").stroke();
    doc.moveDown(0.8);

    // Student profile summary
    doc.font("Times-Bold").fontSize(15).fillColor("#111827").text("Student Details");
    doc.moveDown(0.3);
    doc.font("Times-Roman").fontSize(12).text(`Name: ${student.name}`);
    doc.text(`Student ID: ${student.studentId || "N/A"}`);
    doc.text(`Department: ${student.department || "N/A"}`);
    doc.text(`Year: ${student.year || "N/A"}`);
    if (student.email) doc.text(`Email: ${student.email}`);
    doc.moveDown(0.8);

    // Performance summary
    doc.font("Times-Bold").fontSize(15).text("Performance Summary");
    doc.moveDown(0.3);
    doc.font("Times-Roman").fontSize(12).text(`Average Marks: ${avgMarks.toFixed(1)}%`);
    doc.text(`Average Attendance: ${avgAttendance.toFixed(1)}%`);
    doc.text(`Stability Status: ${stability?.status || "Not available"}`);
    doc.moveDown(0.9);

    // Marks section
    doc.font("Times-Bold").fontSize(15).text("Marks Details");
    doc.moveDown(0.3);
    if (!marks.length) {
      doc.font("Times-Roman").fontSize(12).text("No marks records available.");
    } else {
      marks.forEach((m, index) => {
        const subject = m.subjectId?.subjectName || "Unknown Subject";
        const test = m.testName || `Test ${index + 1}`;
        const markValue = m.marks ?? "N/A";
        doc.font("Times-Roman").fontSize(12).text(`${index + 1}. ${subject} - ${test}: ${markValue}`);
      });
    }
    doc.moveDown(0.9);

    // Attendance section
    doc.font("Times-Bold").fontSize(15).text("Attendance Details");
    doc.moveDown(0.3);
    if (!attendance.length) {
      doc.font("Times-Roman").fontSize(12).text("No attendance records available.");
    } else {
      attendance.forEach((a, index) => {
        const subject = a.subjectId?.subjectName || "Unknown Subject";
        const percentage = a.percentage ?? "N/A";
        doc.font("Times-Roman").fontSize(12).text(`${index + 1}. ${subject}: ${percentage}%`);
      });
    }

    // Footer
    doc.moveDown(1);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#e5e7eb").stroke();
    doc.moveDown(0.5);
    doc.font("Times-Italic").fontSize(10).fillColor("#6b7280").text("Outcome Monitor - Student Outcome Monitoring System", {
      align: "center"
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
