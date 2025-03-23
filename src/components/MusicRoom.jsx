import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";

const socket = io("https://9ccf-2001-448a-4010-6b03-3e4d-ce1e-e752-5a45.ngrok-free.app");

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
    };
  }, []);

  // Sinkronisasi waktu pemutaran
  useEffect(() => {
    if (audioRef.current && songUrl) {
      audioRef.current.load(); // Pastikan audio diperbarui
      audioRef.current.currentTime = currentTime;

      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error("🚨 Tidak bisa memutar lagu:", error);
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [songUrl, isPlaying, currentTime]);

  // Fungsi untuk upload musik
  const handleUpload = async (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append("music", file);

    const response = await fetch("https://9ccf-2001-448a-4010-6b03-3e4d-ce1e-e752-5a45.ngrok-free.app/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    console.log("📡 Emit ke server:", data.url);
    setSongUrl(data.url); // Update the song URL here
    socket.emit("playSong", { currentSong: data.url });
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
          <input
            type="file"
            onChange={handleUpload}
            accept="audio/*"
            className="hidden"
          />
        </label>

        {songUrl ? (
          <div className="flex flex-col items-center">
            <audio ref={audioRef} src={songUrl} controls className="w-full my-4" />
            <button
              onClick={togglePlay}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              {isPlaying ? "Pause" : "Play"}
            </button>
          </div>
        ) : (
          <p className="text-center text-gray-500">❌ Tidak ada lagu yang dimainkan.</p>
        )}
      </div>
    </div>
  );
}
