"use client";

import { useBluetoothHand } from "../hooks/useBluetoothHand";
import HandControls from "./HandControls";
import { useEffect, useRef } from "react";

export default function HandPanel({ onConnect }: { onConnect?: () => void }) {
    const bt = useBluetoothHand({ throttleMs: 20 }); // namePrefix not used in the hook signature now
    const hasCalledOnConnect = useRef(false);

    setTimeout(() => {
        const signals = [...bt.signals];
        localStorage.setItem("signals", JSON.stringify(signals));
    }, 10000);

    // Call onConnect when successfully connected
    useEffect(() => {
        if (bt.connected && !hasCalledOnConnect.current && onConnect) {
            hasCalledOnConnect.current = true;
            onConnect();
        }
    }, [bt.connected, onConnect]);

    // Format signal to max 4 decimal places
    const formatSignal = (signal: number) => {
        return signal.toFixed(4);
    };

    // Map status -> label + colors (emerald theme)
    const statusMap: Record<
        typeof bt.status,
        { label: string; dot: string; bg: string; brd: string }
    > = {
        idle: { label: "Idle", dot: "#64748b", bg: "#f8fafc", brd: "#e2e8f0" },
        requesting: {
            label: "Requesting…",
            dot: "#14b8a6",
            bg: "#f0fdfa",
            brd: "#99f6e4",
        },
        connecting: {
            label: "Connecting…",
            dot: "#14b8a6",
            bg: "#f0fdfa",
            brd: "#99f6e4",
        },
        subscribing: {
            label: "Subscribing…",
            dot: "#14b8a6",
            bg: "#f0fdfa",
            brd: "#99f6e4",
        },
        connected: {
            label: "Connected",
            dot: "#059669",
            bg: "#ecfdf5",
            brd: "#6ee7b7",
        },
        receiving: {
            label: "Receiving",
            dot: "#059669",
            bg: "#ecfdf5",
            brd: "#6ee7b7",
        },
        "no-data": {
            label: "No data yet",
            dot: "#f97316",
            bg: "#fff7ed",
            brd: "#fed7aa",
        },
        error: {
            label: "Error",
            dot: "#ef4444",
            bg: "#fef2f2",
            brd: "#fecaca",
        },
    };

    const s = statusMap[bt.status];

    return (
        <section className="panel">
            <header className="header">
                <div
                    className="badge"
                    style={
                        {
                            "--dot": s.dot,
                            "--badge-bg": s.bg,
                            "--badge-brd": s.brd,
                        } as React.CSSProperties
                    }
                    aria-live="polite"
                >
                    <span
                        className={`dot ${
                            bt.status.endsWith("…") ? "spin" : ""
                        }`}
                    />
                    {s.label}
                    {bt.packets > 0 && (
                        <span className="packets">· {bt.packets} pkt</span>
                    )}
                </div>

                <div className="counts">
                    {["Thumb", "Index", "Middle", "Ring", "Pinky"].map(
                        (label, i) => (
                            <div key={label} className="chip">
                                {label}: <b>{formatSignal(bt.signals[i])}</b>
                            </div>
                        )
                    )}
                </div>
            </header>

            {bt.lastError && (
                <div className="alert" role="alert">
                    <strong>Bluetooth error:</strong> {bt.lastError}
                </div>
            )}

            <div className="body">
                <HandControls
                    connected={bt.connected}
                    connect={bt.connect}
                    disconnect={bt.disconnect}
                    reconnect={bt.reconnect}
                    resetData={bt.resetData}
                    signals={bt.signals}
                />
            </div>

            <footer className="foot">
                <small>
                    Tip: Power the glove and ensure it’s advertising. Status
                    shows the exact step (Requesting → Connecting → Subscribing
                    → Connected/Receiving).
                </small>
            </footer>

            <style jsx>{`
                .panel {
                    width: min(880px, 92vw);
                    border: 1px solid #e5e7eb;
                    background: linear-gradient(180deg, #ffffff, #fbfdff);
                    border-radius: 18px;
                    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06),
                        inset 0 1px 0 #ffffff;
                    overflow: hidden;
                    color: #0f172a;
                }
                .header {
                    display: grid;
                    gap: 14px;
                    padding: 18px 20px 6px;
                }
                .badge {
                    width: fit-content;
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 12px;
                    border-radius: 999px;
                    font-weight: 700;
                    letter-spacing: 0.2px;
                    border: 1px solid var(--badge-brd, #e5e7eb);
                    background: var(--badge-bg, #f8fafc);
                }
                .badge .dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 999px;
                    background: var(--dot, #64748b);
                    box-shadow: 0 0 0 3px #e5e7eb;
                }
                .badge .dot.spin {
                    animation: spin 1s linear infinite;
                }
                .badge .packets {
                    color: #64748b;
                    font-weight: 600;
                }
                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }

                .counts {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
                    gap: 10px;
                }
                .chip {
                    border: 1px solid #e5e7eb;
                    background: #ffffff;
                    border-radius: 12px;
                    padding: 10px 12px;
                    font-size: 14px;
                    color: #334155;
                    display: flex;
                    justify-content: space-between;
                    box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
                }
                .chip b {
                    color: #0f172a;
                }
                .alert {
                    margin: 8px 20px 0;
                    padding: 10px 12px;
                    border: 1px solid #fecaca;
                    background: #fef2f2;
                    color: #7f1d1d;
                    border-radius: 10px;
                    white-space: pre-wrap;
                }
                .body {
                    padding: 14px 20px 20px;
                    border-top: 1px solid #f1f5f9;
                }
                .foot {
                    padding: 12px 20px 18px;
                    border-top: 1px solid #f1f5f9;
                    color: #475569;
                    background: linear-gradient(180deg, #ffffff, #f8fafc);
                }
            `}</style>
        </section>
    );
}
