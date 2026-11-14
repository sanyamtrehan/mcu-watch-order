"use client";

import { useEffect } from "react";
import { RotateCcw, X } from "lucide-react";
import styles from "./watch-undo-toast.module.css";

export function WatchUndoToast({ message, saving, onUndo, onDismiss }: { message: string; saving: boolean; onUndo: () => void; onDismiss: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 12_000);
    return () => window.clearTimeout(timer);
  }, [message, onDismiss]);

  return <aside className={styles.toast} role="status" aria-live="polite">
    <div><small>Archive updated</small><strong>{message}</strong></div>
    <button className={styles.undo} type="button" onClick={onUndo} disabled={saving}><RotateCcw size={15} /> {saving ? "Restoring" : "Undo"}</button>
    <button className={styles.close} type="button" onClick={onDismiss} aria-label="Dismiss undo notification"><X size={15} /></button>
  </aside>;
}
