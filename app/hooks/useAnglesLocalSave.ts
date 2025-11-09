"use client";

import { useEffect, useRef } from "react";
import type { Angles2D } from "./useBluetoothHand";

export function useAnglesLocalSave(angles2D: Angles2D, key = "flex-hand-angles", intervalMs = 2000) {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    timerRef.current = window.setInterval(() => {
      try {
        localStorage.setItem(key, JSON.stringify(angles2D));
      } catch {}
    }, intervalMs) as unknown as number;

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [angles2D, key, intervalMs]);
}