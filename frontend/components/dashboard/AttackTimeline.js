"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { fetchApiJson } from "@/lib/api";

export default function AttackTimeline() {
    const [timelineEvents, setTimelineEvents] = useState([]);

    useEffect(() => {
        const fetchThreats = async () => {
            try {
                const data = await fetchApiJson("/api/threats/recent?connected_only=true", { cache: "no-store" });
                setTimelineEvents(data);
            } catch (err) {
                console.error("Failed to fetch threat timeline", err);
            }
        };
        fetchThreats();
        const interval = setInterval(fetchThreats, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="p-6 rounded-3xl bg-gradient-to-br from-orange-600 via-red-500 to-rose-600 overflow-hidden shadow-xl shadow-black/20"
        >
            {/* Inner highlight */}
            <div className="absolute inset-0 rounded-3xl border border-white/20 pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, white 0%, transparent 20%)', WebkitMaskImage: 'linear-gradient(to bottom, white 0%, transparent 20%)' }} />

            <div className="relative z-10 flex flex-col h-full justify-between">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-sm font-medium tracking-wide text-white/90">Attack Timeline</h3>
                    <span className="text-xs font-semibold text-white/80 bg-white/20 px-3 py-1 rounded-full border border-white/10 shadow-inner">
                        Active Response
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
                    <div className="space-y-6">
                        {timelineEvents.length === 0 ? (
                            <div className="text-center py-6 text-white/50 text-sm">No events recorded</div>
                        ) : (
                            timelineEvents.map((event, i) => (
                                <motion.div
                                    key={event._id || i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 + (i * 0.1) }}
                                    className="relative flex gap-4"
                                >
                                    {/* Timeline line */}
                                    {i !== timelineEvents.length - 1 && (
                                        <div className="absolute top-8 bottom-[-24px] left-[11px] w-[2px] bg-white/20 rounded-full" />
                                    )}

                                    <div className="relative z-10 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20 backdrop-blur-sm mt-1">
                                        <div className={`w-2.5 h-2.5 rounded-full ${i === 0 ? 'bg-orange-400 animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.8)] bg-white' : 'bg-emerald-400'}`} />
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <h4 className="text-sm font-medium text-white capitalize">{(event.type || event.attack_type || 'Unknown Threat').replace(/_/g, ' ')}</h4>
                                            <span className="text-xs text-white/70 font-mono tracking-wider">{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <p className="text-sm text-white/70 mt-1 font-light leading-relaxed">Source: {event.sourceIp || event.source_ip || "N/A"} targeting {event.targetDevice || event.device || "Unknown"}</p>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>

                {/* Progress dot indicator at bottom (like Image 2 "Increases Productivity") */}
                <div className="mt-8 flex justify-center gap-2">
                    {[...Array(8)].map((_, i) => (
                        <motion.div
                            key={`prog-${i}`}
                            className={`w-1.5 h-1.5 rounded-full ${i < 4 ? 'bg-white shadow-[0_0_8px_white]' : 'bg-white/20'}`}
                            initial={i === 3 ? { scale: 0.8, opacity: 0.5 } : {}}
                            animate={i === 3 ? { scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] } : {}}
                            transition={i === 3 ? { duration: 1.5, repeat: Infinity } : {}}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
