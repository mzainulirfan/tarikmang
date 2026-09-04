import type { Difficulty, Operation, Question } from "@/types/game";

let qCounter = 0;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function generateQuestion(
  difficulty: Difficulty = "mudah",
  operation: Operation = "campuran"
): Question {
  const ops: Operation[] =
    operation === "campuran"
      ? ["penjumlahan", "pengurangan", "perkalian", "pembagian"]
      : [operation];

  const op = ops[randomInt(0, ops.length - 1)];
  let a = 0, b = 0, answer = 0, text = "";

  // range by difficulty
  const range = {
    mudah: { add: [2, 20], sub: [5, 30], mul: [2, 10], div: [2, 10] },
    sedang: { add: [10, 50], sub: [10, 60], mul: [3, 12], div: [3, 12] },
    sulit: { add: [20, 100], sub: [20, 100], mul: [6, 15], div: [4, 15] },
  }[difficulty];

  if (op === "penjumlahan") {
    a = randomInt(range.add[0], range.add[1]);
    b = randomInt(range.add[0], range.add[1]);
    answer = a + b;
    text = `${a} + ${b} = ?`;
  } else if (op === "pengurangan") {
    a = randomInt(range.sub[0], range.sub[1]);
    b = randomInt(2, a); // ensure non-negative
    answer = a - b;
    text = `${a} - ${b} = ?`;
  } else if (op === "perkalian") {
    a = randomInt(range.mul[0], range.mul[1]);
    b = randomInt(range.mul[0], range.mul[1]);
    answer = a * b;
    text = `${a} × ${b} = ?`;
  } else if (op === "pembagian") {
    // ensure integer division: pick divisor and quotient, derive dividend
    b = randomInt(range.div[0], range.div[1]);
    const quotient = randomInt(range.div[0], range.div[1]);
    a = b * quotient;
    answer = quotient;
    text = `${a} ÷ ${b} = ?`;
  }

  // generate 4 options with plausible distractors
  const choices = new Set<number>([answer]);
  let attempts = 0;
  while (choices.size < 4 && attempts < 50) {
    attempts++;
    const delta = randomInt(-10, 10);
    if (delta === 0) continue;
    const candidate = Math.max(0, answer + delta);
    // avoid duplicates and very close trivial errors for division
    if (!choices.has(candidate)) choices.add(candidate);
  }
  // fallback if still <4
  while (choices.size < 4) {
    choices.add(randomInt(Math.max(0, answer - 15), answer + 15));
  }

  qCounter += 1;

  return {
    id: `q_${Date.now()}_${qCounter}`,
    text,
    answer,
    options: shuffle([...choices]),
    operation: op,
    difficulty,
  };
}
