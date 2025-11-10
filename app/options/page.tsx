import Link from "next/link";

type GameButtonProps = {
    href: string;
    title: string;
    emoji: string;
    description: string;
    color: string;
};

function GameButton({
    href,
    title,
    emoji,
    description,
    color,
}: GameButtonProps) {
    return (
        <Link
            href={href}
            className={`group relative flex flex-col gap-4 rounded-3xl border-2 p-8 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${color}`}
        >
            <div className="flex items-center gap-4">
                <div className="text-5xl">{emoji}</div>
                <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
            </div>
            <p className="text-base text-slate-600 leading-relaxed">
                {description}
            </p>
            <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-blue-600 transition group-hover:gap-3">
                Play Now
                <span className="text-2xl">→</span>
            </div>
            <div className="absolute top-0 right-0 -mt-3 -mr-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                ▶
            </div>
        </Link>
    );
}

export default function Options() {
    return (
        <div className="min-h-screen bg-linear-to-br from-emerald-50 via-teal-50 to-cyan-50">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-emerald-200/30 blur-3xl"></div>
                <div className="absolute bottom-20 right-10 h-80 w-80 rounded-full bg-teal-200/30 blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-cyan-200/20 blur-3xl"></div>
            </div>

            <main className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
                {/* Header */}
                <div className="mb-16 text-center max-w-3xl">
                    <div className="mb-6 inline-block">
                        <div className="text-6xl mb-4">🤲</div>
                    </div>
                    <h1 className="text-6xl font-black tracking-tight sm:text-7xl mb-6 bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                        Therapy Games
                    </h1>
                    <p className="text-xl text-slate-600 leading-relaxed">
                        Choose a game to exercise your hand strength and
                        coordination.
                        <br />
                        <span className="text-base text-slate-500">
                            Each game targets different hand movements for
                            complete rehabilitation.
                        </span>
                    </p>
                </div>

                {/* Game Grid */}
                <div className="grid w-full max-w-6xl gap-8 sm:grid-cols-2">
                    <GameButton
                        href="/piano"
                        title="Piano Tiles"
                        emoji="🎹"
                        description="Finger Precision Training: Tap tiles in rhythm to improve individual finger control and reaction speed."
                        color="border-blue-200 bg-linear-to-br from-blue-50 to-cyan-50 hover:border-blue-300"
                    />
                    <GameButton
                        href="/space-invaders"
                        title="Space Invaders"
                        emoji="👾"
                        description="Hand-Eye Coordination: Use spacebar and arrows to improve grip strength and directional control."
                        color="border-purple-200 bg-linear-to-br from-purple-50 to-indigo-50 hover:border-purple-300"
                    />
                    <GameButton
                        href="/dinosaur"
                        title="Dino Jump"
                        emoji="🦖"
                        description="Number Recognition & Response: Quick finger movements to improve neural pathways and reaction time."
                        color="border-green-200 bg-linear-to-br from-green-50 to-emerald-50 hover:border-green-300"
                    />
                    <GameButton
                        href="/asteroid-run"
                        title="Asteroid Run"
                        emoji="🚀"
                        description="Multi-Directional Movement: Train continuous hand motion and spatial awareness for daily activities."
                        color="border-orange-200 bg-linear-to-br from-orange-50 to-amber-50 hover:border-orange-300"
                    />
                </div>

                {/* Footer */}
                <div className="mt-16 text-center">
                    <Link
                        href="/"
                        className="inline-block text-sm text-slate-500 hover:text-slate-700 transition"
                    >
                        ← Back to Home
                    </Link>
                    <p className="text-sm text-slate-500 mt-4">
                        Each session is tracked to monitor your rehabilitation
                        progress
                    </p>
                </div>
            </main>
        </div>
    );
}
