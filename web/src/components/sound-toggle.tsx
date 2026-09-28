"use client";

import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { setSoundEnabled, soundEnabled } from "@/lib/ui/scroll-chime";

export function SoundToggle({ className }: { className?: string }) {
  const [enabled, setEnabled] = useState(soundEnabled);

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    setSoundEnabled(next);
  }

  return <button className={className} type="button" onClick={toggle} aria-pressed={enabled} title={enabled ? "Sound on" : "Sound off"} aria-label={enabled ? "Turn scroll sound off" : "Turn scroll sound on"}>{enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}</button>;
}
