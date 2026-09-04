"use client";

export type SoundName = "countdown" | "start" | "correct" | "wrong" | "rope" | "winner" | "join";

let ctx: AudioContext | null = null;
let enabled = true;

export function isSoundEnabled() {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem("tarikmang:sound");
  return v === null ? true : v === "1";
}

export function setSoundEnabled(v: boolean) {
  enabled = v;
  if (typeof window !== "undefined") localStorage.setItem("tarikmang:sound", v ? "1" : "0");
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!isSoundEnabled()) return null;
  if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq: number, duration: number, type: OscillatorType = "sine", gain = 0.12, slideTo?: number) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + duration);
  g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(g);
  g.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration);
}

export function playSound(name: SoundName) {
  if (!isSoundEnabled()) return;
  switch (name) {
    case "countdown":
      tone(800, 0.12, "sine", 0.15);
      break;
    case "start":
      tone(600, 0.15, "square", 0.12, 900);
      break;
    case "correct":
      tone(600, 0.12, "sine", 0.14);
      setTimeout(() => tone(900, 0.15, "sine", 0.14), 120);
      break;
    case "wrong":
      tone(200, 0.25, "sawtooth", 0.08, 120);
      break;
    case "rope":
      tone(150, 0.2, "triangle", 0.1, 80);
      break;
    case "winner":
      [0, 120, 240].forEach((d, i) => setTimeout(() => tone(500 + i * 200, 0.2, "sine", 0.13), d));
      break;
    case "join":
      tone(700, 0.1, "sine", 0.12);
      break;
  }
}
