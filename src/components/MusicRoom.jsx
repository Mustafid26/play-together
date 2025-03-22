import { useState, useEffect, useRef } from "react";

export default function MusicRoom() {
  const [songUrl, setSongUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  // Fungsi untuk memeriksa status lagu setiap 3 detik
  const fetchSongStatus = async () => {
    try {
      const response = await fetch('https://backend-playtogether.vercel.app/polling');
      const data = await response.json();
      
      if (data.currentSong) {
        setSongUrl(data.currentSong);
        setIsPlaying(data.isPlaying);
        setCurrentTime(data.currentTime);
      }
    } catch (error) {
      console.error("Error fetching song status:", error);
    }
  };

  // Polling setiap 3 detik
  useEffect(() => {
    const intervalId = setInterval(fetchSongStatus, 3000); // Polling setiap 3 detik

    return () => clearInterval(intervalId); // Bersihkan interval saat komponen tidak digunakan lagi
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

    const response = await fetch("https://backend-playtogether-5er99fokn-mustafid-kaisalanas-projects.vercel.app/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    console.log("📡 Emit ke server:", data.url);
    console.log(data);
    // Kirim URL lagu ke server jika perlu (atau update status langsung)
    setSongUrl(data.url);
    setIsPlaying(true);
  };

  // Fungsi untuk pause/play
  const togglePlay = () => {
    const newState = !isPlaying;
    setIsPlaying(newState);
    // Kirim state baru ke server jika perlu (atau simpan status di server)
    fetch('https://backend-playtogether.vercel.app/togglePlay', {
      method: "POST",
      body: JSON.stringify({ state: newState }),
      headers: { "Content-Type": "application/json" }
    });
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
          </div>
        ) : (
          <p className="text-center text-gray-500">❌ Tidak ada lagu yang dimainkan.</p>
        )}
        
        <button 
          onClick={togglePlay}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg mt-4"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>
    </div>
  );
}
