"use client";
import { useEffect, useRef, useState } from "react";
import { GAME_WIDTH, GAME_HEIGHT } from "@/utils/constants";
import Link from "next/link";

const ALIEN_SIZE = 35;
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

type Explosion = {
    x: number;
    y: number;
    frame: number;
};

export default function SpaceInvaders() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [started, setStarted] = useState(false);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [countdown, setCountdown] = useState<string | null>(null);
    const scoreRef = useRef(0);
    const livesRef = useRef(3);
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
            spaceBackground.src = "/images/space-invader-bg.jpg";
            const spaceshipImg = new Image();
            spaceshipImg.src = "/images/spaceship.png";
            const ufoImg = new Image();
            ufoImg.src = "/images/ufo.png";

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

                // Draw player spaceship
                if (spaceshipImg.complete) {
                    ctx.drawImage(
                        spaceshipImg,
                        GAME_WIDTH / 2 - 25,
                        GAME_HEIGHT - 80,
                        50,
                        50
                    );
                }

                // Draw sample aliens
                if (ufoImg.complete) {
                    for (let i = 0; i < 5; i++) {
                        const x = GAME_WIDTH / 2 - 100 + i * 50;
                        const y = 100;
                        ctx.drawImage(
                            ufoImg,
                            x - ALIEN_SIZE / 2,
                            y,
                            ALIEN_SIZE,
                            ALIEN_SIZE
                        );
                    }
                }
            };

            drawInitial();
            spaceBackground.onload = drawInitial;
            spaceshipImg.onload = drawInitial;
            ufoImg.onload = drawInitial;
            return;
        }

        // Reset everything
        scoreRef.current = 0;
        setScore(0);
        livesRef.current = 3;
        setLives(3);

        // Load images
        const spaceBackground = new Image();
        spaceBackground.src = "/images/space-invader-bg.jpg";
        const spaceshipImg = new Image();
        spaceshipImg.src = "/images/spaceship.png";
        const ufoImg = new Image();
        ufoImg.src = "/images/ufo.png";
        const missileImg = new Image();
        missileImg.src = "/images/missle_up.png";
        const explosionImg = new Image();
        explosionImg.src = "/images/explosion.png";
        const heartImg = new Image();
        heartImg.src = "/images/pixel-heart.webp";

        // Game state
        const player = {
            x: GAME_WIDTH / 2,
            y: GAME_HEIGHT - 50,
        };

        let playerBullets: Bullet[] = [];
        let alienBullets: Bullet[] = [];
        const aliens: Alien[] = [];
        let explosions: Explosion[] = [];
        let alienDirection = 1;
        let alienMoveDown = false;
        let gameOver = false;
        let frame = 0;
        let gameStarted = false;
        let canShoot = true;
        let waveNumber = 0;
        let alienSpeed = 30; // Base speed (frames between moves)

        // Function to spawn a new wave of aliens
        function spawnWave() {
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

            // Increase difficulty with each wave
            waveNumber++;
            alienSpeed = Math.max(10, 30 - waveNumber * 2); // Speed up, minimum 10 frames
        }

        // Initialize first wave
        spawnWave();

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
            if (gameStarted && !gameOver) {
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

                // Aliens shoot randomly (more frequently as waves progress)
                const shootFrequency = Math.max(30, 60 - waveNumber * 3);
                if (frame % shootFrequency === 0) {
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

                // Move aliens (speed increases with each wave)
                if (frame % alienSpeed === 0) {
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

                // Check bullet collisions with aliens (with splash damage)
                playerBullets.forEach((bullet, bIndex) => {
                    let hitAlien: Alien | undefined = undefined;

                    // Find directly hit alien
                    for (const alien of aliens) {
                        if (
                            alien.alive &&
                            bullet.x > alien.x - ALIEN_SIZE / 2 &&
                            bullet.x < alien.x + ALIEN_SIZE / 2 &&
                            bullet.y > alien.y &&
                            bullet.y < alien.y + ALIEN_SIZE
                        ) {
                            hitAlien = alien;
                            break;
                        }
                    }

                    if (hitAlien) {
                        const hitX = hitAlien.x;
                        const hitY = hitAlien.y;

                        // Destroy the directly hit alien
                        hitAlien.alive = false;
                        playerBullets.splice(bIndex, 1);
                        scoreRef.current += 10;
                        setScore(scoreRef.current);

                        // Add explosion
                        explosions.push({
                            x: hitX,
                            y: hitY,
                            frame: 0,
                        });

                        // Splash damage to nearby aliens (within 80 pixels)
                        const splashRadius = 80;
                        aliens.forEach((alien) => {
                            if (
                                alien.alive &&
                                alien !== hitAlien &&
                                Math.abs(alien.x - hitX) < splashRadius &&
                                Math.abs(alien.y - hitY) < splashRadius
                            ) {
                                alien.alive = false;
                                scoreRef.current += 5; // Bonus points for splash kills
                                setScore(scoreRef.current);
                                explosions.push({
                                    x: alien.x,
                                    y: alien.y,
                                    frame: 0,
                                });
                            }
                        });
                    }
                });

                // Update explosions
                explosions = explosions.filter((e) => {
                    e.frame++;
                    return e.frame < 20; // Show explosion for 20 frames
                });

                // Check alien bullets hitting player
                alienBullets.forEach((bullet, bIndex) => {
                    if (
                        bullet.x > player.x - 20 &&
                        bullet.x < player.x + 20 &&
                        bullet.y > player.y - 10
                    ) {
                        // Remove the bullet
                        alienBullets.splice(bIndex, 1);

                        // Lose a life
                        livesRef.current--;
                        setLives(livesRef.current);

                        // Add explosion at player
                        explosions.push({ x: player.x, y: player.y, frame: 0 });

                        // Check if game over
                        if (livesRef.current <= 0) {
                            gameOver = true;
                        }
                    }
                });

                // Check if aliens reached bottom
                const aliveAliens = aliens.filter((a) => a.alive);
                if (aliveAliens.some((a) => a.y > GAME_HEIGHT - 100)) {
                    gameOver = true;
                }

                // Spawn new wave when all aliens are destroyed
                if (aliveAliens.length === 0) {
                    spawnWave();
                    alienDirection = 1; // Reset direction
                }
            }

            // Draw frame
            if (spaceBackground.complete) {
                ctx.drawImage(spaceBackground, 0, 0, GAME_WIDTH, GAME_HEIGHT);
            } else {
                ctx.fillStyle = "#0a0a1a";
                ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            }

            // Draw player spaceship
            if (spaceshipImg.complete && !gameOver) {
                ctx.drawImage(
                    spaceshipImg,
                    player.x - 25,
                    player.y - 25,
                    50,
                    50
                );
            }

            // Draw aliens (UFOs)
            if (ufoImg.complete) {
                aliens.forEach((alien) => {
                    if (alien.alive) {
                        ctx.drawImage(
                            ufoImg,
                            alien.x - ALIEN_SIZE / 2,
                            alien.y,
                            ALIEN_SIZE,
                            ALIEN_SIZE
                        );
                    }
                });
            }

            // Draw player bullets (missiles)
            if (missileImg.complete) {
                playerBullets.forEach((b) => {
                    ctx.drawImage(missileImg, b.x - 8, b.y - 16, 16, 32);
                });
            }

            // Draw alien bullets
            ctx.fillStyle = "#f59e0b";
            alienBullets.forEach((b) => {
                ctx.beginPath();
                ctx.arc(b.x, b.y, 6, 0, Math.PI * 2);
                ctx.fill();
            });

            // Draw explosions
            if (explosionImg.complete) {
                explosions.forEach((exp) => {
                    const size = 40 + exp.frame * 2; // Grow over time
                    const alpha = 1 - exp.frame / 20; // Fade out
                    ctx.globalAlpha = alpha;
                    ctx.drawImage(
                        explosionImg,
                        exp.x - size / 2,
                        exp.y - size / 2,
                        size,
                        size
                    );
                    ctx.globalAlpha = 1;
                });
            }

            // Display score
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 32px sans-serif";
            ctx.textAlign = "left";
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2;
            ctx.strokeText(`Score: ${scoreRef.current}`, 20, 40);
            ctx.fillText(`Score: ${scoreRef.current}`, 20, 40);

            // Display lives (hearts)
            if (heartImg.complete) {
                for (let i = 0; i < livesRef.current; i++) {
                    ctx.drawImage(heartImg, 20 + i * 35, 55, 30, 30);
                }
            }

            // Aliens remaining and wave number
            const remaining = aliens.filter((a) => a.alive).length;
            ctx.textAlign = "right";
            ctx.strokeText(`Wave: ${waveNumber}`, GAME_WIDTH - 20, 40);
            ctx.fillText(`Wave: ${waveNumber}`, GAME_WIDTH - 20, 40);
            ctx.strokeText(`Aliens: ${remaining}`, GAME_WIDTH - 20, 75);
            ctx.fillText(`Aliens: ${remaining}`, GAME_WIDTH - 20, 75);

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

            if (gameOver) {
                ctx.fillStyle = "rgba(0,0,0,0.7)";
                ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
                ctx.fillStyle = "#fff";
                ctx.font = "48px sans-serif";
                ctx.textAlign = "center";
                ctx.fillText("Game Over", GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);
                ctx.font = "24px sans-serif";
                ctx.fillText(
                    `Final Score: ${scoreRef.current}`,
                    GAME_WIDTH / 2,
                    GAME_HEIGHT / 2 + 5
                );
                ctx.fillText(
                    `Survived ${waveNumber} Wave${waveNumber > 1 ? "s" : ""}`,
                    GAME_WIDTH / 2,
                    GAME_HEIGHT / 2 + 40
                );
                ctx.font = "18px sans-serif";
                ctx.fillText(
                    "Press Enter to restart",
                    GAME_WIDTH / 2,
                    GAME_HEIGHT / 2 + 80
                );
                return;
            }

            requestAnimationFrame(update);
        }

        requestAnimationFrame(update);

        const restart = (e: KeyboardEvent) => {
            if (e.key === "Enter" && gameOver) {
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
