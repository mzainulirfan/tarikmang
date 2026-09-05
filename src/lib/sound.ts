"use client";

export type SoundName = "countdown" | "start" | "correct" | "wrong" | "rope" | "winner" | "join";

let ctx: AudioContext | null = null;

export function isSoundEnabled() {
  if (typeof window === "undefined") return true;
  const v = localStorage.getItem("tarikmang:sound");
  return v === null ? true : v === "1";
}

export function setSoundEnabled(v: boolean) {
  if (typeof window !== "undefined") localStorage.setItem("tarikmang:sound", v ? "1" : "0");
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!isSoundEnabled()) return null;
  if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function envGain(g: GainNode, c: AudioContext, duration: number, peak = 0.18) {
  const now = c.currentTime;
  g.gain.setValueAtTime(0.001, now);
  g.gain.linearRampToValueAtTime(peak, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, now + duration);
}

function tone(freq: number, duration: number, type: OscillatorType = "sine", peak = 0.18, slideTo?: number, detune = 0) {
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 3000;
  osc.type = type;
  osc.frequency.value = freq;
  if (detune) osc.detune.value = detune;
  if (slideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), c.currentTime + duration);
  envGain(gain, c, duration, peak);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration + 0.02);
}

function chord(freqs: number[], duration: number, type: OscillatorType = "sine", peak = 0.16) {
  freqs.forEach((f) => tone(f, duration, type, peak / freqs.length));
}

function tick(high = false) {
  // short click — sine, very short, no slide, soft
  tone(high ? 1100 : 900, 0.08, "sine", 0.22);
  // second harmonic very quiet for warmth
  setTimeout(() => tone(high ? 2200 : 1800, 0.04, "sine", 0.06), 10);
}

export function playSound(name: SoundName) {
  if (!isSoundEnabled()) return;
  switch (name) {
    case "countdown":
      // tick-tick-tick — clean sine click, last one higher
      tick(false);
      break;
    case "start":
      // GO! — rising bright major 3rd (C5 -> E5 -> G5) quick arpeggio
      tone(523, 0.12, "sine", 0.2);
      setTimeout(() => tone(659, 0.12, "sine", 0.2), 90);
      setTimeout(() => tone(784, 0.18, "sine", 0.22), 180);
      break;
    case "correct":
      // cheerful major triad C5-E5-G5, warm
      chord([523, 659], 0.14, "sine", 0.28);
      setTimeout(() => tone(784, 0.22, "sine", 0.24), 110);
      setTimeout(() => tone(1046, 0.18, "triangle", 0.14), 260);
      break;
    case "wrong":
      // soft descending — 300Hz -> 180Hz sine, no harsh sawtooth (no bee)
      tone(320, 0.22, "sine", 0.18, 180);
      tone(318, 0.22, "triangle", 0.08, 178); // slight detune for body, not buzz
      break;
    case "rope":
      // thud pull — low soft thump, not bee
      tone(140, 0.18, "sine", 0.22, 85);
      tone(90, 0.22, "triangle", 0.12, 60);
      // subtle tick for rope
      setTimeout(() => tone(2000, 0.04, "sine", 0.05), 40);
      break;
    case "winner":
      // fanfare C5-E5-G5-C6
      chord([523], 0.16, "sine", 0.22);
      setTimeout(() => chord([659], 0.16, "sine", 0.22), 140);
      setTimeout(() => chord([784], 0.16, "sine", 0.22), 280);
      setTimeout(() => {
        tone(1046, 0.45, "sine", 0.26);
        tone(1048, 0.45, "triangle", 0.1);
      }, 420);
      break;
    case "join":
      // soft pop
      tone(880, 0.09, "sine", 0.18);
      setTimeout(() => tone(1320, 0.06, "sine", 0.08), 50);
      break;
  }
}
