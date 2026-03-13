"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { fetchApiJson } from "@/lib/api";

const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
        case 'online':
            return "text-emerald-400 border-emerald-500/30 bg-emerald-500/20";
        case 'warning':
            return "text-yellow-400 border-yellow-500/30 bg-yellow-500/20";
        case 'offline':
        default:
            return "text-red-400 border-red-500/30 bg-red-500/20";
    }
};

export default function HardwareStatusIndicators() {
    const [hardwareItems, setHardwareItems] = useState([]);

    useEffect(() => {
        const fetchHardware = async () => {
            try {
                const data = await fetchApiJson("/api/hardware", { cache: "no-store" });
                setHardwareItems(data);
            } catch (err) {
                console.error("Failed to fetch hardware status", err);
            }
        };

        fetchHardware();
        const interval = setInterval(fetchHardware, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="p-6 rounded-3xl bg-gradient-to-br from-teal-600 via-emerald-600 to-green-700 overflow-hidden shadow-xl shadow-black/20 relative"
        >
            {/* Inner highlight */}
            <div className="absolute inset-0 rounded-3xl border border-white/20 pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, white 0%, transparent 20%)', WebkitMaskImage: 'linear-gradient(to bottom, white 0%, transparent 20%)' }} />

            <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-medium tracking-wide text-white/90">Hardware Status</h3>
                    <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">
                        <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_white] animate-pulse" />
                        <span className="text-xs font-semibold text-white tracking-widest uppercase">Live</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {hardwareItems.length === 0 ? (
                        <div className="col-span-2 text-center py-6 text-white/50 text-sm">Waiting for hardware telemetry</div>
                    ) : (
                        hardwareItems.map((item, i) => (
                            <motion.div
                                key={item._id || i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.7 + (i * 0.1) }}
                                className="bg-black/20 rounded-2xl p-4 border border-white/10 backdrop-blur-md relative overflow-hidden group"
                            >
                                {/* Hover glow */}
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="flex justify-between items-start mb-3 relative z-10">
                                    <div className={`w-2.5 h-2.5 rounded-full ${item.status === 'Online' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : item.status === 'Warning' ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]' : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]'}`} />
                                    <span className="text-[10px] uppercase tracking-widest text-white/50 font-semibold">{item.type}</span>
                                </div>

                                <h4 className="text-sm text-white font-medium mb-1 relative z-10 truncate">{item.name}</h4>

                                <div className="flex items-end justify-between mt-3 relative z-10">
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-md border backdrop-blur-sm ${getStatusColor(item.status)}`}>
                                        {item.status}
                                    </span>

                                    {/* Signal bars */}
                                    <div className="flex items-end gap-0.5 h-4 opacity-80">
                                        {[1, 2, 3, 4].map((bar) => (
                                            <div
                                                key={bar}
                                                className={`w-1 rounded-t-sm ${(item.signal || 0) >= bar * 25
                                                    ? 'bg-white'
                                                    : 'bg-white/20'
                                                    }`}
                                                style={{ height: `${bar * 25}%` }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </motion.div>
    );
}
