"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { fetchApiJson } from "@/lib/api";
import { getWsBaseUrl } from "@/lib/api";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

/* ───────────────────  HELPER FUNCTIONS  ─────────────────── */
function aggregateThreatsByIP(threatLocations) {
    const map = {};
    threatLocations.forEach((threat) => {
        const ip = threat.ip;
        if (!ip) return;
        if (!map[ip]) {
            map[ip] = {
                ip,
                country: threat.country || "Unknown",
                attacks: 0,
                type: threat.type || "Attack",
                severity: threat.severity || "medium",
            };
        }
        map[ip].attacks += 1;
    });
    return Object.values(map).sort((a, b) => b.attacks - a.attacks).slice(0, 5);
}

/* ───────────────  SEVERITY & STATUS CONFIG  ─────────────── */
const sevConfig = {
    critical: { color: "text-rose-300", bg: "bg-rose-500/20", border: "border-rose-500/30", dot: "bg-rose-400" },
    high: { color: "text-orange-300", bg: "bg-orange-500/20", border: "border-orange-500/30", dot: "bg-orange-400" },
    medium: { color: "text-amber-300", bg: "bg-amber-500/20", border: "border-amber-500/30", dot: "bg-amber-400" },
};

const deviceTypeColors = {
    Router: { bg: "bg-violet-500/20", border: "border-violet-400/40", text: "text-violet-300", fill: "#8B5CF6" },
    Switch: { bg: "bg-blue-500/20", border: "border-blue-400/40", text: "text-blue-300", fill: "#3B82F6" },
    Gateway: { bg: "bg-cyan-500/20", border: "border-cyan-400/40", text: "text-cyan-300", fill: "#06B6D4" },
    Camera: { bg: "bg-rose-500/20", border: "border-rose-400/40", text: "text-rose-300", fill: "#F43F5E" },
    Sensor: { bg: "bg-emerald-500/20", border: "border-emerald-400/40", text: "text-emerald-300", fill: "#10B981" },
    Workstation: { bg: "bg-amber-500/20", border: "border-amber-400/40", text: "text-amber-300", fill: "#F59E0B" },
    Esp32: { bg: "bg-orange-500/20", border: "border-orange-400/40", text: "text-orange-300", fill: "#F97316" },
    Raspberry: { bg: "bg-green-500/20", border: "border-green-400/40", text: "text-green-300", fill: "#22C55E" },
    Servo: { bg: "bg-yellow-500/20", border: "border-yellow-400/40", text: "text-yellow-300", fill: "#EAB308" },
    "Humidity Sensor": { bg: "bg-teal-500/20", border: "border-teal-400/40", text: "text-teal-300", fill: "#14B8A6" },
};

/* ───────────────────  ICONS  ─────────────────── */
const icons = {
    wifi: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" /></svg>,
    shield: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>,
    bolt: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>,
    server: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Zm-3 6h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Z" /></svg>,
    scan: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg>,
    chart: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>,
    terminal: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>,
    triangle: <svg className="w-4 h-4 relative -top-[1px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5l-9 15h18l-9-15z" /></svg>
};

/* ───────────────────  WAVE CHART COMPONENT  ─────────────────── */
const WaveChart = ({ data, color, gradientFrom, gradientTo, label }) => {
    // Handle empty or invalid data
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col gap-2">
                <div className="flex justify-between text-[10px] items-end px-1">
                    <span className="font-mono text-white/50 tracking-white font-bold">{label}</span>
                    <span className="text-white font-mono leading-none flex items-center gap-1.5"><span className="text-[14px]">0.00</span> GB/s</span>
                </div>
                <div className="relative h-16 w-full pt-2 flex items-center justify-center">
                    <span className="text-white/20 text-xs font-mono">Loading...</span>
                </div>
            </div>
        );
    }

    const maxX = data.length - 1;
    const maxVal = Math.max(...data);
    const minVal = Math.min(...data);
    const range = maxVal - minVal || 1;

    const points = data.map((val, i) => {
        const x = (i / maxX) * 100;
        const y = 30 - ((val - minVal) / range) * 30;
        return `${x},${y}`;
    });

    const pathD = `M 0,${30 - ((data[0]-minVal)/range)*30} ` + points.map((p, i) => {
        if (i === 0) return "";
        const prev = points[i - 1].split(",");
        const curr = p.split(",");
        const cp1x = parseFloat(prev[0]) + (parseFloat(curr[0]) - parseFloat(prev[0])) / 2;
        return `C ${cp1x},${prev[1]} ${cp1x},${curr[1]} ${curr[0]},${curr[1]}`;
    }).join(" ");

    const areaD = `${pathD} L 100,30 L 0,30 Z`;

    const lastValue = data[data.length - 1] || 0;
    const cyValue = 30 - ((lastValue - minVal) / range) * 30;
    const displayValue = (lastValue * 0.02).toFixed(2);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between text-[10px] items-end px-1">
                <span className="font-mono text-white/50 tracking-white font-bold">{label}</span>
                <span className="text-white font-mono leading-none flex items-center gap-1.5"><span className="text-[14px]">{displayValue}</span> GB/s</span>
            </div>
            <div className="relative h-16 w-full pt-2">
                <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible preserve-aspect-ratio-none" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={gradientFrom} stopOpacity="0.4" />
                            <stop offset="100%" stopColor={gradientTo} stopOpacity="0.0" />
                        </linearGradient>
                    </defs>
                    <path d={areaD} fill={`url(#grad-${label})`} />
                    <path d={pathD} fill="none" stroke={color} strokeWidth="1.5" className="drop-shadow-[0_0_5px_currentColor]" />
                    <circle cx="100" cy={cyValue} r="2" fill={color} className="animate-pulse shadow-[0_0_10px_currentColor]" />
                </svg>
                <div className="absolute top-0 bottom-0 left-0 w-full overflow-hidden pointer-events-none opacity-20">
                    <div className="w-1 h-full bg-white animate-[slideRight_3s_linear_infinite]" style={{boxShadow: "0 0 15px 5px white"}}></div>
                </div>
            </div>
        </div>
    );
};

/* ───────────────────  COMPONENT  ─────────────────── */
export default function NetworkPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const highlightIp = searchParams.get('highlight_ip');
    const [scanActive, setScanActive] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    
    // Real data state from backend
    const [networkDevices, setNetworkDevices] = useState([]);
    const [topologyLinks, setTopologyLinks] = useState([]);
    const [suspiciousIPs, setSuspiciousIPs] = useState([]);
    const [networkLogs, setNetworkLogs] = useState([]);
    const [trafficData, setTrafficData] = useState({ incoming: [], outgoing: [] });
    const [stats, setStats] = useState({
        activeNodes: 0,
        detectedThreats: 0,
        avgBandwidth: 0,
        systemUptime: "99.9",
        totalPackets: 0,
        avgLatency: 0,
    });

    // Fetch topology data (nodes + links)
    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await fetchApiJson("/api/network/topology");
                if (data && data.nodes && data.links) {
                    // Transform backend nodes to frontend format
                    const nodes = data.nodes.map((node, idx) => ({
                        id: node.id || idx,
                        name: node.name,
                        type: node.type,
                        ip: node.ip,
                        mac: node.mac,
                        status: node.status,
                        threatScore: node.threat_score || 0,
                        lastActivity: node.last_activity || "Just now",
                        x: node.x,
                        y: node.y,
                    }));
                    setNetworkDevices(nodes);

                    // Transform backend links to frontend format
                    const links = data.links.map((link) => ({
                        id: link.id,
                        from: link.from,
                        to: link.to,
                        flows: link.flows,
                        suspicious: link.suspicious,
                    }));
                    setTopologyLinks(links);

                    // Update stats from backend
                    if (data.stats) {
                        setStats((prev) => ({
                            ...prev,
                            activeNodes: data.stats.total_nodes || 0,
                            detectedThreats: data.stats.suspicious_links || 0,
                            avgBandwidth: data.stats.avg_flow || 0,
                        }));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch topology:", error);
            }
        };
        fetch();
        const interval = setInterval(fetch, 5000);
        return () => clearInterval(interval);
    }, []);

    // Fetch traffic data
    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await fetchApiJson("/api/network/traffic");
                if (data && data.incoming && data.outgoing) {
                    setTrafficData({
                        incoming: data.incoming,
                        outgoing: data.outgoing,
                    });
                    if (data.avgBandwidth !== undefined) {
                        setStats((prev) => ({ ...prev, avgBandwidth: data.avgBandwidth }));
                    }
                    if (data.totalPacketsPerSec !== undefined) {
                        setStats((prev) => ({
                            ...prev,
                            totalPackets: data.totalPacketsPerSec,
                            avgLatency: data.avgLatencyMs || 0,
                        }));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch traffic:", error);
            }
        };
        fetch();
        const interval = setInterval(fetch, 5000);
        return () => clearInterval(interval);
    }, []);

    // Fetch network logs
    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await fetchApiJson("/api/network/logs?limit=10");
                if (Array.isArray(data) && data.length > 0) {
                    setNetworkLogs(data);
                }
            } catch (error) {
                console.error("Failed to fetch logs:", error);
            }
        };
        fetch();
        const interval = setInterval(fetch, 3000);
        return () => clearInterval(interval);
    }, []);

    // Fetch threat locations for suspicious IPs
    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await fetchApiJson("/api/threat-locations");
                if (Array.isArray(data)) {
                    const aggregated = aggregateThreatsByIP(data);
                    setSuspiciousIPs(aggregated);
                }
            } catch (error) {
                console.error("Failed to fetch threat locations:", error);
            }
        };
        fetch();
        const interval = setInterval(fetch, 10000);
        return () => clearInterval(interval);
    }, []);

    // WebSocket for real-time network updates (supplements polling)
    useEffect(() => {
        let socket;
        try {
            const wsBase = getWsBaseUrl();
            socket = new WebSocket(`${wsBase}/ws/network`);
            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.topology?.nodes) {
                        const nodes = data.topology.nodes.map((node, idx) => ({
                            id: node.id || idx, name: node.name, type: node.type,
                            ip: node.ip, mac: node.mac, status: node.status,
                            threatScore: node.threat_score || 0,
                            lastActivity: node.last_activity || "Just now",
                            x: node.x, y: node.y,
                        }));
                        setNetworkDevices(nodes);
                        if (data.topology.links) setTopologyLinks(data.topology.links);
                        if (data.topology.stats) {
                            setStats(prev => ({
                                ...prev,
                                activeNodes: data.topology.stats.total_nodes || 0,
                                detectedThreats: data.topology.stats.suspicious_links || 0,
                            }));
                        }
                    }
                    if (data.traffic) {
                        setTrafficData({ incoming: data.traffic.incoming || [], outgoing: data.traffic.outgoing || [] });
                        if (data.traffic.totalPacketsPerSec !== undefined) {
                            setStats(prev => ({
                                ...prev,
                                totalPackets: data.traffic.totalPacketsPerSec,
                                avgLatency: data.traffic.avgLatencyMs || 0,
                                avgBandwidth: data.traffic.avgBandwidth || 0,
                            }));
                        }
                    }
                    if (data.logs) setNetworkLogs(data.logs);
                } catch (e) { /* ignore parse errors */ }
            };
        } catch (e) { /* WebSocket not available, polling handles it */ }
        return () => { if (socket) socket.close(); };
    }, []);

    const cV = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const iV = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20 } } };

    return (
        <div className="min-h-screen w-full bg-[#030308] text-white relative overflow-x-hidden pt-28 pb-16 px-4 md:px-8 xl:px-12 flex justify-center font-sans tracking-wide">
            <div className="absolute inset-0 z-0 opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='69.282' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 17.32l-20 11.547L0 17.32V0h40v17.32zm0 34.64l-20 11.548L0 51.96V34.64l20 11.548 20-11.548v17.32z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }}></div>

            <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-violet-600 opacity-[0.04] blur-[150px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-cyan-600 opacity-[0.05] blur-[150px] rounded-full pointer-events-none"></div>

            <motion.div className="w-full max-w-[1400px] z-10 flex flex-col gap-6" variants={cV} initial="hidden" animate="show">
                <motion.div variants={iV} className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-4">
                    <div>
                        <div className="flex items-center gap-3">
                            {icons.server}
                            <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 text-transparent bg-clip-text">NETWORK_TOPOLOGY</h1>
                        </div>
                        <p className="text-white/40 text-xs font-mono uppercase tracking-[0.2em] mt-2 border-l border-emerald-500 pl-3 ml-1 block">Live Traffic & Packet Inspection</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-r-[20px] rounded-l-[5px]">
                        <div className="w-3 h-3 rounded-[2px] bg-emerald-500 animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_10px_#10B981]"></div>
                        <span className="text-emerald-400 font-mono text-[10px] font-bold tracking-widest uppercase">Connection Status: Optimal</span>
                    </div>
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: "Active Nodes", val: stats.activeNodes.toString(), sub: "Connected", icon: icons.wifi, grad: "from-[#06B6D4] to-[#0891B2]", color: "text-cyan-400", hex: "#06B6D4" },
                        { label: "Detected Threats", val: stats.detectedThreats.toString(), sub: "Isolating...", icon: icons.shield, grad: "from-[#F43F5E] to-[#BE123C]", color: "text-rose-400", hex: "#F43F5E" },
                        { label: "Avg Bandwidth", val: stats.avgBandwidth.toFixed(1), sub: "GB/s", icon: icons.bolt, grad: "from-[#8B5CF6] to-[#6D28D9]", color: "text-violet-400", hex: "#8B5CF6" },
                        { label: "System Uptime", val: stats.systemUptime, sub: "% (14d)", icon: icons.server, grad: "from-[#10B981] to-[#047857]", color: "text-emerald-400", hex: "#10B981" },
                    ].map((card, i) => (
                        <motion.div key={i} variants={iV} className="relative overflow-hidden p-[1px] bg-white/10 group cursor-default" style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}>
                            <div className="absolute inset-0 bg-gradient-to-br opacity-50 transition-opacity duration-500 group-hover:opacity-100" style={{ backgroundImage: `linear-gradient(to bottom right, ${card.hex}33, transparent)` }}></div>
                            <div className="h-full bg-black/80 backdrop-blur-sm p-5 flex flex-col justify-between" style={{ clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)" }}>
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`text-[9px] font-mono tracking-[0.15em] uppercase font-bold ${card.color}`}>{card.label}</span>
                                    <div className="opacity-50">{card.icon}</div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-white">{card.val}</span>
                                    <span className="text-[10px] text-white/40 font-mono uppercase">{card.sub}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <motion.div variants={iV} className="lg:col-span-2 border border-white/10 bg-black/40 relative overflow-hidden flex flex-col min-h-[450px]">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-[3px] border-l-[3px] border-cyan-500/50 -mt-[1px] -ml-[1px]"></div>
                        <div className="px-5 py-4 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <span className="text-cyan-400">{icons.scan}</span>
                                <span className="text-white font-mono text-sm tracking-[0.15em] font-bold">TOPOLOGY_MAP</span>
                            </div>
                            <div className="flex gap-4">
                                <span className="flex items-center gap-2 text-[10px] font-mono text-white/50"><div className="w-2 h-[2px] bg-[#3B82F6]"></div> Standard</span>
                                <span className="flex items-center gap-2 text-[10px] font-mono text-white/50"><div className="w-2 h-[2px] bg-[#F43F5E] border-dashed text-transparent">--</div> Suspicious</span>
                                <span className="flex items-center gap-2 text-[10px] font-mono text-white/50"><div className="w-3 h-3 rounded-full bg-[#22C55E]"></div> RPi</span>
                                <span className="flex items-center gap-2 text-[10px] font-mono text-white/50"><div className="w-3 h-3 rounded-full bg-[#F97316]"></div> ESP32</span>
                            </div>
                        </div>

                        <div className="flex-1 relative w-full h-full bg-[#050510] overflow-hidden">
                            <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                                <defs><pattern id="tgrid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M 50 0 L 0 0 0 50" fill="none" stroke="#00FFFF" strokeWidth="0.5"/></pattern></defs>
                                <rect width="100%" height="100%" fill="url(#tgrid)" />
                            </svg>

                            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                                {topologyLinks.map((link) => {
                                    const from = networkDevices.find(d => d.id === link.from);
                                    const to = networkDevices.find(d => d.id === link.to);
                                    if (!from || !to) return null;

                                    const strokeColor = link.suspicious ? "#F43F5E" : "#3B82F6";
                                    const pathD = `M ${from.x} ${from.y} C ${from.x} ${(from.y+to.y)/2}, ${to.x} ${(from.y+to.y)/2}, ${to.x} ${to.y}`;

                                    return (
                                        <g key={link.id}>
                                            <path id={`path-${link.id}`} d={pathD} fill="none" stroke={strokeColor} strokeWidth="1.2" strokeDasharray={link.suspicious ? "3 3" : "none"} opacity={link.suspicious ? 0.8 : 0.4} />
                                            {Array.from({length: Math.max(1, link.flows)}).map((_, i) => (
                                                <circle key={i} r="1.5" fill={strokeColor} className={link.suspicious ? "shadow-[0_0_8px_#F43F5E]" : "shadow-[0_0_8px_#3B82F6]"}>
                                                    <animateMotion dur={`${2 + Math.random()}s`} repeatCount="indefinite" begin={`${i * 0.5}s`}>
                                                        <mpath href={`#path-${link.id}`} />
                                                    </animateMotion>
                                                </circle>
                                            ))}
                                        </g>
                                    );
                                })}
                            </svg>

                            {networkDevices.map((device) => {
                                const cfg = deviceTypeColors[device.type] || { bg: "bg-gray-500/20", border: "border-gray-400/40", text: "text-gray-300", fill: "#6B7280" };
                                const isThreat = device.threatScore > 30;
                                const isEsp32 = (device.type || '').toLowerCase() === 'esp32';
                                const isRaspberry = (device.type || '').toLowerCase() === 'raspberry';
                                const isSubDevice = (device.type || '').toLowerCase().includes('servo') || (device.type || '').toLowerCase().includes('humidity');
                                const nodeSize = isSubDevice ? 'w-14 h-14 p-2' : 'w-20 h-20 p-3';
                                const typeLabel = isEsp32 ? 'E' : isRaspberry ? 'R' : isSubDevice ? (device.type || 'U').charAt(0).toUpperCase() : (device.type || 'U').charAt(0).toUpperCase();
                                return (
                                    <motion.div key={device.id} className="absolute cursor-pointer flex flex-col items-center group/node z-20"
                                        style={{ left: `${device.x}%`, top: `${device.y}%` }}
                                        initial={{ x: "-50%", y: "-50%", scale: 1 }}
                                        animate={{ x: "-50%", y: "-50%", scale: 1 }}
                                        whileHover={{ x: "-50%", y: "-50%", scale: 1.15 }}
                                        onClick={() => router.push(`/devices?filter=${encodeURIComponent(device.name)}`)}>
                                        <div className={`relative flex items-center justify-center ${nodeSize} rounded-xl border-2 ${cfg.bg} ${cfg.border} backdrop-blur-md ${isThreat ? 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]' : ''} ${isEsp32 ? 'shadow-[0_0_10px_rgba(249,115,22,0.3)]' : ''} ${isRaspberry ? 'shadow-[0_0_10px_rgba(34,197,94,0.3)]' : ''} hover:border-cyan-400/60 transition-colors`}>
                                            {isThreat && <div className="absolute inset-0 border-2 border-rose-500/80 animate-ping rounded-xl"></div>}
                                            {(isEsp32 || isRaspberry) && <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_#10B981]"></div>}
                                            <span className={`text-2xl font-black ${isSubDevice ? 'text-lg' : ''} text-white mix-blend-overlay`}>{typeLabel}</span>
                                            {device.status === 'offline' && <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-xs font-mono text-white/70">OFF</div>}
                                        </div>
                                        <div className="mt-1 flex flex-col items-center bg-black/80 px-4 py-2 rounded-xl border border-white/20 shadow-lg group-hover/node:border-cyan-400/30 transition-colors">
                                            <span className={`${isSubDevice ? 'text-xs' : 'text-sm'} font-mono text-white tracking-wide font-bold whitespace-nowrap group-hover/node:text-cyan-300`}>{device.name}</span>
                                            {(isEsp32 || isRaspberry) && <span className="text-[11px] font-mono font-bold text-emerald-400/70 uppercase tracking-widest">{device.ip}</span>}
                                            {isThreat && !isEsp32 && !isRaspberry && <span className="text-[11px] font-mono font-bold text-rose-400 uppercase font-bold tracking-widest">{device.ip}</span>}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </motion.div>

                    <motion.div variants={iV} className="border border-white/10 bg-black/40 flex flex-col">
                        <div className="px-5 py-4 border-b border-white/10 bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <span className="text-violet-400">{icons.chart}</span>
                                <span className="text-white font-mono text-sm tracking-[0.15em] font-bold">FLOW_ANALYTICS</span>
                            </div>
                        </div>
                        <div className="p-5 flex flex-col gap-6 flex-1 justify-center">
                            <WaveChart data={trafficData.incoming} color="#06B6D4" gradientFrom="#06B6D4" gradientTo="#0891B2" label="[IN_BOUND]" />
                            <WaveChart data={trafficData.outgoing} color="#8B5CF6" gradientFrom="#8B5CF6" gradientTo="#6D28D9" label="[OUT_BOUND]" />

                            <div className="grid grid-cols-2 gap-3 mt-2">
                                <div className="bg-white/5 border border-white/10 p-3 flex flex-col items-end">
                                    <span className="text-[9px] font-mono uppercase text-white/40 mb-1">Total Packets</span>
                                    <span className="font-mono text-lg font-bold">{stats.totalPackets.toFixed ? stats.totalPackets.toFixed(1) : stats.totalPackets}<span className="text-xs text-white/50">K/s</span></span>
                                </div>
                                <div className="bg-white/5 border border-white/10 p-3 flex flex-col items-end">
                                    <span className="text-[9px] font-mono uppercase text-white/40 mb-1">Latency avg</span>
                                    <span className="font-mono text-lg font-bold">{stats.avgLatency.toFixed ? stats.avgLatency.toFixed(1) : stats.avgLatency}<span className="text-xs text-white/50">ms</span></span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-8">
                    <motion.div variants={iV} className="border border-rose-500/20 bg-[#110505] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-full h-[1px] bg-gradient-to-l from-rose-500 to-transparent"></div>
                        <div className="px-5 py-3 border-b border-rose-500/20 flex justify-between items-center">
                            <span className="text-rose-400 font-mono text-xs font-bold tracking-[0.15em] flex items-center gap-2"><div className="w-1.5 h-1.5 bg-rose-500 animate-pulse"></div> TARGETED_IPS</span>
                        </div>
                        <div className="p-4 flex flex-col gap-2">
                            {suspiciousIPs.map((ip, i) => (
                                <div key={i} className={`flex flex-col sm:flex-row justify-between sm:items-center p-3 border transition-colors group cursor-pointer ${
                                    highlightIp === ip.ip 
                                        ? 'border-rose-400/50 bg-rose-500/[0.15] shadow-[0_0_15px_rgba(244,63,94,0.3)]' 
                                        : 'border-rose-500/10 bg-rose-500/[0.02] hover:bg-rose-500/[0.05]'
                                }`}
                                     onClick={() => router.push(`/threats?source_ip=${encodeURIComponent(ip.ip)}`)}>
                                    <div className="flex gap-4 items-center">
                                        <div className="text-3xl opacity-20 group-hover:opacity-40 transition-opacity">{icons.triangle}</div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-rose-400 group-hover:text-rose-300 transition-colors">{ip.ip}</span>
                                                <span className="text-[9px] px-1.5 py-0.5 bg-black border border-rose-500/50 text-rose-400 uppercase font-black">{ip.type}</span>
                                            </div>
                                            <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest">{ip.country}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:items-end mt-2 sm:mt-0">
                                        <span className="font-mono text-rose-300 font-bold">{ip.attacks}</span>
                                        <span className="text-[9px] text-rose-500/50 uppercase">Registered Hits</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div variants={iV} className="border border-white/10 bg-black/60 relative p-5 flex flex-col">
                        <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
                            <span className="text-cyan-400">{icons.terminal}</span>
                            <span className="text-white font-mono text-xs font-bold tracking-[0.15em]">SYS_CONSOLE</span>
                            <div className="ml-auto flex gap-2">
                                <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-auto pr-2 custom-scrollbar font-mono text-[11px] leading-relaxed flex flex-col gap-1.5">
                            {networkLogs.map((log, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <span className="text-white/20 shrink-0 select-none">[{log.time}]</span>
                                    <span className={`shrink-0 lowercase select-none ${log.type === 'security' ? 'text-rose-400' : log.type === 'ai' ? 'text-violet-400' : 'text-cyan-400'}`}>~/{log.type} $</span>
                                    <span className={log.type === 'security' ? 'text-white/80' : 'text-white/60'}>{log.msg}</span>
                                </div>
                            ))}
                            <div className="flex items-start gap-3 mt-2">
                                <span className="text-white/20 font-mono" suppressHydrationWarning>[{liveTimeText()}]</span>
                                <span className="text-emerald-400 lowercase">~/sys   $</span>
                                <span className="w-2 h-3 bg-emerald-400 animate-pulse inline-block"></span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}

function liveTimeText() {
    const d = new Date();
    return d.toLocaleTimeString("en-GB", { hour12: false });
}
