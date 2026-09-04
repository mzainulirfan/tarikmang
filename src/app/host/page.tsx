"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Difficulty, Operation } from "@/types/game";
import { generateRoomCode } from "@/lib/room/code";
import { createRoomState, saveRoom } from "@/lib/room/store";

const DIFFICULTIES: Difficulty[] = ["mudah", "sedang", "sulit"];
const OPERATIONS: Operation[] = ["campuran", "penjumlahan", "pengurangan", "perkalian", "pembagian"];

export default function HostPage() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<Difficulty>("mudah");
  const [operation, setOperation] = useState<Operation>("campuran");
  const [totalRounds, setTotalRounds] = useState(10);
  const [durationSec, setDurationSec] = useState(10);

  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      // Prefer server API when Supabase configured (cross-device), fallback local
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const res = await fetch("/api/game/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ difficulty, operation, totalRounds, durationSec }),
        });
        const json = await res.json();
        if (json.code) {
          router.push(`/room/${json.code}`);
          return;
        }
      }
      const code = generateRoomCode(5);
      const state = createRoomState(code, { difficulty, operation, totalRounds, durationSec });
      await saveRoom(state);
      router.push(`/room/${code}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <header className="text-center mb-6">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight">
          Tarik <span className="text-sky-500">Angka!</span> — Host
        </h1>
        <p className="mt-2 text-slate-600 font-semibold">Atur game untuk layar besar + 2 HP controller.</p>
      </header>

      <section className="bg-white/90 backdrop-blur rounded-[2rem] border border-white p-6 md:p-8 shadow-[0_18px_45px_rgba(15,23,42,.12)]">
        <h2 className="font-black text-lg">Game Setup</h2>

        <div className="grid md:grid-cols-2 gap-4 mt-5">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Kesulitan</span>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className="rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 font-bold">
              {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Operasi</span>
            <select value={operation} onChange={(e) => setOperation(e.target.value as Operation)} className="rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 font-bold">
              {OPERATIONS.map((op) => <option key={op} value={op}>{op}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Jumlah Ronde</span>
            <select value={totalRounds} onChange={(e) => setTotalRounds(Number(e.target.value))} className="rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 font-bold">
              {[5,10,15].map((n) => <option key={n} value={n}>{n} ronde</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Durasi / Soal</span>
            <select value={durationSec} onChange={(e) => setDurationSec(Number(e.target.value))} className="rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 font-bold">
              {[5,10,15].map((n) => <option key={n} value={n}>{n} detik</option>)}
            </select>
          </label>
        </div>

        <div className="mt-6 bg-slate-50 rounded-2xl p-4 text-sm font-semibold text-slate-600">
          Default MVP: Mudah / Campuran / 10 ronde / 10 detik. Kode room 5 karakter, TTL 24 jam.
        </div>

        <button onClick={handleCreate} disabled={loading} className="mt-6 w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition">
          {loading ? "Membuat..." : "Buat Game — Tampilkan QR"}
        </button>

        <div className="mt-4 flex gap-3 text-sm">
          <a href="/solo" className="text-sky-600 font-black hover:underline">Main Solo (1 device) →</a>
          <a href="/" className="text-slate-500 font-bold hover:underline">← Kembali</a>
        </div>
      </section>
    </main>
  );
}
