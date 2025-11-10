"use client";

import BluetoothGate from "../components/BluetoothGate";
import HandPanel from "../components/HandPanel";
import { useEffect, useState } from "react";

export default function Page() {
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  return (
    <main className="shell">
      <div className="bg-glow" />
      <section className="hero">
        <h1>Calibration</h1>
        <p>Connect your Bluetooth flex-sensor glove and stream live finger angles.</p>
        <div className="countdown">
          <b>{countdown}</b>
        </div>
      </section>

      <BluetoothGate>
        <HandPanel />
      </BluetoothGate>

      <style jsx>{`
        .shell {
          min-height: 100dvh;
          background:
            radial-gradient(1100px 520px at 20% -10%, #93c5fd25, transparent),
            radial-gradient(900px 480px at 90% 5%, #c4b5fd25, transparent),
            #f8fafc;
          color: #0f172a;
          display: grid;
          place-items: start center;
          padding: 40px 20px 80px;
          gap: 28px;
          position: relative;
          overflow: hidden;
        }
        .bg-glow {
          pointer-events: none;
          position: absolute;
          inset: -20%;
          background: conic-gradient(
            from 180deg at 50% 50%,
            #93c5fd33,
            #c4b5fd33,
            #99f6e433,
            #93c5fd33
          );
          filter: blur(80px);
          opacity: 0.5;
          animation: spin 22s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .hero {
          text-align: center;
          max-width: 820px;
          z-index: 1;
        }
        .hero h1 {
          margin: 0 0 8px;
          font-size: clamp(28px, 5vw, 44px);
          letter-spacing: 0.3px;
          background: linear-gradient(90deg, #2563eb, #7c3aed, #0891b2);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .hero p {
          margin: 0;
          opacity: 0.8;
        }

        .countdown {
          margin: 0 0 8px;
          font-size: clamp(18px, 3vw, 30px);
          letter-spacing: 0.2px;
          background: linear-gradient(90deg, #2563eb, #7c3aed, #0891b2);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
      `}</style>
    </main>
  );
}