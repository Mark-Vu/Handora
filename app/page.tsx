"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");

  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef(true);

  // --- typing animation state for "Listening…" (slower cadence) ---
  const baseMsg = "Listening...";
  const [typed, setTyped] = useState("");
  const typingTimerRef = useRef<number | null>(null);

  // Type/delete loop for "Listening..."
  useEffect(() => {
    if (!listening) {
      if (typingTimerRef.current) window.clearInterval(typingTimerRef.current);
      setTyped("");
      return;
    }
    let i = 0;
    let deleting = false;
    let cooldown = 0;

    const step = () => {
      if (cooldown > 0) {
        cooldown -= 1;
        return;
      }
      if (!deleting) {
        i++;
        setTyped(baseMsg.slice(0, i));
        if (i >= baseMsg.length) {
          i = baseMsg.length;
          deleting = true;
          cooldown = 4; // hold full text a bit
        }
      } else {
        i--;
        setTyped(baseMsg.slice(0, i));
        if (i <= 0) {
          i = 0;
          deleting = false;
          cooldown = 4; // hold empty a bit
        }
      }
    };

    typingTimerRef.current = window.setInterval(step, 220); // slower letters
    return () => {
      if (typingTimerRef.current) window.clearInterval(typingTimerRef.current);
    };
  }, [listening]);

  // Speech setup
  useEffect(() => {
    const SR =
      typeof window !== "undefined" &&
      ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

    if (!SR) {
      setSupported(false);
      return;
    }
    setSupported(true);

    const r = new SR();
    r.lang = "en-US";
    r.continuous = true;
    r.interimResults = true;
    r.maxAlternatives = 1;

    r.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      let additions = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) additions += transcript;
        else interim += transcript;
      }
      if (additions) setFinalText((prev) => prev + additions);
      setInterimText(interim);
    };

    r.onerror = () => setListening(false);

    r.onend = () => {
      setListening(false);
      if (shouldListenRef.current) {
        try {
          r.start();
          setListening(true);
        } catch {}
      }
    };

    recognitionRef.current = r;

    try {
      r.start();
      setListening(true);
    } catch {}

    return () => {
      shouldListenRef.current = false;
      try {
        r.abort();
      } catch {}
    };
  }, []);

  useEffect(() => {
    const normalized = finalText.toLowerCase();
    if (normalized.includes("go to options")) {
      router.push("/options");
    } else if (normalized.includes("go to analytics")) {
      router.push("/analytics");
    } else if (normalized.includes("go to space invaders")) {
      router.push("/space-invaders");
    } else if (normalized.includes("go to dinosaur")) {
      router.push("/dinosaur");
    }
  }, [finalText, router]);

  return (
    <main style={{ minHeight: "100dvh", display: "grid", placeItems: "center", padding: "2rem", position: "relative", background: "white", color: "#1a1a1a"  }}>
      {/* Main UI */}
      <div style={{ maxWidth: 640, width: "100%", display: "grid", gap: "1rem" }}>
        <h1
          style={{
            fontSize: "2.6rem",
            fontWeight: 800,
            textAlign: "center",
            lineHeight: 1.25,
            letterSpacing: "-0.02em",
            background:
              "linear-gradient(90deg, #7f3ef0 0%, #6a5afc 33%, #3f8bfe 66%, #27b4ff 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "1rem",
          }}
        >
          Therapy Backed by Science. <br /> Powered by Play.
        </h1>

        {!supported && (
          <p>Your browser doesn’t support the Web Speech API. Try Chrome/Edge, or use a server-side STT route.</p>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", minHeight: 24 }}>
          {listening ? (
            <>
              {/* Bounce loader */}
              <div className="bounce">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>
              {/* Typing / disappearing loop */}
              <span
                style={{
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  background:
                    "linear-gradient(90deg,#7f3ef0 0%,#6a5afc 33%,#3f8bfe 66%,#27b4ff 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  minWidth: 130,
                  display: "inline-block",
                }}
                aria-live="polite"
              >
                {typed}
              </span>
            </>
          ) : (
            <span style={{ opacity: 0.7 }}>Not listening</span>
          )}
        </div>

        <div
          style={{
            padding: "1rem",
            border: "1px solid #ddd",
            borderRadius: 12,
            minHeight: 140,
            background: "white",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)"
          }}
        >
          <strong>Transcript</strong>
          <p style={{ whiteSpace: "pre-wrap", marginTop: "0.5rem", color: "black" }}>
            {finalText}
            <span style={{ opacity: 0.5 }}>{interimText}</span>
          </p>
        </div>

        <small>
          Tip: Speak clearly. Interim (lighter) text becomes final after short pauses. Reload the page to clear.
        </small>
      </div>

      {/* component-scoped styles */}
      <style jsx>{`
        /* Bounce loader */
        .bounce {
          display: inline-flex;
          gap: 6px;
          height: 14px;
          align-items: flex-end;
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8a5bff, #5cc8ff);
          animation: bounce 0.9s infinite ease-in-out;
        }
        .dot:nth-child(2) { animation-delay: 0.15s; }
        .dot:nth-child(3) { animation-delay: 0.3s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.8; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </main>
  );
}
