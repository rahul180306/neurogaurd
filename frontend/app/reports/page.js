"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { fetchApiJson, fetchApi, getWsBaseUrl } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

const icons = {
    pdf: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>,
    csv: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5" /></svg>,
    json: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" /></svg>,
    download: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>,
    chart: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" /></svg>,
    radar: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672Zm-7.518-.267A8.25 8.25 0 1 1 20.25 10.5M8.288 14.212A5.25 5.25 0 1 1 17.25 10.5" /></svg>,
    terminal: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m6.75 7.5 3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0 0 21 18V6a2.25 2.25 0 0 0-2.25-2.25H5.25A2.25 2.25 0 0 0 3 6v12a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>,
    network: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" /></svg>,
    cpu: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 0 0 2.25-2.25V6.75a2.25 2.25 0 0 0-2.25-2.25H6.75A2.25 2.25 0 0 0 4.5 6.75v10.5a2.25 2.25 0 0 0 2.25 2.25Zm.75-12h9v9h-9v-9Z" /></svg>,
};

const RadarChart = () => {
    const data = [0.9, 0.7, 0.85, 0.6, 0.95];
    const points = data.map((val, i) => {
        const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
        return `${50 + Math.cos(angle) * 40 * val},${50 + Math.sin(angle) * 40 * val}`;
    }).join(" ");

    const bgPoints = [1, 0.8, 0.6, 0.4].map(scale => {
        return Array.from({length: 5}).map((_, i) => {
            const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
            return `${50 + Math.cos(angle) * 40 * scale},${50 + Math.sin(angle) * 40 * scale}`;
        }).join(" ");
    });

    return (
        <svg viewBox="0 0 100 100" className="w-full h-full transform group-hover:scale-110 transition-transform duration-500 overflow-visible">
            {bgPoints.map((pts, i) => (
                <polygon key={i} points={pts} fill="none" stroke="#10B981" strokeWidth="0.5" strokeOpacity={0.2} />
            ))}
            {Array.from({length: 5}).map((_, i) => {
                const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                return <line key={i} x1="50" y1="50" x2={50 + Math.cos(angle) * 40} y2={50 + Math.sin(angle) * 40} stroke="#10B981" strokeWidth="0.5" strokeOpacity={0.2} />;
            })}

            <polygon points={points} fill="rgba(16, 185, 129, 0.2)" stroke="#10B981" strokeWidth="1.5" className="filter drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />

            {data.map((val, i) => {
                const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                return <circle key={i} cx={50 + Math.cos(angle) * 40 * val} cy={50 + Math.sin(angle) * 40 * val} r="2" fill="#34D399" className="animate-pulse shadow-[0_0_5px_#34D399]" />;
            })}

            <text x="50" y="5" fill="#6EE7B7" fontSize="5" textAnchor="middle" className="font-mono uppercase mix-blend-screen">Firewall</text>
            <text x="95" y="40" fill="#6EE7B7" fontSize="5" textAnchor="start" className="font-mono uppercase opacity-70">EnDPT</text>
            <text x="85" y="95" fill="#6EE7B7" fontSize="5" textAnchor="start" className="font-mono uppercase opacity-70">NET</text>
            <text x="15" y="95" fill="#6EE7B7" fontSize="5" textAnchor="end" className="font-mono uppercase opacity-70">IDAM</text>
            <text x="5" y="40" fill="#6EE7B7" fontSize="5" textAnchor="end" className="font-mono uppercase opacity-70">COMPLY</text>
        </svg>
    );
};

const DonutChart = ({ percentage, colorHex }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative w-24 h-24 flex items-center justify-center filter drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] group-hover:drop-shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all">
            <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-white/5" />
                <motion.circle cx="50" cy="50" r={radius} stroke={colorHex} strokeWidth="6" fill="transparent"
                    strokeDasharray={circumference} strokeDashoffset={circumference}
                    animate={{ strokeDashoffset }} transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeLinecap="round" />
            </svg>
            <div className="absolute flex flex-col items-center">
                <span className="text-xl font-black">{percentage}</span>
                <span className="text-[8px] font-mono text-white/50">/100</span>
            </div>
        </div>
    );
};

export default function ReportsPage() {
    const router = useRouter();
    const [timeRange, setTimeRange] = useState("Weekly");
    const [generating, setGenerating] = useState(false);
    const [lastReportId, setLastReportId] = useState(null);

    // ── Live data state ───────────────────────────────────────────────────────
    const [summaryStats, setSummaryStats] = useState({
        totalThreats: 0, blockedIPs: 0, devicesMonitored: 0,
        criticalIncidents: 0, complianceScore: 0,
    });
    const [topAttacks, setTopAttacks]         = useState([]);
    const [targetedDevices, setTargetedDevices] = useState([]);
    const [topAttackerIPs, setTopAttackerIPs] = useState([]);
    const [networkActivity, setNetworkActivity] = useState({
        totalTraffic: "0 MB", dataUsage: { in: "0 MB", out: "0 MB" },
        connections: "0", suspicious: 0,
        heatMapData: Array.from({ length: 42 }, () => 0),
    });
    const [deviceSummary, setDeviceSummary]   = useState({ total: 0, healthy: 0, vulnerable: 0, investigating: 0, blocked: 0 });
    const [aiInsights, setAiInsights]         = useState({
        summary: "Initializing AI analysis engine…", riskAnalysis: "Analyzing threat vectors…", patterns: [], improvements: [],
    });
    const [reportHistory, setReportHistory]   = useState([]);
    const [auditLogs, setAuditLogs]           = useState([]);

    // ── Data fetching ─────────────────────────────────────────────────────────
    useEffect(() => {
        const loadData = async () => {
            try {
                const [summary, attacks, targets, attackers, network, devices, logs, history] =
                    await Promise.all([
                        fetchApiJson(`/api/report/summary?timeRange=${timeRange}`,   { cache: "no-store" }),
                        fetchApiJson(`/api/report/attacks?timeRange=${timeRange}`,   { cache: "no-store" }),
                        fetchApiJson(`/api/report/targets?timeRange=${timeRange}`,   { cache: "no-store" }),
                        fetchApiJson(`/api/report/attackers?timeRange=${timeRange}`, { cache: "no-store" }),
                        fetchApiJson(`/api/report/network?timeRange=${timeRange}`,   { cache: "no-store" }),
                        fetchApiJson("/api/report/devices",                          { cache: "no-store" }),
                        fetchApiJson("/api/report/logs?limit=20",                    { cache: "no-store" }),
                        fetchApiJson("/api/report/history?limit=3",                  { cache: "no-store" }),
                    ]);
                setSummaryStats(summary);
                setTopAttacks(attacks);
                setTargetedDevices(targets);
                setTopAttackerIPs(attackers);
                setNetworkActivity(network);
                setDeviceSummary(devices);
                setAuditLogs(logs);
                setReportHistory(history);
            } catch (e) {
                console.error("Reports data load failed:", e);
            }
        };
        loadData();
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, [timeRange]);

    // AI insights fetch separately (may be slower)
    useEffect(() => {
        fetchApiJson(`/api/report/ai?timeRange=${timeRange}`, { cache: "no-store" })
            .then(setAiInsights)
            .catch(e => console.error("AI insights failed:", e));
    }, [timeRange]);

    // ── WebSocket real-time updates (supplements polling) ───────────────────
    useEffect(() => {
        let ws;
        try {
            const wsBase = getWsBaseUrl();
            ws = new WebSocket(`${wsBase}/ws/reports`);
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.summary) setSummaryStats(data.summary);
                    if (data.attacks) setTopAttacks(data.attacks);
                    if (data.targets) setTargetedDevices(data.targets);
                    if (data.attackers) setTopAttackerIPs(data.attackers);
                    if (data.network) setNetworkActivity(data.network);
                    if (data.devices) setDeviceSummary(data.devices);
                    if (data.logs) setAuditLogs(data.logs);
                    if (data.history) setReportHistory(data.history);
                } catch (e) {
                    console.error("Reports WS parse error:", e);
                }
            };
            ws.onerror = () => console.warn("Reports WebSocket error — polling fallback active");
        } catch (e) {
            console.warn("Reports WebSocket unavailable:", e);
        }
        return () => { if (ws) ws.close(); };
    }, []);

    // ── Actions ───────────────────────────────────────────────────────────────
    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const result = await fetchApiJson(`/api/report/generate?timeRange=${timeRange}`, { method: "POST", cache: "no-store" });
            setLastReportId(result.id);
            const history = await fetchApiJson("/api/report/history?limit=3", { cache: "no-store" });
            setReportHistory(history);
        } catch (e) {
            console.error("Report generation failed:", e);
        } finally {
            setGenerating(false);
        }
    };

    const handleExport = async (fmt) => {
        try {
            const qs = lastReportId
                ? `?report_id=${lastReportId}&timeRange=${timeRange}`
                : `?timeRange=${timeRange}`;
            const response = await fetchApi(`/api/report/export/${fmt.toLowerCase()}${qs}`);
            if (!response.ok) {
                throw new Error(`Export failed with status ${response.status}`);
            }
            const blob = await response.blob();
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement("a");
            a.href     = url;
            a.download = `neurogaurd-report-${new Date().toISOString().slice(0, 10)}.${fmt.toLowerCase()}`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Export failed:", e);
        }
    };

    const cV = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const iV = { hidden: { opacity: 0, scale: 0.96, y: 20 }, show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 200, damping: 20 } } };

    return (
        <div className="min-h-screen w-full bg-[#02050D] text-white relative overflow-x-hidden pt-28 pb-16 px-4 md:px-8 xl:px-12 flex justify-center font-sans tracking-wide selection:bg-emerald-500/30">
            <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`, backgroundSize: '40px 40px', transform: 'perspective(1000px) rotateX(60deg) scale(2.5) translateY(-10%)', transformOrigin: 'top center' }}></div>

            <div className="absolute top-0 right-1/4 w-[70vw] h-[70vw] bg-emerald-700 opacity-[0.03] blur-[150px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-1/4 w-[70vw] h-[70vw] bg-violet-700 opacity-[0.03] blur-[150px] rounded-full pointer-events-none"></div>

            <motion.div className="w-full max-w-[1500px] z-10 flex flex-col gap-8" variants={cV} initial="hidden" animate="show">
                <motion.div variants={iV} className="relative bg-black/40 border border-white/10 p-6 xl:p-8 overflow-hidden backdrop-blur-xl" style={{ clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)" }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent"></div>
                    <div className="absolute top-0 bottom-0 left-0 w-full overflow-hidden pointer-events-none opacity-20">
                        <div className="w-[150%] h-[2px] bg-emerald-400 rotate-12 animate-[slideRight_6s_linear_infinite]" style={{boxShadow: "0 0 20px 5px #10B981"}}></div>
                    </div>

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                        <div className="flex gap-6 items-center">
                            <div className="w-20 h-20 shrink-0 border border-emerald-500/30 rounded-full flex items-center justify-center relative bg-emerald-500/5 shadow-[0_0_30px_rgba(16,185,129,0.15)] group">
                                <div className="absolute w-full h-full border-2 border-t-emerald-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-[spin_4s_linear_infinite]"></div>
                                <div className="absolute w-3/4 h-3/4 border border-b-emerald-300 border-t-transparent border-r-transparent border-l-transparent rounded-full animate-[spin_3s_linear_infinite_reverse]"></div>
                                <span className="text-emerald-400 font-bold group-hover:scale-110 transition-transform">RPT</span>
                            </div>
                            <div>
                                <h1 className="text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200 tracking-tight uppercase uppercase">Security Intelligence</h1>
                                <div className="flex items-center gap-3 mt-3">
                                    <span className="text-emerald-400 border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono tracking-widest uppercase shadow-[0_0_10px_rgba(16,185,129,0.2)]">Global_Metrics</span>
                                    <span className="text-white/30 text-[10px] font-mono uppercase bg-white/5 px-2 border border-white/10">v9.2.4 Analytics</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex bg-black/60 border border-white/10 p-1 rounded">
                                {["Daily", "Weekly", "Monthly", "Custom"].map(t => (
                                    <button key={t} onClick={() => setTimeRange(t)}
                                        className={`px-6 py-2 text-xs font-mono uppercase tracking-widest transition-all rounded ${timeRange === t ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'text-white/40 hover:text-white/80 hover:bg-white/5 border border-transparent'}`}>
                                        {t}
                                    </button>
                                ))}
                            </div>

                            <div className="flex gap-4">
                                <button onClick={handleGenerate} disabled={generating}
                                    className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 border font-mono text-xs uppercase font-black tracking-widest transition-all relative overflow-hidden group ${
                                        generating
                                        ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
                                        : "border-emerald-500/50 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-400 hover:text-black hover:shadow-[0_0_30px_#34D399]"
                                    }`}>
                                    {generating && <div className="absolute inset-0 bg-emerald-400/20 animate-pulse"></div>}
                                    {generating ? <span className="w-4 h-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin"></span> : icons.download}
                                    {generating ? "Compiling Matrix..." : "Gen_Master_Report"}
                                </button>
                                <div className="flex gap-2">
                                    {["PDF", "CSV", "JSON"].map(fmt => (
                                        <button key={fmt} onClick={() => handleExport(fmt === "PDF" ? "json" : fmt)}
                                            className="w-12 h-12 flex items-center justify-center border border-white/10 bg-black/60 text-white/40 hover:bg-emerald-500 hover:text-black hover:border-emerald-400 transition-colors font-mono text-[10px] font-black uppercase">
                                            {fmt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    <motion.div variants={iV} className="lg:col-span-2 border border-emerald-500/30 bg-[#061B14] p-6 relative overflow-hidden group flex items-center gap-6">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1)_0,transparent_100%)] pointer-events-none"></div>
                        <div className="w-1/2 flex flex-col items-center gap-4 z-10">
                            <span className="text-emerald-400 font-mono text-[10px] uppercase tracking-widest font-bold">Resilience_Matrix</span>
                            <div className="w-32 h-32 relative">
                                <RadarChart />
                            </div>
                        </div>
                        <div className="w-[1px] h-full bg-gradient-to-b from-transparent via-emerald-500/20 to-transparent"></div>
                        <div className="w-1/2 flex flex-col items-center gap-4 z-10">
                            <span className="text-emerald-400 font-mono text-[10px] uppercase tracking-widest font-bold">System_Compliance</span>
                            <DonutChart percentage={summaryStats?.complianceScore ?? 0} colorHex="#10B981" />
                        </div>
                    </motion.div>

                    <motion.div variants={iV} className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { title: "Threats Mitigated",  val: summaryStats?.totalThreats      ?? 0, sub: "From MongoDB",      color: "emerald" },
                            { title: "Blacklisted IPs",    val: summaryStats?.blockedIPs         ?? 0, sub: "Auto-Routed",       color: "rose" },
                            { title: "Critical Incidents", val: summaryStats?.criticalIncidents  ?? 0, sub: "Requires Action",   color: "amber" },
                        ].map((s, i) => (
                            <div key={i} className={`border border-${s.color}-500/20 bg-black/40 p-5 flex flex-col justify-between relative overflow-hidden group hover:bg-${s.color}-900/10 transition-colors`}>
                                <div className={`absolute -right-10 -top-10 w-24 h-24 bg-${s.color}-500/10 blur-2xl rounded-full group-hover:bg-${s.color}-500/20 transition-colors`}></div>
                                <span className="text-white/40 font-mono text-[10px] uppercase tracking-widest z-10 block pb-2 border-b border-white/5 mb-4">{s.title}</span>
                                <div>
                                    <span className="text-5xl font-black text-white relative z-10 tracking-tighter drop-shadow-md">{s.val}</span>
                                    <span className={`text-${s.color}-400 font-mono text-[10px] uppercase block mt-2 font-bold`}>{s.sub}</span>
                                </div>
                                <div className="absolute bottom-0 left-0 h-1 w-full bg-white/5"><div className={`h-full bg-${s.color}-500 shadow-[0_0_10px_currentColor] w-[70%]`}></div></div>
                            </div>
                        ))}
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <motion.div variants={iV} className="border border-white/10 bg-black/60 backdrop-blur-md relative overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="text-rose-400 bg-rose-500/10 p-1.5 border border-rose-500/20">{icons.chart}</div>
                                <span className="font-mono text-sm uppercase font-bold tracking-widest text-white/90">Attack_Vectors</span>
                            </div>
                            <span className="text-rose-400 font-mono text-[9px] uppercase border border-rose-500/30 px-2 pb-0.5 animate-pulse">Live Tracking</span>
                        </div>

                        <div className="p-6 flex flex-col gap-8">
                            <div className="flex flex-col gap-5">
                                {(topAttacks.length ? topAttacks : [
                                    { type: "Analyzing threats…", count: 0, percentage: 0, color: "slate", hex: "#64748B" }
                                ]).map((atk, i) => (
                                    <div key={i} className="flex flex-col gap-2">
                                        <div className="flex justify-between items-end font-mono">
                                            <span className="text-white/80 uppercase text-xs font-bold tracking-wide flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-sm bg-${atk.color}-500`}></div>{atk.type}
                                            </span>
                                            <span className={`text-${atk.color}-400 text-xs font-black`}>{atk.count} <span className="text-white/30 font-normal">({atk.percentage}%)</span></span>
                                        </div>
                                        <div className="h-2 w-full bg-[#111] overflow-hidden rounded-sm border border-white/5">
                                            <motion.div initial={{ width: 0 }} animate={{ width: `${atk.percentage}%` }} transition={{ duration: 1.5, delay: i*0.1, ease: "easeOut" }}
                                                className={`h-full bg-${atk.color}-500 shadow-[0_0_10px_currentColor]`}></motion.div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-black/80 border border-white/5 p-4 flex flex-col">
                                    <span className="text-[10px] font-mono text-fuchsia-400 uppercase tracking-widest mb-3 border-l-2 border-fuchsia-500 pl-2">Top Origin IPs</span>
                                    {(topAttackerIPs.length ? topAttackerIPs : [
                                        { ip: "Scanning…", country: "—", hits: 0 }
                                    ]).map((ip, i) => (
                                        <div key={i} className={`flex justify-between items-center py-2 border-b border-white/5 last:border-0 group ${
                                            topAttackerIPs.length > 0 ? 'hover:bg-white/[0.02] cursor-pointer' : 'opacity-50'
                                        }`}
                                             onClick={() => topAttackerIPs.length > 0 && router.push(`/network?highlight_ip=${encodeURIComponent(ip.ip)}`)}>
                                            <span className={`text-xs font-mono ${topAttackerIPs.length > 0 ? 'text-rose-400 group-hover:text-rose-300 transition-colors' : 'text-white/40'}`}>
                                                {ip.ip} <span className="text-[8px] bg-white/10 px-1 text-white/50">{ip.country}</span>
                                            </span>
                                            <span className="text-fuchsia-400 font-mono text-[10px]">{ip.hits}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-black/80 border border-white/5 p-4 flex flex-col">
                                    <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest mb-3 border-l-2 border-emerald-500 pl-2">Target Assets</span>
                                    {(targetedDevices.length ? targetedDevices : [
                                        { name: "Identifying targets…", hits: 0 }
                                    ]).map((d, i) => (
                                        <div key={i} className={`flex justify-between items-center py-2 border-b border-white/5 last:border-0 group ${
                                            targetedDevices.length > 0 ? 'hover:bg-white/[0.02] cursor-pointer' : 'opacity-50'
                                        }`}
                                             onClick={() => targetedDevices.length > 0 && router.push(`/devices?filter=${encodeURIComponent(d.name)}`)}>
                                            <span className={`text-xs truncate mr-2 ${
                                                targetedDevices.length > 0 ? 'text-cyan-400 group-hover:text-cyan-300 transition-colors' : 'text-white/40'
                                            }`}>{d.name}</span>
                                            <span className="text-emerald-400 font-mono text-[10px] shrink-0">{d.hits}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <div className="flex flex-col gap-6">
                        <motion.div variants={iV} className="flex-1 border border-white/10 bg-black/60 backdrop-blur-md flex flex-col">
                            <div className="px-6 py-4 border-b border-white/10 flex items-center gap-3">
                                <div className="text-cyan-400 bg-cyan-500/10 p-1.5 border border-cyan-500/20">{icons.network}</div>
                                <span className="font-mono text-sm uppercase font-bold tracking-widest text-white/90">Bandwidth_&_Flow</span>
                            </div>
                            <div className="p-6 flex flex-col gap-6 justify-center flex-1">
                                <div className="flex gap-4">
                                    <div className="flex-1 bg-cyan-500/5 border border-cyan-500/20 p-4 flex flex-col relative overflow-hidden">
                                        <div className="absolute right-0 top-0 text-5xl opacity-[0.03] pointer-events-none mt-2 mr-2 font-black">IN</div>
                                        <span className="text-[10px] font-mono text-cyan-400 uppercase mb-1">Inbound Traffic</span>
                                        <span className="text-3xl font-black text-white">{networkActivity?.dataUsage?.in ?? "—"}</span>
                                    </div>
                                    <div className="flex-1 bg-violet-500/5 border border-violet-500/20 p-4 flex flex-col relative overflow-hidden">
                                        <div className="absolute right-0 top-0 text-5xl opacity-[0.03] pointer-events-none mt-2 mr-2 font-black">OUT</div>
                                        <span className="text-[10px] font-mono text-violet-400 uppercase mb-1">Outbound Traffic</span>
                                        <span className="text-3xl font-black text-white">{networkActivity?.dataUsage?.out ?? "—"}</span>
                                    </div>
                                </div>

                                <div>
                                    <span className="text-[10px] font-mono text-white/40 uppercase mb-3 block">High-Density Traffic Grid</span>
                                    <div className="grid grid-cols-14 gap-1 w-full" style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}>
                                        {(networkActivity?.heatMapData ?? Array(42).fill(0)).map((val, i) => (
                                            <div key={i} className="h-6 rounded-[1px] transition-all hover:scale-125"
                                                 style={{ backgroundColor: `rgba(6, 182, 212, ${Math.max(0.1, val/100)})`, boxShadow: val > 80 ? `0 0 8px rgba(6,182,212,0.5)` : 'none' }}>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={iV} className="h-32 border border-white/10 bg-white/[0.02] flex items-stretch">
                            <div className="w-1/3 border-r border-white/10 p-4 flex flex-col justify-center gap-1 bg-emerald-500/5">
                                <span className="text-[10px] font-mono text-emerald-400 uppercase">Healthy Nodes</span>
                                <span className="text-3xl font-black text-white">{deviceSummary?.healthy ?? 0}<span className="text-sm text-white/30">/{deviceSummary?.total ?? 0}</span></span>
                            </div>
                            <div className="w-1/3 border-r border-white/10 p-4 flex flex-col justify-center gap-1 bg-rose-500/5">
                                <span className="text-[10px] font-mono text-rose-400 uppercase">Vulnerable</span>
                                <span className="text-3xl font-black text-white">{deviceSummary?.vulnerable ?? 0}</span>
                            </div>
                            <div className="w-1/3 p-4 flex flex-col justify-center gap-1 bg-amber-500/5">
                                <span className="text-[10px] font-mono text-amber-400 uppercase">Investigating</span>
                                <span className="text-3xl font-black text-white">{deviceSummary?.investigating ?? 0}</span>
                            </div>
                        </motion.div>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <motion.div variants={iV} className="xl:col-span-2 border border-violet-500/30 bg-[#0B0A10] relative p-6 md:p-8 flex flex-col overflow-hidden">
                        <div className="absolute right-[-5%] top-[-10%] text-[200px] font-black text-violet-500 opacity-5 pointer-events-none select-none tracking-tighter">NYX</div>

                        <div className="flex items-center gap-3 mb-6 relative z-10 border-b border-violet-500/20 pb-4">
                            <div className="text-violet-400 bg-violet-500/10 p-1.5 border border-violet-500/20">{icons.cpu}</div>
                            <div>
                                <span className="text-white font-mono text-[14px] uppercase font-bold tracking-[0.2em] block">Nyx_AI Intelligence</span>
                                <span className="text-violet-400 text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 mt-1">
                                    <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse shadow-[0_0_8px_#8B5CF6]"></div> Cognitive Report Generated
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                            <div className="flex flex-col gap-6">
                                <div className="bg-black/40 border border-white/5 p-4">
                                    <h4 className="text-[10px] font-mono text-violet-400 uppercase mb-3 flex items-center gap-2"><div className="w-1 h-3 bg-violet-500"></div> Executive_Summary</h4>
                                    <p className="text-white/80 text-sm leading-relaxed min-h-[60px]">{aiInsights?.summary ? aiInsights.summary : (
                                        <span className="text-white/40">Aggregating threat intelligence…</span>
                                    )}</p>
                                </div>
                                <div className="bg-black/40 border border-white/5 p-4 border-l-2 border-l-rose-500">
                                    <h4 className="text-[10px] font-mono text-rose-400 uppercase mb-3">Risk_Analysis</h4>
                                    <p className="text-rose-200/80 text-sm leading-relaxed min-h-[60px]">{aiInsights?.riskAnalysis ? aiInsights.riskAnalysis : (
                                        <span className="text-white/40">Analyzing risk vectors…</span>
                                    )}</p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-6">
                                <div>
                                    <h4 className="text-[10px] font-mono text-amber-400 uppercase mb-3 flex items-center gap-2"><div className="w-1 h-3 bg-amber-500"></div> Threat_Patterns</h4>
                                    <ul className="flex flex-col gap-3">
                                        {(aiInsights?.patterns && aiInsights.patterns.length > 0 ? aiInsights.patterns : [
                                            "Scanning for threat patterns…"
                                        ]).map((p, i) => (
                                            <li key={i} className={`text-xs flex items-start gap-3 p-2 border ${
                                                aiInsights?.patterns?.length > 0 
                                                    ? 'text-white/70 bg-black/40 border-white/5' 
                                                    : 'text-white/40 bg-amber-500/5 border-amber-500/20'
                                            }`}>
                                                <span className="text-amber-500 font-mono mt-0.5">&gt;</span> {p}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-mono text-emerald-400 uppercase mb-3 flex items-center gap-2"><div className="w-1 h-3 bg-emerald-500"></div> Recommended_Ops</h4>
                                    <ul className="flex flex-col gap-2">
                                        {(aiInsights?.improvements && aiInsights.improvements.length > 0 ? aiInsights.improvements : [
                                            "Generating recommendations…"
                                        ]).map((p, i) => (
                                            <li key={i} className={`text-xs flex items-start gap-3 p-2 border transition-colors ${
                                                aiInsights?.improvements?.length > 0 
                                                    ? 'text-emerald-100/70 bg-emerald-500/5 border-emerald-500/10 hover:bg-emerald-500/10 cursor-crosshair' 
                                                    : 'text-white/40 bg-emerald-500/5 border-emerald-500/10'
                                            }`}>
                                                <span className="text-emerald-500 font-black mt-0.5">+</span> {p}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div variants={iV} className="flex flex-col gap-6">
                        <div className="border border-white/10 bg-black/50 p-5 flex flex-col flex-1">
                            <span className="text-white/80 font-mono text-[11px] uppercase tracking-widest mb-4 border-b border-white/10 pb-2">Compiled_Archive</span>
                            <div className="flex flex-col gap-2 overflow-y-auto pr-1">
                                {(reportHistory.length ? reportHistory.slice(0, 3) : [
                                    { type: "JSON", name: "Initializing report system…", date: "—", size: "—", id: "" }
                                ]).map((rep, i) => (
                                    <div key={i} className={`bg-black border p-3 flex justify-between items-center group ${rep.id ? 'hover:border-emerald-500/50 cursor-pointer' : 'border-white/5 opacity-50'} transition-colors`}>
                                        <div className="flex items-center gap-3">
                                            <span className={`text-[9px] font-black uppercase font-mono px-1.5 py-0.5 ${rep.type === 'PDF' ? 'bg-rose-500/20 text-rose-400' : rep.type === 'CSV' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'}`}>{rep.type}</span>
                                            <div className="flex flex-col">
                                                <span className="text-white text-xs font-semibold">{rep.name}</span>
                                                <span className="text-[9px] font-mono text-white/40">{rep.date} • {rep.size}</span>
                                            </div>
                                        </div>
                                        <span className="text-white/20 group-hover:text-emerald-400 transition-colors">{icons.download}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border border-white/10 bg-[#090909] p-4 flex flex-col h-48 font-mono relative overflow-hidden group">
                           <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
                           <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                                <span className="text-cyan-400">{icons.terminal}</span>
                                <span className="text-[10px] text-white/60 uppercase font-bold">Audit_Log_Stream</span>
                                <span className="w-1.5 h-3 bg-cyan-400 animate-pulse ml-auto inline-block"></span>
                           </div>
                           <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-1.5 text-[10px]">
                                {(auditLogs.length ? auditLogs : [
                                    { time: "00:00:00", type: "SYSTEM", action: "Audit log stream initializing…", user: "system" }
                                ]).map((log, i) => (
                                    <div key={i} className={`flex items-start gap-2 p-1 rounded-sm transition-colors ${auditLogs.length ? 'hover:bg-white/[0.04]' : 'opacity-50'}`}>
                                        <span className="text-white/30 shrink-0 select-none">[{log.time}]</span>
                                        <span className={`shrink-0 lowercase px-1 rounded-sm select-none ${
                                            log.type === 'ACCESS' ? 'bg-blue-500/20 text-blue-300' :
                                            log.type === 'DEFENSE' ? 'bg-rose-500/20 text-rose-300' :
                                            log.type === 'BACKUP' ? 'bg-emerald-500/20 text-emerald-300' :
                                            'bg-white/10 text-white/60'
                                        }`}>SYS_{log.type}</span>
                                        <span className="text-white/70 truncate">{log.action}</span>
                                    </div>
                                ))}
                           </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
}
