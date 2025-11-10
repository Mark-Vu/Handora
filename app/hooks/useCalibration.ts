"use client";

import { useCallback, useRef, useState } from "react";

export function useCalibration(fingers = 5) {
    const [offsets, setOffsets] = useState<number[]>(Array(fingers).fill(0));
    const emaStateRef = useRef<number[]>(Array(fingers).fill(NaN));
    const [alpha, setAlpha] = useState(0.2); // smoothing factor

    const setBaseline = useCallback((currentAngles: number[]) => {
        // When user is in neutral pose, capture offsets so adjusted = angle - baseline
        setOffsets(currentAngles.slice(0, fingers));
    }, [fingers]);

    const adjustAndSmooth = useCallback((angles: number[]) => {
        const out = new Array(fingers);
        for (let i = 0; i < fingers; i++) {
            const adjusted = angles[i] - (offsets[i] ?? 0);
            const prev = emaStateRef.current[i];
            if (Number.isNaN(prev)) {
                emaStateRef.current[i] = adjusted;
                out[i] = adjusted;
            } else {
                const ema = prev + (adjusted - prev) * alpha;
                emaStateRef.current[i] = ema;
                out[i] = ema;
            }
        }
        return out as number[];
    }, [alpha, offsets, fingers]);

    return {
        offsets,
        alpha,
        setAlpha,
        setBaseline,
        adjustAndSmooth,
    };
}