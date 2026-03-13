"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { fetchApiJson } from "@/lib/api";

export default function SecurityAnalyticsCharts() {
    const [distribution, setDistribution] = useState([]);
    const [weeklyTrends, setWeeklyTrends] = useState([
        { day: "S", value: 0 }, { day: "M", value: 0 }, { day: "T", value: 0 },
        { day: "W", value: 0 }, { day: "T", value: 0 }, { day: "F", value: 0 }, { day: "S", value: 0 }
    ]);
    const [totalThreats, setTotalThreats] = useState(0);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const data = await fetchApiJson("/api/analytics", { cache: "no-store" });

                setDistribution(data.distribution || []);
                setWeeklyTrends(data.weeklyTrends || []);

                const total = (data.distribution || []).reduce((sum, item) => sum + item.value, 0);
                // The API actually returns percentages in value. Wait, let's just show total count from the weekly trends sum or similar.
                // Let's use the actual threats sum for the SVG or just 100%. If empty, 0.
                if (data.distribution && data.distribution.length > 0) {
                    setTotalThreats(100);
                } else {
                    setTotalThreats(0);
                }
            } catch (err) {
                console.error("Failed to fetch analytics", err);
            }
        };

        fetchAnalytics();
        const interval = setInterval(fetchAnalytics, 5000);
        return () => clearInterval(interval);
    }, []);

    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const maxVal = Math.max(...weeklyTrends.map(t => t.value), 10); // Prevent divide by zero

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">

            {/* Attack Distribution Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative p-6 rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 overflow-hidden shadow-xl shadow-black/20"
            >
                {/* Inner highlight (liquid glass top edge effect) */}
                <div className="absolute inset-0 rounded-3xl border border-white/20 pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, white 0%, transparent 20%)', WebkitMaskImage: 'linear-gradient(to bottom, white 0%, transparent 20%)' }} />
                <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/20 rounded-full blur-3xl" />

                <div className="relative z-10">
                    <h3 className="text-sm font-medium tracking-wide text-white/80 mb-6">Attack Distribution</h3>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                        {/* Donut Chart SVG */}
                        <div className="relative w-40 h-40 flex-shrink-0">
                            <svg width="160" height="160" viewBox="0 0 160 160" className="transform -rotate-90 drop-shadow-xl">
                                {/* Background ring */}
                                <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16" />

                                {/* Data segments */}
                                {(() => {
                                    let currentOffset = 0;
                                    if (distribution.length === 0) {
                                        return (
                                            <circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="16" />
                                        );
                                    }
                                    return distribution.map((item, i) => {
                                        const arcLength = (item.value / 100) * circumference;
                                        const offset = -currentOffset;
                                        currentOffset += arcLength;

                                        return (
                                            <motion.circle
                                                key={item.label}
                                                cx="80" cy="80" r={radius}
                                                fill="none"
                                                stroke={item.color}
                                                strokeWidth="16"
                                                initial={{
                                                    strokeDasharray: `0 ${circumference}`,
                                                    strokeDashoffset: offset
                                                }}
                                                animate={{
                                                    strokeDasharray: `${arcLength} ${circumference}`,
                                                    strokeDashoffset: offset
                                                }}
                                                transition={{
                                                    duration: 1.8,
                                                    ease: [0.16, 1, 0.3, 1],
                                                    delay: i * 0.15
                                                }}
                                                whileHover={{ strokeWidth: 22, opacity: 0.9 }}
                                                className="cursor-pointer"
                                            />
                                        );
                                    });
                                })()}
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-3xl font-light text-white leading-none mb-1">{totalThreats}</span>
                                <span className="text-xs text-white/60 tracking-widest uppercase">{totalThreats > 0 ? "%" : "Total"}</span>
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex-1 w-full space-y-3">
                            {distribution.length === 0 ? (
                                <div className="text-sm text-white/40 italic">No distribution data</div>
                            ) : (
                                distribution.map((item, i) => (
                                    <motion.div
                                        key={item.label}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 + (i * 0.1) }}
                                        className="flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="w-3 h-3 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: item.color, color: item.color }} />
                                            <span className="text-sm font-medium text-white/90">{item.label}</span>
                                        </div>
                                        <span className="text-sm font-light text-white/60">{item.value}%</span>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Weekly Threat Trends Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="relative p-6 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden shadow-xl shadow-black/20"
            >
                {/* Inner highlight */}
                <div className="absolute inset-0 rounded-3xl border border-white/10 pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, white 0%, transparent 20%)', WebkitMaskImage: 'linear-gradient(to bottom, white 0%, transparent 20%)' }} />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />

                <div className="relative z-10 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-sm font-medium tracking-wide text-white/80">Threats This Week</h3>
                        <span className="text-sm font-medium text-cyan-400">{weeklyTrends.reduce((sum, t) => sum + t.value, 0)} total</span>
                    </div>

                    <div className="flex-1 pb-4">
                        <div className="flex items-end justify-between h-40 gap-2">
                            {weeklyTrends.map((trend, i) => {
                                const heightPercentage = (trend.value / maxVal) * 100;
                                return (
                                    <div key={`${trend.day}-${i}`} className="flex flex-col items-center gap-3 group flex-1">
                                        <div className="relative w-full max-w-[40px] h-full bg-white/5 rounded-t-xl overflow-hidden flex items-end justify-center">
                                            {/* Tooltip on hover */}
                                            <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded text-xs text-white whitespace-nowrap z-20">
                                                {trend.value} threats
                                            </div>

                                            <motion.div
                                                className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t-xl shadow-[0_0_15px_rgba(34,211,238,0.5)]"
                                                initial={{ height: 0 }}
                                                animate={{ height: `${heightPercentage}%` }}
                                                transition={{ duration: 1, delay: i * 0.1, type: "spring" }}
                                            />
                                        </div>
                                        <span className="text-xs font-semibold text-white/50">{trend.day}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </motion.div>

        </div>
    );
}
