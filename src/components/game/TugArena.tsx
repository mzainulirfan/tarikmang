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

      {/* Rope — always taut + subtle vibration even when draw */}
      <motion.div
        className="absolute left-[7%] right-[7%] top-[57%] h-5 md:h-6 rounded-full"
        style={{
          background: `repeating-linear-gradient(90deg,#b7791f 0 12px,#d69e2e 12px 24px,#b7791f 24px 36px)`,
          boxShadow: `inset 0 2px 3px rgba(255,255,255,.35), 0 3px 8px rgba(120,70,0,.22)`,
        }}
        animate={{ x: `${shift}%`, scaleY: lastWinner ? 1.1 : 1.04 }}
        transition={{ type: "spring", stiffness: 180, damping: 18, mass: 1.1 }}
      />
      {/* Rope idle shiver */}
      <motion.div
        className="absolute left-[7%] right-[7%] top-[57%] h-5 md:h-6 rounded-full pointer-events-none opacity-30"
        animate={{ scaleY: [1, 1.02, 1] }}
        transition={{ duration: 0.35, repeat: Infinity, ease: "easeInOut" }}
        style={{ background: `transparent` }}
      />

      {/* Flag — always wobble slightly, wobble stronger on win */}
      <motion.div
        className="absolute top-[40%] left-1/2 text-3xl"
        animate={{
          x: `calc(-50% + ${shift}vw)`,
          rotate: lastWinner ? (lastWinner === "A" ? -14 : 14) : 0,
          y: [0, -3, 0],
        }}
        transition={{
          x: { type: "spring", stiffness: 200, damping: 14 },
          rotate: { type: "spring", stiffness: 200, damping: 12 },
          y: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        🏳️
      </motion.div>

      {/* Characters — always in pulling pose, continuous strain */}
      <motion.div
        className="absolute left-[3%] top-[37%] text-5xl md:text-6xl select-none"
        animate={{ x: `${clamped * 1.4}%` }}
        transition={{ type: "spring", stiffness: 160, damping: 14 }}
      >
        <motion.div
          animate={{
            rotate: lastWinner === "A" ? -12 : lastWinner === "B" ? -2 : -7,
            y: [0, -2, 0],
            x: [0, -1, 0],
          }}
          transition={{
            rotate: { type: "spring", stiffness: 160, damping: 14 },
            y: { duration: 0.5, repeat: Infinity, ease: "easeInOut" },
            x: { duration: 0.4, repeat: Infinity, ease: "easeInOut" },
          }}
          style={{ display: "inline-block" }}
        >
          🧒
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute right-[3%] top-[37%] text-5xl md:text-6xl select-none"
        animate={{ x: `${clamped * 1.4}%` }}
        transition={{ type: "spring", stiffness: 160, damping: 14 }}
      >
        <motion.div
          animate={{
            rotate: lastWinner === "B" ? 12 : lastWinner === "A" ? 2 : 7,
            y: [0, -2, 0],
            x: [0, 1, 0],
          }}
          transition={{
            rotate: { type: "spring", stiffness: 160, damping: 14 },
            y: { duration: 0.5, repeat: Infinity, ease: "easeInOut", delay: 0.15 },
            x: { duration: 0.4, repeat: Infinity, ease: "easeInOut", delay: 0.15 },
          }}
          style={{ display: "inline-block", transform: "scaleX(-1)" }}
        >
          <span style={{ display: "inline-block", transform: "scaleX(-1)" }}>👧</span>
        </motion.div>
      </motion.div>

      {/* Continuous subtle dust when playing, burst on win */}
      <div className="absolute left-[20%] right-[20%] top-[62%] h-2 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute inset-0 flex justify-center gap-1 opacity-20"
          animate={{ x: [0, -2, 0, 2, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.span
              key={i}
              className="w-1 h-1 rounded-full bg-amber-900/40"
              animate={{ y: [0, -4, 0], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 0.7 + i * 0.1, repeat: Infinity, delay: i * 0.12 }}
            />
          ))}
        </motion.div>
      </div>

      {/* Burst dust on win */}
      <AnimatePresence>
        {dustKey > 0 && lastWinner && (
          <motion.div key={dustKey} className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 10 }).map((_, i) => (
              <motion.span
                key={i}
                className="absolute w-1.5 h-1.5 rounded-full bg-amber-900/30"
                initial={{ x: lastWinner === "A" ? "25%" : "75%", y: "62%", opacity: 0.8, scale: 0 }}
                animate={{
                  x: lastWinner === "A" ? `${15 + Math.random() * 20}%` : `${60 + Math.random() * 20}%`,
                  y: `${50 + Math.random() * 15}%`,
                  opacity: 0,
                  scale: 1.6,
                }}
                transition={{ duration: 0.7, delay: i * 0.03, ease: "easeOut" }}
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
