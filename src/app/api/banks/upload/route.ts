import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";
import Papa from "papaparse";

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form" }, { status: 400 });

  const file = form.get("file") as File | null;
  const bank_id = form.get("bank_id") as string | null;
  if (!file || !bank_id) return NextResponse.json({ error: "file, bank_id required" }, { status: 400 });

  const text = await file.text();
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });

  if (parsed.errors.length > 0) {
    return NextResponse.json({ error: "CSV parse error", details: parsed.errors.slice(0, 3) }, { status: 400 });
  }

  const rows = parsed.data;
  if (rows.length === 0) return NextResponse.json({ error: "CSV kosong" }, { status: 400 });
  if (rows.length > 200) return NextResponse.json({ error: "Maks 200 soal per upload" }, { status: 400 });

  const required = ["question", "option1", "option2", "option3", "option4", "correct_answer"];
  const headers = Object.keys(rows[0] || {}).map((h) => h.trim().toLowerCase());
  for (const r of required) {
    if (!headers.includes(r)) return NextResponse.json({ error: `Header wajib: ${required.join(", ")}` }, { status: 400 });
  }

  const supa = getServiceClient();
  if (!supa) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  // verify bank exists
  const { data: bank } = await supa.from("game_question_banks").select("id").eq("id", bank_id).single();
  if (!bank) return NextResponse.json({ error: "Bank not found" }, { status: 404 });

  const inserts: { bank_id: string; question: string; options: string[]; correct_answer: string }[] = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    // case-insensitive keys
    const norm: Record<string, string> = {};
    for (const k of Object.keys(r)) norm[k.trim().toLowerCase()] = (r[k] || "").trim();
    const question = norm["question"];
    const opts = [norm["option1"], norm["option2"], norm["option3"], norm["option4"]];
    const correct = norm["correct_answer"];
    if (!question || opts.some((o) => !o) || !correct) {
      return NextResponse.json({ error: `Baris ${i + 2} tidak lengkap` }, { status: 400 });
    }
    if (!opts.includes(correct)) {
      return NextResponse.json({ error: `Baris ${i + 2} correct_answer harus salah satu option1-4` }, { status: 400 });
    }
    inserts.push({ bank_id, question, options: opts, correct_answer: correct });
  }

  const { error: insErr } = await supa.from("game_questions_custom").insert(inserts);
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  // update count
  const { count } = await supa.from("game_questions_custom").select("id", { count: "exact", head: true }).eq("bank_id", bank_id);
  await supa.from("game_question_banks").update({ question_count: count || inserts.length }).eq("id", bank_id);

  return NextResponse.json({ ok: true, inserted: inserts.length, total: count || inserts.length });
}
