import express from "express";
import { textToSpeech } from "../controllers/voiceController.js";
import { body, validationResult } from "express-validator";

const router = express.Router();

/**
 * Validation rules for TTS endpoint
 */
const validateSpeak = [
    body("text")
        .trim()
        .notEmpty()
        .withMessage("Text is required for text-to-speech.")
        .isLength({ max: 5000 })
        .withMessage("Text cannot exceed 5000 characters."),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: `Validation error: ${errors.array()[0].msg}`,
                errors: errors.array().map((err) => ({
                    field: err.path,
                    message: err.msg
                }))
            });
        }
        next();
    }
];

/**
 * POST /api/voice/speak
 * Convert text to speech using ElevenLabs
 * Returns audio/mpeg binary
 */
router.post("/speak", validateSpeak, textToSpeech);

export default router;