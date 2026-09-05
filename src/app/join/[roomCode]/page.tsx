"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useRoom } from "@/hooks/useRoom";
import { AnswerGrid } from "@/components/controller/AnswerGrid";
import { Countdown } from "@/components/game/Countdown";
import { ConnectionStatus } from "@/components/room/ConnectionStatus";
import { generatePlayerToken } from "@/lib/room/code";
import { joinTeam, submitAnswer, handleTimeout } from "@/lib/room/store";
import { playSound, isSoundEnabled, setSoundEnabled } from "@/lib/sound";
import type { Team } from "@/types/game";

export default function JoinPage() {
  const params = useParams<{ roomCode: string }>();
  const rawCode = (params.roomCode as string) || "";
  const code = rawCode.toUpperCase();
  const isValidCode = /^[A-Z0-9]{5}$/.test(code);
  const { room } = useRoom(isValidCode ? code : null);
  const [team, setTeam] = useState<Team | null>(null);
  const [token, setToken] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState(10);
  const [locked, setLocked] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [retryMsg, setRetryMsg] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => setSoundOn(isSoundEnabled()), []);
  useEffect(() => {
    if (!room?.lastResult) return;
    if (room.lastResult.winner === team) {
      playSound("correct");
      if (navigator.vibrate) navigator.vibrate(60);
    } else if (room.lastResult.winner === "draw") {
      playSound("wrong");
      if (navigator.vibrate) navigator.vibrate([20, 30, 20]);
    } else {
      playSound("rope");
      if (navigator.vibrate) navigator.vibrate(35);
    }
  }, [room?.lastResult, team]);

  useEffect(() => {
    if (!isValidCode) return;
    try {
      const saved = localStorage.getItem(`tarikmang:player:${code}`);
      if (saved) {
        try {
          const { team: t, token: tk } = JSON.parse(saved);
          setTeam(t);
          setToken(tk);
        } catch {}
      } else {
        const tk = generatePlayerToken();
        setToken(tk);
      }
    } catch {
      try {
        const tk = generatePlayerToken();
        setToken(tk);
      } catch {}
    }
  }, [code, isValidCode]);

  useEffect(() => {
    if (!room || !team || !token) return;
    if (room.players[team].token === token) return;
    const taken = room.players[team].token;
    if (!taken) void joinTeam(code, team, token);
  }, [room, team, token, code]);

  useEffect(() => {
    if (!room || room.status !== "playing" || !room.questionStartedAt) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    const duration = room.config.durationSec;
    const started = room.questionStartedAt;
    const tick = () => {
      const left = Math.max(0, duration - (Date.now() - started) / 1000);
      setTimeLeft(+left.toFixed(1));
      if (left <= 0 && timerRef.current) {
        clearInterval(timerRef.current);
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
    if (room?.status === "playing") {
      const myAns = team ? room.answers[team] : null;
      if (!myAns) setLocked(false);
      else if (myAns.isCorrect) setLocked(true);
      else setLocked(false);
    } else if (room?.status === "result" || room?.status === "countdown") setLocked(true);
    else if (room?.status === "finished") setLocked(true);
  }, [room?.status, room?.answers, team]);

  if (!isValidCode) {
    return (
      <main className="min-h-dvh grid place-items-center bg-gradient-to-br from-sky-50 to-amber-50 p-4">
        <div className="bg-white rounded-[2rem] p-8 shadow-xl text-center max-w-sm w-full">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 grid place-items-center mx-auto text-2xl">⚠️</div>
          <div className="mt-3 font-black text-lg">Kode tidak valid</div>
          <div className="text-sm font-bold text-slate-500 mt-1">{rawCode || "(kosong)"} — harus 5 huruf/angka A-Z0-9</div>
          <a href="/" className="mt-6 inline-flex bg-slate-900 text-white font-black px-6 py-3 rounded-2xl">Kembali ke Home</a>
        </div>
      </main>
    );
  }

  if (!room) {
    return (
      <main className="min-h-dvh grid place-items-center bg-gradient-to-br from-sky-50 to-amber-50 p-4">
        <div className="bg-white rounded-[2rem] p-8 shadow-xl text-center max-w-sm w-full">
          <div className="w-14 h-14 rounded-2xl bg-sky-100 grid place-items-center mx-auto animate-pulse text-xl">⏳</div>
          <div className="mt-3 font-black">Memuat room {code}...</div>
          <div className="text-xs font-bold text-slate-500 mt-2">Jika lama, room tidak ditemukan / expired 24 jam. Buat baru di <a href="/host" className="underline text-sky-600">/host</a>.</div>
        </div>
      </main>
    );
  }

  const handleSelect = async (t: Team) => {
    if (!token) return;
    const taken = !!room.players[t].token && room.players[t].token !== token;
    if (taken) return;
    const res = await joinTeam(code, t, token);
    if (res) {
      setTeam(t);
      try {
        localStorage.setItem(`tarikmang:player:${code}`, JSON.stringify({ team: t, token }));
      } catch {}
      playSound("join");
      if (navigator.vibrate) navigator.vibrate(30);
    }
  };

  const handleAnswer = async (choice: string | number) => {
    if (!team || !room.question || locked) return;
    const isCorrect = String(choice).trim() === String(room.question.answer).trim();
    const res = await submitAnswer(code, team, choice, token);
    if (!res) return;
    if (isCorrect) {
      setLocked(true);
      setRetryMsg(null);
      playSound("correct");
      if (navigator.vibrate) navigator.vibrate(50);
    } else {
      setRetryMsg(`❌ Salah! Coba lagi`);
      playSound("wrong");
      if (navigator.vibrate) navigator.vibrate([30, 40, 30]);
      setLocked(false);
      setTimeout(() => setRetryMsg(null), 800);
    }
  };

  const bothReady = !!room.players.A.token && !!room.players.B.token;
  const connected = !!team && !!room.players[team]?.token && room.players[team].token === token;
  const myTeamColor = team === "A" ? "sky" : "rose";

  return (
    <main className="min-h-dvh bg-gradient-to-br from-sky-50 via-white to-amber-50 flex flex-col">
      {/* Header — compact controller */}
      <header className="sticky top-0 z-10 backdrop-blur bg-white/70 border-b border-white/60">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white grid place-items-center font-black text-xs">TA</div>
            <div>
              <div className="font-black text-sm leading-none">GAME {code}</div>
              <div className="text-xs font-bold text-slate-500">Controller HP</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                const v = !soundOn;
                setSoundOn(v);
                setSoundEnabled(v);
              }}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 grid place-items-center text-xs"
            >
              {soundOn ? "🔊" : "🔇"}
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-md mx-auto w-full px-4 py-4 flex flex-col">
        {/* Team badge + connection */}
        {team && (
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black ${team === "A" ? "bg-sky-500 text-white" : "bg-rose-500 text-white"}`}>
              {team === "A" ? "🔵 KUBU A" : "🔴 KUBU B"} • {token.slice(0, 6)}
            </div>
            <ConnectionStatus connected={connected} team={team ? `KUBU ${team}` : undefined} />
          </div>
        )}
        {room.suddenDeath && <div className="mb-3 bg-amber-400 text-slate-900 font-black text-xs py-2 rounded-full text-center animate-pulse">⚡ SUDDEN DEATH!</div>}

        {/* PILIH TIM */}
        {!team || !room.players[team]?.token || room.players[team].token !== token ? (
          <section className="flex-1 flex flex-col">
            <div className="text-center">
              <h1 className="text-2xl font-black text-slate-900">Pilih Tim</h1>
              <p className="text-sm font-bold text-slate-500 mt-1">Hanya 1 pemain per kubu • Tap kartu</p>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                { t: "A" as Team, icon: "🧒", bg: "bg-sky-500", light: "bg-sky-50", border: "border-sky-200", label: "KUBU A" },
                { t: "B" as Team, icon: "👧", bg: "bg-rose-500", light: "bg-rose-50", border: "border-rose-200", label: "KUBU B" },
              ].map((c) => {
                const taken = !!room.players[c.t].token;
                const selected = team === c.t;
                return (
                  <button
                    key={c.t}
                    disabled={taken}
                    onClick={() => handleSelect(c.t)}
                    className={`relative rounded-[1.7rem] border-2 p-5 text-center transition active:scale-[0.98] ${taken ? "bg-slate-100 border-slate-200 opacity-60" : selected ? `${c.bg} border-transparent text-white shadow-lg` : `${c.light} ${c.border} hover:border-slate-300`}`}
                  >
                    <div className={`w-16 h-16 rounded-2xl grid place-items-center mx-auto text-3xl ${taken ? "bg-slate-200" : c.bg + " text-white"}`}>{c.icon}</div>
                    <div className={`mt-3 font-black ${taken ? "text-slate-500" : selected ? "text-white" : "text-slate-900"}`}>{c.label}</div>
                    <div className={`text-xs font-bold ${taken ? "text-rose-600" : selected ? "text-white/80" : "text-slate-500"}`}>{taken ? "TERISI" : "TAP UNTUK JOIN"}</div>
                    {selected && !taken && <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white text-slate-900 grid place-items-center text-xs">✓</div>}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 rounded-2xl bg-white border border-slate-100 p-3 flex justify-between text-xs font-black">
              <span className={room.players.A.token ? "text-sky-600" : "text-slate-400"}>🔵 A {room.players.A.token ? "Terisi" : "Kosong"}</span>
              <span className={room.players.B.token ? "text-rose-600" : "text-slate-400"}>🔴 B {room.players.B.token ? "Terisi" : "Kosong"}</span>
            </div>
            <div className="mt-auto pt-4 text-center text-xs font-bold text-slate-400">Token anti-rebut • Reconnect otomatis</div>
          </section>
        ) : room.status === "waiting" || room.status === "ready" ? (
          <section className="flex-1 flex flex-col items-center justify-center text-center">
            <div className={`w-24 h-24 rounded-[1.7rem] grid place-items-center text-5xl shadow-lg ${team === "A" ? "bg-sky-500" : "bg-rose-500"} text-white animate-pulse`}>{team === "A" ? "🧒" : "👧"}</div>
            <h2 className="mt-4 text-2xl font-black">KUBU {team} — TERHUBUNG</h2>
            <div className={`mt-2 inline-flex px-3 py-1 rounded-full text-xs font-black ${connected ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{connected ? "● TERHUBUNG" : "● MENYAMBUNG..."}</div>
            <p className="mt-3 text-sm font-bold text-slate-500 max-w-xs">{bothReady ? "Kedua tim siap! Menunggu host menekan MULAI di layar besar..." : "Menunggu kubu lawan bergabung — minta teman scan QR yang sama."}</p>
            <div className="mt-4 w-full bg-white border border-slate-100 rounded-2xl p-3 flex items-center justify-between">
              <span className="text-xs font-black tracking-widest text-slate-500">ROOM {code}</span>
              <span className="text-xs font-mono font-bold bg-slate-900 text-white px-2 py-1 rounded-full">{token.slice(0, 8)}</span>
            </div>
            <button onClick={() => { try { localStorage.removeItem(`tarikmang:player:${code}`); } catch {}; setTeam(null); }} className="mt-3 text-xs font-black text-slate-400 underline">
              Ganti Tim
            </button>
          </section>
        ) : room.status === "countdown" ? (
          <div className="flex-1 grid place-items-center">
            <Countdown onDone={() => {}} />
            <div className="absolute bottom-6 text-xs font-black tracking-widest text-slate-500">SIAP-SIAP DI HP...</div>
          </div>
        ) : room.status === "playing" || room.status === "result" ? (
          <section className="flex-1 flex flex-col">
            <div className="bg-white rounded-[1.7rem] border border-white shadow-sm p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-widest text-slate-400">RONDE {room.round} / {room.config.totalRounds}</span>
                <span className={`px-3 py-1.5 rounded-full text-sm font-black ${timeLeft <= 3 ? "bg-rose-500 text-white animate-pulse" : "bg-slate-900 text-white"}`}>⏱ {timeLeft.toFixed(1)}s</span>
              </div>
              {room.question ? (
                <>
                  <div className="mt-3 text-5xl font-black text-center tracking-tight text-slate-900">{room.question.text}</div>
                  <div className="mt-1 text-center">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-black ${myTeamColor === "sky" ? "bg-sky-100 text-sky-700" : "bg-rose-100 text-rose-700"}`}>KUBU {team}</span>
                  </div>
                </>
              ) : (
                <div className="mt-6 text-center font-black text-slate-400">Menyiapkan soal...</div>
              )}
            </div>

            {/* Answer grid — large tap targets 64-80px */}
            <div className="mt-4">
              <AnswerGrid options={room.question?.options ?? []} disabled={locked} onAnswer={handleAnswer} team={team ?? undefined} />
            </div>

            <div className="mt-3 min-h-[28px] text-center">
              {retryMsg && room.status === "playing" && <div className="inline-flex bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-full text-sm font-black animate-shake">{retryMsg}</div>}
              {room.answers[team!]?.isCorrect && room.status === "result" && <div className="text-sm font-black text-emerald-600">🎉 BENAR! Menunggu next...</div>}
              {room.lastResult && room.status === "result" && (
                <div className={`mt-2 text-sm font-black ${room.lastResult.winner === team ? "text-emerald-600" : room.lastResult.winner === "draw" ? "text-slate-500" : "text-slate-400"}`}>
                  {room.lastResult.winner === "draw" ? "🤝 Seri" : room.lastResult.winner === team ? "🏳️ Kamu menarik!" : "Ditarik lawan"}
                </div>
              )}
            </div>

            <div className="mt-auto pt-3 flex items-center justify-between text-xs font-black">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-500" /> A {room.scoreA}
                <span className="opacity-30">—</span>
                <span className="w-2 h-2 rounded-full bg-rose-500" /> B {room.scoreB}
              </div>
              <span className="text-slate-400">{room.config.durationSec}s/soal</span>
            </div>
          </section>
        ) : room.status === "finished" ? (
          <section className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-28 h-28 rounded-[2rem] bg-white border border-slate-100 shadow-lg grid place-items-center text-6xl">{room.scoreA === room.scoreB ? "🤝" : (room.scoreA > room.scoreB ? (team === "A" ? "🏆" : "😢") : (team === "B" ? "🏆" : "😢"))}</div>
            <h2 className="mt-4 text-3xl font-black">{room.scoreA === room.scoreB ? "SERI!" : room.scoreA > room.scoreB ? "KUBU A MENANG!" : "KUBU B MENANG!"}</h2>
            <div className="mt-1 inline-flex bg-slate-900 text-white px-3 py-1.5 rounded-full text-sm font-black">Skor {room.scoreA} — {room.scoreB}</div>
            <div className="mt-2 text-sm font-bold text-slate-500">Kamu: KUBU {team} • Ronde {room.round}</div>
            <button onClick={() => { try { localStorage.removeItem(`tarikmang:player:${code}`); } catch {}; setTeam(null); }} className="mt-6 w-full bg-white border-2 border-slate-200 font-black py-3 rounded-2xl">
              Main Lagi — Ganti Tim
            </button>
            <a href="/" className="mt-2 text-xs font-black text-slate-400 underline">
              Kembali ke Home
            </a>
          </section>
        ) : null}

        <div className="mt-4 text-center text-xs font-bold text-slate-400">Tap jawaban besar — 64px • Salah boleh tap lagi seketika</div>
      </div>
    </main>
  );
}
