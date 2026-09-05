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

  useEffect(() => {
    if (!room || room.status !== "playing" || !room.questionStartedAt) return;
    const t = setTimeout(() => void handleTimeout(code), (room.config.durationSec + 1) * 1000);
    return () => clearTimeout(t);
  }, [room?.status, room?.questionStartedAt, room?.config.durationSec, code]);

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
      const t = setTimeout(() => void nextRoundOrFinish(code), 0);
      return () => clearTimeout(t);
    }
    if (room.status === "finished") {
      playSound("winner");
      setConfettiKey((k) => k + 1);
    }
    if (room.status === "countdown") {
      playSound("countdown");
    }
  }, [room?.status, room?.lastResult?.winner, room?.lastResult?.text, code]);

  if (!room) {
    return (
      <main className="min-h-dvh grid place-items-center bg-gradient-to-br from-sky-50 to-amber-50 p-6">
        <div className="bg-white rounded-[2rem] p-8 shadow-xl text-center max-w-md w-full">
          <div className="text-5xl">🛰️</div>
          <div className="mt-3 font-black text-xl">Room {code} tidak ditemukan</div>
          <div className="text-sm font-semibold text-slate-500 mt-1">Sudah expired 24 jam atau kode salah.</div>
          <a href="/host" className="mt-6 inline-flex bg-sky-500 text-white font-black px-6 py-3 rounded-2xl">
            Buat Game Baru
          </a>
        </div>
      </main>
    );
  }

  const bothReady = !!room.players.A.token && !!room.players.B.token;
  const winner = room.status === "finished" ? getGameWinner(room.scoreA, room.scoreB) : null;

  return (
    <main className="min-h-dvh bg-gradient-to-br from-sky-50 via-white to-amber-50">
      <Confetti trigger={confettiKey} />

      {/* Header — compact for display, auto-hide in fullscreen */}
      <header className="sticky top-0 z-20 backdrop-blur bg-white/70 border-b border-white/60">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white grid place-items-center font-black">TA</div>
            <div>
              <div className="font-black leading-none">TARIK ANGKA! <span className="text-slate-400 font-bold text-xs">DISPLAY</span></div>
              <div className="text-xs font-black tracking-widest text-slate-500">{code} • Ronde {room.round}/{room.config.totalRounds}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {room.suddenDeath && room.status !== "finished" && <span className="hidden md:inline-flex bg-amber-400 text-slate-900 font-black text-xs px-3 py-1.5 rounded-full animate-pulse">⚡ SUDDEN DEATH</span>}
            <button
              onClick={() => {
                const v = !soundOn;
                setSoundOn(v);
                setSoundEnabled(v);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-black border ${soundOn ? "bg-white border-slate-200" : "bg-amber-100 border-amber-200"}`}
            >
              {soundOn ? "🔊" : "🔇"}
            </button>
            <button onClick={() => document.documentElement.requestFullscreen?.()} className="hidden md:inline-flex bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-black">
              ⛶ Fullscreen
            </button>
            <button onClick={() => { void resetRoom(code); setCountdownKey((k) => k + 1); }} className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-black">
              Reset
            </button>
          </div>
        </div>
      </header>

      {room.status === "waiting" || room.status === "ready" ? (
        <section className="max-w-7xl mx-auto px-4 py-6 md:py-8">
          <div className="grid lg:grid-cols-5 gap-6">
            <div className="lg:col-span-3">
              <div className="bg-white rounded-[2rem] border border-white p-6 md:p-8 shadow-[0_18px_45px_rgba(15,23,42,.08)]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-black tracking-widest text-slate-500">WAITING ROOM • SCAN UNTUK JOIN</span>
                </div>
                <div className="mt-4 grid md:grid-cols-2 gap-6 items-center">
                  <RoomQR code={code} />
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <PlayerStatus team="A" connected={!!room.players.A.token} />
                      <PlayerStatus team="B" connected={!!room.players.B.token} />
                    </div>
                    <div className="rounded-2xl bg-slate-900 text-white p-4">
                      <div className="text-xs font-black tracking-widest opacity-60">CARA JOIN</div>
                      <div className="mt-1 text-sm font-bold leading-relaxed">Buka kamera HP → scan QR → pilih <span className="text-sky-300">KUBU A</span> atau <span className="text-rose-300">KUBU B</span> di <code className="bg-white/20 px-1.5 py-0.5 rounded">/join/{code}</code></div>
                      <div className="mt-2 text-xs font-mono opacity-70 break-all">https://{typeof window !== "undefined" ? window.location.host : "tarikmang.vercel.app"}/join/{code}</div>
                    </div>
                  </div>
                </div>
                <button
                  disabled={!bothReady}
                  onClick={() => { void startCountdown(code).then(() => setCountdownKey((k) => k + 1)); }}
                  className="mt-6 w-full bg-sky-500 hover:bg-sky-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black py-4 rounded-2xl text-lg shadow-lg transition"
                >
                  {bothReady ? "▶ MULAI — 3-2-1" : "Menunggu 2 pemain..."}
                </button>
                <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500 justify-center">
                  <span className="px-2 py-1 rounded-full bg-slate-100">{room.config.difficulty}</span>
                  <span className="px-2 py-1 rounded-full bg-slate-100">{room.config.operation}</span>
                  <span className="px-2 py-1 rounded-full bg-slate-100">{room.config.totalRounds} ronde</span>
                  <span className="px-2 py-1 rounded-full bg-slate-100">{room.config.durationSec}s/soal</span>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-sky-500 to-indigo-600 rounded-[2rem] p-6 text-white shadow-xl">
                <div className="text-sm font-black opacity-80">ATURAN CEPAT</div>
                <ul className="mt-3 space-y-2 text-sm font-bold leading-relaxed">
                  <li>• Benar → tarik 1 langkah, langsung soal berikutnya (tanpa 321).</li>
                  <li>• Salah → boleh coba lagi seketika, kedua tim.</li>
                  <li>• Waktu habis → seri, langsung next.</li>
                  <li>• Seri di akhir → <b>Sudden Death</b> sampai ada pemenang.</li>
                </ul>
                <div className="mt-4 rounded-xl bg-white/15 backdrop-blur p-3 text-xs font-semibold">Display ini adalah pusat perhatian — HP hanya untuk jawab. Skor = posisi tali.</div>
              </div>
            </div>
          </div>
        </section>
      ) : room.status === "countdown" ? (
        <Countdown key={countdownKey} onDone={() => { playSound("start"); void startRound(code); }} />
      ) : null}

      {(room.status === "playing" || room.status === "result" || room.status === "finished") && (
        <section className="max-w-7xl mx-auto px-4 py-4 md:py-6">
          {/* Score + Timer bar — big for distance viewing */}
          <div className="bg-white rounded-[1.5rem] border border-white shadow-sm p-3 md:p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-500 text-white grid place-items-center font-black text-xl">A</div>
              <div>
                <div className="text-xs font-black tracking-widest text-slate-500">KUBU A</div>
                <div className="text-3xl font-black leading-none">{room.scoreA}</div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs font-black tracking-widest text-slate-400">RONDE {room.round} / {room.config.totalRounds}</div>
              <div className="mt-1 inline-flex items-center gap-2">
                {room.status === "playing" ? (
                  <span className={`px-4 py-1.5 rounded-full font-black text-sm ${timeLeft <= 3 ? "bg-rose-500 text-white animate-pulse" : "bg-amber-400 text-slate-900"}`}>⏱ {timeLeft.toFixed(1)}s</span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-black">{room.status.toUpperCase()}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs font-black tracking-widest text-slate-500">KUBU B</div>
                <div className="text-3xl font-black leading-none">{room.scoreB}</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white grid place-items-center font-black text-xl">B</div>
            </div>
          </div>

          {/* Arena — taller for display, interactive spring */}
          <div className="mt-4 rounded-[2rem] overflow-hidden border border-white shadow-[0_18px_45px_rgba(15,23,42,.08)]">
            <TugArena scoreA={room.scoreA} scoreB={room.scoreB} lastWinner={room.lastResult?.winner ?? null} />
          </div>

          {/* Question — huge for distance */}
          <div className="mt-4 bg-white rounded-[2rem] border border-white p-6 md:p-8 shadow-sm text-center">
            {room.suddenDeath && <div className="inline-flex bg-amber-400 text-slate-900 font-black text-xs px-3 py-1 rounded-full animate-pulse mb-3">⚡ SUDDEN DEATH</div>}
            {room.question ? (
              <>
                <div className="text-6xl md:text-8xl font-black tracking-tight text-slate-900 animate-bounceIn">{room.question.text}</div>
                <div className="mt-3 text-xs font-bold tracking-widest text-slate-400">JAWAB DI HP • OPSI: {room.question.options.join(" • ")}</div>
              </>
            ) : (
              <div className="text-2xl font-black text-slate-400">Menyiapkan soal...</div>
            )}

            {room.lastResult && (
              <div className={`mt-4 inline-flex flex-col items-center rounded-2xl px-5 py-3 ${room.lastResult.winner === "A" ? "bg-sky-50 text-sky-700 border border-sky-200" : room.lastResult.winner === "B" ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                <span className="font-black">{room.lastResult.winner === "draw" ? "🤝 SERI — Tali diam" : `🏳️ ${room.lastResult.text}`}</span>
                <span className="text-xs font-bold opacity-70">Polling 200ms • Server timestamp fair</span>
              </div>
            )}

            {room.status === "playing" && (
              <div className="mt-4 flex flex-col items-center gap-2">
                <div className="flex gap-6 text-sm font-black">
                  <span className={room.answers.A ? "text-green-600" : "text-slate-400"}>🔵 A {room.answers.A ? (room.answers.A.isCorrect ? "✓ BENAR" : "✗ salah — retry") : "… menunggu"}</span>
                  <span className={room.answers.B ? "text-green-600" : "text-slate-400"}>🔴 B {room.answers.B ? (room.answers.B.isCorrect ? "✓ BENAR" : "✗ salah — retry") : "… menunggu"}</span>
                </div>
                <button onClick={() => void handleTimeout(code)} className="text-xs font-black text-slate-400 underline">
                  ⏭ Lewati jika diam
                </button>
              </div>
            )}

            {room.status === "finished" && (
              <div className="mt-6">
                <div className="text-7xl">{winner === "draw" ? "🤝" : "🏆"}</div>
                <div className="text-4xl font-black mt-2">{winner === "draw" ? "SERI!" : winner === "A" ? "KUBU A MENANG!" : "KUBU B MENANG!"}</div>
                <div className="text-slate-500 font-bold mt-1">Skor akhir {room.scoreA} — {room.scoreB} • Ronde {room.round}</div>
                <div className="flex justify-center gap-3 mt-5">
                  <button onClick={() => void resetRoom(code)} className="bg-sky-500 text-white font-black px-7 py-3 rounded-2xl">
                    Main Lagi
                  </button>
                  <button onClick={() => router.push("/host")} className="bg-white border-2 border-slate-200 px-7 py-3 rounded-2xl font-black">
                    Room Baru
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
