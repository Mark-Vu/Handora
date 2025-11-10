"use client";
import { useEffect, useRef, useState } from "react";
import * as PIXI from "pixi.js";
import { GAME_WIDTH, GAME_HEIGHT } from "@/utils/constants";
import Link from "next/link";

const LANES = 5;
const TILE_WIDTH = GAME_WIDTH / LANES;
const TILE_HEIGHT = 180;
const MAX_MISSES = 3;
const BASE_SPEED = 4;
const SPEED_GAIN = 0.1;
const COUNTDOWN = ["3", "2", "1", "Start!"];
const HIT_ZONE_HEIGHT = 150; // Threshold zone at bottom
const GAME_DURATION = 145; // 2:25 in seconds

const NOTES = [
    "A0",
    "Bb0",
    "B0",
    "C1",
    "Db1",
    "D1",
    "Eb1",
    "E1",
    "F1",
    "Gb1",
    "G1",
    "Ab1",
    "A1",
    "Bb1",
    "B1",
    "C2",
    "Db2",
    "D2",
    "Eb2",
    "E2",
    "F2",
    "Gb2",
    "G2",
    "Ab2",
    "A2",
    "Bb2",
    "B2",
    "C3",
    "Db3",
    "D3",
    "Eb3",
    "E3",
    "F3",
    "Gb3",
    "G3",
    "Ab3",
    "A3",
    "Bb3",
    "B3",
    "C4",
    "Db4",
    "D4",
    "Eb4",
    "E4",
    "F4",
    "Gb4",
    "G4",
    "Ab4",
    "A4",
    "Bb4",
    "B4",
    "C5",
    "Db5",
    "D5",
    "Eb5",
    "E5",
    "F5",
    "Gb5",
    "G5",
    "Ab5",
    "A5",
    "Bb5",
    "B5",
    "C6",
    "Db6",
    "D6",
    "Eb6",
    "E6",
    "F6",
    "Gb6",
    "G6",
    "Ab6",
    "A6",
    "Bb6",
    "B6",
    "C7",
    "Db7",
    "D7",
    "Eb7",
    "E7",
    "F7",
    "Gb7",
    "G7",
    "Ab7",
    "A7",
    "Bb7",
    "B7",
    "C8",
];

export default function Piano() {
    const canvasRef = useRef<HTMLDivElement>(null);
    const tiles = useRef<{ lane: number; graphic: PIXI.Graphics }[]>([]);
    const spawnTimer = useRef(0);
    const speed = useRef(BASE_SPEED);

    const [score, setScore] = useState(0);
    const [misses, setMisses] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isWin, setIsWin] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [countdown, setCountdown] = useState<string | null>(null);
    const [started, setStarted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);

    const bg = useRef<HTMLAudioElement | undefined>(undefined);
    const notes = useRef<HTMLAudioElement[]>([]);
    const isRunningRef = useRef(false);
    const isGameOverRef = useRef(false);

    // Load sounds once
    useEffect(() => {
        bg.current = new Audio("/sounds/jingle-bells.mp3");
        bg.current.loop = true;
        bg.current.volume = 1.0;
        notes.current = NOTES.map(
            (n) => new Audio(`/sounds/piano-notes/${n}.mp3`)
        );

        // Cleanup: stop music when component unmounts (user navigates away)
        return () => {
            if (bg.current) {
                bg.current.pause();
                bg.current.currentTime = 0;
            }
        };
    }, []);

    const handleRestart = () => {
        setScore(0);
        setMisses(0);
        setIsGameOver(false);
        setIsWin(false);
        setIsRunning(false);
        setCountdown(null);
        setTimeLeft(GAME_DURATION);
        spawnTimer.current = 0;
        speed.current = BASE_SPEED;
        tiles.current = [];
        bg.current?.pause();
        if (bg.current) bg.current.currentTime = 0;
        setStarted(false);
    };

    const gameOver = () => {
        setIsGameOver(true);
        setIsRunning(false);
        bg.current?.pause();
    };

    const winGame = () => {
        setIsWin(true);
        setIsRunning(false);
        bg.current?.pause();
    };

    const startCountdown = () => {
        let i = 0;
        const step = () => {
            if (i >= COUNTDOWN.length) {
                setCountdown(null);
                setIsRunning(true);
                bg.current?.play().catch(() => console.log("Audio blocked"));
                return;
            }
            setCountdown(COUNTDOWN[i]);
            setTimeout(step, COUNTDOWN[i] === "Start!" ? 600 : 1000);
            i++;
        };
        step();
    };

    useEffect(() => {
        isRunningRef.current = isRunning;
    }, [isRunning]);

    useEffect(() => {
        isGameOverRef.current = isGameOver;
    }, [isGameOver]);

    // Timer countdown
    useEffect(() => {
        if (!isRunning || isGameOver || isWin) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    winGame();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isRunning, isGameOver, isWin]);

    // Preview setup - show tiles before starting
    useEffect(() => {
        if (started) return;
        let app: PIXI.Application | null = null;
        let disposed = false;

        const setupPreview = async () => {
            const instance = new PIXI.Application();
            await instance.init({
                width: GAME_WIDTH,
                height: GAME_HEIGHT,
                background: "white",
                antialias: true,
            });
            if (disposed) return;
            canvasRef.current!.innerHTML = "";
            canvasRef.current!.appendChild(instance.canvas);
            app = instance;

            // Background
            const bgRect = new PIXI.Graphics();
            bgRect.fill(0xf8fafc);
            bgRect.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            app.stage.addChild(bgRect);

            // Lane dividers
            for (let i = 1; i < LANES; i++) {
                const d = new PIXI.Graphics();
                d.setStrokeStyle({ width: 2, color: 0xe2e8f0 });
                d.moveTo(i * TILE_WIDTH, 0);
                d.lineTo(i * TILE_WIDTH, GAME_HEIGHT);
                d.stroke();
                app.stage.addChild(d);
            }

            // Hit zone line
            const hitZoneLine = new PIXI.Graphics();
            hitZoneLine.setStrokeStyle({ width: 3, color: 0x10b981 });
            hitZoneLine.moveTo(0, GAME_HEIGHT - HIT_ZONE_HEIGHT);
            hitZoneLine.lineTo(GAME_WIDTH, GAME_HEIGHT - HIT_ZONE_HEIGHT);
            hitZoneLine.stroke();
            app.stage.addChild(hitZoneLine);

            // Hand images below hit zone (left to right: thumb, index, middle, ring, pinky)
            const handImages = ["thumb", "index", "middle", "ring", "pinky"];
            const handSize = Math.min(TILE_WIDTH * 0.7, 80);
            for (let i = 0; i < LANES; i++) {
                const handTexture = await PIXI.Assets.load(
                    `/images/piano/${handImages[i]}.png`
                );
                const handSprite = new PIXI.Sprite(handTexture);
                handSprite.width = handSize;
                handSprite.height = handSize;
                handSprite.x = i * TILE_WIDTH + (TILE_WIDTH - handSize) / 2;
                handSprite.y = GAME_HEIGHT - HIT_ZONE_HEIGHT + 10;
                app.stage.addChild(handSprite);
            }

            // Preview tiles - spread across lanes
            const usedLanes = new Set<number>();
            const previewCount = 3;
            for (let i = 0; i < previewCount; i++) {
                let lane;
                do {
                    lane = Math.floor(Math.random() * LANES);
                } while (usedLanes.has(lane));
                usedLanes.add(lane);

                const tile = new PIXI.Graphics();
                tile.beginFill(0x0f172a);
                tile.drawRoundedRect(0, 0, TILE_WIDTH - 12, TILE_HEIGHT, 10);
                tile.endFill();
                tile.x = lane * TILE_WIDTH + 6;
                tile.y = GAME_HEIGHT / 2 - TILE_HEIGHT * (i + 1) * 1.5;
                app.stage.addChild(tile);
            }
        };

        setupPreview();

        return () => {
            disposed = true;
            app?.destroy(true, { children: true });
        };
    }, [started]);

    // Setup PIXI once per game
    useEffect(() => {
        if (!started) return;
        let app: PIXI.Application | null = null;
        let disposed = false;
        let keyboardHandler: ((e: KeyboardEvent) => void) | null = null;

        const setup = async () => {
            const instance = new PIXI.Application();
            await instance.init({
                width: GAME_WIDTH,
                height: GAME_HEIGHT,
                background: "white",
                antialias: true,
            });
            if (disposed) return;
            canvasRef.current!.innerHTML = "";
            canvasRef.current!.appendChild(instance.canvas);
            app = instance;

            const bgRect = new PIXI.Graphics();
            bgRect.fill(0xf8fafc);
            bgRect.rect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            app.stage.addChild(bgRect);

            for (let i = 1; i < LANES; i++) {
                const d = new PIXI.Graphics();
                d.setStrokeStyle({ width: 2, color: 0xe2e8f0 });
                d.moveTo(i * TILE_WIDTH, 0);
                d.lineTo(i * TILE_WIDTH, GAME_HEIGHT);
                d.stroke();
                app.stage.addChild(d);
            }

            // Draw hit zone threshold line
            const hitZoneLine = new PIXI.Graphics();
            hitZoneLine.setStrokeStyle({ width: 3, color: 0x10b981 });
            hitZoneLine.moveTo(0, GAME_HEIGHT - HIT_ZONE_HEIGHT);
            hitZoneLine.lineTo(GAME_WIDTH, GAME_HEIGHT - HIT_ZONE_HEIGHT);
            hitZoneLine.stroke();
            app.stage.addChild(hitZoneLine);

            // Hand images below hit zone (left to right: thumb, index, middle, ring, pinky)
            const handImages = ["thumb", "index", "middle", "ring", "pinky"];
            const handSize = Math.min(TILE_WIDTH * 0.7, 80);
            for (let i = 0; i < LANES; i++) {
                const handTexture = await PIXI.Assets.load(
                    `/images/piano/${handImages[i]}.png`
                );
                const handSprite = new PIXI.Sprite(handTexture);
                handSprite.width = handSize;
                handSprite.height = handSize;
                handSprite.x = i * TILE_WIDTH + (TILE_WIDTH - handSize) / 2;
                handSprite.y = GAME_HEIGHT - HIT_ZONE_HEIGHT + 10;
                app.stage.addChild(handSprite);
            }

            const spawnTile = () => {
                const lane = Math.floor(Math.random() * LANES);
                const tile = new PIXI.Graphics();
                tile.beginFill(0x0f172a);
                tile.drawRoundedRect(0, 0, TILE_WIDTH - 12, TILE_HEIGHT, 10);
                tile.endFill();
                tile.x = lane * TILE_WIDTH + 6;
                tile.y = -TILE_HEIGHT;
                tiles.current.push({ lane, graphic: tile });
                app!.stage.addChild(tile);
            };

            const removeTile = (tile: {
                lane: number;
                graphic: PIXI.Graphics;
            }) => {
                app!.stage.removeChild(tile.graphic);
                tile.graphic.destroy();
                tiles.current = tiles.current.filter((t) => t !== tile);
            };

            const hit = (lane: number) => {
                const hitZoneStart = GAME_HEIGHT - HIT_ZONE_HEIGHT;
                const hitZoneEnd = GAME_HEIGHT;

                const laneTiles = tiles.current
                    .filter((t) => t.lane === lane)
                    .sort((a, b) => b.graphic.y - a.graphic.y);

                // Check if any tile in this lane is touching the hit zone
                const target = laneTiles.find((t) => {
                    const tileBottom = t.graphic.y + TILE_HEIGHT;
                    const tileTop = t.graphic.y;
                    // Tile is in hit zone if it overlaps with it
                    return tileBottom >= hitZoneStart && tileTop <= hitZoneEnd;
                });

                if (!target) return; // Don't count as miss if no tile in hit zone

                const flash = new PIXI.Graphics();
                flash.beginFill(0x38bdf8, 0.25);
                flash.drawRoundedRect(0, 0, TILE_WIDTH - 12, TILE_HEIGHT, 10);
                flash.endFill();
                flash.x = target.graphic.x;
                flash.y = target.graphic.y;
                app!.stage.addChild(flash);
                setTimeout(() => {
                    app!.stage.removeChild(flash);
                    flash.destroy();
                }, 120);

                const note =
                    notes.current[
                        Math.floor(Math.random() * notes.current.length)
                    ];
                note.currentTime = 0;
                note.play();

                removeTile(target);
                setScore((s) => {
                    const next = s + 1;
                    speed.current = BASE_SPEED + next * SPEED_GAIN;
                    return next;
                });
            };

            const miss = (tile?: { lane: number; graphic: PIXI.Graphics }) => {
                if (tile) removeTile(tile);
                setMisses((m) => {
                    const next = m + 1;
                    if (next >= MAX_MISSES) gameOver();
                    return next;
                });
            };

            const ticker = (t: PIXI.Ticker) => {
                if (!isRunningRef.current || isGameOverRef.current) return;
                const d = t.deltaTime;
                spawnTimer.current += d * (speed.current / 4);
                if (spawnTimer.current > 40) {
                    spawnTimer.current = 0;
                    spawnTile();
                }
                tiles.current.forEach((tile) => {
                    tile.graphic.y += speed.current * d;
                    if (tile.graphic.y > GAME_HEIGHT) miss(tile);
                });
            };

            app.ticker.add(ticker);
            app.stage.eventMode = "static";
            app.stage.hitArea = new PIXI.Rectangle(
                0,
                0,
                GAME_WIDTH,
                GAME_HEIGHT
            );
            app.stage.on("pointerdown", (e: PIXI.FederatedPointerEvent) => {
                if (!isRunningRef.current || isGameOverRef.current) return;
                const lane = Math.floor(e.global.x / TILE_WIDTH);
                hit(lane);
            });

            // Keyboard controls: 1-5 for lanes (thumb to pinky)
            keyboardHandler = (e: KeyboardEvent) => {
                if (!isRunningRef.current || isGameOverRef.current) return;
                const key = e.key;
                if (key >= "1" && key <= "5") {
                    const lane = parseInt(key) - 1; // 1->0, 2->1, 3->2, 4->3, 5->4
                    hit(lane);
                }
            };
            window.addEventListener("keydown", keyboardHandler);

            // Spawn initial tiles - random and spread out
            const usedLanes = new Set<number>();
            const initialCount = Math.floor(Math.random() * 2) + 2;
            for (let i = 0; i < initialCount; i++) {
                let lane;
                do {
                    lane = Math.floor(Math.random() * LANES);
                } while (usedLanes.has(lane));
                usedLanes.add(lane);

                const tile = new PIXI.Graphics();
                tile.beginFill(0x0f172a);
                tile.drawRoundedRect(0, 0, TILE_WIDTH - 12, TILE_HEIGHT, 10);
                tile.endFill();
                tile.x = lane * TILE_WIDTH + 6;
                tile.y = -TILE_HEIGHT - Math.random() * TILE_HEIGHT * 2;
                tiles.current.push({ lane, graphic: tile });
                app.stage.addChild(tile);
            }

            startCountdown();
        };

        setup();
        return () => {
            disposed = true;
            app?.destroy(true, { children: true });
            if (keyboardHandler) {
                window.removeEventListener("keydown", keyboardHandler);
            }
        };
    }, [started]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-linear-to-br from-emerald-50 via-teal-50 to-cyan-50">
            <Link
                href="/options"
                className="absolute top-6 left-6 px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium shadow hover:bg-emerald-700 transition"
            >
                ← Back
            </Link>
            <div className="relative">
                <div
                    ref={canvasRef}
                    className="overflow-hidden rounded-3xl border border-slate-200 shadow-2xl"
                    style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
                />
                {countdown && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 text-white text-6xl font-bold">
                        {countdown}
                    </div>
                )}
                {isGameOver && !isWin && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900/75 text-white">
                        <h2 className="text-3xl font-bold">Game Over</h2>
                        <p className="text-lg">Final Score: {score}</p>
                        <p className="text-sm">
                            Misses: {misses}/{MAX_MISSES}
                        </p>
                        <button
                            onClick={handleRestart}
                            className="rounded-full bg-white text-slate-900 px-6 py-2 font-semibold shadow hover:scale-105 transition"
                        >
                            Restart
                        </button>
                    </div>
                )}
                {isWin && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-linear-to-br from-green-600/90 to-emerald-600/90 text-white">
                        <h2 className="text-4xl font-bold">🎉 You Win! 🎉</h2>
                        <div className="text-center space-y-2">
                            <p className="text-2xl font-semibold">
                                Final Score: {score}
                            </p>
                            <p className="text-lg">
                                Misses: {misses}/{MAX_MISSES}
                            </p>
                            <p className="text-lg">
                                Accuracy:{" "}
                                {score > 0
                                    ? Math.round(
                                          (score / (score + misses)) * 100
                                      )
                                    : 0}
                                %
                            </p>
                        </div>
                        <button
                            onClick={handleRestart}
                            className="rounded-full bg-white text-emerald-700 px-8 py-3 text-lg font-semibold shadow-lg hover:scale-105 transition"
                        >
                            Play Again
                        </button>
                    </div>
                )}
                {!started && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm">
                        <button
                            onClick={() => setStarted(true)}
                            className="rounded-full bg-emerald-600 text-white px-8 py-4 text-xl font-semibold shadow-lg hover:bg-emerald-700 hover:scale-105 transition"
                        >
                            Start
                        </button>
                    </div>
                )}
                <div className="absolute left-1/2 top-6 flex -translate-x-1/2 gap-4 rounded-full bg-white/90 px-6 py-3 text-sm font-semibold text-slate-700 shadow">
                    <span>Score: {score}</span>
                    <span>
                        Misses: {misses}/{MAX_MISSES}
                    </span>
                    <span>
                        Time: {Math.floor(timeLeft / 60)}:
                        {String(timeLeft % 60).padStart(2, "0")}
                    </span>
                </div>
            </div>
        </div>
    );
}
