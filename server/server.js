require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.set("io", io);

io.on("connection", (socket) => {
  socket.emit("connected", { message: "Real-time channel ready" });
  socket.on("disconnect", () => {});
});

server.listen(PORT, () => console.log(`Server running on ${PORT}`));
