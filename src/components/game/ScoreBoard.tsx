"use client";

export function ScoreBoard({
  scoreA,
  scoreB,
  round,
  totalRounds,
}: {
  scoreA: number;
  scoreB: number;
  round: number;
  totalRounds: number;
}) {
  return (
    <div className="grid grid-cols-3 items-center gap-3 p-4 md:p-6 border-b border-slate-100">
      <div className="rounded-2xl bg-sky-50 border-2 border-sky-200 p-3 md:p-4 text-center">
        <div className="text-2xl">🔵</div>
        <div className="font-black text-sky-700 text-sm">KUBU A</div>
        <div className="text-2xl font-black">{scoreA}</div>
      </div>
      <div className="text-center">
        <div className="text-xs uppercase tracking-widest font-black text-slate-400">Babak</div>
        <div className="text-2xl font-black text-slate-900">
          {Math.min(round, totalRounds)} / {totalRounds}
        </div>
      </div>
      <div className="rounded-2xl bg-rose-50 border-2 border-rose-200 p-3 md:p-4 text-center">
        <div className="text-2xl">🔴</div>
        <div className="font-black text-rose-700 text-sm">KUBU B</div>
        <div className="text-2xl font-black">{scoreB}</div>
      </div>
    </div>
  );
}
