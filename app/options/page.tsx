import Link from "next/link";

type GameButtonProps = {
    href: string;
    title: string;
    description: string;
};

function GameButton({ href, title, description }: GameButtonProps) {
    return (
        <Link
            href={href}
            className="group flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md"
        >
            <span className="text-lg font-semibold tracking-wide text-slate-900">
                {title}
            </span>
            <span className="text-sm text-slate-500">{description}</span>
            <span className="mt-auto text-sm font-medium text-sky-600 transition group-hover:text-sky-500">
                Play →
            </span>
        </Link>
    );
}

export default function Options() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-white text-slate-900">
            <main className="flex w-full max-w-4xl flex-col items-center gap-12 px-6 py-24">
                <div className="text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                        Choose Your Game
                    </h1>
                    <p className="mt-4 text-base text-slate-600 sm:text-lg">
                        Pick from the lineup below to jump straight into the
                        action.
                    </p>
                </div>
                <div className="grid w-full gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <GameButton
                        href="/piano"
                        title="🎹 Piano Tiles"
                        description="Tap the falling tiles in rhythm to Jingle Bells!"
                    />
                    <GameButton
                        href="/space-invaders"
                        title="👾 Space Invaders"
                        description="Shoot the alien invaders before they reach Earth!"
                    />
                    <GameButton
                        href="/dinosaur"
                        title="🦖 Number Dino Jump"
                        description="Press the correct number to jump over obstacles!"
                    />
                </div>
            </main>
        </div>
    );
}
