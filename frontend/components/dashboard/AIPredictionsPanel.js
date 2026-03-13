"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { fetchApiJson } from "@/lib/api";

const riskColors = {
    high: {
        bg: "bg-red-500/15",
        border: "border-red-500/30",
        text: "text-red-400",
        dot: "bg-red-400 shadow-[0_0_10px_rgba(239,68,68,0.8)]",
        bar: "bg-red-400"
    },
    medium: {
        bg: "bg-yellow-500/15",
        border: "border-yellow-500/30",
        text: "text-yellow-400",
        dot: "bg-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.8)]",
        bar: "bg-yellow-400"
    },
    low: {
        bg: "bg-emerald-500/15",
        border: "border-emerald-500/30",
        text: "text-emerald-400",
        dot: "bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)]",
        bar: "bg-emerald-400"
    }
};

export default function AIPredictionsPanel() {
    const [predictions, setPredictions] = useState([]);

    useEffect(() => {
        const fetchPredictions = async () => {
            try {
                const data = await fetchApiJson("/api/predictions", { cache: "no-store" });
                setPredictions(data);
            } catch (err) {
                console.error("Failed to fetch predictions", err);
            }
        };

        fetchPredictions();
        const interval = setInterval(fetchPredictions, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="p-6 rounded-3xl bg-gradient-to-br from-violet-600/80 via-purple-600/80 to-fuchsia-700/80 overflow-hidden shadow-xl shadow-black/20 relative"
        >
            {/* Inner highlight */}
            <div className="absolute inset-0 rounded-3xl border border-white/20 pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, white 0%, transparent 20%)', WebkitMaskImage: 'linear-gradient(to bottom, white 0%, transparent 20%)' }} />

            {/* Glowing orb decoration */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-fuchsia-400/20 rounded-full blur-[60px]" />

            <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <div className="text-lg">🧠</div>
                        <h3 className="text-sm font-medium tracking-wide text-white/90 uppercase">AI Predictions</h3>
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
                        <div className="w-2 h-2 rounded-full bg-fuchsia-400 shadow-[0_0_8px_rgba(217,70,239,0.8)] animate-pulse" />
                        <span className="text-xs font-semibold text-white tracking-widest uppercase">AI Engine</span>
                    </div>
                </div>

                {predictions.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="text-3xl mb-3">🔍</div>
                        <p className="text-sm text-white/60">No active predictions</p>
                        <p className="text-xs text-white/40 mt-1">AI engine analyzing telemetry data...</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {predictions.map((pred, i) => {
                            const risk = riskColors[pred.risk_level] || riskColors.low;
                            const confidencePct = Math.round((pred.confidence || 0) * 100);

                            return (
                                <motion.div
                                    key={pred._id || i}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: 0.5 + (i * 0.1) }}
                                    className={`rounded-2xl p-4 ${risk.bg} border ${risk.border} backdrop-blur-md relative overflow-hidden group`}
                                >
                                    {/* Hover glow */}
                                    <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full animate-pulse ${risk.dot}`} />
                                                <span className="text-xs text-white/60 uppercase tracking-wider font-semibold">
                                                    ⚠ Predicted Attack
                                                </span>
                                            </div>
                                            <span className={`text-xs font-bold uppercase tracking-wider ${risk.text}`}>
                                                {pred.risk_level}
                                            </span>
                                        </div>

                                        <h4 className="text-sm font-semibold text-white capitalize mb-2">
                                            {(pred.predicted_attack || "unknown").replace(/_/g, " ")}
                                        </h4>

                                        <div className="flex items-center justify-between text-xs text-white/50">
                                            <span>Device: <span className="text-white/80 font-mono">{pred.device_id}</span></span>
                                            <span>Confidence: <span className={`font-bold ${risk.text}`}>{confidencePct}%</span></span>
                                        </div>

                                        {/* Confidence bar */}
                                        <div className="mt-3 h-1.5 bg-black/30 rounded-full overflow-hidden">
                                            <motion.div
                                                className={`h-full rounded-full ${risk.bar}`}
                                                initial={{ width: 0 }}
                                                animate={{ width: `${confidencePct}%` }}
                                                transition={{ duration: 1, delay: 0.6 + (i * 0.1) }}
                                            />
                                        </div>

                                        {pred.reasoning && (
                                            <p className="text-xs text-white/40 mt-2 italic">{pred.reasoning}</p>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
