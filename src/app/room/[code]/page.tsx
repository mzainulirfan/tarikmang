"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRoom } from "@/hooks/useRoom";
import { RoomQR } from "@/components/room/RoomQR";
import { PlayerStatus } from "@/components/room/PlayerStatus";
import { TugArena } from "@/components/game/TugArena";
import { ScoreBoard } from "@/components/game/ScoreBoard";
import { Countdown } from "@/components/game/Countdown";
import { Confetti } from "@/components/game/Confetti";
import { handleTimeout, nextRoundOrFinish, resetRoom, startCountdown, startRound } from "@/lib/room/store";
import { getGameWinner } from "@/lib/game/scoring";
import { playSound, isSoundEnabled, setSoundEnabled } from "@/lib/sound";

export default function DisplayPage() {
  const params = useParams<{ code: string }>();
  const code = (params.code as string)?.toUpperCase();
  const { room } = useRoom(code);
  const router = useRouter();
  const [countdownKey, setCountdownKey] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [soundOn, setSoundOn] = useState(true);
  const [confettiKey, setConfettiKey] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => setSoundOn(isSoundEnabled()), []);

  // timer for playing state — jangan depend ke `room` full biar tidak reset tiap polling 400ms
  useEffect(() => {
    if (!room || room.status !== "playing" || !room.questionStartedAt) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    const duration = room.config.durationSec;
    const started = room.questionStartedAt;
    const tick = () => {
      const elapsed = (Date.now() - started) / 1000;
      const left = Math.max(0, duration - elapsed);
      setTimeLeft(+left.toFixed(1));
      if (left <= 0) {
        clearInterval(timerRef.current!);
        void handleTimeout(code);
      }
    };
    tick();
    timerRef.current = setInterval(tick, 100);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [room?.status, room?.questionStartedAt, room?.config.durationSec, code]);

  // fallback: jika playing terlalu lama (tab throttled) paksa timeout setelah duration+1s
  useEffect(() => {
    if (!room || room.status !== "playing" || !room.questionStartedAt) return;
    const t = setTimeout(() => void handleTimeout(code), (room.config.durationSec + 1) * 1000);
    return () => clearTimeout(t);
  }, [room?.status, room?.questionStartedAt, room?.config.durationSec, code]);

  // auto handle result -> nextRound cepat jika benar, sedikit delay jika seri
  useEffect(() => {
    if (!room) return;
    if (room.status === "result" && room.lastResult) {
      const isWin = room.lastResult.winner === "A" || room.lastResult.winner === "B";
      if (isWin) {
        playSound("rope");
        setConfettiKey((k) => k + 1);
      } else {
        playSound("wrong");
      }
      const delay = isWin ? 1200 : 1500; // perbaiki delay: benar langsung next 1.2s, seri 1.5s (sebelumnya 2.2s)
      const t = setTimeout(() => void nextRoundOrFinish(code), delay);
      return () => clearTimeout(t);
    }
    if (room.status === "finished") {
      playSound("winner");
      setConfettiKey((k) => k + 1);
    }
    if (room.status === "countdown") {
      playSound("countdown");
    }
  }, [room?.status, room?.lastResult, code, room]);

  if (!room) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10 text-center">
        <div className="bg-white rounded-3xl p-8 shadow">Room {code} tidak ditemukan atau sudah expired (24 jam).</div>
        <a href="/host" className="mt-4 inline-block bg-sky-500 text-white font-black px-6 py-3 rounded-2xl">Buat Game Baru</a>
      </main>
    );
  }

  const bothReady = !!room.players.A.token && !!room.players.B.token;

  const winner = room.status === "finished" ? getGameWinner(room.scoreA, room.scoreB) : null;

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      <Confetti trigger={confettiKey} />
      {room.suddenDeath && room.status !== "finished" && (
        <div className="mb-3 bg-amber-400 text-slate-900 font-black text-center py-2 rounded-2xl animate-pulse">⚡ SUDDEN DEATH — Ronde {room.round} penentuan!</div>
      )}
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-black">TARIK ANGKA! <span className="text-slate-400 text-sm">DISPLAY — {code}</span></h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const v = !soundOn;
              setSoundOn(v);
              setSoundEnabled(v);
            }}
            className={`px-3 py-2 rounded-xl text-xs font-black border ${soundOn ? "bg-white border-slate-200" : "bg-slate-200 border-slate-300"}`}
          >
            {soundOn ? "🔊 Sound ON" : "🔇 OFF"}
          </button>
          <button onClick={() => document.documentElement.requestFullscreen?.()} className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-black">Fullscreen</button>
          <button onClick={() => { void resetRoom(code); setCountdownKey(k=>k+1); }} className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-black">Reset</button>
        </div>
      </header>

      {room.status === "waiting" || room.status === "ready" ? (
        <section className="bg-white/90 backdrop-blur rounded-[2rem] border border-white p-6 md:p-8 shadow-[0_18px_45px_rgba(15,23,42,.12)]">
          <div className="grid md:grid-cols-2 gap-6">
            <RoomQR code={code} />
            <div className="flex flex-col gap-4">
              <div className="flex gap-3">
                <PlayerStatus team="A" connected={!!room.players.A.token} />
                <PlayerStatus team="B" connected={!!room.players.B.token} />
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 text-sm">
                <div className="font-black">Waiting Room</div>
                <div className="text-slate-500 font-semibold mt-1">
                  {bothReady ? "Kedua tim siap! Host dapat memulai." : "Menunggu 2 HP scan QR dan pilih tim."}
                </div>
                <div className="mt-2 text-xs font-mono">Join: {typeof window !== "undefined" ? `${window.location.origin}/join/${code}` : `/join/${code}`}</div>
              </div>

              <button
                disabled={!bothReady}
                onClick={() => { void startCountdown(code).then(()=>setCountdownKey(k=>k+1)); }}
                className="w-full bg-sky-500 hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black py-4 rounded-2xl transition"
              >
                {bothReady ? "MULAI — Countdown 3-2-1" : "Menunggu Pemain..."}
              </button>

              <div className="text-xs text-slate-500 font-semibold">Config: {room.config.difficulty} / {room.config.operation} / {room.config.totalRounds} ronde / {room.config.durationSec}s</div>
            </div>
          </div>
        </section>
      ) : room.status === "countdown" ? (
        <Countdown key={countdownKey} onDone={() => { playSound("start"); void startRound(code); }} />
      ) : null}

      {(room.status === "playing" || room.status === "result" || room.status === "finished") && (
        <section className="bg-white/90 backdrop-blur rounded-[2rem] border border-white overflow-hidden shadow-[0_18px_45px_rgba(15,23,42,.12)]">
          <ScoreBoard scoreA={room.scoreA} scoreB={room.scoreB} round={room.round} totalRounds={room.config.totalRounds} />
          <TugArena scoreA={room.scoreA} scoreB={room.scoreB} />
          <div className="p-5 md:p-8 text-center">
            <div className="flex justify-center items-center gap-2 mb-3">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Pertanyaan</span>
              {room.status === "playing" && (
                <span className={`rounded-full px-3 py-1 text-xs font-black ${timeLeft <= 3 ? "bg-rose-100 text-rose-700 animate-pulse" : "bg-amber-100 text-amber-700"}`}>
                  {timeLeft.toFixed(1)} dtk
                </span>
              )}
            </div>

            {room.question ? (
              <>
                <div className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-2 animate-bounceIn">{room.question.text}</div>
                <div className="text-xs font-bold text-slate-400">Opsi (jawab di HP): {room.question.options.join(" • ")}</div>
              </>
            ) : (
              <div className="text-2xl font-black text-slate-400">Memuat soal...</div>
            )}

            {room.lastResult && (
              <div className={`mt-4 text-xl font-black ${room.lastResult.winner === "A" ? "text-sky-600" : room.lastResult.winner === "B" ? "text-rose-600" : "text-amber-600"}`}>
                {room.lastResult.winner === "draw" ? "🤝 SERI — Tali tidak bergerak" : `🏳️ ${room.lastResult.text}`}
              </div>
            )}

            {room.status === "playing" && (
              <div className="mt-3 flex flex-col items-center gap-2">
                <div className="flex justify-center gap-4 text-xs font-bold">
                  <span className={room.answers.A ? "text-green-600" : "text-slate-400"}>🔵 A {room.answers.A ? "✓ menjawab" : "… menunggu"}</span>
                  <span className={room.answers.B ? "text-green-600" : "text-slate-400"}>🔴 B {room.answers.B ? "✓ menjawab" : "… menunggu"}</span>
                </div>
                <button onClick={() => void handleTimeout(code)} className="text-xs font-black text-slate-500 underline">⏭ Lewati (paksa next jika diam)</button>
              </div>
            )}

            {room.status === "finished" && (
              <div className="mt-6">
                <div className="text-7xl">{winner === "draw" ? "🤝" : "🏆"}</div>
                <div className="text-3xl font-black mt-2">{winner === "draw" ? "SERI!" : winner === "A" ? "KUBU A MENANG!" : "KUBU B MENANG!"}</div>
                <div className="text-slate-500 font-semibold mt-1">Skor akhir: A {room.scoreA} — {room.scoreB} B</div>
                <div className="flex justify-center gap-3 mt-4">
                  <button onClick={() => void resetRoom(code)} className="bg-sky-500 text-white font-black px-6 py-3 rounded-2xl">Main Lagi</button>
                  <button onClick={() => router.push("/host")} className="bg-white border-2 border-slate-200 px-6 py-3 rounded-2xl font-black">Buat Room Baru</button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
