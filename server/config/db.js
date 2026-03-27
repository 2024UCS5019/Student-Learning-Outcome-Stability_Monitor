const mongoose = require("mongoose");
const dns = require("dns");

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    const error = new Error(
      "MongoDB connection string missing. Set MONGO_URI (or MONGODB_URI) in your environment variables."
    );
    error.statusCode = 500;
    throw error;
  }

  const dnsServers = String(process.env.MONGO_DNS_SERVERS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (dnsServers.length) {
    dns.setServers(dnsServers);
  }

  try {
    const dbName = String(process.env.MONGO_DB_NAME || "").trim();
    const options = dbName ? { dbName } : undefined;
    await mongoose.connect(mongoUri, options);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    throw err;
  }
};

module.exports = connectDB;
