import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const bank_id = searchParams.get("bank_id");
  const exclude = (searchParams.get("exclude") || "").split(",").filter(Boolean);
  if (!bank_id) return NextResponse.json({ error: "bank_id required" }, { status: 400 });

  const supa = getServiceClient();
  if (!supa) return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });

  let query = supa.from("game_questions_custom").select("id,question,options,correct_answer").eq("bank_id", bank_id);
  if (exclude.length > 0) query = query.not("id", "in", `(${exclude.join(",")})`);

  const { data, error } = await query.limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || data.length === 0) {
    // if all used, fallback to any
    const { data: fallback } = await supa.from("game_questions_custom").select("id,question,options,correct_answer").eq("bank_id", bank_id).limit(50);
    if (!fallback || fallback.length === 0) return NextResponse.json({ error: "Bank kosong" }, { status: 404 });
    const pick = fallback[Math.floor(Math.random() * fallback.length)];
    return NextResponse.json({ question: pick });
  }
  const pick = data[Math.floor(Math.random() * data.length)];
  return NextResponse.json({ question: pick });
}
