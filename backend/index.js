import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import assistantRouter from "./routes/assistant.js";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { runCode } from "./runManager.js";

const __filename = fileURLToPath(import.meta.url);
const backendDir = path.dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: path.join(backendDir, ".env") }); 

const app = express();

// Enable CORS for all routes
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

const rooms = new Map();

io.on("connection", (socket) => {
  console.log("User Connected", socket.id);

  let currentRoom = null;
  let currentUser = null;

  socket.on("join", ({ roomId, userName }) => {
    if (currentRoom) {
      socket.leave(currentRoom);
      rooms.get(currentRoom).delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));
    }

    currentRoom = roomId;
    currentUser = userName;

    socket.join(roomId);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Set());
    }

    rooms.get(roomId).add(userName);

    io.to(roomId).emit("userJoined", Array.from(rooms.get(currentRoom)));
  });

  socket.on("codeChange", ({ roomId, code }) => {
    socket.to(roomId).emit("codeUpdate", code);
  });

  socket.on("leaveRoom", () => {
    if (currentRoom && currentUser) {
      rooms.get(currentRoom).delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));

      socket.leave(currentRoom);

      currentRoom = null;
      currentUser = null;
    }
  });

  socket.on("typing", ({ roomId, userName }) => {
    socket.to(roomId).emit("userTyping", userName);
  });

  socket.on("languageChange", ({ roomId, language }) => {
    io.to(roomId).emit("languageUpdate", language);
  });

  socket.on("disconnect", () => {
    if (currentRoom && currentUser) {
      rooms.get(currentRoom).delete(currentUser);
      io.to(currentRoom).emit("userJoined", Array.from(rooms.get(currentRoom)));
    }
    console.log("user Disconnected");
  });

    socket.on("run-code", async ({ code, lang, stdin }) => {
    socket.emit("run-output", { system: "---- new run ----\n" });
    await runCode(socket, { code, lang, stdin });
  });

});

const port = process.env.PORT || 5000;
// Get project root directory (parent of backend)
const projectRoot = path.resolve(backendDir, "..");

app.use(express.json({ limit: "1mb" })); // parse JSON bodies

// Log all API requests for debugging
app.use("/api", (req, res, next) => {
  console.log(`API Request: ${req.method} ${req.path}`);
  next();
});

// mount assistant API under /api (before static files)
app.use("/api", assistantRouter);


app.use(express.static(path.join(projectRoot, "frontend", "dist")));

app.use((req, res) => {
  res.sendFile(path.join(projectRoot, "frontend", "dist", "index.html"));
});

server.listen(port, () => {
  console.log("server is working on port", port);
});
