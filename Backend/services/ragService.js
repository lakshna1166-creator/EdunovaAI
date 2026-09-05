const getRAGServiceUrl = () => {
    const raw = process.env.RAG_SERVICE_URL || process.env.AI_RAG_URL || "http://127.0.0.1:8000";
    return raw.trim().replace(/\/+$/, "");
};

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const RAG_TIMEOUT_MS = parseInt(process.env.RAG_TIMEOUT_MS, 10) || 120000; // 120s timeout

// One-time startup log so production logs make it obvious which AI-Rag URL is in use.
console.log(
    `[ragService] RAG_SERVICE_URL = ${getRAGServiceUrl()} (env: ${process.env.NODE_ENV || "development"})`
);

export const askRAG = async ({ question, level = "beginner" }) => {
    const serviceUrl = getRAGServiceUrl();
    if (!serviceUrl) {
        throw new Error("RAG_SERVICE_URL is not configured. Set it in Backend/.env");
    }

    // In production, refuse to call localhost because AI-Rag is deployed separately.
    if (IS_PRODUCTION && /localhost|127\.0\.0\.1/i.test(serviceUrl)) {
        throw new Error(
            "RAG_SERVICE_URL is set to a localhost address in production. " +
            "Set RAG_SERVICE_URL (or AI_RAG_URL) to the deployed AI-Rag service URL " +
            "(e.g. https://<your-ai-rag>.onrender.com) in the Render environment."
        );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), RAG_TIMEOUT_MS);

    const targetUrl = `${serviceUrl}/teacher/ask`;
    console.log(`[AI CHAT] Calling RAG: ${targetUrl}`);

    let response;
    try {
        response = await fetch(targetUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                question,
                level
            }),
            signal: controller.signal
        });
        console.log("[AI CHAT] RAG request completed");
    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error(`AI-RAG service timed out after ${RAG_TIMEOUT_MS / 1000} seconds.`);
        }
        throw new Error(`Could not connect to AI-RAG service: ${error.message}`);
    } finally {
        clearTimeout(timeoutId);
    }

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AI CHAT] RAG error: status ${response.status} - body: ${errorText.substring(0, 300)}`);
        throw new Error(
            `RAG service returned ${response.status}: ${errorText}`
        );
    }

    const data = await response.json();
    console.log("[AI CHAT] RAG response received");
    return data;
};