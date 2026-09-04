"use client";
import type { Team } from "@/types/game";

export function TeamSelector({
  selected,
  takenA,
  takenB,
  onSelect,
}: {
  selected: Team | null;
  takenA: boolean;
  takenB: boolean;
  onSelect: (t: Team) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <button
        disabled={takenA}
        onClick={() => onSelect("A")}
        className={`rounded-2xl border-2 p-6 text-center font-black transition ${
          takenA
            ? "bg-slate-100 border-slate-200 text-slate-400"
            : selected === "A"
              ? "bg-sky-500 border-sky-600 text-white scale-[0.98]"
              : "bg-sky-50 border-sky-200 hover:border-sky-400 text-sky-700 active:scale-95"
        }`}
      >
        <div className="text-3xl">🔵</div>
        <div className="mt-1">KUBU A</div>
        {takenA && <div className="text-xs mt-1">SUDAH TERISI</div>}
      </button>

      <button
        disabled={takenB}
        onClick={() => onSelect("B")}
        className={`rounded-2xl border-2 p-6 text-center font-black transition ${
          takenB
            ? "bg-slate-100 border-slate-200 text-slate-400"
            : selected === "B"
              ? "bg-rose-500 border-rose-600 text-white scale-[0.98]"
              : "bg-rose-50 border-rose-200 hover:border-rose-400 text-rose-700 active:scale-95"
        }`}
      >
        <div className="text-3xl">🔴</div>
        <div className="mt-1">KUBU B</div>
        {takenB && <div className="text-xs mt-1">SUDAH TERISI</div>}
      </button>
    </div>
  );
}
