"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { clampRope } from "@/lib/game/scoring";

export function TugArena({ scoreA, scoreB, lastWinner }: { scoreA: number; scoreB: number; lastWinner?: "A" | "B" | "draw" | null }) {
  const pos = scoreA - scoreB;
  const clamped = clampRope(pos, 5);
  const shift = clamped * 5.2;
  const [dustKey, setDustKey] = useState(0);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (lastWinner === "A" || lastWinner === "B") {
      setDustKey((k) => k + 1);
      setShake(true);
      const t = setTimeout(() => setShake(false), 400);
      return () => clearTimeout(t);
    }
  }, [lastWinner, scoreA, scoreB]);

  return (
    <div className={`relative h-52 md:h-64 overflow-hidden bg-gradient-to-b from-emerald-300 to-green-400 ${shake ? "animate-[shake_0.4s_ease-in-out]" : ""}`}>
      <div className="absolute inset-x-0 bottom-0 h-9 bg-green-700/20" />
      <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-white/70 border-x border-white/80 border-dashed" />
      <div className="absolute left-1/2 -translate-x-1/2 top-3 bg-white/90 rounded-full px-3 py-1 text-xs font-black text-slate-500 shadow">GARIS TENGAH</div>

      {/* Rope with spring */}
      <motion.div
        className="absolute left-[7%] right-[7%] top-[57%] h-5 md:h-6 rounded-full"
        style={{
          background: `repeating-linear-gradient(90deg,#b7791f 0 12px,#d69e2e 12px 24px,#b7791f 24px 36px)`,
          boxShadow: `inset 0 2px 3px rgba(255,255,255,.35), 0 3px 8px rgba(120,70,0,.22)`,
        }}
        animate={{ x: `${shift}%`, scaleY: lastWinner ? 1.08 : 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 18, mass: 1.1 }}
      />

      {/* Flag with spring + wobble */}
      <motion.div
        className="absolute top-[40%] left-1/2 text-3xl"
        animate={{ x: `calc(-50% + ${shift}vw)`, rotate: lastWinner ? (lastWinner === "A" ? -12 : 12) : 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 12 }}
      >
        🏳️
      </motion.div>

      {/* Characters with lean */}
      <motion.div
        className="absolute left-[3%] top-[37%] text-5xl md:text-6xl select-none"
        animate={{
          x: `${clamped * 1.4}%`,
          rotate: lastWinner === "A" ? -10 : lastWinner === "B" ? 8 : 0,
          scale: lastWinner === "A" ? 1.05 : 1,
        }}
        transition={{ type: "spring", stiffness: 160, damping: 14 }}
      >
        🧒
      </motion.div>
      <motion.div
        className="absolute right-[3%] top-[37%] text-5xl md:text-6xl select-none"
        animate={{
          x: `${clamped * 1.4}%`,
          rotate: lastWinner === "B" ? 10 : lastWinner === "A" ? -8 : 0,
          scale: lastWinner === "B" ? 1.05 : 1,
        }}
        transition={{ type: "spring", stiffness: 160, damping: 14 }}
        style={{ scaleX: -1 } as any}
      >
        <span style={{ display: "inline-block", transform: "scaleX(-1)" }}>👧</span>
      </motion.div>

      {/* Dust particles */}
      <AnimatePresence>
        {dustKey > 0 && lastWinner && (
          <motion.div key={dustKey} className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.span
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-amber-900/30"
                initial={{ x: lastWinner === "A" ? "25%" : "75%", y: "62%", opacity: 0.8, scale: 0 }}
                animate={{
                  x: lastWinner === "A" ? `${20 + Math.random() * 15}%` : `${60 + Math.random() * 15}%`,
                  y: `${58 + Math.random() * 10}%`,
                  opacity: 0,
                  scale: 1.5,
                }}
                transition={{ duration: 0.6, delay: i * 0.04, ease: "easeOut" }}
                style={{ left: 0, top: 0 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute left-[3%] bottom-1 text-xs font-black text-sky-900">TIM A</div>
      <div className="absolute right-[3%] bottom-1 text-xs font-black text-rose-900">TIM B</div>
    </div>
  );
}
