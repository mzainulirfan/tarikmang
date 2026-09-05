"use client";
import { motion } from "framer-motion";

export function AnswerGrid({
  options,
  disabled,
  onAnswer,
  team,
}: {
  options: (string | number)[];
  disabled: boolean;
  onAnswer: (v: string | number) => void;
  team?: "A" | "B";
}) {
  const isA = team === "A";
  return (
    <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
      {options.map((opt) => (
        <motion.button
          key={opt}
          disabled={disabled}
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(20);
            onAnswer(opt);
          }}
          whileTap={{ scale: 0.94 }}
          whileHover={!disabled ? { scale: 1.02 } : {}}
          className={`rounded-[1.3rem] border-2 py-5 text-2xl font-black shadow-sm transition disabled:opacity-50 ${
            disabled
              ? "bg-slate-100 border-slate-200 text-slate-400"
              : isA
                ? "bg-white border-sky-200 hover:border-sky-400 hover:bg-sky-50 active:bg-sky-100"
                : team === "B"
                  ? "bg-white border-rose-200 hover:border-rose-400 hover:bg-rose-50 active:bg-rose-100"
                  : "bg-white border-slate-200 hover:border-sky-300"
          }`}
        >
          {opt}
        </motion.button>
      ))}
    </div>
  );
}
