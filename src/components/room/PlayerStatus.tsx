"use client";
import type { Team } from "@/types/game";

export function PlayerStatus({ team, connected }: { team: Team; connected: boolean }) {
  const isA = team === "A";
  return (
    <div
      className={`rounded-2xl border-2 p-4 text-center flex-1 ${isA ? "bg-sky-50 border-sky-200" : "bg-rose-50 border-rose-200"}`}
    >
      <div className="text-2xl">{isA ? "🔵" : "🔴"}</div>
      <div className={`font-black ${isA ? "text-sky-700" : "text-rose-700"}`}>KUBU {team}</div>
      <div className={`mt-1 text-sm font-black ${connected ? "text-green-600" : "text-slate-400"}`}>
        {connected ? "✓ TERHUBUNG" : "WAITING"}
      </div>
      <div className={`text-xs font-bold ${connected ? "text-green-600" : "text-slate-400"}`}>
        {connected ? "SIAP" : "MENUNGGU"}
      </div>
    </div>
  );
}
