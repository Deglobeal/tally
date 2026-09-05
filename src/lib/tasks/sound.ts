let ctx: AudioContext | null = null;
let loopTimer: number | null = null;
let playing = false;

function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

export function unlockAlarmAudio(): void {
  const c = audioContext();
  if (c?.state === "suspended") void c.resume();
}

function chime(c: AudioContext): void {
  const now = c.currentTime;
  const master = c.createGain();
  master.gain.setValueAtTime(0.0001, now);
  master.gain.exponentialRampToValueAtTime(0.11, now + 0.02);
  master.gain.exponentialRampToValueAtTime(0.0001, now + 1.05);
  master.connect(c.destination);

  const low = c.createOscillator();
  low.type = "sine";
  low.frequency.setValueAtTime(659.25, now);
  low.connect(master);
  low.start(now);
  low.stop(now + 0.42);

  const high = c.createOscillator();
  high.type = "sine";
  high.frequency.setValueAtTime(987.77, now + 0.28);
  high.connect(master);
  high.start(now + 0.28);
  high.stop(now + 1.05);
}

export function startAlarmLoop(): void {
  if (playing) return;
  playing = true;
  const c = audioContext();
  if (!c) return;
  void c.resume();
  const tick = () => {
    if (!playing) return;
    chime(c);
    loopTimer = window.setTimeout(tick, 1700);
  };
  tick();
}

export function stopAlarmLoop(): void {
  playing = false;
  if (loopTimer != null) {
    window.clearTimeout(loopTimer);
    loopTimer = null;
  }
}
