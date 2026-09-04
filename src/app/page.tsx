"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Landing() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <header className="text-center">
        <div className="inline-flex items-center gap-2 bg-white/80 border border-white rounded-full px-4 py-2 text-sm font-bold text-sky-700 shadow-sm">
          🧠 GAME MATEMATIKA
        </div>
        <h1 className="mt-4 text-5xl md:text-6xl font-black tracking-tight text-slate-900">
          Tarik <span className="text-sky-500">Angka!</span>
        </h1>
        <p className="mt-3 text-slate-600 font-semibold max-w-xl mx-auto">
          1 layar besar + 2 HP controller. Jawab cepat, jawab benar, tarik lawan! Cepat. Benar. Tarik!
        </p>
      </header>

      <section className="mt-8 bg-white/90 backdrop-blur rounded-[2rem] border border-white p-6 md:p-8 shadow-[0_18px_45px_rgba(15,23,42,.12)]">
        <h2 className="font-black text-lg">Mulai Bermain</h2>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <button
            onClick={() => router.push("/host")}
            className="bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-2xl shadow-lg flex flex-col items-center gap-1"
          >
            <span className="text-xl">🎮 Buat Game</span>
            <span className="text-xs font-semibold opacity-80">Host — Tampilkan QR di layar besar</span>
          </button>

          <button
            onClick={() => router.push("/solo")}
            className="bg-sky-500 hover:bg-sky-600 text-white font-black py-5 rounded-2xl shadow flex flex-col items-center gap-1"
          >
            <span className="text-xl">⚡ Main Solo</span>
            <span className="text-xs font-semibold opacity-90">1 device vs Bot (latihan)</span>
          </button>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-6">
          <div className="text-xs font-black tracking-widest text-slate-500">JOIN DENGAN KODE</div>
          <div className="mt-2 flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5))}
              placeholder="7K4P2"
              className="flex-1 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 font-black tracking-widest uppercase text-center"
            />
            <button
              disabled={joinCode.length !== 5}
              onClick={() => router.push(`/join/${joinCode}`)}
              className="bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-50 disabled:opacity-40 font-black px-6 py-3 rounded-2xl"
            >
              Join
            </button>
          </div>
          <div className="mt-2 text-xs text-slate-500 font-semibold">Scan QR di display atau masukkan 5-char code.</div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 text-xs">
          <a href="/tarik-angka-game.html" target="_blank" className="underline font-bold text-slate-600">Prototype HTML →</a>
          <span className="text-slate-400">•</span>
          <span className="font-semibold text-slate-500">Realtime lokal via BroadcastChannel + localStorage (tanpa Supabase, TTL 24j)</span>
        </div>
      </section>

      <section className="mt-6 bg-slate-900 text-white rounded-[2rem] p-6">
        <div className="font-black">Cara Main (3 Device)</div>
        <ol className="mt-3 space-y-2 text-sm font-semibold list-decimal list-inside opacity-90">
          <li>Host buka <code className="bg-white/20 px-1.5 py-0.5 rounded">/host</code> → Buat Game → tampilkan <code className="bg-white/20 px-1.5 py-0.5 rounded">/room/[CODE]</code> di proyektor/TV</li>
          <li>2 pemain scan QR → <code className="bg-white/20 px-1.5 py-0.5 rounded">/join/[CODE]</code> → pilih Kubu A / B (1 pemain per tim)</li>
          <li>Host tekan MULAI → Countdown 3-2-1 (server timestamp) → soal muncul di semua device</li>
          <li>Jawab di HP → server nilai <b>benar &gt; salah</b>, keduanya benar → <b>tercepat menang</b> → tali tarik 1 langkah</li>
          <li>10 ronde → skor tertinggi menang, seri → tampil 🤝</li>
        </ol>
      </section>
    </main>
  );
}
