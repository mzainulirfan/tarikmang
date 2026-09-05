"use client";
import type { Question } from "@/types/game";

export type LocalBank = {
  id: string;
  name: string;
  category: string;
  questionCount: number;
  createdAt: number;
};

export type LocalQuestion = {
  id: string;
  bankId: string;
  question: string;
  options: string[];
  correct_answer: string;
};

const BANKS_KEY = "tarikmang:banks";
const QUESTIONS_PREFIX = "tarikmang:bank:questions:";

export function getBanks(): LocalBank[] {
  try {
    const raw = localStorage.getItem(BANKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBanks(banks: LocalBank[]) {
  localStorage.setItem(BANKS_KEY, JSON.stringify(banks));
}

export function addBank(name: string, category: string): LocalBank {
  const banks = getBanks();
  const bank: LocalBank = {
    id: `bank_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    category,
    questionCount: 0,
    createdAt: Date.now(),
  };
  banks.unshift(bank);
  saveBanks(banks);
  return bank;
}

export function getQuestions(bankId: string): LocalQuestion[] {
  try {
    const raw = localStorage.getItem(QUESTIONS_PREFIX + bankId);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveQuestions(bankId: string, qs: LocalQuestion[]) {
  localStorage.setItem(QUESTIONS_PREFIX + bankId, JSON.stringify(qs));
  // update count
  const banks = getBanks();
  const idx = banks.findIndex((b) => b.id === bankId);
  if (idx >= 0) {
    banks[idx].questionCount = qs.length;
    saveBanks(banks);
  }
}

export function addQuestionsFromCSV(bankId: string, csvText: string): { inserted: number; error?: string } {
  // simple CSV parse: header question,option1,option2,option3,option4,correct_answer
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return { inserted: 0, error: "CSV kosong" };
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const required = ["question", "option1", "option2", "option3", "option4", "correct_answer"];
  for (const r of required) if (!header.includes(r)) return { inserted: 0, error: `Header wajib: ${required.join(", ")}` };

  const idx = {
    q: header.indexOf("question"),
    o1: header.indexOf("option1"),
    o2: header.indexOf("option2"),
    o3: header.indexOf("option3"),
    o4: header.indexOf("option4"),
    c: header.indexOf("correct_answer"),
  };

  const existing = getQuestions(bankId);
  let inserted = 0;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    // naive split by comma not handling quoted commas — cukup untuk MVP
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cols.length < 6) continue;
    const question = cols[idx.q];
    const opts = [cols[idx.o1], cols[idx.o2], cols[idx.o3], cols[idx.o4]];
    const correct = cols[idx.c];
    if (!question || opts.some((o) => !o) || !correct) continue;
    if (!opts.includes(correct)) continue;
    existing.push({
      id: `q_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 4)}`,
      bankId,
      question,
      options: opts,
      correct_answer: correct,
    });
    inserted++;
    if (inserted >= 200) break;
  }
  saveQuestions(bankId, existing);
  return { inserted };
}

export function getRandomQuestion(bankId: string, excludeIds: string[] = []): { question: string; options: string[]; correct_answer: string; id: string } | null {
  const all = getQuestions(bankId);
  const filtered = all.filter((q) => !excludeIds.includes(q.id));
  const pool = filtered.length > 0 ? filtered : all;
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function toQuestion(bankQ: { id: string; question: string; options: string[]; correct_answer: string }): Question {
  const opts = [...bankQ.options].sort(() => Math.random() - 0.5);
  return {
    id: bankQ.id,
    text: bankQ.question,
    answer: bankQ.correct_answer,
    options: opts,
    operation: "campuran",
    difficulty: "mudah",
    bankId: bankQ.id,
  };
}
