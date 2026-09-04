const RAG_SERVICE_URL =
    process.env.RAG_SERVICE_URL || process.env.AI_RAG_URL || "http://localhost:8000";

export const askRAG = async ({ question, level = "beginner" }) => {
    if (!RAG_SERVICE_URL) {
        throw new Error("RAG_SERVICE_URL is not configured. Set it in Backend/.env");
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