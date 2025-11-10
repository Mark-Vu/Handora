"use client";

import type { Signals } from "../hooks/useBluetoothHand";

export default function HandControls({
    connected,
    connect,
    disconnect,
    reconnect,
    resetData,
    signals,
}: {
    connected: boolean;
    connect: () => Promise<void>;
    disconnect: () => Promise<void>;
    reconnect: () => Promise<void>;
    resetData: () => void;
    signals: Signals;
}) {
    return (
        <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {!connected ? (
                    <button className="btn-connect" onClick={connect}>Connect</button>
                ) : (
                    <>
                        <button onClick={disconnect}>Disconnect</button>
                        <button onClick={reconnect}>Reconnect</button>
                        <button onClick={resetData}>Reset</button>
                    </>
                )}
            </div>

            <style jsx>{`
                .btn-connect {
                    appearance: none;
                    padding: 10px 18px;
                    background: #2563eb;
                    color: white;
                    font-weight: 600;
                    font-size: 15px;
                    border: none;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.18s ease;
                    box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
                }

                .btn-connect:hover {
                    background: #1e4fcf;
                    box-shadow: 0 4px 10px rgba(37, 99, 235, 0.35);
                    transform: translateY(-1px);
                }

                .btn-connect:active {
                    transform: translateY(0px);
                    box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25);
                }
            `}</style>
        </div>
    );
}