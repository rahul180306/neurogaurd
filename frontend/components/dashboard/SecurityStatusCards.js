"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { getWsBaseUrl } from "@/lib/api";

const getCards = (stats) => [
    {
        label: "Connected Devices",
        value: stats.connected,
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
            </svg>
        ),
        bgClasses: "bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-400",
        shadowHover: "hover:shadow-[0_0_40px_rgba(6,182,212,0.4)]",
    },
    {
        label: "Detected Devices",
        value: stats.detected,
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
        ),
        bgClasses: "bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-500",
        shadowHover: "hover:shadow-[0_0_40px_rgba(245,158,11,0.4)]",
    },
    {
        label: "Blocked Devices",
        value: stats.blocked,
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
        ),
        bgClasses: "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500",
        shadowHover: "hover:shadow-[0_0_40px_rgba(16,185,129,0.4)]",
    },
    {
        label: "Trusted Devices",
        value: stats.trusted,
        suffix: "",
        icon: (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12.75 11.25 15 15 9.75m-3-6.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
        ),
        bgClasses: "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500",
        shadowHover: "hover:shadow-[0_0_40px_rgba(168,85,247,0.4)]",
        isScore: false,
    },
];

function ScoreRing({ value }) {
    const safeValue = typeof value === 'number' ? value : 0;
    const radius = 32;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (safeValue / 100) * circumference;

    return (
        <div className="relative w-[80px] h-[80px] flex-shrink-0">
            <svg width="80" height="80" viewBox="0 0 80 80" className="transform -rotate-90 drop-shadow-lg">
                <circle cx="40" cy="40" r={radius} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
                <motion.circle
                    cx="40" cy="40" r={radius} fill="none"
                    stroke="#ffffff" strokeWidth="6" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={circumference}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                {/* Decorative inner wave/dot */}
                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            </div>
        </div>
    );
}

export default function SecurityStatusCards() {
    const [stats, setStats] = useState({ connected: 0, detected: 0, blocked: 0, trusted: 0 });

    useEffect(() => {
        const socket = new WebSocket(`${getWsBaseUrl()}/ws/dashboard`);

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setStats(data);
            } catch (e) {
                console.error("WebSocket message parsing error:", e);
            }
        };

        return () => {
            socket.close();
        };
    }, []);

    const cards = getCards(stats);

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, i) => (
                <motion.div
                    key={card.label}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1, duration: 0.5, type: "spring" }}
                    className={`relative rounded-3xl ${card.bgClasses} p-6 overflow-hidden transition-all duration-300 ${card.shadowHover} text-white shadow-xl shadow-black/20`}
                >
                    {/* Inner highlight (liquid glass top edge effect) */}
                    <div className="absolute inset-0 rounded-3xl border border-white/30 pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, white 0%, transparent 20%)', WebkitMaskImage: 'linear-gradient(to bottom, white 0%, transparent 20%)' }} />

                    {/* Background decorative blob */}
                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

                    <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                        <div className="flex justify-between items-start">
                            <span className="text-sm font-medium opacity-90 tracking-wide">{card.label}</span>
                            <div className="opacity-80">
                                {card.icon}
                            </div>
                        </div>

                        <div className="flex items-end justify-between mt-4">
                            {!card.isScore ? (
                                <motion.div
                                    className="text-5xl font-light tracking-tight"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 + 0.3 }}
                                >
                                    {card.value}
                                    <span className="text-2xl font-normal opacity-80 ml-1">{card.suffix || ""}</span>
                                </motion.div>
                            ) : (
                                <div className="flex items-center justify-between w-full">
                                    <motion.div
                                        className="text-5xl font-light tracking-tight"
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.1 + 0.3 }}
                                    >
                                        {card.value}
                                        <span className="text-2xl font-normal opacity-80">{card.suffix}</span>
                                    </motion.div>
                                    <ScoreRing value={card.value} />
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
