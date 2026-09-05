"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Difficulty, Operation } from "@/types/game";
import { generateRoomCode } from "@/lib/room/code";
import { createRoomState, saveRoom } from "@/lib/room/store";

const DIFFICULTIES: { v: Difficulty; label: string; desc: string; icon: string }[] = [
  { v: "mudah", label: "Mudah", desc: "Angka kecil", icon: "🌱" },
  { v: "sedang", label: "Sedang", desc: "Menengah", icon: "🔥" },
  { v: "sulit", label: "Sulit", desc: "Angka besar", icon: "⚡" },
];
const OPERATIONS: { v: Operation; label: string; icon: string }[] = [
  { v: "campuran", label: "Campuran", icon: "🎲" },
  { v: "penjumlahan", label: "Tambah", icon: "➕" },
  { v: "pengurangan", label: "Kurang", icon: "➖" },
  { v: "perkalian", label: "Kali", icon: "✖️" },
  { v: "pembagian", label: "Bagi", icon: "➗" },
];

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
    <main className="min-h-dvh">
      <header className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-white/60">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="font-black text-slate-900 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-slate-900 text-white grid place-items-center">←</span>
            Tarik Angka!
          </a>
          <div className="text-xs font-black tracking-widest text-slate-500">HOST • LAYAR BESAR</div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 pt-6 md:pt-8">
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white border border-white rounded-full px-4 py-2 text-xs font-black tracking-widest text-sky-700 shadow-sm">
            🎮 ATUR PERTANDINGAN
          </div>
          <h1 className="mt-3 text-4xl md:text-5xl font-black tracking-tight text-slate-900">
            Siapkan <span className="text-sky-500">Arena</span>
          </h1>
          <p className="mt-2 text-slate-600 font-bold">Pilih tingkat, operasi, ronde & timer — QR akan tampil di layar besar untuk 2 HP.</p>
        </div>

        <div className="mt-8 grid lg:grid-cols-5 gap-6">
          {/* Form */}
          <div className="lg:col-span-3 bg-white/90 backdrop-blur rounded-[2rem] border border-white p-6 md:p-7 shadow-[0_18px_45px_rgba(15,23,42,.12)]">
            <h2 className="font-black text-slate-900">Game Setup</h2>
            <p className="text-sm font-semibold text-slate-500">Tap kartu, bukan dropdown — cepat untuk guru di kelas.</p>

            <div className="mt-5">
              <div className="text-xs font-black tracking-widest text-slate-500">TINGKAT KESULITAN</div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.v}
                    onClick={() => setDifficulty(d.v)}
                    className={`rounded-2xl border-2 p-3 text-center transition ${difficulty === d.v ? "bg-sky-500 border-sky-500 text-white shadow" : "bg-white border-slate-200 hover:border-sky-200"}`}
                  >
                    <div className="text-xl">{d.icon}</div>
                    <div className="text-sm font-black">{d.label}</div>
                    <div className={`text-xs font-bold ${difficulty === d.v ? "text-white/80" : "text-slate-500"}`}>{d.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <div className="text-xs font-black tracking-widest text-slate-500">OPERASI</div>
              <div className="mt-2 grid grid-cols-3 md:grid-cols-5 gap-2">
                {OPERATIONS.map((op) => (
                  <button
                    key={op.v}
                    onClick={() => setOperation(op.v)}
                    className={`rounded-2xl border-2 py-3 text-center transition ${operation === op.v ? "bg-slate-900 border-slate-900 text-white" : "bg-white border-slate-200 hover:border-slate-300"}`}
                  >
                    <div className="text-lg">{op.icon}</div>
                    <div className="text-xs font-black">{op.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-black tracking-widest text-slate-500">JUMLAH RONDE</div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {[5, 10, 15].map((n) => (
                    <button
                      key={n}
                      onClick={() => setTotalRounds(n)}
                      className={`rounded-2xl border-2 py-3 font-black ${totalRounds === n ? "bg-amber-400 border-amber-400 text-slate-900" : "bg-white border-slate-200"}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-black tracking-widest text-slate-500">DURASI / SOAL</div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {[5, 10, 15].map((n) => (
                    <button
                      key={n}
                      onClick={() => setDurationSec(n)}
                      className={`rounded-2xl border-2 py-3 font-black ${durationSec === n ? "bg-emerald-400 border-emerald-400 text-slate-900" : "bg-white border-slate-200"}`}
                    >
                      {n}s
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={handleCreate} disabled={loading} className="mt-6 w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black py-5 rounded-2xl shadow-[0_12px_30px_rgba(15,23,42,.2)] active:scale-[0.98] transition">
              {loading ? "Membuat arena..." : "Buat Game — Tampilkan QR →"}
            </button>
            <div className="mt-3 flex gap-3 text-xs font-black justify-center">
              <a href="/solo" className="text-sky-600 hover:underline">
                Main Solo →
              </a>
              <span className="text-slate-300">•</span>
              <a href="/" className="text-slate-500 hover:underline">
                Kembali ke Home
              </a>
            </div>
          </div>

          {/* Preview */}
          <div className="lg:col-span-2">
            <div className="bg-slate-900 text-white rounded-[2rem] p-6 shadow-[0_18px_45px_rgba(15,23,42,.2)]">
              <div className="text-xs font-black tracking-widest opacity-60">PREVIEW DISPLAY</div>
              <div className="mt-3 rounded-2xl bg-white text-slate-900 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black tracking-widest text-slate-500">KODE AKAN MUNCUL</span>
                  <span className="text-xs font-black bg-amber-100 text-amber-700 px-2 py-1 rounded-full">QR</span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-sky-50 border border-sky-200 p-3 text-center">
                    <div className="text-xs font-black text-sky-700">KUBU A</div>
                    <div className="text-xs text-slate-500">Menunggu</div>
                  </div>
                  <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-center">
                    <div className="text-xs font-black text-rose-700">KUBU B</div>
                    <div className="text-xs text-slate-500">Menunggu</div>
                  </div>
                </div>
                <div className="mt-3 rounded-xl bg-slate-900 text-white p-3 text-center font-black">SCAN UNTUK JOIN</div>
              </div>
              <div className="mt-4 space-y-2 text-sm font-bold">
                <div className="flex justify-between">
                  <span className="opacity-60">Kesulitan</span>
                  <span className="capitalize">{difficulty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Operasi</span>
                  <span className="capitalize">{operation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Ronde</span>
                  <span>{totalRounds}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Timer</span>
                  <span>{durationSec} detik</span>
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-white/10 p-3 text-xs font-semibold leading-relaxed">
                Tips: proyeksikan <b>/room/[CODE]</b> di TV. 2 HP buka <b>/join/[CODE]</b>. Host tekan MULAI → 3-2-1 sekali → soal mengalir tanpa jeda.
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
