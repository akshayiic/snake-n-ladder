import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import CreatePlayer from "./components/CreatePlayer";
import Game from "./components/Game";
import RoomJoin from "./components/RoomJoin";
import { socket } from "./lib/socket";

export default function App() {
  useEffect(() => {
    if (localStorage.getItem("userId")) {
      socket.connect(
        `${import.meta.env.VITE_BACKEND_URL}?userId=${localStorage.getItem(
          "userId"
        )}`
      );
    }
  }, []);

  return (
    <div className="flex items-center justify-center h-full w-full overflow-hidden">
      <Routes>
        <Route path="/" element={<CreatePlayer />} />
        <Route path="/join" element={<RoomJoin />} />
        <Route path="/game" element={<Game />} />
        {/* 
          <Route path="/contact" element={<Contact />} /> */}
      </Routes>
    </div>
  );
}
