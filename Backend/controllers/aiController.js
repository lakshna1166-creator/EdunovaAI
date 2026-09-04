import supabase from "../config/supabase.js";
import { askRAG } from "../services/ragService.js";
/**
 * Intelligent Socratic Tutor Dialogue Engine
 * POST /api/ai/chat
 */
/**
 * AI Teacher Chat powered by RAG service
 * POST /api/ai/chat
 */
export const socraticChat = async (req, res, next) => {
  try {
    const {
      message,
      topic = "General",
      tutorMode = "socratic",
      history = []
    } = req.body || {};

    const userId = req.user?.userId;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message content cannot be empty."
      });
    }

    // Map frontend tutor modes to RAG teaching levels
    const levelMap = {
      eli5: "beginner",
      first_principles: "intermediate",
      feynman: "advanced",
      socratic: "intermediate"
    };

    const level = levelMap[tutorMode] || "beginner";

    // Send the student's question to the RAG Teacher Service
    const ragResponse = await askRAG({
      question: message.trim(),
      level
    });

    // Store conversation in Supabase
    if (userId) {
      try {
        await supabase.from("ai_tutor_chats").insert([
          {
            student_id: userId,
            topic,
            tutor_mode: tutorMode,
            sender: "user",
            message: message.trim()
          },
          {
            student_id: userId,
            topic,
            tutor_mode: tutorMode,
            sender: "ai",
            message: ragResponse.answer || ragResponse.explanation || "",
            metadata: {
              type: "rag_teacher",
              difficulty: ragResponse.difficulty || null,
              sources: ragResponse.sources || [],
              video: ragResponse.video || null
            }
          }
        ]);
      } catch (dbErr) {
        console.warn(
          "Could not record chat history to DB:",
          dbErr.message
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: {
        sender: "ai",

        // Main AI Teacher response
        text:
          ragResponse.answer ||
          ragResponse.explanation ||
          "I could not generate a response.",

        type: "rag_teacher",

        // Extra teaching information from RAG
        explanation: ragResponse.explanation || null,
        example: ragResponse.example || null,
        checkQuestion: ragResponse.check_question || null,
        difficulty: ragResponse.difficulty || null,
        sources: ragResponse.sources || [],

        // HeyGen video information
        video: ragResponse.video || null,

        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("AI Teacher / RAG Error:", error.message);
    next(error);
  }
};

/**
 * Generate multi-modal alternative explanations
 * POST /api/ai/explain-differently
 */
export const explainDifferently = async (req, res, next) => {
  try {
    const { topic = "Backpropagation", mode = "analogy" } = req.body || {};

    const explanations = {
      analogy: {
        title: "The Assembly Line Inspector Metaphor",
        content: "Imagine an automated car manufacturing plant. If a car comes off the final line with a misaligned door, we don't blame every robotic arm equally. The diagnostic computer traces backward from the door latch, calculates how many millimeters each specific arm was off, and sends corrective electrical pulses proportional to that error."
      },
      visual: {
        title: "The Error Wave Contours",
        content: "Visualize the loss surface as a mountainous topographical map. Backpropagation sends a ripple or pressure wave uphill against the gradient vectors, with height corresponding to the magnitude of partial derivatives ∂L/∂w."
      },
      mathematical: {
        title: "Exact Composite Chain Rule Derivation",
        content: "For loss L, layer output a⁽ˡ⁾ = σ(z⁽ˡ⁾), and pre-activation z⁽ˡ⁾ = W⁽ˡ⁾a⁽ˡ⁻¹⁾ + b⁽ˡ⁾, the gradient is given by: ∂L/∂W⁽ˡ⁾ = δ⁽ˡ⁾(a⁽ˡ⁻¹⁾)ᵀ where δ⁽ˡ⁾ = (W⁽ˡ⁺¹⁾)ᵀδ⁽ˡ⁺¹⁾ ⊙ σ'(z⁽ˡ⁾)."
      }
    };

    const selected = explanations[mode] || explanations.analogy;

    return res.status(200).json({
      success: true,
      topic,
      mode,
      explanation: selected
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Synthesize Curriculum Unit from Topic / Raw Syllabus
 * POST /api/ai/generate-lesson
 */
export const generateLesson = async (req, res, next) => {
  try {
    const { topic, curriculumStandard = "University STEM" } = req.body || {};

    if (!topic) {
      return res.status(400).json({ success: false, message: "Topic is required to generate lesson." });
    }

    const generatedUnit = {
      title: `${topic}: Foundations & Modern Applications`,
      topic,
      curriculumStandard,
      estimatedTimeMinutes: 45,
      learningObjectives: [
        `Understand foundational principles and definitions of ${topic}`,
        `Derive core equations and identify common cognitive traps`,
        `Apply knowledge to real-world STEM problem solving`
      ],
      sections: [
        {
          id: 1,
          title: `1. Intuitive Introduction to ${topic}`,
          content: `Why does ${topic} matter? We break down the real-world necessity before delving into formal frameworks.`
        },
        {
          id: 2,
          title: `2. Mathematical & Formal Foundations`,
          content: `Rigorous exploration of the core mechanics, governing formulas, and edge cases.`
        },
        {
          id: 3,
          title: `3. Common Misconceptions & Socratic Traps`,
          content: `Key conceptual pitfalls that fool 70%+ of beginners, and how to verify correct intuition.`
        }
      ]
    };

    return res.status(200).json({
      success: true,
      lesson: generatedUnit
    });
  } catch (error) {
    next(error);
  }
};
