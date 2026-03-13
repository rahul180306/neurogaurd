"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import SecurityStatusCards from "@/components/dashboard/SecurityStatusCards";
import ThreatMonitorFeed from "@/components/dashboard/ThreatMonitorFeed";
import DeviceStatusPanel from "@/components/dashboard/DeviceStatusPanel";
import AttackTimeline from "@/components/dashboard/AttackTimeline";
import AIAnalysisPanel from "@/components/dashboard/AIAnalysisPanel";
import AutoResponseLog from "@/components/dashboard/AutoResponseLog";
import SecurityAnalyticsCharts from "@/components/dashboard/SecurityAnalyticsCharts";
import HardwareStatusIndicators from "@/components/dashboard/HardwareStatusIndicators";
import AttackMap from "@/components/dashboard/AttackMap";
import AttackGraph from "@/components/dashboard/AttackGraph";
import AIPredictionsPanel from "@/components/dashboard/AIPredictionsPanel";
import { fetchApi } from "@/lib/api";
export default function Dashboard() {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <div className="min-h-screen w-full bg-[#0a0a0a] text-white relative overflow-hidden">
            {/* Ambient background effects - Vibrant Orbs for Liquid Glass */}
            {/* Added transform-gpu to prevent Safari from repainting/refreshing continuously on scroll */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 transform-gpu">
                {/* Top left purple/pink */}
                <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-fuchsia-600/30 rounded-full blur-[120px] mix-blend-screen transform-gpu" />
                {/* Center right vibrant blue */}
                <div className="absolute top-[20%] right-[5%] w-[40%] h-[60%] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen transform-gpu" />
                {/* Bottom left emerald/teal */}
                <div className="absolute bottom-[-10%] left-[10%] w-[60%] h-[50%] bg-teal-500/20 rounded-full blur-[140px] mix-blend-screen transform-gpu" />
                {/* Top right orange highlight */}
                <div className="absolute top-[5%] right-[30%] w-[30%] h-[30%] bg-orange-500/15 rounded-full blur-[100px] mix-blend-screen transform-gpu" />
            </div>

            <div className="relative z-10 pt-28 pb-12 px-4 md:px-8 lg:px-12 max-w-[1440px] mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="mb-8 relative z-20"
                >
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                        <div>
                            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Welcome to</p>
                            <h2 className="text-2xl md:text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">
                                Security Dashboard
                            </h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={async () => {
                                    if (confirm("Clear all threat simulation data? Registered devices will remain.")) {
                                        try {
                                            await fetchApi("/api/clear-history", { method: "POST" });
                                        } catch (e) {
                                            console.error(e);
                                        }
                                    }
                                }}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose-600/20 hover:bg-rose-600/30 transition-colors border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)] cursor-pointer"
                            >
                                <span className="text-[11px] text-rose-400 font-bold tracking-wider uppercase">🗑️ Reset Dashboard</span>
                            </button>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-[11px] text-emerald-400 font-medium tracking-wide">SOC Online</span>
                            </div>
                            <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 min-w-[100px] text-center">
                                <span className="text-[11px] text-gray-400 font-mono">
                                    {mounted ? new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Loading date..."}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Security Status Cards - Top Row */}
                <div className="mb-6">
                    <SecurityStatusCards />
                </div>

                {/* Main Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - 2/3 width */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* New Advanced SOC Visualizations */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <AttackMap />
                            <AttackGraph />
                        </div>

                        {/* Threat Monitor Feed */}
                        <ThreatMonitorFeed />

                        {/* AI Analysis Panel */}
                        <AIAnalysisPanel />
                    </div>

                    {/* Right Column - 1/3 width */}
                    <div className="space-y-6">
                        {/* Device Status */}
                        <DeviceStatusPanel />

                        {/* Attack Timeline */}
                        <AttackTimeline />

                        {/* Hardware Status */}
                        <HardwareStatusIndicators />

                        {/* AI Predictions */}
                        <AIPredictionsPanel />

                        {/* Auto Response Log */}
                        <AutoResponseLog />
                    </div>
                </div>
            </div>
        </div>
    );
}
