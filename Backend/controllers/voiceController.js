import axios from "axios";

const ELEVENLABS_API_BASE = "https://api.elevenlabs.io/v1/text-to-speech";

/**
 * Text-to-Speech endpoint powered by ElevenLabs
 * POST /api/voice/speak
 *
 * Receives text from the frontend and returns audio/mpeg from ElevenLabs.
 * The API key never leaves the server.
 */
export const textToSpeech = async (req, res, next) => {
    try {
        const { text } = req.body || {};

        // -------------------------------------------------------------------------
        // Input Validation
        // -------------------------------------------------------------------------
        if (!text) {
            return res.status(400).json({
                success: false,
                message: "Text is required for text-to-speech conversion."
            });
        }

        if (typeof text !== "string" || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: "Text must be a non-empty string."
            });
        }

        // -------------------------------------------------------------------------
        // Environment Validation
        // -------------------------------------------------------------------------
        const apiKey = process.env.ELEVENLABS_API_KEY;
        const voiceId = process.env.ELEVENLABS_VOICE_ID;

        if (!apiKey) {
            console.error("[voiceController] ELEVENLABS_API_KEY is not configured.");
            return res.status(503).json({
                success: false,
                message: "Text-to-speech service is not configured on the server."
            });
        }

        if (!voiceId) {
            console.error("[voiceController] ELEVENLABS_VOICE_ID is not configured.");
            return res.status(503).json({
                success: false,
                message: "Text-to-speech voice is not configured on the server."
            });
        }

        // -------------------------------------------------------------------------
        // Call ElevenLabs API — binary audio response
        // -------------------------------------------------------------------------
        let elevenResponse;

        try {
            elevenResponse = await axios.post(
                `${ELEVENLABS_API_BASE}/${voiceId}`,
                {
                    text: text.trim(),
                    model_id: "eleven_multilingual_v2",
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75
                    }
                },
                {
                    headers: {
                        "xi-api-key": apiKey,
                        "Content-Type": "application/json",
                        Accept: "audio/mpeg"
                    },
                    responseType: "arraybuffer",
                    timeout: 60000 // 60s timeout for TTS generation
                }
            );
        } catch (apiError) {
            // ElevenLabs returns error details in the response body as text/JSON
            let errorDetail = "ElevenLabs TTS request failed.";

            if (apiError.response?.data) {
                try {
                    // Attempt to parse error JSON from the arraybuffer body
                    const errorJson = JSON.parse(
                        Buffer.from(apiError.response.data).toString("utf-8")
                    );
                    errorDetail = errorJson.detail || errorJson.message || errorDetail;
                } catch {
                    // Body is not JSON — use raw error message
                    errorDetail = apiError.message || errorDetail;
                }
            } else if (apiError.code === "ECONNABORTED") {
                errorDetail = "Text-to-speech request timed out. Please try a shorter text.";
            } else if (apiError.code === "ENOTFOUND" || apiError.code === "ECONNREFUSED") {
                errorDetail = "Could not reach the ElevenLabs service. Please try again later.";
            }

            console.error("[voiceController] ElevenLabs API error:", errorDetail);
            return res.status(502).json({
                success: false,
                message: errorDetail
            });
        }

        // -------------------------------------------------------------------------
        // Stream audio back to frontend
        // -------------------------------------------------------------------------
        const audioBuffer = Buffer.from(elevenResponse.data);

        res.set({
            "Content-Type": "audio/mpeg",
            "Content-Length": audioBuffer.length,
            "Cache-Control": "no-cache",
            "X-Content-Type-Options": "nosniff"
        });

        return res.status(200).send(audioBuffer);

    } catch (error) {
        console.error("[voiceController] Unexpected error:", error.message);
        return res.status(500).json({
            success: false,
            message: "An unexpected error occurred during text-to-speech."
        });
    }
};
