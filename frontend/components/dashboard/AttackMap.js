"use client";

import { useState, useEffect, useMemo } from "react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import { motion } from "framer-motion";
import { fetchApiJson } from "@/lib/api";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function AttackMap() {
    const [locations, setLocations] = useState([]);

    useEffect(() => {
        const fetchLocations = async () => {
            try {
                const data = await fetchApiJson("/api/threat-locations", { cache: "no-store" });
                setLocations(data);
            } catch (err) {
                console.error("Failed to fetch threat locations", err);
            }
        };

        fetchLocations();
        const interval = setInterval(fetchLocations, 5000);
        return () => clearInterval(interval);
    }, []);

    // Filter valid coordinates to prevent Mapbox/Leaflet/SimpleMaps crash
    const validMarkers = useMemo(() => {
        return locations.filter(loc => loc.lat && loc.lng && !isNaN(loc.lat) && !isNaN(loc.lng));
    }, [locations]);

    return (
        <div className="bg-black/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white/90">Global Threat Origins</h3>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="text-xs text-white/50 uppercase tracking-widest font-mono">Live Tracking</span>
                </div>
            </div>

            {/* Map Container */}
            <div className="w-full h-[300px] relative bg-[#0a0f18] rounded-2xl border border-white/5 overflow-hidden">
                {validMarkers.length === 0 && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <span className="text-white/50 text-sm font-medium tracking-wide">No threat origins detected</span>
                    </div>
                )}

                {/* Glowing background behind map */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.05)_0%,transparent_70%)]" />

                <ComposableMap projection="geoMercator" projectionConfig={{ scale: 100 }} className="w-full h-full">
                    <Geographies geography={geoUrl}>
                        {({ geographies }) =>
                            geographies.map((geo) => (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    fill="#1e293b" // Dark slate slate color for countries
                                    stroke="#334155" // Slightly lighter borders
                                    strokeWidth={0.5}
                                    style={{
                                        default: { outline: "none" },
                                        hover: { fill: "#334155", outline: "none" },
                                        pressed: { outline: "none" },
                                    }}
                                />
                            ))
                        }
                    </Geographies>

                    {validMarkers.map((marker, index) => (
                        <Marker key={`${marker.ip}-${index}`} coordinates={[marker.lng, marker.lat]}>
                            <motion.g
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                            >
                                {/* Ripple Effect */}
                                <motion.circle
                                    r={10}
                                    fill="rgba(239, 68, 68, 0.4)"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 2.5, opacity: 0 }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                                />
                                {/* Core Dot */}
                                <circle r={4} fill="#ef4444" stroke="#fff" strokeWidth={1} />
                            </motion.g>
                        </Marker>
                    ))}
                </ComposableMap>
            </div>

            <div className="mt-4 flex justify-between items-center text-xs text-white/40 font-mono">
                <span>Total distinct origins: {validMarkers.length}</span>
                <span>Coordinates resolved via IP Geolocation</span>
            </div>
        </div>
    );
}
