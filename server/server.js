require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Promise Rejection:", reason);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  process.exit(1);
});
const expandLocalOrigins = (origins) => {
  const expanded = new Set(origins);
  for (const origin of origins) {
    if (origin.includes("localhost")) expanded.add(origin.replace("localhost", "127.0.0.1"));
    if (origin.includes("127.0.0.1")) expanded.add(origin.replace("127.0.0.1", "localhost"));
  }
  return [...expanded];
};

const socketAllowedOrigins = expandLocalOrigins(
  (process.env.CLIENT_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);

const io = new Server(server, {
  cors: {
    origin: socketAllowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
  }
});

app.set("io", io);

io.on("connection", (socket) => {
  socket.emit("connected", { message: "Real-time channel ready" });
  socket.on("disconnect", () => {});
});

const start = async () => {
  console.log("Starting server...");
  await connectDB();
  server.listen(PORT, () => console.log(`Server running on ${PORT}`));
};

start().catch((err) => {
  console.error("Failed to start server:", err?.message || err);
  process.exit(1);
});
