"use client";
import { useEffect, useRef, useState } from "react";
import { GAME_WIDTH, GAME_HEIGHT } from "@/utils/constants";
import Link from "next/link";

const ALIEN_SIZE = 35;
const BULLET_SIZE = 5;
const PLAYER_SPEED = 6;
const BULLET_SPEED = 8;
const ALIEN_BULLET_SPEED = 4;

type Bullet = {
    x: number;
    y: number;
};

type Alien = {
    x: number;
    y: number;
    alive: boolean;
};

export default function SpaceInvaders() {
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
            // Draw initial state
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

                // Draw player
                ctx.fillStyle = "#22c55e";
                ctx.beginPath();
                ctx.moveTo(GAME_WIDTH / 2, GAME_HEIGHT - 60);
                ctx.lineTo(GAME_WIDTH / 2 - 20, GAME_HEIGHT - 30);
                ctx.lineTo(GAME_WIDTH / 2 + 20, GAME_HEIGHT - 30);
                ctx.closePath();
                ctx.fill();

                // Draw sample aliens
                for (let i = 0; i < 5; i++) {
                    const x = GAME_WIDTH / 2 - 100 + i * 50;
                    const y = 100;
                    ctx.fillStyle = "#ef4444";
                    ctx.fillRect(x - ALIEN_SIZE / 2, y, ALIEN_SIZE, ALIEN_SIZE);
                    ctx.fillStyle = "#fff";
                    ctx.fillRect(x - 8, y + 10, 6, 6);
                    ctx.fillRect(x + 2, y + 10, 6, 6);
                }
            };

            drawInitial();
            spaceBackground.onload = drawInitial;
            return;
        }

        // Reset everything
        scoreRef.current = 0;
        setScore(0);

        // Load background
        const spaceBackground = new Image();
        spaceBackground.src = "/images/space-background.png";

        // Game state
        const player = {
            x: GAME_WIDTH / 2,
            y: GAME_HEIGHT - 50,
        };

        let playerBullets: Bullet[] = [];
        let alienBullets: Bullet[] = [];
        const aliens: Alien[] = [];
        let alienDirection = 1;
        let alienMoveDown = false;
        let gameOver = false;
        let gameWon = false;
        let frame = 0;
        let gameStarted = false;
        let canShoot = true;

        // Initialize aliens in a grid
        const rows = 4;
        const cols = 8;
        const startX = 80;
        const startY = 80;
        const spacingX = 60;
        const spacingY = 50;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                aliens.push({
                    x: startX + col * spacingX,
                    y: startY + row * spacingY,
                    alive: true,
                });
            }
        }

        const keys: Record<string, boolean> = {};
        window.onkeydown = (e) => {
            keys[e.key] = true;

            // Shoot on spacebar
            if (e.key === " " && gameStarted && !gameOver && canShoot) {
                playerBullets.push({ x: player.x, y: player.y });
                canShoot = false;
                setTimeout(() => (canShoot = true), 300);
            }
        };
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

        function update() {
            if (gameStarted && !gameOver && !gameWon) {
                // Player movement
                if (keys["ArrowLeft"]) player.x -= PLAYER_SPEED;
                if (keys["ArrowRight"]) player.x += PLAYER_SPEED;
                player.x = Math.max(20, Math.min(GAME_WIDTH - 20, player.x));

                frame++;

                // Move player bullets
                playerBullets.forEach((b) => (b.y -= BULLET_SPEED));
                playerBullets = playerBullets.filter((b) => b.y > 0);

                // Move alien bullets
                alienBullets.forEach((b) => (b.y += ALIEN_BULLET_SPEED));
                alienBullets = alienBullets.filter((b) => b.y < GAME_HEIGHT);

                // Aliens shoot randomly
                if (frame % 60 === 0) {
                    const aliveAliens = aliens.filter((a) => a.alive);
                    if (aliveAliens.length > 0) {
                        const shooter =
                            aliveAliens[
                                Math.floor(Math.random() * aliveAliens.length)
                            ];
                        alienBullets.push({
                            x: shooter.x,
                            y: shooter.y + ALIEN_SIZE,
                        });
                    }
                }

                // Move aliens
                if (frame % 30 === 0) {
                    if (alienMoveDown) {
                        aliens.forEach((a) => (a.y += 20));
                        alienMoveDown = false;
                    } else {
                        const aliveAliens = aliens.filter((a) => a.alive);
                        const leftMost = Math.min(
                            ...aliveAliens.map((a) => a.x)
                        );
                        const rightMost = Math.max(
                            ...aliveAliens.map((a) => a.x)
                        );

                        if (
                            (alienDirection === 1 &&
                                rightMost >= GAME_WIDTH - 40) ||
                            (alienDirection === -1 && leftMost <= 40)
                        ) {
                            alienDirection *= -1;
                            alienMoveDown = true;
                        }

                        aliens.forEach((a) => (a.x += alienDirection * 10));
                    }
                }

                // Check bullet collisions with aliens
                playerBullets.forEach((bullet, bIndex) => {
                    aliens.forEach((alien) => {
                        if (
                            alien.alive &&
                            bullet.x > alien.x - ALIEN_SIZE / 2 &&
                            bullet.x < alien.x + ALIEN_SIZE / 2 &&
                            bullet.y > alien.y &&
                            bullet.y < alien.y + ALIEN_SIZE
                        ) {
                            alien.alive = false;
                            playerBullets.splice(bIndex, 1);
                            scoreRef.current += 10;
                            setScore(scoreRef.current);
                        }
                    });
                });

                // Check alien bullets hitting player
                alienBullets.forEach((bullet) => {
                    if (
                        bullet.x > player.x - 20 &&
                        bullet.x < player.x + 20 &&
                        bullet.y > player.y - 10
                    ) {
                        gameOver = true;
                    }
                });

                // Check if aliens reached bottom
                const aliveAliens = aliens.filter((a) => a.alive);
                if (aliveAliens.some((a) => a.y > GAME_HEIGHT - 100)) {
                    gameOver = true;
                }

                // Check win condition
                if (aliveAliens.length === 0) {
                    gameWon = true;
                }
            }

            // Draw frame
            if (spaceBackground.complete) {
                ctx.drawImage(spaceBackground, 0, 0, GAME_WIDTH, GAME_HEIGHT);
            } else {
                ctx.fillStyle = "#0a0a1a";
                ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            }

            // Draw player
            ctx.fillStyle = "#22c55e";
            ctx.beginPath();
            ctx.moveTo(player.x, player.y - 10);
            ctx.lineTo(player.x - 20, player.y + 10);
            ctx.lineTo(player.x + 20, player.y + 10);
            ctx.closePath();
            ctx.fill();

            // Draw aliens
            aliens.forEach((alien) => {
                if (alien.alive) {
                    ctx.fillStyle = "#ef4444";
                    ctx.fillRect(
                        alien.x - ALIEN_SIZE / 2,
                        alien.y,
                        ALIEN_SIZE,
                        ALIEN_SIZE
                    );
                    // Eyes
                    ctx.fillStyle = "#fff";
                    ctx.fillRect(alien.x - 8, alien.y + 10, 6, 6);
                    ctx.fillRect(alien.x + 2, alien.y + 10, 6, 6);
                }
            });

            // Draw player bullets
            ctx.fillStyle = "#3b82f6";
            playerBullets.forEach((b) => {
                ctx.fillRect(
                    b.x - BULLET_SIZE / 2,
                    b.y,
                    BULLET_SIZE,
                    BULLET_SIZE * 2
                );
            });

            // Draw alien bullets
            ctx.fillStyle = "#f59e0b";
            alienBullets.forEach((b) => {
                ctx.fillRect(
                    b.x - BULLET_SIZE / 2,
                    b.y,
                    BULLET_SIZE,
                    BULLET_SIZE * 2
                );
            });

            // Display score
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 32px sans-serif";
            ctx.textAlign = "left";
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2;
            ctx.strokeText(`Score: ${scoreRef.current}`, 20, 40);
            ctx.fillText(`Score: ${scoreRef.current}`, 20, 40);

            // Aliens remaining
            const remaining = aliens.filter((a) => a.alive).length;
            ctx.textAlign = "right";
            ctx.strokeText(`Aliens: ${remaining}`, GAME_WIDTH - 20, 40);
            ctx.fillText(`Aliens: ${remaining}`, GAME_WIDTH - 20, 40);

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
            }

            if (gameWon) {
                ctx.fillStyle = "rgba(34, 197, 94, 0.8)";
                ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
                ctx.fillStyle = "#fff";
                ctx.font = "48px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText("Victory!", GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
                ctx.font = "24px sans-serif";
                ctx.fillText(
                    `Final Score: ${scoreRef.current}`,
                    GAME_WIDTH / 2,
                    GAME_HEIGHT / 2 + 20
                );
                ctx.font = "18px sans-serif";
                ctx.fillText(
                    "Press Enter to play again",
                    GAME_WIDTH / 2,
                    GAME_HEIGHT / 2 + 60
                );
                return;
            }

            if (gameOver) {
                ctx.fillStyle = "rgba(0,0,0,0.7)";
                ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
                ctx.fillStyle = "#fff";
                ctx.font = "48px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText("Game Over", GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20);
                ctx.font = "24px sans-serif";
                ctx.fillText(
                    `Final Score: ${scoreRef.current}`,
                    GAME_WIDTH / 2,
                    GAME_HEIGHT / 2 + 20
                );
                ctx.font = "18px sans-serif";
                ctx.fillText(
                    "Press Enter to restart",
                    GAME_WIDTH / 2,
                    GAME_HEIGHT / 2 + 60
                );
                return;
            }

            requestAnimationFrame(update);
        }

        requestAnimationFrame(update);

        const restart = (e: KeyboardEvent) => {
            if (e.key === "Enter" && (gameOver || gameWon)) {
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
            <div className="mb-4 text-center">
                <h1 className="text-3xl font-bold text-slate-800 mb-2">
                    Space Invaders 👾
                </h1>
            </div>
            <div className="relative">
                <canvas
                    ref={canvasRef}
                    className="border-4 border-slate-400 rounded-lg shadow-xl"
                />
                {!started && !countdown && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <button
                            onClick={() => setStarted(true)}
                            className="rounded-full bg-emerald-600 text-white px-8 py-4 text-xl font-semibold shadow-lg hover:bg-emerald-700 hover:scale-105 transition"
                        >
                            Start Game
                        </button>
                    </div>
                )}
            </div>
            <p className="mt-4 text-slate-600 text-sm">
                Arrow keys to move • Spacebar to shoot
            </p>
        </div>
    );
}
