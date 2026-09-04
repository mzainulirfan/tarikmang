"use client";

export function AnswerGrid({
  options,
  disabled,
  onAnswer,
}: {
  options: number[];
  disabled: boolean;
  onAnswer: (v: number) => void;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
      {options.map((opt) => (
        <button
          key={opt}
          disabled={disabled}
          onClick={() => onAnswer(opt)}
          className="bg-sky-50 hover:bg-sky-100 border-2 border-sky-200 hover:border-sky-400 rounded-2xl py-4 text-2xl font-black transition active:scale-95 disabled:pointer-events-none disabled:opacity-55"
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
