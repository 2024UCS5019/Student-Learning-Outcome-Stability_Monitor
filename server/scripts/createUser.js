require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");
const connectDB = require("../config/db");
const { isStrongPassword, PASSWORD_POLICY_MESSAGE } = require("../utils/passwordPolicy");

const toEmailSlug = (value = "") => String(value).toLowerCase().replace(/[^a-z0-9]/g, "");

const run = async () => {
  const name = String(process.env.CREATE_USER_NAME || "").trim();
  const password = String(process.env.CREATE_USER_PASSWORD || "");
  const role = String(process.env.CREATE_USER_ROLE || "Admin").trim();
  const requestedEmailRaw = String(process.env.CREATE_USER_EMAIL || "").trim().toLowerCase();

  if (!process.env.MONGO_URI) {
    throw new Error("Missing MONGO_URI in environment.");
  }

  if (!name || !password) {
    throw new Error("Missing CREATE_USER_NAME or CREATE_USER_PASSWORD.");
  }

  if (!["Admin", "Faculty", "Student", "Viewer"].includes(role)) {
    throw new Error("Invalid CREATE_USER_ROLE. Use Admin|Faculty|Student|Viewer.");
  }

  if (!isStrongPassword(password)) {
    throw new Error(PASSWORD_POLICY_MESSAGE);
  }

  const fallbackEmail = `${toEmailSlug(name) || "user"}@local.som`;
  const email = requestedEmailRaw || fallbackEmail;

  await connectDB();

  const existing = await User.findOne({ email });
  if (existing) {
    existing.name = name;
    existing.password = password;
    existing.role = role;
    existing.isApproved = true;
    existing.isBlocked = false;
    await existing.save();
    console.log(`Updated user: ${existing.email} (${existing.role})`);
    await mongoose.disconnect();
    return;
  }

  const created = await User.create({
    name,
    email,
    password,
    role,
    isApproved: true
  });

  console.log(`Created user: ${created.email} (${created.role})`);
  await mongoose.disconnect();
};

run().catch(async (err) => {
  console.error(err?.message || err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
