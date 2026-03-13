import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const apiKey = process.env.BEDROCK_API_KEY;
        const region = process.env.BEDROCK_REGION || "ap-south-2";

        if (!apiKey) {
            return NextResponse.json({ success: false, analysis: "AI offline. Bedrock keys not configured." });
        }

        // Fetch the most recent active threat from MongoDB
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);
        const latestThreats = await db
            .collection("threats")
            .find({ status: "active" })
            .sort({ timestamp: -1 })
            .limit(1)
            .toArray();

        let contextPrompt = "You are a highly advanced cybersecurity AI system named NeuroGuard. Analyze the following security event and provide a concise, 1-2 sentence real-time action briefing. Sound highly technical, robotic, and authoritative.";
        let cvssScore = "8.5";
        let severityLabel = "Critical Threat";

        if (latestThreats && latestThreats.length > 0) {
            const threat = latestThreats[0];
            contextPrompt += `\n\nRecent Threat Detected:\nType: ${threat.type}\nSeverity: ${threat.severity}\nSource IP: ${threat.sourceIp}\nTarget: ${threat.targetDevice}\nDetails: ${threat.description}`;

            if (threat.severity === "Critical") { cvssScore = "9.8"; severityLabel = "Critical Threat"; }
            else if (threat.severity === "High") { cvssScore = "8.2"; severityLabel = "High Alert"; }
            else { cvssScore = "5.4"; severityLabel = "Monitoring"; }
        } else {
            contextPrompt += "\n\nSystem Status: All systems normal. No active threats detected.";
            cvssScore = "0.0";
            severityLabel = "Systems Nominal";
        }

        // Use the newest available non-legacy US cross-region profile for Sonnet
        const alternateModelId = "us.anthropic.claude-3-5-sonnet-20241022-v2:0";
        const invokeUrl = `https://bedrock-runtime.${region}.amazonaws.com/model/${encodeURIComponent(alternateModelId)}/converse`;

        const response = await fetch(invokeUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: "user",
                        content: [{ text: contextPrompt }]
                    }
                ],
                inferenceConfig: {
                    maxTokens: 100,
                    temperature: 0.3,
                }
            }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("Bedrock API Error:", errorBody);
            return NextResponse.json({ success: false, analysis: "AI subsystems currently unvailable due to regional api throttling." });
        }

        const data = await response.json();
        const analysis = data.output?.message?.content?.[0]?.text || "Analysis completed successfully. No anomalies detected.";

        return NextResponse.json({
            success: true,
            analysis: analysis,
            cvss: cvssScore,
            severityLabel: severityLabel
        });
    } catch (err) {
        return NextResponse.json(
            { success: false, analysis: "Connection to core AI brain interrupted." },
            { status: 500 }
        );
    }
}
