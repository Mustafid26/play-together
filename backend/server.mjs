import express from "express";
import multer from "multer";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// CORS middleware
app.use(cors({
  origin: "https://play-together-mu.vercel.app",
  methods: ["GET", "POST"],
  credentials: true
}));

// Static file serving for uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Multer setup for handling file uploads
const storage = multer.diskStorage({
  destination: path.join(__dirname, "uploads"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + path.extname(file.originalname);
    cb(null, uniqueSuffix);
  },
});
const upload = multer({ storage });

// Variable to store current song state
let isPlaying = false;
let currentSong = null;

// Upload endpoint for music file
app.post("/upload", upload.single("music"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fileUrl = `https://backend-playtogether.vercel.app/uploads/${req.file.filename}`;
  console.log("✅ File diterima:", fileUrl);

  // Respond with the file URL
  res.json({ url: fileUrl });

  // Update current song status
  isPlaying = true;
  currentSong = fileUrl;
});

// Polling endpoint to provide song status
app.get("/polling", (req, res) => {
  res.json({
    isPlaying,
    currentSong
  });
});

// Start server
server.listen(5000, () => {
  console.log("🚀 Server berjalan di http://localhost:5000");
});
