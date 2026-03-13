import { NextResponse } from "next/server";

export async function GET() {
    const apiKey = process.env.BEDROCK_API_KEY;
    const region = process.env.BEDROCK_REGION || "ap-south-2";

    if (!apiKey) {
        return NextResponse.json(
            { success: false, error: "Bedrock API key not configured in .env.local" },
            { status: 500 }
        );
    }

    // Try multiple models to find what's available in ap-south-2
    const modelsToTry = [
        "anthropic.claude-3-haiku-20240307-v1:0",
        "anthropic.claude-3-sonnet-20240229-v1:0",
        "amazon.titan-text-express-v1",
        "amazon.titan-text-lite-v1",
    ];

    // First, try listing available foundation models
    const listUrl = `https://bedrock.${region}.amazonaws.com/foundation-models`;

    try {
        const listResponse = await fetch(listUrl, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
        });

        if (listResponse.ok) {
            const listData = await listResponse.json();
            const availableModels = listData.modelSummaries?.map(m => m.modelId) || [];

            return NextResponse.json({
                success: true,
                message: "✅ Connected to AWS Bedrock!",
                region: region,
                availableModels: availableModels.slice(0, 20),
                totalModels: availableModels.length,
            });
        }
    } catch (e) {
        // List endpoint might not work with API key auth, continue to try invoke
    }

    // Try invoking a model directly
    for (const modelId of modelsToTry) {
        const invokeUrl = `https://bedrock-runtime.${region}.amazonaws.com/model/${encodeURIComponent(modelId)}/converse`;

        try {
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
                            content: [
                                {
                                    text: "Confirm you are online. Respond in exactly one sentence."
                                }
                            ]
                        }
                    ],
                    inferenceConfig: {
                        maxTokens: 60,
                        temperature: 0.3,
                    }
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const message = data.output?.message?.content?.[0]?.text || "Connected but no text in response";

                return NextResponse.json({
                    success: true,
                    message: "✅ AWS Bedrock is working!",
                    model: modelId,
                    region: region,
                    response: message,
                    usage: data.usage || null,
                });
            }

            // If 404, model not available in region — try next model
            if (response.status === 404) {
                continue;
            }

            // Other error — return details
            const errorBody = await response.text();
            return NextResponse.json({
                success: false,
                model: modelId,
                status: response.status,
                error: `Bedrock returned ${response.status}`,
                details: errorBody,
            }, { status: response.status });

        } catch (err) {
            continue;
        }
    }

    return NextResponse.json({
        success: false,
        error: "Could not connect to any Bedrock model. Tried: " + modelsToTry.join(", "),
        region: region,
        hint: "Check if your API key is valid and models are enabled in your AWS account for this region."
    }, { status: 500 });
}
