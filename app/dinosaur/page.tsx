"use client";
import { DINO_GAME_HEIGHT, DINO_GAME_WIDTH } from "@/utils/constants";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useBluetoothHand } from "../hooks/useBluetoothHand";

const W = DINO_GAME_WIDTH;
const H = DINO_GAME_HEIGHT;
const GROUND_Y = H - 80;
const DINO_WIDTH = 60;
const DINO_HEIGHT = 60;
const OB_WIDTH = 40;
const OB_HEIGHT = 60;
const BASE_SPEED = 3;
const SPEED_GAIN = 0.1;
const SPAWN_RATE = 120;

type Obstacle = {
    x: number;
    dodged: boolean;
    num: number;
};

export default function DinoJump() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [running, setRunning] = useState(false);
    const [score, setScore] = useState(0);
    const [countdown, setCountdown] = useState<string | null>(null);
    const scoreRef = useRef(0);
    const countdownRef = useRef<string | null>(null);

    // Bluetooth glove integration
    const bt = useBluetoothHand({ throttleMs: 20 });
    const [thresholdSignals, setThresholdSignals] = useState<number[]>([]);
    const jumpRef = useRef<((fingerNum: number) => void) | null>(null);
    const thresholdSignalsRef = useRef<number[]>([]);

    // Load calibration signals from localStorage
    useEffect(() => {
        const stored = localStorage.getItem("signals");
        if (stored) {
            try {
                const signals = JSON.parse(stored);
                setThresholdSignals(signals.slice(0, 5));
                thresholdSignalsRef.current = signals.slice(0, 5);
            } catch (e) {
                console.error("Failed to load calibration signals", e);
            }
        }
    }, []);

    // Monitor Bluetooth live data continuously with polling
    useEffect(() => {
        if (!running) return;

        const checkFingers = () => {
            if (!jumpRef.current || thresholdSignalsRef.current.length === 0)
                return;

            for (let i = 0; i < 5; i++) {
                if (bt.liveData[i] <= thresholdSignalsRef.current[i]) {
                    jumpRef.current(i + 1); // Fingers are numbered 1-5
                }
            }
        };

        // Check every 50ms for finger presses
        const interval = setInterval(checkFingers, 50);
        return () => clearInterval(interval);
    }, [running, bt.liveData]);

    // Draw initial state
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || running) return;

        const ctx = canvas.getContext("2d")!;
        canvas.width = W;
        canvas.height = H;

        // Load images
        const dinoImg = new Image();
        dinoImg.src = "/images/dinosaur.png";
        const cactusImg = new Image();
        cactusImg.src = "/images/cactus.png";

        const drawInitial = () => {
            // Sky
            ctx.fillStyle = "#e0f2fe";
            ctx.fillRect(0, 0, W, H);

            // Ground
            ctx.fillStyle = "#a16207";
            ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

            // Dino
            if (dinoImg.complete) {
                ctx.drawImage(
                    dinoImg,
                    100,
                    GROUND_Y - DINO_HEIGHT,
                    DINO_WIDTH,
                    DINO_HEIGHT
                );
            }

            // Sample cactus
            if (cactusImg.complete) {
                ctx.drawImage(
                    cactusImg,
                    W - 150,
                    GROUND_Y - OB_HEIGHT,
                    OB_WIDTH,
                    OB_HEIGHT
                );
            }
        };

        drawInitial();
        dinoImg.onload = drawInitial;
        cactusImg.onload = drawInitial;
    }, [running]);

    useEffect(() => {
        if (!running) return;

        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        canvas.width = W;
        canvas.height = H;

        // game state
        let obstacles: Obstacle[] = [];
        let frame = 0;
        let gameOver = false;
        let gameStarted = false;
        let dinoY = GROUND_Y - DINO_HEIGHT;
        let velY = 0;
        const gravity = 0.6;

        scoreRef.current = 0;
        setScore(0);

        // Load images
        const dinoImg = new Image();
        dinoImg.src = "/images/dinosaur.png";
        const cactusImg = new Image();
        cactusImg.src = "/images/cactus.png";

        // Load finger images
        const fingerImages: { [key: number]: HTMLImageElement } = {};
        const fingerNames = ["thumb", "index", "middle", "ring", "pinky"];
        fingerNames.forEach((name, index) => {
            const img = new Image();
            img.src = `/images/piano/${name}.png`;
            fingerImages[index + 1] = img;
        });

        // Countdown sequence
        const startCountdown = async () => {
            const sequence = ["3", "2", "1", "Start!"];
            for (const text of sequence) {
                setCountdown(text);
                countdownRef.current = text;
                await new Promise((resolve) =>
                    setTimeout(resolve, text === "Start!" ? 600 : 1000)
                );
            }
            setCountdown(null);
            countdownRef.current = null;
            gameStarted = true;
        };

        startCountdown();

        // Jump logic function
        const tryJump = (num: number) => {
            if (gameOver || !gameStarted) return;

            // Find nearest obstacle ahead
            const upcoming = obstacles.find(
                (o) => o.x < W && o.x + OB_WIDTH > 100
            );
            if (!upcoming) return;

            // If correct number, jump
            if (num === upcoming.num) {
                const onGround = dinoY >= GROUND_Y - DINO_HEIGHT - 0.5;
                if (onGround) velY = -14; // jump impulse
            }
        };

        // Make jump function accessible to Bluetooth effect
        jumpRef.current = tryJump;

        // ✅ Number key controls jump
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key >= "1" && e.key <= "5") {
                tryJump(parseInt(e.key));
            }
        };

        window.addEventListener("keydown", handleKeyPress);

        const restart = (e: KeyboardEvent) => {
            if (e.key === "Enter") {
                setRunning(false);
                setTimeout(() => setRunning(true), 50);
            }
        };
        window.addEventListener("keydown", restart);

        function spawnObstacle() {
            const num = Math.floor(Math.random() * 5) + 1;
            obstacles.push({ x: W, dodged: false, num });
        }

        function update() {
            if (gameOver) return;

            if (gameStarted) {
                frame++;
                const speed = BASE_SPEED + scoreRef.current * SPEED_GAIN;

                // spawn
                if (frame % SPAWN_RATE === 0) spawnObstacle();

                // move
                obstacles.forEach((o) => (o.x -= speed));

                // physics
                velY += gravity;
                dinoY += velY;
                if (dinoY > GROUND_Y - DINO_HEIGHT) {
                    dinoY = GROUND_Y - DINO_HEIGHT;
                    velY = 0;
                }

                // collision
                obstacles.forEach((o) => {
                    const obsTop = GROUND_Y - OB_HEIGHT;
                    const obsBottom = GROUND_Y;

                    // Adjust dino hitbox to account for empty corners
                    const hitboxInsetX = 18; // Reduce width on each side
                    const hitboxInsetBottom = 10; // Raise bottom

                    const dinoTop = dinoY;
                    const dinoBottom = dinoY + DINO_HEIGHT - hitboxInsetBottom;
                    const obsLeft = o.x;
                    const obsRight = o.x + OB_WIDTH;
                    const dinoLeft = 100 + hitboxInsetX;
                    const dinoRight = 100 + DINO_WIDTH - hitboxInsetX;

                    const overlap =
                        dinoLeft < obsRight &&
                        dinoRight > obsLeft &&
                        dinoTop < obsBottom &&
                        dinoBottom > obsTop;

                    if (overlap && !gameOver) {
                        gameOver = true;
                    }

                    // score if passed
                    if (!o.dodged && obsRight < 100) {
                        o.dodged = true;
                        scoreRef.current++;
                        setScore(scoreRef.current);
                    }
                });

                obstacles = obstacles.filter((o) => o.x > -OB_WIDTH);
            }

            // draw
            ctx.fillStyle = "#e0f2fe";
            ctx.fillRect(0, 0, W, H);

            // ground
            ctx.fillStyle = "#a16207";
            ctx.fillRect(0, GROUND_Y, W, H - GROUND_Y);

            // dino
            if (dinoImg.complete) {
                ctx.drawImage(dinoImg, 100, dinoY, DINO_WIDTH, DINO_HEIGHT);
            }

            // obstacles
            obstacles.forEach((o) => {
                // Draw cactus
                if (cactusImg.complete) {
                    ctx.drawImage(
                        cactusImg,
                        o.x,
                        GROUND_Y - OB_HEIGHT,
                        OB_WIDTH,
                        OB_HEIGHT
                    );
                }

                // Draw finger image below obstacle
                const fingerImg = fingerImages[o.num];
                if (fingerImg && fingerImg.complete) {
                    const imgSize = 40;
                    ctx.drawImage(
                        fingerImg,
                        o.x + OB_WIDTH / 2 - imgSize / 2,
                        GROUND_Y + 10,
                        imgSize,
                        imgSize
                    );
                }
            });

            // score
            ctx.fillStyle = "#000";
            ctx.font = "24px sans-serif";
            ctx.textAlign = "left";
            ctx.fillText(`Score: ${scoreRef.current}`, 20, 40);

            // countdown overlay
            if (!gameStarted && countdownRef.current) {
                ctx.fillStyle = "rgba(0,0,0,0.5)";
                ctx.fillRect(0, 0, W, H);
                ctx.fillStyle = "#fff";
                ctx.font = "60px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(countdownRef.current, W / 2, H / 2 + 20);
                ctx.textAlign = "left";
            }

            if (gameOver) {
                ctx.fillStyle = "rgba(0,0,0,0.7)";
                ctx.fillRect(0, 0, W, H);
                ctx.fillStyle = "#fff";
                ctx.font = "48px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText("Game Over!", W / 2, H / 2 - 20);
                ctx.font = "20px sans-serif";
                ctx.fillText(
                    `Final Score: ${scoreRef.current}`,
                    W / 2,
                    H / 2 + 20
                );
                ctx.fillText("Press Enter to restart", W / 2, H / 2 + 60);
                ctx.textAlign = "left";
                return;
            }

            requestAnimationFrame(update);
        }

        requestAnimationFrame(update);

        return () => {
            window.removeEventListener("keydown", handleKeyPress);
            window.removeEventListener("keydown", restart);
            jumpRef.current = null;
        };
    }, [running]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-br from-emerald-50 via-teal-50 to-cyan-50">
            <Link
                href="/options"
                className="absolute top-6 left-6 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium shadow hover:bg-emerald-700 transition"
            >
                ← Back
            </Link>
            <h1 className="text-3xl font-bold mb-2 text-slate-800">
                Dino Jump 🦖
            </h1>
            <p className="mb-4 text-slate-600">
                Press the <strong>finger number (1-5)</strong> matching the
                finger shown on the obstacle to jump over it!
            </p>

            <div className="relative">
                <canvas
                    ref={canvasRef}
                    className="border-4 border-slate-400 rounded-lg shadow-lg"
                />
                {!running && !countdown && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <button
                            onClick={() => setRunning(true)}
                            className="px-8 py-4 rounded-full bg-emerald-600 text-white text-xl font-semibold shadow-lg hover:bg-emerald-700 hover:scale-105 transition"
                        >
                            Start Game
                        </button>
                    </div>
                )}
            </div>

            <p className="mt-3 text-slate-600 text-sm">
                Press Enter to restart after game over.
            </p>
        </div>
    );
}
