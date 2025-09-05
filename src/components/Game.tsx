import { cn } from "@/lib/utils";
import { useRef, useState } from "react";
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

const Dice = ({ onClick }: { onClick: any }) => {
  return (
    <div className="mt-4">
      <Button variant={"outline"} onClick={onClick} className="pointer">
        Roll
      </Button>
    </div>
  );
};

const Person = () => (
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="h-5 w-5 rounded-full bg-black border-2 border-white shadow" />
  </div>
);

const rows = 10;
const cols = 10;

export default function Game() {
  const [current, setCurrent] = useState(1);

  const animatingRef = useRef(false);

  const advance = async () => {
    if (animatingRef.current) return;
    animatingRef.current = true;

    const roll = Math.floor(Math.random() * 6) + 1;

    const start = current;
    const target = Math.min(100, start + roll);
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

    animatingRef.current = false;
  };

  return (
    <div className="inline-flex flex-col-reverse items-center justify-center gap-3">
      <div className="flex gap-2">
        <Dice onClick={advance} />
      </div>

      {Array.from({ length: rows }).map((_, row) => {
        const base = row * cols;
        const isLTR = row % 2 === 0;
        const cells = Array.from({ length: cols }, (_, col) =>
          isLTR ? base + col + 1 : base + (cols - col)
        );

        return (
          <div className="flex" key={row}>
            {cells.map((n) => (
              <div className="relative" key={n}>
                <Box
                  text={n}
                  onClick={() => {}}
                  isSnake={[26, 44, 98, 90, 61].includes(n)}
                  isLadder={[3, 14, 46, 57].includes(n)}
                />
                {n === current && <Person />}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
