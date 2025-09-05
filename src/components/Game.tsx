import { socket } from "@/lib/socket";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "./ui/button";

type BoxProps = {
  text: number;
  onClick?: (n: number) => void;
  isSnake?: boolean;
  isLadder?: boolean;
};

const SNAKE_BACK: Record<number, number> = {
  26: 5,
  44: 12,
  98: 21,
  90: 31,
  61: 39,
};

const LADDER_UP: Record<number, number> = {
  3: 37,
  14: 32,
  46: 65,
  57: 91,
};

const ANIM_TOTAL_MS = 1000;
const LAND_PAUSE_MS = 400;

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
const Box = ({
  text,
  onClick,
  isSnake = false,
  isLadder = false,
}: BoxProps) => (
  <div
    className={cn(
      "w-15 h-15 border flex items-center justify-center text-lg select-none",
      {
        "bg-purple-500": isSnake,
        "bg-orange-500": isLadder,
      }
    )}
    onClick={() => onClick?.(text)}
  >
    {text}
  </div>
);

const Dice = ({ onClick, disabled }: { onClick: any; disabled?: boolean }) => {
  return (
    <div className="mt-4">
      <Button
        variant={"outline"}
        onClick={onClick}
        className={cn(disabled ? "cursor-not-allowed" : "cursor-pointer")}
        disabled={disabled}
      >
        Roll
      </Button>
    </div>
  );
};

const COLORS = [
  "#111827",
  "#ef4444",
  "#10b981",
  "#3b82f6",
  "#f59e0b",
  "#8b5cf6",
];
const Person = ({ color }: { color: string }) => (
  <div
    className="h-4 w-4 rounded-full border-2 border-white shadow absolute"
    style={{ backgroundColor: color }}
  />
);

const rows = 10;
const cols = 10;

export default function Game() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [current, setCurrent] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [roll, setRoll] = useState<number | null>(null);
  const [showRoll, setShowRoll] = useState(false);

  const [players, setPlayers] = useState<string[]>([]);

  const [positions, setPositions] = useState<Record<string, number>>({});

  const animatingRef = useRef(false);

  useEffect(() => {
    const roomId = params.get("roomId");
    if (!roomId) {
      navigate("/join", { replace: true });
      return;
    }
    const off = socket.listenForRoomUsers((users) => {
      setPlayers(users);
    });
    socket.getRoomUsers(roomId);
    return () => off?.();
  }, [navigate, params]);

  useEffect(() => {
    setPositions((prev) => {
      const next: Record<string, number> = {};
      for (const p of players) next[p] = prev[p] ?? 1;
      return next;
    });
  }, [players]);

  useEffect(() => {
    if (players.length < 2) return;
    if (!players) return;
    socket.setPositionForUser(localStorage.getItem("userId") || "", current);
  }, [current]);

  const advance = async () => {
    if (animatingRef.current) return;
    animatingRef.current = true;
    setIsAnimating(true);
    try {
      const r = Math.floor(Math.random() * 6) + 1;
      setRoll(r);
      setShowRoll(true);
      const hideId = setTimeout(() => setShowRoll(false), 1200);

      const start = current;
      const target = Math.min(100, start + r);
      const steps = target - start || 0;
      const perStepMs = steps
        ? Math.max(40, Math.floor(ANIM_TOTAL_MS / steps))
        : ANIM_TOTAL_MS;

      for (let i = 0; i < steps; i++) {
        await sleep(perStepMs);
        setCurrent((prev) => Math.min(100, prev + 1));
      }

      await sleep(LAND_PAUSE_MS);
      setCurrent((prev) => {
        if (LADDER_UP[prev]) return LADDER_UP[prev];
        if (SNAKE_BACK[prev]) return SNAKE_BACK[prev];
        return prev;
      });

      clearTimeout(hideId);
    } finally {
      animatingRef.current = false;
      setIsAnimating(false);
    }
  };

  return (
    <div className="inline-flex flex-col-reverse items-center justify-center gap-3 relative">
      <div className="relative">
        <Dice
          onClick={advance}
          disabled={isAnimating}
          aria-busy={isAnimating}
        />
        {showRoll && roll != null && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md border text-sm bg-white shadow">
            🎲 {roll}
          </div>
        )}
      </div>

      {Array.from({ length: rows }).map((_, row) => {
        const base = row * cols;
        const isLTR = row % 2 === 0;
        const cells = Array.from({ length: cols }, (_, col) =>
          isLTR ? base + col + 1 : base + (cols - col)
        );

        return (
          <div className="flex" key={row}>
            {cells.map((n) => {
              const playersHere = players.filter(
                (p) => (positions[p] ?? 1) === n
              );
              return (
                <div className="relative" key={n}>
                  <Box
                    text={n}
                    onClick={() => {}}
                    isSnake={[26, 44, 98, 90, 61].includes(n)}
                    isLadder={[3, 14, 46, 57].includes(n)}
                  />

                  {playersHere.length > 0 && (
                    <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 place-items-center">
                      {playersHere.slice(0, 4).map((p, i) => (
                        <Person key={p} color={COLORS[i % COLORS.length]} />
                      ))}

                      {playersHere.length > 4 && (
                        <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 text-[10px] px-1 py-0.5 rounded bg-black text-white">
                          +{playersHere.length - 4}
                        </div>
                      )}
                    </div>
                  )}

                  {n === current && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="h-4 w-4 rounded-full border-2 border-white shadow bg-gray-800" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {players.length < 2 && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/50">
          <div className="px-6 py-4 rounded-lg bg-white text-black shadow-lg">
            Waiting for others to join...
          </div>
          <Button
            className="mt-3 bg-purple-500 text-white"
            onClick={() => navigate("/join")}
          >
            Join another room
          </Button>
        </div>
      )}
    </div>
  );
}
