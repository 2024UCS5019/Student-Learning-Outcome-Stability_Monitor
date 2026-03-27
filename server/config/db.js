const mongoose = require("mongoose");
const dns = require("dns");

const connectDB = async () => {
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
    await mongoose.connect(process.env.MONGO_URI, options);
    console.log("MongoDB Connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    throw err;
  }
};

module.exports = connectDB;
