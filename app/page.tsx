import Link from "next/link";

export default function Home() {
    return (
        <div className="min-h-screen bg-linear-to-br from-emerald-50 via-teal-50 to-cyan-50">
            {/* Hero Section */}
            <main className="relative flex min-h-screen flex-col items-center justify-center px-6 py-20">
                {/* Background decorative elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-emerald-200/30 blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-teal-200/30 blur-3xl"></div>
                </div>

                <div className="relative z-10 max-w-5xl mx-auto text-center">
                    {/* Logo/Brand */}
                    <div className="mb-8">
                        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/80 backdrop-blur-sm shadow-lg border border-emerald-100">
                            <div className="text-3xl">🤲</div>
                            <h1 className="text-2xl font-bold text-emerald-900">
                                Handora
                            </h1>
                        </div>
                    </div>

                    {/* Main Headline */}
                    <h2 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 mb-6 leading-tight">
                        Rebuild Hand Strength
                        <br />
                        <span className="bg-linear-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                            Through Play
                        </span>
                    </h2>

                    {/* Subheadline */}
                    <p className="text-xl md:text-2xl text-slate-700 mb-8 max-w-3xl mx-auto leading-relaxed">
                        A rehabilitation system designed for people recovering
                        from hand paralysis. Smart gloves + engaging games =
                        effective therapy.
                    </p>

                    {/* Problem Statement */}
                    <div className="mb-12 p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-emerald-100 max-w-2xl mx-auto">
                        <p className="text-lg text-slate-600 italic">
                            &ldquo;Traditional hand therapy can be repetitive
                            and unmotivating. We&rsquo;re making rehabilitation
                            engaging, measurable, and effective.&rdquo;
                        </p>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                        <Link
                            href="/onboarding"
                            className="group px-8 py-4 rounded-full bg-emerald-600 text-white text-lg font-semibold shadow-xl hover:bg-emerald-700 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            Start Your Recovery
                            <span className="text-2xl group-hover:translate-x-1 transition-transform">
                                →
                            </span>
                        </Link>
                        <Link
                            href="/options"
                            className="px-8 py-4 rounded-full bg-white text-emerald-700 text-lg font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-emerald-200"
                        >
                            Preview Games
                        </Link>
                    </div>

                    {/* How It Works */}
                    <div className="grid md:grid-cols-3 gap-6 mt-20 max-w-4xl mx-auto">
                        <div className="p-6 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-emerald-100 hover:scale-105 transition-transform">
                            <div className="text-4xl mb-4">🧤</div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">
                                1. Wear Smart Gloves
                            </h3>
                            <p className="text-slate-600">
                                Our sensors track every finger movement and hand
                                position in real-time.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-teal-100 hover:scale-105 transition-transform">
                            <div className="text-4xl mb-4">🎮</div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">
                                2. Play Therapeutic Games
                            </h3>
                            <p className="text-slate-600">
                                Engage with games designed by therapists to
                                target specific hand movements.
                            </p>
                        </div>

                        <div className="p-6 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg border border-cyan-100 hover:scale-105 transition-transform">
                            <div className="text-4xl mb-4">📊</div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">
                                3. Track Progress
                            </h3>
                            <p className="text-slate-600">
                                Monitor your improvement with detailed metrics
                                and celebrate milestones.
                            </p>
                        </div>
                    </div>

                    {/* Features Section */}
                    <div className="mt-20 p-8 rounded-3xl bg-linear-to-br from-emerald-100/50 to-teal-100/50 backdrop-blur-sm border border-emerald-200 max-w-4xl mx-auto">
                        <h3 className="text-3xl font-bold text-slate-900 mb-6">
                            Why Handora Works
                        </h3>
                        <div className="grid md:grid-cols-2 gap-6 text-left">
                            <div className="flex gap-3">
                                <div className="text-2xl">✓</div>
                                <div>
                                    <h4 className="font-semibold text-slate-900 mb-1">
                                        Personalized Calibration
                                    </h4>
                                    <p className="text-slate-600">
                                        We assess your current range of motion
                                        and adapt difficulty accordingly.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="text-2xl">✓</div>
                                <div>
                                    <h4 className="font-semibold text-slate-900 mb-1">
                                        Guided Experience
                                    </h4>
                                    <p className="text-slate-600">
                                        Dora, your AI assistant, minimizes
                                        keyboard use and guides you through
                                        every step.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="text-2xl">✓</div>
                                <div>
                                    <h4 className="font-semibold text-slate-900 mb-1">
                                        Measurable Results
                                    </h4>
                                    <p className="text-slate-600">
                                        Track strength, range of motion, and
                                        response time over weeks.
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="text-2xl">✓</div>
                                <div>
                                    <h4 className="font-semibold text-slate-900 mb-1">
                                        Fun & Engaging
                                    </h4>
                                    <p className="text-slate-600">
                                        Turn tedious exercises into enjoyable
                                        challenges that you&rsquo;ll want to do
                                        daily.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Final CTA */}
                    <div className="mt-16">
                        <p className="text-lg text-slate-600 mb-4">
                            Ready to begin your recovery journey?
                        </p>
                        <Link
                            href="/onboarding"
                            className="inline-flex items-center gap-2 px-10 py-5 rounded-full bg-emerald-600 text-white text-xl font-bold shadow-2xl hover:bg-emerald-700 hover:scale-105 transition-all duration-300"
                        >
                            Get Started Now
                            <span className="text-3xl">→</span>
                        </Link>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 py-8 text-center text-slate-600 border-t border-emerald-100 bg-white/50">
                <p className="text-sm">
                    Handora - Empowering recovery through innovative
                    rehabilitation technology
                </p>
            </footer>
        </div>
    );
}