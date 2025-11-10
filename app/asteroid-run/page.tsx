"use client";
import { useEffect, useRef, useState } from "react";
import { GAME_WIDTH, GAME_HEIGHT } from "@/utils/constants";
import Link from "next/link";

const BASE_SPEED = 3;
const SPEED_INCREMENT = 0.5; // Speed increases every 50 points

export default function AsteroidRun() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [started, setStarted] = useState(false);
    const [score, setScore] = useState(0);
    const [countdown, setCountdown] = useState<string | null>(null);
    const scoreRef = useRef(0);
    const countdownRef = useRef<string | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d")!;
        canvas.width = GAME_WIDTH;
        canvas.height = GAME_HEIGHT;

        if (!started) {
            // Draw initial state with images
            const spaceshipImg = new Image();
            spaceshipImg.src = "/images/spaceship.png";
            const spaceBackground = new Image();
            spaceBackground.src = "/images/space-background.png";

            const drawInitial = () => {
                if (spaceBackground.complete) {
                    ctx.drawImage(
                        spaceBackground,
                        0,
                        0,
                        GAME_WIDTH,
                        GAME_HEIGHT
                    );
                } else {
                    ctx.fillStyle = "#0a0a1a";
                    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
                }

                if (spaceshipImg.complete) {
                    ctx.drawImage(
                        spaceshipImg,
                        GAME_WIDTH / 2 - 25,
                        GAME_HEIGHT / 2 - 25,
                        50,
                        50
                    );
                } else {
                    ctx.fillStyle = "#0f172a";
                    ctx.fillRect(
                        GAME_WIDTH / 2 - 25,
                        GAME_HEIGHT / 2 - 25,
                        50,
                        50
                    );
                }
            };

            drawInitial();
            // Redraw when images load
            spaceshipImg.onload = drawInitial;
            spaceBackground.onload = drawInitial;
            return;
        }

        // reset everything
        scoreRef.current = 0;
        setScore(0);

        // Load images
        const spaceshipImg = new Image();
        spaceshipImg.src = "/images/spaceship.png";
        const asteroidImg = new Image();
        asteroidImg.src = "/images/asteroid.png";
        const spaceBackground = new Image();
        spaceBackground.src = "/images/space-background.png";

        const player = {
            x: GAME_WIDTH / 2 - 25,
            y: GAME_HEIGHT / 2 - 25,
            size: 50,
        };
        let obstacles: {
            x: number;
            y: number;
            dx: number;
            dy: number;
            size: number;
            scored: boolean;
        }[] = [];
        let gameOver = false;
        let frame = 0;
        let gameStarted = false;

        const keys: Record<string, boolean> = {};
        window.onkeydown = (e) => (keys[e.key] = true);
        window.onkeyup = (e) => (keys[e.key] = false);

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

        function spawnObstacle() {
            const dir = Math.floor(Math.random() * 4);
            const size = 30 + Math.random() * 30; // Increased from 20-40 to 30-60
            const currentSpeed =
                BASE_SPEED +
                Math.floor(scoreRef.current / 50) * SPEED_INCREMENT;

            // After 100 points, some arrows go diagonal
            const useDiagonal = scoreRef.current >= 20 && Math.random() < 0.3;

            if (dir === 0)
                obstacles.push({
                    x: Math.random() * GAME_WIDTH,
                    y: -size,
                    dx: useDiagonal ? (Math.random() - 0.5) * currentSpeed : 0,
                    dy: currentSpeed,
                    size,
                    scored: false,
                });
            if (dir === 1)
                obstacles.push({
                    x: Math.random() * GAME_WIDTH,
                    y: GAME_HEIGHT + size,
                    dx: useDiagonal ? (Math.random() - 0.5) * currentSpeed : 0,
                    dy: -currentSpeed,
                    size,
                    scored: false,
                });
            if (dir === 2)
                obstacles.push({
                    x: -size,
                    y: Math.random() * GAME_HEIGHT,
                    dx: currentSpeed,
                    dy: useDiagonal ? (Math.random() - 0.5) * currentSpeed : 0,
                    size,
                    scored: false,
                });
            if (dir === 3)
                obstacles.push({
                    x: GAME_WIDTH + size,
                    y: Math.random() * GAME_HEIGHT,
                    dx: -currentSpeed,
                    dy: useDiagonal ? (Math.random() - 0.5) * currentSpeed : 0,
                    size,
                    scored: false,
                });
        }

        function update() {
            // Only allow movement and game logic after countdown
            if (gameStarted) {
                if (keys["ArrowLeft"]) player.x -= 5;
                if (keys["ArrowRight"]) player.x += 5;
                if (keys["ArrowUp"]) player.y -= 5;
                if (keys["ArrowDown"]) player.y += 5;

                player.x = Math.max(
                    0,
                    Math.min(GAME_WIDTH - player.size, player.x)
                );
                player.y = Math.max(
                    0,
                    Math.min(GAME_HEIGHT - player.size, player.y)
                );

                frame++;

                // Spawn more frequently after 100 points
                const spawnRate = scoreRef.current >= 100 ? 20 : 40;
                if (frame % spawnRate === 0) spawnObstacle();

                // move obstacles
                obstacles.forEach((o) => {
                    o.x += o.dx;
                    o.y += o.dy;
                });
            }

            // Only do collision and scoring after game starts
            if (gameStarted) {
                // collision check with adjusted hitbox for spaceship shape
                // The spaceship's main body is more centered, so reduce hitbox by ~20%
                const hitboxPadding = player.size * 0.2;
                const playerHitX = player.x + hitboxPadding;
                const playerHitY = player.y + hitboxPadding;
                const playerHitWidth = player.size - hitboxPadding * 2;
                const playerHitHeight = player.size - hitboxPadding * 2;

                for (const o of obstacles) {
                    if (
                        o.x < playerHitX + playerHitWidth &&
                        o.x + o.size > playerHitX &&
                        o.y < playerHitY + playerHitHeight &&
                        o.y + o.size > playerHitY
                    ) {
                        gameOver = true;
                    }
                }

                // scoring
                obstacles.forEach((o) => {
                    if (o.scored) return;
                    const outRight = o.dx > 0 && o.x > GAME_WIDTH;
                    const outLeft = o.dx < 0 && o.x + o.size < 0;
                    const outBottom = o.dy > 0 && o.y > GAME_HEIGHT;
                    const outTop = o.dy < 0 && o.y + o.size < 0;
                    if (outRight || outLeft || outBottom || outTop) {
                        o.scored = true;
                        scoreRef.current++;
                        setScore(scoreRef.current);
                    }
                });

                // cleanup offscreen
                obstacles = obstacles.filter(
                    (o) =>
                        o.x > -60 &&
                        o.x < GAME_WIDTH + 60 &&
                        o.y > -60 &&
                        o.y < GAME_HEIGHT + 60
                );
            }

            // draw frame
            // Draw space background
            if (spaceBackground.complete) {
                ctx.drawImage(spaceBackground, 0, 0, GAME_WIDTH, GAME_HEIGHT);
            } else {
                ctx.fillStyle = "#0a0a1a";
                ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            }

            // Draw spaceship
            if (spaceshipImg.complete) {
                ctx.drawImage(
                    spaceshipImg,
                    player.x,
                    player.y,
                    player.size,
                    player.size
                );
            } else {
                ctx.fillStyle = "#0f172a";
                ctx.fillRect(player.x, player.y, player.size, player.size);
            }

            // Draw asteroids
            obstacles.forEach((o) => {
                if (asteroidImg.complete) {
                    ctx.drawImage(asteroidImg, o.x, o.y, o.size, o.size);
                } else {
                    ctx.fillStyle = "#ef4444";
                    ctx.fillRect(o.x, o.y, o.size, o.size);
                }
            });

            // Display score at top center
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 48px sans-serif";
            ctx.textAlign = "center";
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 3;
            ctx.strokeText(scoreRef.current.toString(), GAME_WIDTH / 2, 50);
            ctx.fillText(scoreRef.current.toString(), GAME_WIDTH / 2, 50);
            ctx.textAlign = "left";

            // Show countdown overlay
            if (!gameStarted && countdownRef.current) {
                ctx.fillStyle = "rgba(0,0,0,0.5)";
                ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
                ctx.fillStyle = "#fff";
                ctx.font = "60px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText(
                    countdownRef.current,
                    GAME_WIDTH / 2,
                    GAME_HEIGHT / 2 + 20
                );
                ctx.textAlign = "left";
            }

            if (gameOver) {
                ctx.fillStyle = "rgba(0,0,0,0.6)";
                ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
                ctx.fillStyle = "#fff";
                ctx.font = "28px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText("Game Over", GAME_WIDTH / 2, GAME_HEIGHT / 2);
                ctx.font = "18px sans-serif";
                ctx.fillText(
                    "Press Enter to restart",
                    GAME_WIDTH / 2,
                    GAME_HEIGHT / 2 + 30
                );
                ctx.textAlign = "left";
                return;
            }

            requestAnimationFrame(update);
        }

        requestAnimationFrame(update);

        const restart = (e: KeyboardEvent) => {
            if (e.key === "Enter") {
                setStarted(false);
                setTimeout(() => setStarted(true), 50);
            }
        };
        window.addEventListener("keydown", restart);

        return () => {
            window.removeEventListener("keydown", restart);
            window.onkeydown = null;
            window.onkeyup = null;
        };
    }, [started]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-linear-to-br from-emerald-50 via-teal-50 to-cyan-50">
            <Link
                href="/options"
                className="absolute top-6 left-6 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium shadow hover:bg-emerald-700 transition"
            >
                ← Back
            </Link>
            <div className="relative">
                <canvas
                    ref={canvasRef}
                    className="border border-slate-300 rounded-lg shadow"
                />
                {!started && !countdown && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <button
                            onClick={() => setStarted(true)}
                            className="rounded-full bg-emerald-600 text-white px-8 py-4 text-xl font-semibold shadow-lg hover:bg-emerald-700 hover:scale-105 transition"
                        >
                            Start
                        </button>
                    </div>
                )}
            </div>
            <p className="mt-3 text-slate-600 text-sm">
                Use arrow keys to move and avoid squares!
            </p>
        </div>
    );
}
