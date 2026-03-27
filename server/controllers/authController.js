const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Student = require("../models/Student");
const asyncHandler = require("../utils/asyncHandler");
const { isStrongPassword, PASSWORD_POLICY_MESSAGE } = require("../utils/passwordPolicy");

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const normalizeUsername = (value = "") => value.trim();
const toEmailSlug = (value = "") => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const buildUniqueInternalEmail = async (username) => {
  const baseSlug = toEmailSlug(username) || "user";
  let candidate = `${baseSlug}@local.som`;
  let suffix = 1;

  while (await User.findOne({ email: candidate })) {
    candidate = `${baseSlug}${suffix}@local.som`;
    suffix += 1;
  }

  return candidate;
};

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d"
  });

const resolveStudentProfileForUser = async (user) => {
  const email = String(user?.email || "").toLowerCase().trim();
  if (email) {
    const byEmail = await Student.findOne({ email }).select("_id").lean();
    if (byEmail) return byEmail;
  }

  const name = String(user?.name || "").trim();
  if (!name) return null;
  return Student.findOne({ name: new RegExp(`^${escapeRegex(name)}$`, "i") }).select("_id").lean();
};

const normalizeLegacyStudentToViewer = async (user) => {
  if (!user || user.role !== "Student") return user;
  const profile = await resolveStudentProfileForUser(user);
  if (profile) return user;
  user.role = "Viewer";
  await user.save();
  return user;
};

exports.register = asyncHandler(async (req, res) => {
  const name = normalizeUsername(String(req.body.name || req.body.username || ""));
  const incomingEmail = String(req.body.email || "").trim().toLowerCase();
  const { password } = req.body;
  const requestedRole = "Viewer";

  if (!name || !password) {
    return res.status(400).json({ message: "Name and password are required" });
  }

  if (!isStrongPassword(password)) {
    return res.status(400).json({ message: PASSWORD_POLICY_MESSAGE });
  }

  if (incomingEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(incomingEmail)) {
    return res.status(400).json({ message: "Please enter a valid email address" });
  }

  const email = incomingEmail || await buildUniqueInternalEmail(name);
  const exists = await User.findOne({
    $or: [
      { email },
      { name: new RegExp(`^${escapeRegex(name)}$`, "i") }
    ]
  });
  if (exists) return res.status(400).json({ message: "User already exists" });

  const user = await User.create({ name, email, password, role: requestedRole, isApproved: false });

  res.status(201).json({
    id: user._id,
    name: user.name,
    role: user.role
  });
});

exports.login = asyncHandler(async (req, res) => {
  const usernameOrEmail = String(req.body.username || req.body.email || "").trim();
  const { password } = req.body;

  if (!usernameOrEmail || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  const normalizedEmail = usernameOrEmail.toLowerCase();
  const user = await User.findOne({
    $or: [
      { email: normalizedEmail },
      { name: new RegExp(`^${escapeRegex(usernameOrEmail)}$`, "i") }
    ]
  });

  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  await normalizeLegacyStudentToViewer(user);

  if (user.role !== "Admin" && user.isApproved === false) {
    return res.status(403).json({ message: "Your account is pending admin approval." });
  }

  if (user.role === "Student" && user.isBlocked) {
    return res.status(403).json({ message: "Your account is blocked" });
  }

  res.json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id)
  });
});

exports.googleAuth = asyncHandler(async (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'your_google_client_id_here') {
    return res.status(400).json({ message: 'Google OAuth not configured. Please set up credentials in .env file.' });
  }

  // Force the Google account chooser every time (useful when multiple accounts are signed in).
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "profile email",
    prompt: "select_account"
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

exports.googleCallback = asyncHandler(async (req, res) => {
  const { code } = req.query;
  const { data } = await require('axios').post('https://oauth2.googleapis.com/token', {
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    grant_type: 'authorization_code'
  });
  
  const { data: profile } = await require('axios').get('https://www.googleapis.com/oauth2/v1/userinfo', {
    headers: { Authorization: `Bearer ${data.access_token}` }
  });
  
  const user = await User.findOne({ email: String(profile.email || "").toLowerCase().trim() });
  if (!user) {
    return res.redirect(`${process.env.CLIENT_URL}/login?error=${encodeURIComponent("Account not found. Contact Admin.")}`);
  }

  await normalizeLegacyStudentToViewer(user);

  if (user.role !== "Admin" && user.isApproved === false) {
    return res.redirect(`${process.env.CLIENT_URL}/login?error=${encodeURIComponent("Your account is pending admin approval.")}`);
  }

  if (user.role === "Student" && user.isBlocked) {
    return res.redirect(`${process.env.CLIENT_URL}/login?error=${encodeURIComponent("Your account is blocked")}`);
  }
  
  const token = generateToken(user._id);
  res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({ id: user._id, name: user.name, email: user.email, role: user.role }))}`);
});

exports.approveUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });

  if (user.role === "Admin") {
    return res.status(400).json({ message: "Admin accounts do not require approval" });
  }

  user.isApproved = true;
  await user.save();

  res.json({ message: "User approved" });
});
