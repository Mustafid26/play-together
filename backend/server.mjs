import express from "express";
import multer from "multer";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";
import { Server } from "socket.io";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
app.use(cors({
  origin: ["https://play-together-mu.vercel.app"],  // Allow both domains
  methods: ["GET", "POST"],
  credentials: true
}));

const io = new Server(server, {
  cors: {
    origin: ["https://play-together-mu.vercel.app"],  // Allow both domains
    methods: ["GET", "POST"],
    credentials: true,
  }
});

// Middleware CORS untuk API Express
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const storage = multer.diskStorage({
  destination: path.join(__dirname, "uploads"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, uniqueSuffix);
  },
});
const upload = multer({ storage });

let isPlaying = false;

app.post("/upload", upload.single("music"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fileUrl = `https://b64c-2001-448a-4010-6b03-3e4d-ce1e-e752-5a45.ngrok-free.app/uploads/${req.file.filename}`;
  console.log("✅ File diterima:", fileUrl);

  res.json({ url: fileUrl });

  isPlaying = true;
  io.emit("playSong", { currentSong: fileUrl, isPlaying });
});

// Health Check Endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running!" });
});

// Status Endpoint
app.get("/status", (req, res) => {
  res.json({ isPlaying });
});

io.on("connection", (socket) => {
  console.log("⚡ Client terhubung:", socket.id);

  socket.on("playSong", ({ currentSong }) => {
    console.log("📡 Menerima playSong:", currentSong);
    isPlaying = true;
    io.emit("playSong", { currentSong, isPlaying });
  });

  socket.on("togglePlay", (state) => {
    isPlaying = state;
    io.emit("togglePlay", isPlaying);
  });
});

server.listen(5000, () => {
  console.log("🚀 Server berjalan di http://localhost:5000");
});
