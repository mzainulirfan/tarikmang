"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { TugArena } from "@/components/game/TugArena";
import { ScoreBoard } from "@/components/game/ScoreBoard";
import { AnswerGrid } from "@/components/controller/AnswerGrid";
import { Countdown } from "@/components/game/Countdown";
import { generateQuestion } from "@/lib/game/questions";
import { determineWinner, getGameWinner } from "@/lib/game/scoring";
import type { Difficulty, Operation, Question } from "@/types/game";

const DIFFICULTIES: Difficulty[] = ["mudah", "sedang", "sulit"];
const OPERATIONS: Operation[] = ["campuran", "penjumlahan", "pengurangan", "perkalian", "pembagian"];
const ROUND_OPTIONS = [5, 10, 15];
const DURATION_OPTIONS = [5, 10, 15];

export default function Home() {
  // setup
  const [difficulty, setDifficulty] = useState<Difficulty>("mudah");
  const [operation, setOperation] = useState<Operation>("campuran");
  const [totalRounds, setTotalRounds] = useState(10);
  const [durationSec, setDurationSec] = useState(10);

  // game
  const [status, setStatus] = useState<"setup" | "countdown" | "playing" | "finished">("setup");
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [round, setRound] = useState(1);
  const [question, setQuestion] = useState<Question | null>(null);
  const [timeLeft, setTimeLeft] = useState(durationSec);
  const [message, setMessage] = useState("Cepat! Jawab benar & cepat untuk menarik tali.");
  const [msgType, setMsgType] = useState<"a" | "b" | "wrong" | "neutral">("neutral");
  const [locked, setLocked] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startedAtRef = useRef<number>(0);

  const makeNextQuestion = useCallback(() => {
    const q = generateQuestion(difficulty, operation);
    setQuestion(q);
    startedAtRef.current = Date.now();
    return q;
  }, [difficulty, operation]);

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const nextRound = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (_winnerOverride?: "A" | "B" | "draw" | null) => {
      if (round >= totalRounds) {
        clearTimer();
        setStatus("finished");
        setShowResult(true);
        return;
      }
      setRound((r) => r + 1);
      setLocked(false);
      makeNextQuestion();
      setTimeLeft(durationSec);
    },
    [round, totalRounds, makeNextQuestion, durationSec]
  );

  const startTimer = useCallback(() => {
    clearTimer();
    setTimeLeft(durationSec);
    startedAtRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        const next = +(prev - 0.1).toFixed(1);
        if (next <= 0) {
          clearTimer();
          setLocked(true);
          setMessage("⏰ Waktu habis! Lanjut pertanyaan berikutnya...");
          setMsgType("wrong");
          setTimeout(() => nextRound(null), 0);
          return 0;
        }
        return next;
      });
    }, 100);
  }, [durationSec, nextRound]);

  // restart timer when new round starts
  useEffect(() => {
    if (status === "playing" && !locked) {
      startTimer();
    }
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, status]);

  const handleStart = () => {
    setScoreA(0);
    setScoreB(0);
    setRound(1);
    setLocked(false);
    setShowResult(false);
    setMessage("Bersiap...");
    setMsgType("neutral");
    setStatus("countdown");
  };

  const handleCountdownDone = () => {
    const q = makeNextQuestion();
    setStatus("playing");
    setMessage("Cepat! Siapa paling siap?");
    setMsgType("neutral");
    setLocked(false);
    // startTimer via effect
    void q;
  };

  const handleAnswer = (choice: string | number) => {
    if (status !== "playing" || locked || !question) return;
    const isCorrect = String(choice).trim() === String(question.answer).trim();
    if (isCorrect) {
      // benar → langsung next seketika (tanpa 321, tanpa delay)
      setLocked(true);
      clearTimer();
      const playerMs = Date.now() - startedAtRef.current;
      setScoreA((s) => s + 1);
      setMessage(`🎯 BENAR! (${(playerMs / 1000).toFixed(1)}s) Kubu A menarik!`);
      setMsgType("a");
      setTimeout(() => {
        if (round >= totalRounds) {
          setStatus("finished");
          setShowResult(true);
        } else {
          setRound((r) => r + 1);
          makeNextQuestion();
          setLocked(false);
          setMessage("Lanjut pertanyaan berikutnya...");
          setMsgType("neutral");
          setTimeLeft(durationSec);
        }
      }, 0);
    } else {
      // salah → boleh retry langsung tanpa cooldown
      setMessage(`❌ Salah! Coba lagi`);
      setMsgType("wrong");
      setLocked(false);
    }
  };

  // start timer when question changes and playing
  useEffect(() => {
    if (status === "playing" && question && !locked) {
      startTimer();
    }
  }, [question, status, locked, startTimer]);

  const winner = getGameWinner(scoreA, scoreB);

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 md:py-8">
      {status === "countdown" && <Countdown onDone={handleCountdownDone} />}

      <header className="text-center mb-5">
        <div className="inline-flex items-center gap-2 bg-white/80 border border-white rounded-full px-4 py-2 text-sm font-bold text-sky-700 shadow-sm">
          🧠 GAME MATEMATIKA
        </div>
        <h1 className="mt-3 text-4xl md:text-6xl font-black tracking-tight text-slate-900">
          Tarik <span className="text-sky-500">Angka!</span>
        </h1>
        <p className="mt-2 text-slate-600 font-semibold">Jawab cepat, jawab benar, tarik lawan!</p>
      </header>

      {status === "setup" && (
        <section className="bg-white/90 backdrop-blur rounded-[2rem] border border-white overflow-hidden shadow-[0_18px_45px_rgba(15,23,42,.12)] p-6 md:p-8">
          <h2 className="text-xl font-black text-slate-900">Buat Game</h2>
          <p className="text-slate-500 font-semibold text-sm mt-1">Atur kesulitan & mulai. Mode lokal: kamu = Kubu A vs Bot = Kubu B (simulasi PRD #13).</p>

          <div className="grid md:grid-cols-4 gap-4 mt-6">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">Tingkat Kesulitan</span>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 font-bold"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">Operasi</span>
              <select
                value={operation}
                onChange={(e) => setOperation(e.target.value as Operation)}
                className="rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 font-bold"
              >
                {OPERATIONS.map((op) => (
                  <option key={op} value={op}>
                    {op.charAt(0).toUpperCase() + op.slice(1)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">Jumlah Ronde</span>
              <select
                value={totalRounds}
                onChange={(e) => setTotalRounds(Number(e.target.value))}
                className="rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 font-bold"
              >
                {ROUND_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n} ronde
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">Durasi</span>
              <select
                value={durationSec}
                onChange={(e) => setDurationSec(Number(e.target.value))}
                className="rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 font-bold"
              >
                {DURATION_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n} detik
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleStart}
              className="bg-slate-900 hover:bg-slate-800 text-white font-black px-8 py-4 rounded-2xl shadow-lg transition active:scale-95"
            >
              Buat Game & Mulai
            </button>
            <a
              href="/tarik-angka-game.html"
              target="_blank"
              className="bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-900 font-black px-6 py-4 rounded-2xl transition"
            >
              Lihat Prototype HTML →
            </a>
          </div>

          <div className="mt-4 text-xs font-semibold text-slate-500">
            Default MVP: Mudah / Campuran / 10 ronde / 10 detik. Skor = posisi tali = <code>scoreA - scoreB</code>.
          </div>
        </section>
      )}

      {(status === "playing" || status === "finished") && (
        <section className="bg-white/90 backdrop-blur rounded-[2rem] border border-white overflow-hidden shadow-[0_18px_45px_rgba(15,23,42,.12)]">
          <ScoreBoard scoreA={scoreA} scoreB={scoreB} round={round} totalRounds={totalRounds} />
          <TugArena scoreA={scoreA} scoreB={scoreB} />

          <div className="p-5 md:p-8 text-center">
            <div className="flex justify-center items-center gap-2 mb-3">
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Pertanyaan</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-black ${timeLeft <= 3 ? "bg-rose-100 text-rose-700 animate-pulse" : "bg-amber-100 text-amber-700"}`}
              >
                {timeLeft.toFixed(1)} dtk
              </span>
            </div>

            {question ? (
              <>
                <div key={question.id} className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 mb-6 animate-bounceIn">
                  {question.text}
                </div>
                <AnswerGrid options={question.options} disabled={locked || status === "finished"} onAnswer={handleAnswer} />
              </>
            ) : (
              <div className="text-2xl font-black text-slate-400">Memuat soal...</div>
            )}

            <div
              className={`min-h-10 mt-5 text-lg font-black ${msgType === "a" ? "text-sky-600" : msgType === "b" ? "text-rose-600" : msgType === "wrong" ? "text-amber-600" : "text-slate-500"}`}
            >
              {message}
            </div>

            <div className="mt-4 flex justify-center gap-3">
              <button
                onClick={handleStart}
                className="bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-900 font-black px-6 py-3 rounded-2xl"
              >
                Ulangi Setup
              </button>
              {status === "finished" && (
                <button
                  onClick={() => setShowResult(true)}
                  className="bg-sky-500 hover:bg-sky-600 text-white font-black px-6 py-3 rounded-2xl"
                >
                  Lihat Hasil
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {showResult && status === "finished" && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 text-center max-w-sm w-full shadow-[0_18px_45px_rgba(15,23,42,.12)] animate-bounceIn">
            <div className="text-7xl mb-3">{winner === "draw" ? "🤝" : "🏆"}</div>
            <div className="text-sm font-black uppercase tracking-widest text-slate-400">Pemenang</div>
            <h2 className="text-4xl font-black mt-1 text-slate-900">{winner === "draw" ? "SERI!" : winner === "A" ? "KUBU A!" : "KUBU B!"}</h2>
            <p className="mt-3 text-slate-500 font-semibold">
              Skor akhir: Kubu A {scoreA} — {scoreB} Kubu B
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setShowResult(false);
                  setStatus("setup");
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-900 font-black py-3 rounded-2xl"
              >
                Setup
              </button>
              <button
                onClick={() => {
                  setShowResult(false);
                  handleStart();
                }}
                className="bg-sky-500 hover:bg-sky-600 text-white font-black py-3 rounded-2xl"
              >
                Main Lagi
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-center mt-5 text-sm text-slate-500 font-semibold">
        Aturan PRD #13: <b>benar &gt; salah</b>, keduanya benar → <b>tercepat menang</b>, seri → tali diam. Posisi tali = skorA - skorB.
      </p>
    </main>
  );
}
