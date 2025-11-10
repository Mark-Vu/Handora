"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const API_BASE = "http://localhost:8000";

type SessionData = {
  id?: string;
  score?: number;
  baseline_by_finger?: { thumb?: number; index?: number; middle?: number; ring?: number; pinky?: number };
  metrics?: {
    accuracy?: number;
    rom_percent?: number;
    reaction_time?: number;
    smoothness?: number;
  };
  game_key?: string;
  started_at?: string;
  finished_at?: string;
};

const GAME_NAMES: Record<string, string> = {
  piano_tiles: "Piano Tiles",
  space_invader: "Space Invader",
  dinosaur: "Dinosaur",
};

export default function AnalyticsPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");

  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  const [history, setHistory] = useState<SessionData[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [analyzingAI, setAnalyzingAI] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    // Fetch current session + history
    fetch(`${API_BASE}/api/v1/sessions/${sessionId}/with-history`)
      .then((r) => r.json())
      .then((data) => {
        console.log("Received session data:", data);
        setCurrentSession(data.current);
        setHistory(data.history || []);
        // Trigger AI analysis
        if (data.current) {
          analyzeSession(data.current, data.history || []);
        }
      })
      .catch((err) => console.error("Fetch error:", err))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const analyzeSession = (current: SessionData, hist: SessionData[]) => {
    setAnalyzingAI(true);
    const allScores = hist.map((h) => h.score || 0);
    const avgPrevious = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;

    const prompt = `Analyze this rehab game session. Current score: ${current.score || 0}. Previous average: ${avgPrevious.toFixed(
      1
    )}. Provide 3-5 sentences on performance trends and 1-2 actionable tips.`;

    const metricsPayload = {
      score: current.score,
      accuracy: current.metrics?.accuracy,
      rom_percent: current.metrics?.rom_percent,
      reaction_time: current.metrics?.reaction_time,
      smoothness: current.metrics?.smoothness,
      baseline_by_finger: current.baseline_by_finger,
    };

    console.log("Sending to AI:", { prompt, metrics: metricsPayload });

    fetch(`${API_BASE}/api/v1/analytics/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        metrics: metricsPayload,
      }),
    })
      .then((r) => r.json())
      .then((data) => setAiAnalysis(data.analysis || "No analysis available."))
      .catch((err) => {
        console.error("AI analysis error:", err);
        setAiAnalysis("AI analysis unavailable.");
      })
      .finally(() => setAnalyzingAI(false));
  };

  if (loading) return <div className="p-8 text-center text-gray-900">Loading...</div>;
  if (!sessionId || !currentSession)
    return <div className="p-8 text-center text-gray-900">No session specified. Add ?session=SESSION_ID to URL.</div>;

  // Chart data: history + current
  const chartData = [
    ...history.map((h, i) => ({ session: `${i + 1}`, score: h.score || 0, isCurrent: false })),
    { session: `${history.length + 1}`, score: currentSession.score || 0, isCurrent: true },
  ];

  const gameName = GAME_NAMES[currentSession.game_key || ""] || currentSession.game_key || "Unknown";

  // Per-finger data for bar chart
  const fingerData = currentSession.baseline_by_finger
    ? Object.entries(currentSession.baseline_by_finger).map(([finger, value]) => ({
        finger: finger.charAt(0).toUpperCase() + finger.slice(1),
        angle: value,
      }))
    : [];

  return (
    <div className="p-8 max-w-7xl mx-auto text-gray-900 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-extrabold mb-6 text-gray-900">Session Results - {gameName}</h1>

      {/* Current Session Metrics - Hero Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-6 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-lg shadow-lg">
          <p className="text-sm font-medium opacity-90">Score</p>
          <p className="text-4xl font-extrabold">{currentSession.score ?? "—"}</p>
        </div>
        {currentSession.metrics?.accuracy !== undefined && (
          <div className="p-6 bg-gradient-to-br from-green-400 to-green-600 text-white rounded-lg shadow-lg">
            <p className="text-sm font-medium opacity-90">Accuracy</p>
            <p className="text-4xl font-extrabold">{(currentSession.metrics.accuracy * 100).toFixed(0)}%</p>
          </div>
        )}
        {currentSession.metrics?.rom_percent !== undefined && (
          <div className="p-6 bg-gradient-to-br from-purple-400 to-purple-600 text-white rounded-lg shadow-lg">
            <p className="text-sm font-medium opacity-90">ROM</p>
            <p className="text-4xl font-extrabold">{(currentSession.metrics.rom_percent * 100).toFixed(0)}%</p>
          </div>
        )}
        {currentSession.metrics?.reaction_time !== undefined && (
          <div className="p-6 bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-lg shadow-lg">
            <p className="text-sm font-medium opacity-90">Reaction Time</p>
            <p className="text-4xl font-extrabold">{currentSession.metrics.reaction_time}ms</p>
          </div>
        )}
      </div>

      {/* Per-Finger Flex Angles */}
      {fingerData.length > 0 && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Flex Angles by Finger</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={fingerData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="finger" tick={{ fill: "#111827" }} />
              <YAxis
                label={{ value: "Angle (°)", angle: -90, position: "insideLeft", fill: "#111827" }}
                tick={{ fill: "#111827" }}
              />
              <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }} />
              <Bar dataKey="angle" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Score Progress Chart */}
      <div className="mb-8 p-6 bg-white rounded-lg shadow-lg border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Your Progress - {gameName}</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="session"
              label={{ value: "Session Number", position: "insideBottom", offset: -5, fill: "#111827" }}
              tick={{ fill: "#111827" }}
            />
            <YAxis
              label={{ value: "Score", angle: -90, position: "insideLeft", fill: "#111827" }}
              tick={{ fill: "#111827" }}
            />
            <Tooltip contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb" }} />
            <Legend wrapperStyle={{ color: "#111827" }} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#4f46e5"
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload, index } = props;
                return (
                  <circle
                    key={`dot-${index}`}
                    cx={cx}
                    cy={cy}
                    r={payload.isCurrent ? 8 : 4}
                    fill={payload.isCurrent ? "#ef4444" : "#4f46e5"}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                );
              }}
            />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-sm text-gray-600 mt-2">
          <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-1"></span>
          Red dot = Current session
        </p>
      </div>

      {/* AI Analysis */}
      <div className="p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg shadow-lg border border-indigo-200">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <span>🤖</span> What does Dora has to say?
        </h2>
        {analyzingAI ? (
          <p className="text-gray-600 italic">Analyzing your session...</p>
        ) : (
          <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{aiAnalysis}</p>
        )}
      </div>
    </div>
  );
}
