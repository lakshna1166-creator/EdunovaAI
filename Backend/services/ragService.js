const RAG_SERVICE_URL =
    process.env.RAG_SERVICE_URL || process.env.AI_RAG_URL || "http://localhost:8000";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

// One-time startup log so production logs make it obvious which AI-Rag URL is in use.
console.log(
    `[ragService] RAG_SERVICE_URL = ${RAG_SERVICE_URL} (env: ${process.env.NODE_ENV || "development"})`
);

export const askRAG = async ({ question, level = "beginner" }) => {
    if (!RAG_SERVICE_URL) {
        throw new Error("RAG_SERVICE_URL is not configured. Set it in Backend/.env");
    }

    // In production, refuse to call localhost because AI-Rag is deployed separately.
    if (IS_PRODUCTION && /localhost|127\.0\.0\.1/i.test(RAG_SERVICE_URL)) {
        throw new Error(
            "RAG_SERVICE_URL is set to a localhost address in production. " +
            "Set RAG_SERVICE_URL (or AI_RAG_URL) to the deployed AI-Rag service URL " +
            "(e.g. https://<your-ai-rag>.onrender.com) in the Render environment."
        );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout

    let response;
    try {
        response = await fetch(`${RAG_SERVICE_URL}/teacher/ask`, {
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
    } catch (error) {
        if (error.name === "AbortError") {
            throw new Error("AI-RAG service timed out after 120 seconds.");
        }
        throw new Error(`Could not connect to AI-RAG service: ${error.message}`);
    } finally {
        clearTimeout(timeoutId);
    }

    if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
            `RAG service returned ${response.status}: ${errorText}`
        );
    }

    return await response.json();
};