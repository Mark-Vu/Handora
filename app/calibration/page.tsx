"use client";

import BluetoothGate from "../components/BluetoothGate";
import HandPanel from "../components/HandPanel";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
    const router = useRouter();
    const [countdown, setCountdown] = useState<number | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [redirecting, setRedirecting] = useState(false);

    // Start countdown only when connected
    useEffect(() => {
        if (!isConnected || countdown === null) return;
        if (countdown <= 0) {
            // Countdown finished, show redirect message and redirect
            const redirectTimer = setTimeout(() => {
                setRedirecting(true);
                setTimeout(() => {
                    router.push("/options");
                }, 1000);
            }, 0);
            return () => clearTimeout(redirectTimer);
        }
        const timer = setInterval(() => {
            setCountdown((c) => (c !== null && c > 0 ? c - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [countdown, isConnected, router]);

    const handleConnect = () => {
        setIsConnected(true);
        setCountdown(8); // Start countdown when connected
    };

    return (
        <main className="shell">
            <div className="bg-glow" />
            <section className="hero">
                <h1>Calibration</h1>
                {!redirecting && (
                    <p>
                        Connect your Bluetooth flex-sensor glove and stream live
                        finger angles.
                    </p>
                )}
                {countdown !== null && countdown > 0 && (
                    <div className="countdown">
                        <b>{countdown}</b>
                    </div>
                )}
                {redirecting && (
                    <div className="redirect-message">
                        Redirecting to game center...
                    </div>
                )}
            </section>

            {!redirecting && (
                <BluetoothGate>
                    <HandPanel onConnect={handleConnect} />
                </BluetoothGate>
            )}

            <style jsx>{`
                .shell {
                    min-height: 100dvh;
                    background: radial-gradient(
                            1100px 520px at 20% -10%,
                            #6ee7b725,
                            transparent
                        ),
                        radial-gradient(
                            900px 480px at 90% 5%,
                            #5eead425,
                            transparent
                        ),
                        linear-gradient(
                            to bottom right,
                            #ecfdf5,
                            #f0fdfa,
                            #cffafe
                        );
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
                        #6ee7b733,
                        #5eead433,
                        #22d3ee33,
                        #6ee7b733
                    );
                    filter: blur(80px);
                    opacity: 0.5;
                    animation: spin 22s linear infinite;
                }
                @keyframes spin {
                    to {
                        transform: rotate(360deg);
                    }
                }
                .hero {
                    text-align: center;
                    max-width: 820px;
                    z-index: 1;
                }
                .hero h1 {
                    margin: 0 0 8px;
                    font-size: clamp(28px, 5vw, 44px);
                    letter-spacing: 0.3px;
                    background: linear-gradient(
                        90deg,
                        #059669,
                        #14b8a6,
                        #0891b2
                    );
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
                    background: linear-gradient(
                        90deg,
                        #059669,
                        #14b8a6,
                        #0891b2
                    );
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                }
                .redirect-message {
                    margin: 16px 0;
                    font-size: clamp(18px, 3vw, 24px);
                    font-weight: 600;
                    letter-spacing: 0.3px;
                    background: linear-gradient(
                        90deg,
                        #059669,
                        #14b8a6,
                        #0891b2
                    );
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                    animation: fadeIn 0.5s ease-in;
                }
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </main>
    );
}
