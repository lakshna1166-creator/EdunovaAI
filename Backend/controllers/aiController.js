import supabase from "../config/supabase.js";
import { askRAG } from "../services/ragService.js";

/**
 * AI Teacher Chat powered by RAG service
 * POST /api/ai/chat
 */
export const socraticChat = async (req, res, next) => {
  try {
    const {
      message,
      topic = "Backpropagation & Neural Networks",
      tutorMode = "socratic",
      history = [],
      level = "beginner"
    } = req.body || {};

    const userId = req.user?.userId;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message content cannot be empty."
      });
    }

    // Send the student's question to the existing Python AI-RAG service
    const ragData = await askRAG({
      question: message.trim(),
      level
    });

    const aiResponse =
      ragData.answer ||
      ragData.explanation ||
      "I couldn't generate an answer right now.";

    // Save conversation to Supabase if the user is authenticated
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
            message: aiResponse,
            metadata: {
              source: "python-ai-rag",
              explanation: ragData.explanation || null,
              example: ragData.example || null,
              check_question: ragData.check_question || null,
              difficulty: ragData.difficulty || level,
              sources: ragData.sources || []
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

    // Send RAG result back to frontend
    return res.status(200).json({
      success: true,

      message: {
        sender: "ai",
        text: aiResponse,
        type: "answer",
        remediation: null,
        conceptHighlight: null,
        timestamp: new Date().toISOString()
      },

      rag: {
        explanation: ragData.explanation || null,
        example: ragData.example || null,
        check_question: ragData.check_question || null,
        difficulty: ragData.difficulty || level,
        sources: ragData.sources || [],
        video: ragData.video || null
      }
    });

  } catch (error) {
    console.error(
      "AI-RAG connection error:",
      error.message
    );

    return res.status(502).json({
      success: false,
      message: "AI-RAG service is unavailable.",
      error: error.message
    });
  }
};

/**
 * Generate alternative explanations
 * POST /api/ai/explain-differently
 */
export const explainDifferently = async (req, res, next) => {
  try {
    const {
      topic = "Backpropagation",
      mode = "analogy"
    } = req.body || {};

    const explanations = {
      analogy: {
        title: "The Assembly Line Inspector Metaphor",
        content:
          "Imagine an automated car manufacturing plant. If a car comes off the final line with a misaligned door, we don't blame every robotic arm equally. The diagnostic computer traces backward from the door latch, calculates how much each specific arm was off, and sends corrective signals proportional to that error."
      },

      visual: {
        title: "The Error Wave Contours",
        content:
          "Visualize the loss surface as a mountainous topographical map. Backpropagation sends a ripple or pressure wave against the gradient vectors, with height corresponding to the magnitude of partial derivatives."
      },

      mathematical: {
        title: "Exact Composite Chain Rule Derivation",
        content:
          "For loss L, layer output a^(l) = sigma(z^(l)), and pre-activation z^(l) = W^(l)a^(l-1) + b^(l), the gradient is given by the chain rule through each layer."
      }
    };

    const selected =
      explanations[mode] || explanations.analogy;

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
 * Generate lesson
 * POST /api/ai/generate-lesson
 */
export const generateLesson = async (req, res, next) => {
  try {
    const {
      topic,
      curriculumStandard = "University STEM"
    } = req.body || {};

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: "Topic is required to generate lesson."
      });
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
          content:
            `Why does ${topic} matter? We break down the real-world necessity before delving into formal frameworks.`
        },
        {
          id: 2,
          title: `2. Mathematical & Formal Foundations`,
          content:
            `Rigorous exploration of the core mechanics, governing formulas, and edge cases.`
        },
        {
          id: 3,
          title: `3. Common Misconceptions & Socratic Traps`,
          content:
            `Key conceptual pitfalls and how to verify correct intuition.`
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