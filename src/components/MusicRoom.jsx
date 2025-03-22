import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";

// Pastikan backend URL diambil dari environment variable
const BACKEND_URL = "https://backend-playtogether-bpw71hvzf-mustafid-kaisalanas-projects.vercel.app";
const socket = io(BACKEND_URL, {
  transports: ["websocket", "polling"],
});

export default function MusicRoom() {
  const [songUrl, setSongUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  // Terima status lagu saat pertama kali masuk
  useEffect(() => {
    socket.on("currentSong", ({ currentSong, currentTime, isPlaying }) => {
      if (currentSong) {
        setSongUrl(currentSong);
        setCurrentTime(currentTime);
        setIsPlaying(isPlaying);
      }
    });

    socket.on("playSong", ({ currentSong }) => {
      console.log("🎵 Diterima dari server:", currentSong);
      if (!currentSong) {
        console.error("🚨 URL lagu kosong!");
      }
      setSongUrl(currentSong);
      setIsPlaying(true);
    });

    socket.on("togglePlay", (state) => {
      setIsPlaying(state);
    });

    socket.on("updateTime", (time) => {
      setCurrentTime(time);
    });

    return () => {
      socket.off("currentSong");
      socket.off("playSong");
      socket.off("togglePlay");
      socket.off("updateTime");
      socket.disconnect(); // Hindari memory leak
    };
  }, []);

  // Sinkronisasi waktu pemutaran
  useEffect(() => {
    if (audioRef.current && songUrl) {
      audioRef.current.load();
      audioRef.current.currentTime = currentTime;

      if (isPlaying) {
        audioRef.current
          .play()
          .catch((error) => console.error("🚨 Tidak bisa memutar lagu:", error));
      } else {
        audioRef.current.pause();
      }
    }
  }, [songUrl, isPlaying, currentTime]);

  // Fungsi untuk upload musik
  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("music", file);

    try {
      const response = await fetch(`${BACKEND_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Gagal mengupload file");

      const data = await response.json();
      console.log("📡 Emit ke server:", data.url);
      socket.emit("playSong", { currentSong: data.url });
    } catch (error) {
      console.error("🚨 Error saat upload:", error);
    }
  };

  // Fungsi untuk pause/play
  const togglePlay = () => {
    const newState = !isPlaying;
    setIsPlaying(newState);
    socket.emit("togglePlay", newState);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
      <div className="bg-white text-black shadow-lg rounded-2xl p-6 w-full max-w-lg">
        <h1 className="text-2xl font-bold text-center mb-4">🎶 Music Room</h1>

        <label className="block text-center mb-4 cursor-pointer">
          <span className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg shadow-md transition">
            📂 Upload Lagu
          </span>
          <input type="file" onChange={handleUpload} accept="audio/*" className="hidden" />
        </label>

        {songUrl ? (
          <div className="flex flex-col items-center">
            <audio ref={audioRef} src={songUrl} controls className="w-full my-4" />
            <button onClick={togglePlay} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-md">
              {isPlaying ? "⏸ Pause" : "▶ Play"}
            </button>
          </div>
        ) : (
          <p className="text-center text-gray-500">❌ Tidak ada lagu yang dimainkan.</p>
        )}
      </div>
    </div>
  );
}
