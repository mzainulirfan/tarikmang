"use client";
import { clampRope } from "@/lib/game/scoring";

export function TugArena({ scoreA, scoreB }: { scoreA: number; scoreB: number }) {
  const pos = scoreA - scoreB;
  const clamped = clampRope(pos, 5);
  const shift = clamped * 5.2;

  return (
    <div className="relative h-52 md:h-64 overflow-hidden rounded-none bg-gradient-to-b from-emerald-300 to-green-400">
      <div className="absolute inset-x-0 bottom-0 h-9 bg-green-700/20" />
      <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-white/70 border-x border-white/80 border-dashed" />
      <div className="absolute left-1/2 -translate-x-1/2 top-3 bg-white/90 rounded-full px-3 py-1 text-xs font-black text-slate-500 shadow">
        GARIS TENGAH
      </div>

      <div
        className="absolute left-[7%] right-[7%] top-[57%] h-5 md:h-6 rounded-full transition-transform duration-500"
        style={{
          transform: `translateX(${shift}%)`,
          background: `repeating-linear-gradient(90deg,#b7791f 0 12px,#d69e2e 12px 24px,#b7791f 24px 36px)`,
          boxShadow: `inset 0 2px 3px rgba(255,255,255,.35), 0 3px 8px rgba(120,70,0,.22)`,
        }}
      />
      <div
        className="absolute top-[40%] left-1/2 transition-all duration-500 text-3xl"
        style={{ transform: `translateX(calc(-50% + ${shift}vw))` }}
      >
        🏳️
      </div>

      <div
        className="absolute left-[3%] top-[37%] text-5xl md:text-6xl transition-all duration-500 select-none"
        style={{ transform: `translateX(${clamped * 1.4}%)` }}
      >
        🧒
      </div>
      <div
        className="absolute right-[3%] top-[37%] text-5xl md:text-6xl transition-all duration-500 select-none"
        style={{ transform: `scaleX(-1) translateX(${clamped * 1.4}%)` }}
      >
        👧
      </div>

      <div className="absolute left-[3%] bottom-1 text-xs font-black text-sky-900">TIM A</div>
      <div className="absolute right-[3%] bottom-1 text-xs font-black text-rose-900">TIM B</div>
    </div>
  );
}
