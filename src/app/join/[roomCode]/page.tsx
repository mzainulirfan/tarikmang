"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { useRoom } from "@/hooks/useRoom";
import { TeamSelector } from "@/components/room/TeamSelector";
import { AnswerGrid } from "@/components/controller/AnswerGrid";
import { Countdown } from "@/components/game/Countdown";
import { ConnectionStatus } from "@/components/room/ConnectionStatus";
import { generatePlayerToken } from "@/lib/room/code";
import { joinTeam, submitAnswer, handleTimeout } from "@/lib/room/store";
import { playSound, isSoundEnabled, setSoundEnabled } from "@/lib/sound";
import type { Team } from "@/types/game";

export default function JoinPage() {
  const params = useParams<{ roomCode: string }>();
  const code = (params.roomCode as string)?.toUpperCase();
  const { room } = useRoom(code);
  const [team, setTeam] = useState<Team | null>(null);
  const [token, setToken] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState(10);
  const [locked, setLocked] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => setSoundOn(isSoundEnabled()), []);
  useEffect(() => {
    if (!room?.lastResult) return;
    if (room.lastResult.winner === team) playSound("correct");
    else if (room.lastResult.winner === "draw") playSound("wrong");
    else playSound("rope");
  }, [room?.lastResult, team]);

  // restore from localStorage per PRD #35 reconnect
  useEffect(() => {
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
  }, [code]);

  // auto rejoin if token exists
  useEffect(() => {
    if (!room || !team || !token) return;
    if (room.players[team].token === token) return;
    const taken = room.players[team].token;
    if (!taken) void joinTeam(code, team, token);
  }, [room, team, token, code]);

  // timer sync to room.questionStartedAt
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
  }, [room?.status, room?.questionStartedAt, room?.config.durationSec, code, room]);

  useEffect(() => {
    if (room?.status === "playing") setLocked(!!room.answers[team!]);
    if (room?.status === "result" || room?.status === "countdown") setLocked(true);
    if (room?.status === "finished") setLocked(true);
  }, [room?.status, room?.answers, team]);

  if (!room) {
    return (
      <main className="max-w-md mx-auto px-4 py-10 text-center">
        <div className="bg-white rounded-3xl p-6 shadow">Room {code} tidak ditemukan / expired.</div>
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
      localStorage.setItem(`tarikmang:player:${code}`, JSON.stringify({ team: t, token }));
      playSound("join");
    }
  };

  const handleAnswer = async (choice: number) => {
    if (!team || !room.question || locked) return;
    const res = await submitAnswer(code, team, choice, token);
    if (res) {
      setLocked(true);
      const correct = choice === room.question.answer;
      playSound(correct ? "correct" : "wrong");
    }
  };

  const bothReady = !!room.players.A.token && !!room.players.B.token;
  const isMyTeamTaken = team ? !!room.players[team].token && room.players[team].token !== token : false;

  const connected = !!team && !!room.players[team]?.token && room.players[team].token === token;

  return (
    <main className="max-w-md mx-auto px-4 py-6 min-h-dvh flex flex-col">
      <header className="text-center">
        <div className="text-xs font-black tracking-widest text-slate-400">TARIK ANGKA!</div>
        <div className="text-sm font-black">GAME {code} — Room Controller</div>
        {team && <div className={`inline-flex mt-2 px-3 py-1 rounded-full text-xs font-black ${team === "A" ? "bg-sky-100 text-sky-700" : "bg-rose-100 text-rose-700"}`}>{team === "A" ? "🔵 KUBU A" : "🔴 KUBU B"} • {token.slice(0, 6)}</div>}
        <div className="mt-2 flex justify-center gap-2">
          <ConnectionStatus connected={connected} team={team ? `KUBU ${team}` : undefined} />
          <button
            onClick={() => {
              const v = !soundOn;
              setSoundOn(v);
              setSoundEnabled(v);
            }}
            className="text-xs font-black px-2 py-1 rounded-full border bg-white"
          >
            {soundOn ? "🔊" : "🔇"}
          </button>
        </div>
        {room.suddenDeath && <div className="mt-2 bg-amber-400 text-slate-900 font-black text-xs py-1.5 rounded-full animate-pulse">⚡ SUDDEN DEATH!</div>}
      </header>

      {!team || !room.players[team]?.token || room.players[team].token !== token ? (
        <section className="mt-6 bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h2 className="font-black text-center">Pilih Tim</h2>
          <p className="text-sm text-center text-slate-500 font-semibold mt-1">Hanya 1 pemain per kubu. Pilihan mengikat token.</p>
          <div className="mt-4">
            <TeamSelector selected={team} takenA={!!room.players.A.token} takenB={!!room.players.B.token} onSelect={handleSelect} />
          </div>
          <div className="mt-4 text-xs text-center text-slate-500">
            {room.players.A.token ? "🔵 A terisi" : "🔵 A kosong"} • {room.players.B.token ? "🔴 B terisi" : "🔴 B kosong"}
          </div>
        </section>
      ) : room.status === "waiting" || room.status === "ready" ? (
        <section className="mt-6 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-center">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center text-2xl ${team === "A" ? "bg-sky-100" : "bg-rose-100"}`}>{team === "A" ? "🔵" : "🔴"}</div>
          <div className="mt-3 font-black">KUBU {team} — ✓ TERHUBUNG</div>
          <div className="text-sm text-slate-500 font-semibold mt-1">{bothReady ? "Kedua tim siap! Menunggu host mulai..." : "Menunggu Kubu lawan bergabung..."}</div>
          <div className="mt-4 text-xs font-mono bg-slate-50 rounded-xl p-3">Token: {token} • Reconnect otomatis aktif</div>
          <button onClick={() => { localStorage.removeItem(`tarikmang:player:${code}`); setTeam(null); }} className="mt-4 text-xs font-black text-slate-500 underline">Ganti Tim</button>
        </section>
      ) : room.status === "countdown" ? (
        <Countdown onDone={() => {}} />
      ) : room.status === "playing" || room.status === "result" ? (
        <section className="mt-4 flex-1 flex flex-col">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black tracking-widest text-slate-400">ROUND {room.round} / {room.config.totalRounds}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${timeLeft <= 3 ? "bg-rose-100 text-rose-700 animate-pulse" : "bg-amber-100 text-amber-700"}`}>⏱ {timeLeft.toFixed(1)} dtk</span>
            </div>
            {room.question ? (
              <>
                <div className="mt-3 text-4xl font-black text-center text-slate-900">{room.question.text}</div>
                <div className="mt-4">
                  <AnswerGrid options={room.question.options} disabled={locked} onAnswer={handleAnswer} />
                </div>
              </>
            ) : (
              <div className="text-center text-slate-400 font-black">Memuat soal...</div>
            )}

            <div className="mt-4 text-center min-h-6">
              {locked && room.answers[team!] && <div className="text-sm font-black text-green-600">✓ JAWABAN TERKIRIM — Menunggu hasil...</div>}
              {room.answers[team!] && room.status === "result" && (
                <div className={`text-sm font-black ${room.answers[team!]!.isCorrect ? "text-green-600" : "text-rose-600"}`}>
                  {room.answers[team!]!.isCorrect ? `🎉 BENAR! (${(room.answers[team!]!.responseMs / 1000).toFixed(1)}s)` : `❌ SALAH — Jawaban: ${room.question?.answer}`}
                </div>
              )}
              {!room.answers[team!] && room.status === "result" && <div className="text-sm font-black text-amber-600">⏰ Tidak menjawab — Seri</div>}
            </div>

            {room.lastResult && (
              <div className={`mt-2 text-center text-sm font-black ${room.lastResult.winner === team ? "text-green-600" : room.lastResult.winner === "draw" ? "text-slate-500" : "text-slate-400"}`}>
                {room.lastResult.winner === "draw" ? "🤝 Seri — tali diam" : room.lastResult.winner === team ? "🏳️ KUBU KAMU MENARIK!" : "Tali ditarik lawan"}
                <div className="text-xs font-semibold text-slate-500">{room.lastResult.text}</div>
              </div>
            )}
          </div>

          <div className="mt-3 bg-slate-900 text-white rounded-2xl p-3 flex justify-between text-xs font-black">
            <span>🔵 A {room.scoreA}</span>
            <span>—</span>
            <span>🔴 B {room.scoreB}</span>
          </div>
        </section>
      ) : room.status === "finished" ? (
        <section className="mt-6 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-center">
          <div className="text-6xl">{room.scoreA === room.scoreB ? "🤝" : (room.scoreA > room.scoreB ? (team === "A" ? "🏆" : "😢") : (team === "B" ? "🏆" : "😢"))}</div>
          <div className="mt-2 font-black text-xl">{room.scoreA === room.scoreB ? "SERI!" : room.scoreA > room.scoreB ? "KUBU A MENANG!" : "KUBU B MENANG!"}</div>
          <div className="text-sm text-slate-500 font-semibold mt-1">Skor akhir: A {room.scoreA} — {room.scoreB} B</div>
          <div className={`mt-3 inline-flex px-3 py-1 rounded-full text-xs font-black ${team === "A" ? "bg-sky-100 text-sky-700" : "bg-rose-100 text-rose-700"}`}>Kamu: KUBU {team}</div>
          <button onClick={() => setTeam(null)} className="mt-4 w-full bg-slate-900 text-white font-black py-3 rounded-2xl">Keluar / Ganti Tim</button>
        </section>
      ) : null}

      <div className="mt-auto pt-6 text-center text-xs text-slate-400 font-semibold">
        {room.status === "playing" ? "Jawab cepat & benar — tercepat menang!" : "Server authority: validasi di host display"}
      </div>
    </main>
  );
}
