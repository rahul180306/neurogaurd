"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchApiJson } from "@/lib/api";

const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'blocked':
            return { color: "bg-red-500", glow: "shadow-[0_0_15px_rgba(239,68,68,0.8)]", displayStatus: "Blocked" };
        case 'detected':
            return { color: "bg-yellow-500", glow: "shadow-[0_0_15px_rgba(234,179,8,0.8)]", displayStatus: "Detected" };
        case 'connected':
        default:
            return { color: "bg-emerald-500", glow: "shadow-[0_0_15px_rgba(16,185,129,0.8)]", displayStatus: "Connected" };
    }
};

export default function DeviceStatusPanel() {
    const [devices, setDevices] = useState([]);

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const data = await fetchApiJson("/api/devices", { cache: "no-store" });
                setDevices(data);
            } catch (err) {
                console.error("Failed to fetch devices", err);
            }
        };

        fetchDevices();
        const interval = setInterval(fetchDevices, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="p-6 rounded-3xl bg-gradient-to-b from-[#111827] to-[#0A0F1A] border border-white/5 shadow-2xl relative overflow-hidden"
        >
            {/* Top liquid reflection */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />

            <div className="flex justify-between items-center mb-6 relative z-10">
                <h3 className="text-sm font-medium tracking-wide text-white/80 uppercase">Device Status</h3>
                <div className="flex items-center gap-3">
                    <span className="text-xs bg-white/5 text-white/60 px-2 py-1 rounded-full border border-white/10">
                        {devices.length} devices
                    </span>
                    <Link href="/devices" className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20 hover:bg-cyan-500/20">
                        View All
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                    </Link>
                </div>
            </div>

            <div className="space-y-3 relative z-10">
                {devices.length === 0 ? (
                    <div className="text-center py-6 text-white/50 text-sm">No devices connected</div>
                ) : (
                    devices.map((device, i) => {
                        const { color, glow, displayStatus } = getStatusColor(device.status);
                        return (
                            <motion.div
                                key={device._id || i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + (i * 0.1) }}
                                className="group flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all cursor-pointer relative overflow-hidden"
                            >
                                {/* Hover flare */}
                                <div className="absolute inset-0 bg-gradient-to-r from-white/[0.0] via-white/[0.05] to-white/[0.0] -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                                <div className="flex items-center gap-4 relative z-10">
                                    {/* Colorful abstract device dot */}
                                    <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                        <div className={`w-3 h-3 rounded-full ${color} ${glow} animate-pulse`} />
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-white/90">{device.name || "Unknown Device"}</h4>
                                        <p className="text-xs text-white/40 mt-0.5 font-light">{device.type || device.type_guess || "unknown"} • {device.last_seen ? new Date(device.last_seen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 relative z-10">
                                    {device.trusted ? (
                                        <span className="text-xs font-semibold text-violet-300 bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-500/20">
                                            Trusted
                                        </span>
                                    ) : null}
                                    {displayStatus === 'Blocked' && (
                                        <span className="text-xs font-semibold text-red-400 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                                            {displayStatus}
                                        </span>
                                    )}
                                    {displayStatus === 'Detected' && (
                                        <span className="text-xs font-semibold text-yellow-400 bg-yellow-500/10 px-2.5 py-1 rounded-full border border-yellow-500/20">
                                            {displayStatus}
                                        </span>
                                    )}
                                    {displayStatus === 'Connected' && (
                                        <span className="text-xs font-medium text-emerald-400/80">
                                            {displayStatus}
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        )
                    })
                )}
            </div>

            {/* Visual Scatter Plot Decoration (Like 'Skin Damage' in Reference Image 2) */}
            <div className="mt-8 relative h-32 w-full border-t border-white/5 pt-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
                    <div className="w-full h-[1px] bg-white/20" />
                    <div className="h-full w-[1px] bg-white/20 absolute" />
                </div>
                {/* Pseudo-random glowing dots for aesthetic (deterministic for SSR hydration) */}
                <div className="relative w-full h-full">
                    {[...Array(15)].map((_, i) => (
                        <motion.div
                            key={`dot-${i}`}
                            className="absolute rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]"
                            style={{
                                width: `${(Math.abs(Math.sin(i * 1.5)) * 8 + 4).toFixed(2)}px`,
                                height: `${(Math.abs(Math.sin(i * 1.5)) * 8 + 4).toFixed(2)}px`,
                                top: `${(Math.abs(Math.cos(i * 2.3)) * 100).toFixed(2)}%`,
                                left: `${(Math.abs(Math.sin(i * 3.7)) * 100).toFixed(2)}%`,
                                opacity: Number((Math.abs(Math.cos(i * 4.1)) * 0.5 + 0.3).toFixed(2))
                            }}
                            animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.2, 1] }}
                            transition={{ duration: Math.abs(Math.sin(i * 5.5)) * 2 + 2, repeat: Infinity }}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
