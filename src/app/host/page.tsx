"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Difficulty, Operation } from "@/types/game";
import { generateRoomCode, generatePlayerToken } from "@/lib/room/code";
import { createRoomState, saveRoom } from "@/lib/room/store";
import { getBanks as getLocalBanks, addBank as addLocalBank, addQuestionsFromCSV as addLocalQuestions } from "@/lib/banks/local";

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

type Bank = { id: string; name: string; category: string; question_count: number };

export default function HostPage() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<Difficulty>("mudah");
  const [operation, setOperation] = useState<Operation>("campuran");
  const [totalRounds, setTotalRounds] = useState(10);
  const [durationSec, setDurationSec] = useState(10);
  const [source, setSource] = useState<"auto" | "bank">("auto");
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(false);
  const [hostToken, setHostToken] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankCategory, setBankCategory] = useState("agama");
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);

  useEffect(() => {
    let t = localStorage.getItem("tarikmang:hostToken");
    if (!t) {
      t = generatePlayerToken();
      localStorage.setItem("tarikmang:hostToken", t);
    }
    setHostToken(t);
  }, []);

  useEffect(() => {
    if (!hostToken) return;
    fetch(`/api/banks/list?owner_token=${hostToken}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.banks && j.banks.length > 0) setBanks(j.banks);
        else setBanks(getLocalBanks().map((b) => ({ id: b.id, name: b.name, category: b.category, question_count: b.questionCount })));
      })
      .catch(() => {
        setBanks(getLocalBanks().map((b) => ({ id: b.id, name: b.name, category: b.category, question_count: b.questionCount })));
      });
  }, [hostToken]);

  const handleCreate = async () => {
    if (source === "bank" && !selectedBank) {
      setUploadMsg("Pilih bank dulu");
      return;
    }
    setLoading(true);
    try {
      const body: any = { difficulty, operation, totalRounds, durationSec };
      let customQuestions: any[] | undefined;
      if (source === "bank" && selectedBank) {
        body.source = "bank";
        body.bankId = selectedBank;
        // untuk bank lokal, embed questions langsung ke room agar cross-device tanpa butuh tabel Supabase
        try {
          const { getQuestions } = await import("@/lib/banks/local");
          const qs = getQuestions(selectedBank);
          if (qs.length > 0) {
            customQuestions = qs.map((q) => ({ id: q.id, question: q.question, options: q.options, correct_answer: q.correct_answer }));
            body.customQuestions = customQuestions;
          }
        } catch {}
      } else {
        body.source = "auto";
      }

      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const res = await fetch("/api/game/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (json.code) {
          router.push(`/room/${json.code}`);
          return;
        }
      }
      const code = generateRoomCode(5);
      const state = createRoomState(code, body);
      if (customQuestions) (state as any).customQuestions = customQuestions;
      await saveRoom(state);
      router.push(`/room/${code}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBank = async () => {
    if (!bankName.trim() || !hostToken) return;
    try {
      const res = await fetch("/api/banks/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: bankName, category: bankCategory, owner_token: hostToken }),
      });
      const json = await res.json();
      if (json.bank) {
        setBanks((b) => [{ id: json.bank.id, name: json.bank.name, category: json.bank.category, question_count: 0 }, ...b]);
        setSelectedBank(json.bank.id);
        setBankName("");
        setUploadMsg(`Bank "${json.bank.name}" dibuat (Supabase)`);
        return;
      }
      throw new Error(json.error);
    } catch {
      // fallback local
      const bank = addLocalBank(bankName, bankCategory);
      setBanks((b) => [{ id: bank.id, name: bank.name, category: bank.category, question_count: 0 }, ...b]);
      setSelectedBank(bank.id);
      setBankName("");
      setUploadMsg(`Bank "${bank.name}" dibuat (lokal)`);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBank) {
      setUploadMsg("Pilih bank dulu & pilih file CSV");
      return;
    }
    const text = await file.text();
    // coba Supabase dulu
    try {
      const fd = new FormData();
      fd.append("file", new Blob([text], { type: "text/csv" }), file.name);
      fd.append("bank_id", selectedBank);
      const res = await fetch("/api/banks/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (json.ok) {
        setUploadMsg(`Berhasil upload ${json.inserted} soal (total ${json.total}) ke Supabase`);
        fetch(`/api/banks/list?owner_token=${hostToken}`)
          .then((r) => r.json())
          .then((j) => {
            if (j.banks) setBanks(j.banks);
            else setBanks(getLocalBanks().map((b) => ({ id: b.id, name: b.name, category: b.category, question_count: b.questionCount })));
          });
        e.target.value = "";
        return;
      }
      throw new Error(json.error);
    } catch {}
    // fallback local
    const result = addLocalQuestions(selectedBank, text);
    if (result.error) setUploadMsg(result.error);
    else {
      setUploadMsg(`Berhasil upload ${result.inserted} soal (lokal)`);
      setBanks(getLocalBanks().map((b) => ({ id: b.id, name: b.name, category: b.category, question_count: b.questionCount })));
    }
    e.target.value = "";
  };

  const downloadTemplate = () => {
    const csv = "question,option1,option2,option3,option4,correct_answer\nApa rukun Islam pertama?,Syhadat,Shalat,Puasa,Zakat,Syhadat\nBerapa rakaat Subuh?,2,3,4,1,2";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "template_agama.csv";
    a.click();
    URL.revokeObjectURL(url);
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
          <div className="inline-flex items-center gap-2 bg-white border border-white rounded-full px-4 py-2 text-xs font-black tracking-widest text-sky-700 shadow-sm">🎮 ATUR PERTANDINGAN</div>
          <h1 className="mt-3 text-4xl md:text-5xl font-black tracking-tight text-slate-900">
            Siapkan <span className="text-sky-500">Arena</span>
          </h1>
          <p className="mt-2 text-slate-600 font-bold">Pilih sumber soal: Otomatis Matematika atau Bank Custom (Agama/lain) via upload CSV.</p>
        </div>

        <div className="mt-8 grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-white/90 backdrop-blur rounded-[2rem] border border-white p-6 md:p-7 shadow-[0_18px_45px_rgba(15,23,42,.12)]">
            <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
              <button onClick={() => setSource("auto")} className={`px-4 py-2 rounded-xl font-black text-sm ${source === "auto" ? "bg-white shadow" : "text-slate-500"}`}>
                ⚡ Otomatis
              </button>
              <button onClick={() => setSource("bank")} className={`px-4 py-2 rounded-xl font-black text-sm ${source === "bank" ? "bg-white shadow" : "text-slate-500"}`}>
                📚 Bank Custom
              </button>
            </div>

            {source === "auto" ? (
              <>
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
              </>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
                  <div className="font-black text-sm">Bank Soal Custom (CSV Private)</div>
                  <div className="text-xs font-bold text-slate-600 mt-1">Hanya kamu (owner_token) yang lihat bank ini. Upload CSV 5-200 soal.</div>
                  <div className="mt-3 flex gap-2">
                    <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Nama bank misal: Agama Kelas 5" className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold" />
                    <select value={bankCategory} onChange={(e) => setBankCategory(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold">
                      <option value="agama">Agama</option>
                      <option value="ipa">IPA</option>
                      <option value="ips">IPS</option>
                      <option value="lain">Lain</option>
                    </select>
                    <button onClick={handleCreateBank} className="bg-slate-900 text-white font-black px-4 py-2 rounded-xl text-sm">
                      Buat
                    </button>
                  </div>
                  {banks.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs font-black tracking-widest text-slate-500">PILIH BANK</div>
                      <select value={selectedBank || ""} onChange={(e) => setSelectedBank(e.target.value)} className="mt-1 w-full rounded-xl border-2 border-slate-200 px-3 py-2 font-bold">
                        <option value="">— Pilih bank —</option>
                        {banks.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.category}) — {b.question_count} soal
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {selectedBank && (
                    <div className="mt-3">
                      <label className="block text-xs font-black tracking-widest text-slate-500">UPLOAD CSV</label>
                      <input type="file" accept=".csv" onChange={handleUpload} className="mt-1 block w-full text-sm" />
                      <div className="text-xs text-slate-500 mt-1">Header wajib: question,option1,option2,option3,option4,correct_answer</div>
                    </div>
                  )}
                  <div className="mt-3 flex gap-2">
                    <button onClick={downloadTemplate} className="text-xs font-black underline">
                      Download template CSV Agama
                    </button>
                  </div>
                  {uploadMsg && <div className="mt-2 text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 rounded-xl p-2">{uploadMsg}</div>}
                </div>
              </div>
            )}

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-black tracking-widest text-slate-500">JUMLAH RONDE</div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {[5, 10, 15].map((n) => (
                    <button key={n} onClick={() => setTotalRounds(n)} className={`rounded-2xl border-2 py-3 font-black ${totalRounds === n ? "bg-amber-400 border-amber-400 text-slate-900" : "bg-white border-slate-200"}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs font-black tracking-widest text-slate-500">DURASI / SOAL</div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {[5, 10, 15].map((n) => (
                    <button key={n} onClick={() => setDurationSec(n)} className={`rounded-2xl border-2 py-3 font-black ${durationSec === n ? "bg-emerald-400 border-emerald-400 text-slate-900" : "bg-white border-slate-200"}`}>
                      {n}s
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button onClick={handleCreate} disabled={loading || (source === "bank" && !selectedBank)} className="mt-6 w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-black py-5 rounded-2xl shadow-[0_12px_30px_rgba(15,23,42,.2)] active:scale-[0.98] transition">
              {loading ? "Membuat arena..." : source === "bank" ? "Buat Game dengan Bank Custom →" : "Buat Game — Tampilkan QR →"}
            </button>
          </div>

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
                  <span className="opacity-60">Sumber</span>
                  <span>{source === "bank" ? `Bank ${banks.find((b) => b.id === selectedBank)?.name || "-"}` : `${difficulty} • ${operation}`}</span>
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
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
