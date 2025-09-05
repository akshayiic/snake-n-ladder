import { socket } from "@/lib/socket";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const CreatePlayer = () => {
  const navigate = useNavigate();

  const [name, setName] = useState("");

  function handleName() {
    if (!name) return;

    socket.connect(`${import.meta.env.VITE_BACKEND_URL}?userId=${name}`);

    localStorage.setItem("userId", name);

    navigate("/join");
  }

  return (
    <div className="flex items-center justify-center h-[100vh] w-full">
      <div className="flex flex-col items-center justify-center">
        <Input
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Button
          className="mt-3 bg-purple-500 text-white cursor-pointer"
          disabled={!name}
          onClick={handleName}
        >
          Search for a room
        </Button>
      </div>
    </div>
  );
};

export default CreatePlayer;
