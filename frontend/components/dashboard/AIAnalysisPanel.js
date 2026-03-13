"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";

export default function AIAnalysisPanel() {
    const [textIndex, setTextIndex] = useState(0);
    const [fullText, setFullText] = useState("Establishing secure link to AI engine... Analyzing network telemetry...");
    const [displayedText, setDisplayedText] = useState("");
    const [cvss, setCvss] = useState("---");
    const [severityLabel, setSeverityLabel] = useState("ANALYZING");

    // Fetch live AI analysis from Bedrock via MongoDB threat data
    useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                const res = await fetch("/api/ai/analyze");
                const data = await res.json();

                // Clear and restart typewriter effect safely
                setDisplayedText("");
                setTextIndex(0);

                if (data.analysis) setFullText(data.analysis);
                if (data.cvss) setCvss(data.cvss);
                if (data.severityLabel) setSeverityLabel(data.severityLabel);

            } catch (err) {
                console.error("AI Analysis error:", err);
                setFullText("Warning: AI endpoint unreachable. Reverting to manual investigation mode.");
            }
        };

        fetchAnalysis();
    }, []);

    // Typewriter effect logic
    useEffect(() => {
        if (textIndex < fullText.length) {
            const timer = setTimeout(() => {
                setDisplayedText(prev => prev + fullText[textIndex]);
                setTextIndex(prev => prev + 1);
            }, 25); // Snappy typing speed
            return () => clearTimeout(timer);
        }
    }, [textIndex, fullText]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="p-6 rounded-3xl bg-gradient-to-br from-pink-600 via-purple-600 to-indigo-700 overflow-hidden shadow-xl shadow-black/20 relative"
        >
            {/* Inner highlight */}
            <div className="absolute inset-0 rounded-3xl border border-white/20 pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, white 0%, transparent 20%)', WebkitMaskImage: 'linear-gradient(to bottom, white 0%, transparent 20%)' }} />

            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />

            {/* Glowing orb behind waveform */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-fuchsia-400/30 rounded-full blur-[60px]" />

            <div className="relative z-10 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-sm font-medium tracking-wide text-white/90">AI Analysis</h3>
                        <p className="text-white/60 text-xs mt-1">Real-time investigation</p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-md"
                    >
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_8px_white]" />
                        <span className="text-xs font-semibold text-white tracking-widest uppercase">Active</span>
                    </motion.div>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <span className="text-4xl font-light text-white tracking-tighter">{cvss !== "---" ? "+" : ""}{cvss}<span className="text-xl opacity-70 ml-1">CVSS</span></span>
                        <div className="bg-white/10 px-3 py-1 rounded-full border border-white/20">
                            <span className="text-white/90 text-xs font-medium uppercase tracking-wider">{severityLabel}</span>
                        </div>
                    </div>

                    {/* Audio Waveform visualization */}
                    <div className="flex items-center justify-center gap-1 h-32 my-4">
                        {[...Array(30)].map((_, i) => (
                            <motion.div
                                key={i}
                                className={`w-1.5 rounded-full ${Math.abs(15 - i) < 3 ? 'bg-yellow-300 shadow-[0_0_10px_rgba(253,224,71,0.8)]' : 'bg-white/40'}`}
                                animate={{
                                    height: [
                                        Math.abs(Math.sin(i * 2)) * 20 + 10,
                                        Math.abs(Math.cos(i * 3)) * 80 + 20,
                                        Math.abs(Math.sin(i * 2)) * 20 + 10
                                    ]
                                }}
                                transition={{
                                    duration: Math.abs(Math.sin(i * 4)) * 0.5 + 0.5,
                                    repeat: Infinity,
                                    repeatType: "reverse",
                                    ease: "easeInOut"
                                }}
                            />
                        ))}
                    </div>

                    {/* Typewriter text console */}
                    <div className="bg-black/20 rounded-2xl p-5 border border-white/10 backdrop-blur-md relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-yellow-300 to-transparent" />
                        <div className="text-sm text-white/90 font-mono leading-relaxed min-h-[80px]">
                            {displayedText}
                            <motion.span
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 0.8, repeat: Infinity }}
                                className="inline-block w-2 h-4 bg-white/80 ml-1 align-middle"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
