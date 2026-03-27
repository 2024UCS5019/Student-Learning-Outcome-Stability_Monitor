const mongoose = require("mongoose");
const dns = require("dns");

const describeMongoUri = (uri = "") => {
  try {
    const host = uri.includes("@") ? uri.split("@").pop().split("/")[0] : uri.split("//")[1]?.split("/")[0];
    const scheme = uri.startsWith("mongodb+srv://") ? "mongodb+srv" : uri.startsWith("mongodb://") ? "mongodb" : "unknown";
    return `${scheme}://${host || "?"}`;
  } catch {
    return "unknown";
  }
};

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    const error = new Error(
      "MongoDB connection string missing. Set MONGO_URI (or MONGODB_URI) in your environment variables."
    );
    error.statusCode = 500;
    throw error;
  }

  const dbName = String(process.env.MONGO_DB_NAME || "").trim();
  console.log(`MongoDB: connecting (${describeMongoUri(mongoUri)})${dbName ? ` dbName=${dbName}` : ""}`);

  const dnsServers = String(process.env.MONGO_DNS_SERVERS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (dnsServers.length) {
    console.log(`MongoDB: using custom DNS servers (${dnsServers.join(", ")})`);
    dns.setServers(dnsServers);
  }

  try {
    const options = dbName ? { dbName } : undefined;
    await mongoose.connect(mongoUri, options);
    console.log("MongoDB Connected");
  } catch (err) {
    console.log("MongoDB connection error:", err?.message || err);
    throw err;
  }
};

module.exports = connectDB;
