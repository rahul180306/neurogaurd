import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const apiKey = process.env.BEDROCK_API_KEY;
        const region = process.env.BEDROCK_REGION || "ap-south-2";

        
        // Fetch up to 3 most recent threats to build investigations out of
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://10.102.70.61:8000";
        const threatsResponse = await fetch(`${apiUrl}/api/threats`);
        if (!threatsResponse.ok) {
             throw new Error("Failed to fetch threats from backend");
        }
        const allThreats = await threatsResponse.json();
        const latestThreats = allThreats.slice(0, 3);
        
        console.log("Found threats:", latestThreats.length);

        if (!latestThreats || latestThreats.length === 0) {
            return NextResponse.json([]); // Return empty array if no threats
        }

        if (!apiKey) {
            console.error("Bedrock API Key missing");
            // If AWS is offline, just mock it so it doesn't crash
            return NextResponse.json([{ 
                id: "INV-OFFLINE", 
                title: "Bedrock Offline", 
                summary: "Please configure AWS keys to enable AI.", 
                classification: "System Warning", severity: "Low", riskScore: 0, 
                status: "resolved", 
                evidence: {suspiciousIPs: [], anomalies: []}, affectedDevices: [], timeline: [] 
            }]);
        }

        const prompt = `You are a cybersecurity AI. Convert the following recent threats into a JSON array of investigation cases. 
Format EXACTLY like this (no markdown wrap, just pure JSON):
[
    {
        "id": "INV-... (generate id)",
        "created": "(iso date)",
        "title": "(Short clever title)",
        "summary": "(AI generated summary analyzing the threat in 1 sentence)",
        "classification": "(Type)",
        "severity": "(High/Medium/Critical)",
        "riskScore": (number 1-100),
        "status": "in-progress",
        "evidence": { "suspiciousIPs": ["..."], "logsExtracted": 42 },
        "affectedDevices": [{ "id": "...", "ip": "...", "type": "Sensor Node" }],
        "timeline": [ { "time": "12:00", "event": "...", "type": "alert", "icon": "⚡" } ],
        "aiAnalysis": {
            "confidence": 95,
            "reasoning": "...",
            "mitigations": ["...", "..."],
            "attackTechnique": { "name": "...", "mitreId": "...", "description": "..." },
            "hackerProfile": { "estimatedLocation": "...", "attackPattern": "...", "riskLevel": "..." }
        }
    }
]

Threats to analyze:
${JSON.stringify(latestThreats)}
`;

        // Use the newest available Sonnet model
        const alternateModelId = "us.anthropic.claude-3-5-sonnet-20241022-v2:0";
        const invokeUrl = `https://bedrock-runtime.${region}.amazonaws.com/model/${encodeURIComponent(alternateModelId)}/converse`;

        const response = await fetch(invokeUrl, {
            method: "POST",
            headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: [{ role: "user", content: [{ text: prompt }] }],
                inferenceConfig: { maxTokens: 2000, temperature: 0.2 }
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("Bedrock error:", err);
            throw new Error("AWS Bedrock unavailable");
        }

        const data = await response.json();
        const rawText = data.output?.message?.content?.[0]?.text || "[]";
        
        let parsed = [];
        try {
            // Unpack Claude's text incase he wraps it in markdown backticks
            const cleanText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
            parsed = JSON.parse(cleanText);
        } catch(e) {
            console.error("Failed to parse bedrock json:", rawText);
        }

        return NextResponse.json(parsed);
    } catch (err) {
        console.error(err);
        return NextResponse.json([]);
    }
}