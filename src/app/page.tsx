"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { TugArena } from "@/components/game/TugArena";

export default function Landing() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");

  const handleJoin = () => {
    if (joinCode.length === 5) router.push(`/join/${joinCode}`);
  };

  return (
    <main className="min-h-dvh">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-white/60">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-slate-900">
            <span className="w-8 h-8 rounded-xl bg-sky-500 text-white grid place-items-center text-sm">🧠</span>
            Tarik Angka!
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs font-black">
            <a href="/host" className="px-3 py-2 rounded-full bg-slate-900 text-white">Buat Game</a>
            <a href="/solo" className="px-3 py-2 rounded-full bg-white border border-slate-200">Solo</a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-8 md:pt-12">
        <div className="grid md:grid-cols-2 gap-6 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white border border-white rounded-full px-4 py-2 text-xs font-black tracking-widest text-sky-700 shadow-sm">
              🧠 GAME MATEMATIKA • 7–14 TAHUN
            </div>
            <h1 className="mt-4 text-5xl md:text-7xl font-black tracking-tight leading-[0.9] text-slate-900">
              Tarik <span className="text-sky-500">Angka!</span>
            </h1>
            <p className="mt-4 text-lg md:text-xl font-bold text-slate-600 leading-relaxed">
              1 layar besar + 2 HP controller.<br />
              <span className="text-slate-900">Jawab cepat, jawab benar, tarik lawan!</span>
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-500">Cepat. Benar. Tarik! — Server timestamp adil, retry tanpa cooldown.</p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => router.push("/host")}
                className="bg-slate-900 hover:bg-slate-800 text-white font-black py-5 rounded-[1.5rem] shadow-[0_12px_30px_rgba(15,23,42,.2)] flex flex-col items-center gap-1 active:scale-[0.98] transition"
              >
                <span className="text-xl">🎮 Buat Game</span>
                <span className="text-xs font-bold opacity-80">Host — QR di TV/Proyektor</span>
              </button>
              <button
                onClick={() => router.push("/solo")}
                className="bg-white hover:bg-sky-50 border-2 border-sky-200 text-sky-700 font-black py-5 rounded-[1.5rem] flex flex-col items-center gap-1 active:scale-[0.98] transition"
              >
                <span className="text-xl">⚡ Main Solo</span>
                <span className="text-xs font-bold opacity-80">1 device vs Bot</span>
              </button>
            </div>

            {/* Join */}
            <div className="mt-4 bg-white/90 backdrop-blur rounded-[1.5rem] border border-white p-4 shadow-sm">
              <div className="text-xs font-black tracking-widest text-slate-500">JOIN DENGAN KODE</div>
              <div className="mt-2 flex gap-2">
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 5))}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  placeholder="7K4P2"
                  className="flex-1 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 font-black tracking-[0.3em] uppercase text-center text-lg focus:border-sky-400 focus:outline-none"
                />
                <button
                  disabled={joinCode.length !== 5}
                  onClick={handleJoin}
                  className="bg-sky-500 hover:bg-sky-600 disabled:opacity-40 text-white font-black px-6 py-3 rounded-2xl"
                >
                  Join
                </button>
              </div>
              <div className="mt-2 text-xs font-semibold text-slate-500">Scan QR di display atau masukkan 5-char code.</div>
            </div>
          </div>

          {/* Mini Arena Preview */}
          <div className="relative">
            <div className="bg-white/90 backdrop-blur rounded-[2rem] border border-white overflow-hidden shadow-[0_18px_45px_rgba(15,23,42,.12)]">
              <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100">
                <span className="text-xs font-black tracking-widest text-slate-400">PREVIEW ARENA</span>
                <span className="text-xs font-black bg-amber-100 text-amber-700 px-2 py-1 rounded-full">LIVE</span>
              </div>
              <div className="p-3">
                <div className="rounded-2xl overflow-hidden border border-slate-100">
                  <TugArena scoreA={2} scoreB={1} />
                </div>
              </div>
              <div className="px-4 pb-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-sky-50 border border-sky-200 py-2">
                  <div className="text-xs font-black text-sky-700">KUBU A</div>
                  <div className="text-xl font-black">2</div>
                </div>
                <div className="rounded-2xl bg-white border border-slate-200 py-2">
                  <div className="text-xs font-black text-slate-500">RONDE</div>
                  <div className="text-xl font-black">4 / 10</div>
                </div>
                <div className="rounded-2xl bg-rose-50 border border-rose-200 py-2">
                  <div className="text-xs font-black text-rose-700">KUBU B</div>
                  <div className="text-xl font-black">1</div>
                </div>
              </div>
              <div className="px-4 pb-4">
                <div className="rounded-2xl bg-slate-900 text-white p-3 text-center">
                  <div className="text-xs font-black tracking-widest opacity-60">PERTANYAAN</div>
                  <div className="text-2xl font-black mt-1">8 × 7 = ?</div>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {["54", "56", "58", "52"].map((v) => (
                      <div key={v} className="rounded-xl bg-white text-slate-900 font-black py-2 text-sm">
                        {v}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -z-10 -top-4 -right-4 w-24 h-24 bg-amber-300 rounded-full blur-2xl opacity-40" />
            <div className="absolute -z-10 -bottom-6 -left-6 w-32 h-32 bg-sky-300 rounded-full blur-2xl opacity-40" />
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-8 grid grid-cols-3 md:grid-cols-4 gap-3">
          {[
            { k: "10 ronde", v: "Skor tertinggi menang" },
            { k: "5–15 detik", v: "Timer server" },
            { k: "Mudah–Sulit", v: "Campuran operasi" },
            { k: "Retry tanpa delay", v: "Salah boleh coba lagi" },
          ].map((s) => (
            <div key={s.k} className="bg-white/80 backdrop-blur rounded-2xl border border-white p-3 text-center">
              <div className="text-sm font-black text-slate-900">{s.k}</div>
              <div className="text-xs font-bold text-slate-500">{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How to play */}
      <section className="max-w-6xl mx-auto px-4 mt-8">
        <div className="bg-white/90 backdrop-blur rounded-[2rem] border border-white p-6 md:p-8 shadow-[0_18px_45px_rgba(15,23,42,.12)]">
          <h2 className="text-xl md:text-2xl font-black text-slate-900">Cara Main — 3 Device</h2>
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            {[
              { n: "1", t: "Host bikin room", d: "Buka /host → Buat Game → tampilkan /room/[CODE] + QR di TV/Proyektor. Kode 5-char, TTL 24 jam.", c: "bg-sky-500" },
              { n: "2", t: "2 HP join", d: "Scan QR → /join/[CODE] → pilih Kubu A / B. 1 pemain per tim, token anti-rebut.", c: "bg-rose-500" },
              { n: "3", t: "Mulai 3-2-1 → main", d: "Host MULAI → countdown sekali → soal muncul. Benar langsung next, salah retry seketika, waktu habis langsung next.", c: "bg-amber-400" },
            ].map((s) => (
              <div key={s.n} className="rounded-[1.5rem] border-2 border-slate-100 bg-slate-50 p-5">
                <div className={`w-10 h-10 rounded-full ${s.c} text-white grid place-items-center font-black`}>{s.n}</div>
                <div className="mt-3 font-black text-slate-900">{s.t}</div>
                <div className="mt-1 text-sm font-semibold text-slate-600 leading-relaxed">{s.d}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl bg-slate-900 text-white p-4 flex flex-wrap gap-3 items-center justify-between">
            <div className="text-sm font-bold">Aturan cepat: <span className="text-sky-300">benar &gt; salah</span> • seri → tali diam • posisi tali = skorA − skorB</div>
            <a href="/tarik-angka-game.html" target="_blank" className="text-xs font-black bg-white text-slate-900 px-3 py-2 rounded-full">
              Prototype HTML →
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 py-8 text-center text-xs font-bold text-slate-500">
        <div>© Tarik Angka! — Next.js + Tailwind + Supabase (game_*) • PWA ready • Sound toggle di Display/Controller</div>
        <div className="mt-1 flex justify-center gap-2">
          <a href="https://github.com/mzainulirfan/tarikmang" target="_blank" className="underline">
            GitHub
          </a>
          <span>•</span>
          <span>Vercel • Supabase Realtime polling 200ms (server timestamp fair)</span>
        </div>
      </footer>
    </main>
  );
}
