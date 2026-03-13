import "dotenv/config";

async function listModels() {
    const apiKey = process.env.BEDROCK_API_KEY;
    const region = process.env.BEDROCK_REGION || "us-east-1";

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

            const novaModels = availableModels.filter(id => id.toLowerCase().includes("nova") || id.toLowerCase().includes("sonic"));
            console.log("Nova / Sonic Models:", novaModels);
        } else {
            console.error("Failed to list models:", listResponse.status, await listResponse.text());
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

listModels();
