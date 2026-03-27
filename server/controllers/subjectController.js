const Subject = require("../models/Subject");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { isStrongPassword, PASSWORD_POLICY_MESSAGE } = require("../utils/passwordPolicy");

const parseFacultyPayload = (payload = {}) => {
  const facultyPayload = payload.faculty || {};
  return {
    facultyCode: String(facultyPayload.facultyId || "").trim(),
    facultyName: String(facultyPayload.name || "").trim(),
    facultyEmail: String(facultyPayload.email || "").toLowerCase().trim(),
    facultyPassword: String(facultyPayload.password || "")
  };
};

const resolveFacultyUser = async ({ facultyCode, facultyName, facultyEmail, facultyPassword }) => {
  if (!facultyName || !facultyEmail) {
    throw new Error("Faculty name and email are required");
  }

  let facultyUser = await User.findOne({ email: facultyEmail });
  if (facultyUser) {
    if (facultyUser.role !== "Faculty") {
      throw new Error("This email is already used by a non-faculty account");
    }
    if (facultyCode && facultyUser.facultyCode !== facultyCode) {
      const codeOwner = await User.findOne({ facultyCode });
      if (codeOwner && String(codeOwner._id) !== String(facultyUser._id)) {
        throw new Error("Faculty ID already exists");
      }
      facultyUser.facultyCode = facultyCode;
      facultyUser.name = facultyName || facultyUser.name;
      await facultyUser.save();
    } else if (facultyName && facultyName !== facultyUser.name) {
      facultyUser.name = facultyName;
      await facultyUser.save();
    }
  } else {
    if (!facultyPassword) {
      throw new Error("Password is required to create a new faculty account");
    }
    if (!isStrongPassword(facultyPassword)) {
      throw new Error(PASSWORD_POLICY_MESSAGE);
    }
    facultyUser = await User.create({
      name: facultyName,
      email: facultyEmail,
      password: facultyPassword,
      facultyCode: facultyCode || undefined,
      role: "Faculty"
    });
  }

  return facultyUser;
};

exports.createSubject = asyncHandler(async (req, res) => {
  const subjectId = String(req.body.subjectId || "").trim();
  const subjectName = String(req.body.subjectName || "").trim();

  if (!subjectId || !subjectName) {
    return res.status(400).json({ message: "Subject ID and Subject Name are required" });
  }

  const duplicateBySubjectId = await Subject.findOne({ subjectId });
  if (duplicateBySubjectId) {
    return res.status(400).json({ message: "Subject ID already exists" });
  }

  let facultyUser;
  if (req.user?.role === "Faculty") {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (req.user.role !== "Faculty") {
      return res.status(403).json({ message: "Access denied" });
    }
    facultyUser = req.user;
  } else {
    const facultyInput = parseFacultyPayload(req.body);
    try {
      facultyUser = await resolveFacultyUser(facultyInput);
    } catch (error) {
      return res.status(400).json({ message: error.message || "Invalid faculty details" });
    }
  }

  const subject = await Subject.create({
    subjectId,
    subjectName,
    facultyId: facultyUser._id
  });
  const io = req.app.get("io");
  if (io) io.emit("subjects:updated");
  res.status(201).json(subject);
});

exports.getSubjects = asyncHandler(async (req, res) => {
  const search = String(req.query.search || "").trim();
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 10);
  const isPaged = Boolean(req.query.page || req.query.limit);
  const query = {};

  if (req.user?.role === "Faculty") {
    query.facultyId = req.user._id;
  }

  if (search) {
    const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ subjectId: regex }, { subjectName: regex }];
  }

  const baseQuery = Subject.find(query)
    .populate("facultyId", "name email facultyCode")
    .collation({ locale: "en", numericOrdering: true })
    .sort({ subjectId: 1, subjectName: 1 });

  if (!isPaged) {
    const subjects = await baseQuery;
    return res.json(subjects);
  }

  const total = await Subject.countDocuments(query);
  const subjects = await baseQuery.skip((page - 1) * limit).limit(limit);

  res.json({
    items: subjects,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit))
  });
});

exports.updateSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) return res.status(404).json({ message: "Subject not found" });

  if (req.user?.role === "Faculty" && String(subject.facultyId) !== String(req.user._id)) {
    return res.status(403).json({ message: "Access denied" });
  }

  const nextSubjectId = String(req.body.subjectId || subject.subjectId).trim();
  const nextSubjectName = String(req.body.subjectName || subject.subjectName).trim();
  let nextFacultyId = subject.facultyId;

  const duplicateBySubjectId = await Subject.findOne({
    _id: { $ne: req.params.id },
    subjectId: nextSubjectId
  });
  if (duplicateBySubjectId) {
    return res.status(400).json({ message: "Subject ID already exists" });
  }

  if (req.user?.role === "Admin" && req.body.faculty) {
    let facultyUser;
    try {
      facultyUser = await resolveFacultyUser(parseFacultyPayload(req.body));
    } catch (error) {
      return res.status(400).json({ message: error.message || "Invalid faculty details" });
    }
    nextFacultyId = facultyUser._id;
  } else if (req.user?.role === "Admin" && req.body.facultyId) {
    nextFacultyId = req.body.facultyId;
  }

  subject.subjectId = nextSubjectId;
  subject.subjectName = nextSubjectName;
  subject.facultyId = nextFacultyId;
  await subject.save();

  const io = req.app.get("io");
  if (io) io.emit("subjects:updated");
  res.json(subject);
});

exports.deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) return res.status(404).json({ message: "Subject not found" });

  if (req.user?.role === "Faculty" && String(subject.facultyId) !== String(req.user._id)) {
    return res.status(403).json({ message: "Access denied" });
  }

  await Subject.findByIdAndDelete(req.params.id);
  const io = req.app.get("io");
  if (io) io.emit("subjects:updated");
  res.json({ message: "Subject deleted" });
});
