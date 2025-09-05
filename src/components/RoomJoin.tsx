// RoomJoin.tsx
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { socket } from "@/lib/socket";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

const RoomJoin = () => {
  const navigate = useNavigate();

  const [isConnected, setIsConnected] = useState<boolean>(false);

  const [rooms, setRooms] = useState<{ roomId: string; users: string[] }[]>([]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (socket?.getConnection()) {
        setIsConnected(true);
        clearInterval(intervalId);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (isConnected) {
      socket?.getRooms();
      const off = socket.listenForRooms((list) => setRooms(list));
      return () => off?.();
    }
  }, [isConnected]);

  return (
    <div className="w-full max-w-md mx-auto flex items-center flex-col justify-center h-[100vh]">
      <h2 className="text-lg font-semibold mb-3">Available Rooms</h2>
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-700">
                Rooms
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-700">
                Number of players
              </th>
              <th className="px-4 py-2 text-left font-medium text-gray-700">
                Join
              </th>
            </tr>
          </thead>

          <tbody>
            {rooms.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-gray-500">
                  No rooms yet.
                </td>
              </tr>
            ) : (
              rooms.map((room) => (
                <tr key={room.roomId} className="odd:bg-white even:bg-gray-50">
                  <td className="px-4 py-2">{room.roomId}</td>
                  <td className="px-4 py-2">{room.users.length}</td>
                  <td className="px-4 py-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="cursor-pointer"
                      onClick={() => {
                        socket.joinRoom(
                          room.roomId,
                          localStorage.getItem("userId") ?? ""
                        );
                        navigate(`/game?roomId=${room.roomId}`);
                      }}
                      disabled={room.users.length >= 4}
                    >
                      Join
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="m-4">OR</div>
      <CreateRoomDialog setRooms={setRooms} />
    </div>
  );
};

export default RoomJoin;

function CreateRoomDialog({}: {
  onCreate?: (data: { name: string; maxPlayers: number }) => void;
  setRooms: React.Dispatch<
    React.SetStateAction<
      {
        roomId: string;
        users: string[];
      }[]
    >
  >;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const submit = () => {
    socket.createRoom(name);
    setOpen(false);
    setName("");

    socket.getRooms();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="destructive"
          className="bg-purple-500 text-white cursor-pointer"
        >
          Create a new Room
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle>Create a Room</DialogTitle>
          <DialogDescription>
            Set a room name and choose how many players can join.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="room-name">Room name</Label>
            <Input
              id="room-name"
              placeholder="e.g., Alpha"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={submit}
            className="bg-purple-600 text-white hover:bg-purple-700"
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
