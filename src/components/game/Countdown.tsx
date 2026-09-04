"use client";
import { useEffect, useState } from "react";

export function Countdown({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(3);

  useEffect(() => {
    if (n === 0) {
      const t = setTimeout(onDone, 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setN((v) => v - 1), 900);
    return () => clearTimeout(t);
  }, [n, onDone]);

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
      <div
        key={n}
        className="text-8xl md:text-[10rem] font-black text-white animate-[bounceIn_.35s_ease-out]"
        style={{ textShadow: "0 10px 30px rgba(0,0,0,.4)" }}
      >
        {n === 0 ? "GO!" : n}
      </div>
    </div>
  );
}
