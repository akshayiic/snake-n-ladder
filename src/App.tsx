import { Route, Routes } from "react-router-dom";
import "./App.css";
import Game from "./components/Game";
import RoomJoin from "./components/RoomJoin";

export default function App() {
  // socket.connect(`${import.meta.env.VITE_BACKEND_URL}`);
  return (
    <div className="flex items-center justify-center h-full w-full overflow-hidden">
      <Routes>
        <Route path="/" element={<RoomJoin />} />
        <Route path="/game" element={<Game />} />
        {/* 
          <Route path="/contact" element={<Contact />} /> */}
      </Routes>
    </div>
  );
}
