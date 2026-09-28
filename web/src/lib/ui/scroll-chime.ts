const SOUND_KEY = "mcu-watch-order:sound-enabled";

let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === "undefined") return null;
  audioContext ??= new AudioContext();
  return audioContext;
}

export function soundEnabled() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SOUND_KEY) === "true";
}

export function setSoundEnabled(enabled: boolean) {
  window.localStorage.setItem(SOUND_KEY, String(enabled));
  if (enabled) void getAudioContext()?.resume();
}

export function playScrollChime() {
  if (!soundEnabled() || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const context = getAudioContext();
  if (!context) return;

  void context.resume().then(() => {
    const start = context.currentTime;
    const gain = context.createGain();
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(.028, start + .018);
    gain.gain.exponentialRampToValueAtTime(.0001, start + .42);
    gain.connect(context.destination);

    [392, 587].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start + index * .07);
      oscillator.connect(gain);
      oscillator.start(start + index * .07);
      oscillator.stop(start + .44);
    });
  }).catch(() => undefined);
}
