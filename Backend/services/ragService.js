const RAG_SERVICE_URL =
    process.env.RAG_SERVICE_URL || "https://edunovaai-2.onrender.com/docs";

export const askRAG = async ({ question, level = "beginner" }) => {
    const response = await fetch(`${RAG_SERVICE_URL}/teacher/ask`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            question,
            level
        })
    });

    if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
            `RAG service returned ${response.status}: ${errorText}`
        );
    }

    return await response.json();
};