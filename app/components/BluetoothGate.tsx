"use client";

import { ReactNode, useEffect, useState } from "react";

export default function BluetoothGate({ children }: { children: ReactNode }) {
  const [supported, setSupported] = useState<boolean | null>(null);

  useEffect(() => {
    setSupported(typeof navigator !== "undefined" && !!(navigator as any).bluetooth);
  }, []);

  if (supported === null) {
    return (
      <div className="card">
        <div className="title">
          <span className="dot dot-wait" /> Checking Web Bluetooth…
        </div>
        <p>Please wait while we detect browser capabilities.</p>
        <style jsx>{styles}</style>
      </div>
    );
  }

  if (!supported) {
    return (
      <div className="card warn">
        <div className="title">
          <span className="dot dot-bad" /> Web Bluetooth isn’t available
        </div>
        <ul className="tips">
          <li>Use <b>Chrome</b> or <b>Edge</b>.</li>
          <li>Serve over <b>HTTPS</b> (or <code>http://localhost</code> in dev).</li>
          <li>Ensure your device supports BLE and is powered on.</li>
        </ul>
        <style jsx>{styles}</style>
      </div>
    );
  }

  return <>{children}</>;
}

const styles = `
.card {
  width: min(880px, 92vw);
  border: 1px solid #e5e7eb;
  background: linear-gradient(180deg, #ffffff, #fbfdff);
  border-radius: 16px;
  padding: 18px 20px;
  box-shadow:
    0 8px 24px rgba(15, 23, 42, 0.06),
    inset 0 1px 0 #ffffff;
  backdrop-filter: blur(4px);
  color: #0f172a;
}
.card.warn {
  border-color: #fecaca;
  box-shadow:
    0 8px 24px rgba(239, 68, 68, 0.12),
    inset 0 1px 0 #fff0f0;
}
.title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  letter-spacing: 0.2px;
}
p, .tips { margin: 8px 0 0; opacity: 0.9; }
.tips { padding-left: 18px; }
.dot {
  width: 10px; height: 10px; border-radius: 999px;
  display: inline-block;
  box-shadow: 0 0 0 3px #e5e7eb;
}
.dot-wait { background: #06b6d4; animation: pulse 1.2s ease-in-out infinite; }
.dot-bad  { background: #ef4444; }
@keyframes pulse { 50% { transform: scale(0.6); opacity: 0.6; } }
`;
