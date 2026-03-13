"use client";

import { useState, useEffect } from "react";
import { ReactFlow, useNodesState, useEdgesState, Background, Controls, MarkerType } from "@xyflow/react";
import '@xyflow/react/dist/style.css';
import { fetchApiJson } from "@/lib/api";

export default function AttackGraph() {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    useEffect(() => {
        const fetchGraphData = async () => {
            try {
                const data = await fetchApiJson("/api/attack-path", { cache: "no-store" });

                // Add styling to nodes
                const styledNodes = data.nodes.map(node => ({
                    ...node,
                    style: {
                        background: node.type === 'input' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(56, 189, 248, 0.1)',
                        color: 'white',
                        border: node.type === 'input' ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(56, 189, 248, 0.5)',
                        borderRadius: '8px',
                        padding: '10px 15px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        boxShadow: node.type === 'input' ? '0 0 15px rgba(239, 68, 68, 0.2)' : '0 0 10px rgba(56, 189, 248, 0.1)'
                    }
                }));

                // Add styling to edges
                const styledEdges = data.edges.map(edge => ({
                    ...edge,
                    style: { stroke: 'rgba(239, 68, 68, 0.8)', strokeWidth: 2 },
                    labelStyle: { fill: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: 'bold' },
                    labelBgStyle: { fill: 'rgba(0,0,0,0.8)', color: '#fff', padding: 2 },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: 'rgba(239, 68, 68, 0.8)',
                    },
                }));

                setNodes(styledNodes);
                setEdges(styledEdges);
            } catch (err) {
                console.error("Failed to fetch attack path graph", err);
            }
        };

        fetchGraphData();
        const interval = setInterval(fetchGraphData, 5000);
        return () => clearInterval(interval);
    }, [setNodes, setEdges]);

    return (
        <div className="bg-black/40 border border-white/10 rounded-3xl p-6 backdrop-blur-xl h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white/90">Attack Path Visualizer</h3>
                <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-bold tracking-widest border border-emerald-500/20">
                    Live Tracing
                </div>
            </div>

            <div className="w-full h-[300px] bg-[#050505] rounded-xl border border-white/5 overflow-hidden relative">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    fitView
                    attributionPosition="bottom-right"
                    proOptions={{ hideAttribution: true }}
                >
                    <Background color="#333" gap={16} />
                </ReactFlow>
            </div>

            <div className="mt-4 text-xs text-white/40 font-mono">
                Visualizing lateral movement & multi-vector intrusions.
            </div>
        </div>
    );
}
