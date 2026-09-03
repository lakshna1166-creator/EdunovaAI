import supabase from "../config/supabase.js";

/**
 * Intelligent Socratic Tutor Dialogue Engine
 * POST /api/ai/chat
 */
export const socraticChat = async (req, res, next) => {
  try {
    const { message, topic = "Backpropagation & Neural Networks", tutorMode = "socratic", history = [] } = req.body || {};
    const userId = req.user?.userId;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message content cannot be empty."
      });
    }

    const trimmedMsg = message.trim().toLowerCase();

    // Misconception Detection Heuristics
    let type = "answer";
    let aiResponse = "";
    let remediation = null;
    let conceptHighlight = null;

    if (
      trimmedMsg.includes("equal") ||
      trimmedMsg.includes("same fraction") ||
      trimmedMsg.includes("divide equally") ||
      trimmedMsg.includes("same weight")
    ) {
      type = "misconception";
      conceptHighlight = "Proportional Responsibility vs Equal Division";
      remediation = "Think of a committee vote: A member who voted aggressively with 10x authority bears more responsibility than an abstaining member.";
      aiResponse = `Careful! Assigning equal fractions assumes every neuron has the same activation and weight. In reality, neurons with larger weights and higher activation fired stronger, so they carried a larger share of the blame via their partial derivative (Chain Rule: ∂L/∂w = ∂L/∂a · ∂a/∂z · ∂z/∂w).

How do you think the magnitude of the previous layer's activation affects how much we adjust this weight?`;
    } else if (
      trimmedMsg.includes("add") ||
      trimmedMsg.includes("addition") ||
      trimmedMsg.includes("plus")
    ) {
      type = "misconception";
      conceptHighlight = "Multiplicative Chain Rule vs Additive Derivatives";
      remediation = "Because layer functions are nested f(g(h(x))), we multiply rates of change rather than sum them.";
      aiResponse = `Let's reflect on calculus for a moment: When functions are nested inside each other like f(g(x)), how does a small change in x ripple through g and into f? Do the rates of change add up, or do they multiply?`;
    } else if (
      trimmedMsg.includes("gradient") ||
      trimmedMsg.includes("derivative") ||
      trimmedMsg.includes("chain rule") ||
      trimmedMsg.includes("partial") ||
      trimmedMsg.includes("sensitivity") ||
      trimmedMsg.includes("learning rate")
    ) {
      type = "success";
      conceptHighlight = "Mastery of Gradient Sensitivity";
      aiResponse = `Spot on! By computing the gradient with respect to that specific weight, we scale the weight update proportional to its direct sensitivity. 

Let's test the boundary: What happens if the activation function saturates (its derivative approaches 0)? How does that affect all the weights deeper in the network?`;
    } else {
      // General Mode-specific Responses
      if (tutorMode === "eli5") {
        aiResponse = `Imagine a factory assembly line making cookies. If the cookies come out too salty at the end, the master chef walks backward along the line, checking who poured in how much salt. The chef gives more feedback to the worker who dumped a whole bucket than to the one who dropped a pinch!

How does this relate to the weights in our neural network?`;
      } else if (tutorMode === "first_principles") {
        aiResponse = `Let's break this down to first principles:
1. Every neural layer is an affine transformation: z = Wx + b.
2. An activation function applies non-linearity: a = σ(z).
3. The loss function L compares output ŷ against target y.

To minimize L, we need the exact vector direction of steepest ascent, which is ∇_W L. What calculus theorem allows us to compute ∇_W L layer by layer?`;
      } else if (tutorMode === "feynman") {
        aiResponse = `Great start! Now explain this to me as if I were a 10-year-old: If you change one single number in the very first layer of a 10-layer network, why does the final answer at the output move?`;
      } else {
        // Standard Socratic
        aiResponse = `Interesting point! Let's examine that closely: If you decrease the learning rate η by a factor of 10, how does that alter the stability of the loss landscape navigation during the backward pass?`;
      }
    }

    // Record conversation in database if student is logged in
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
            metadata: { type, remediation, conceptHighlight }
          }
        ]);
      } catch (dbErr) {
        console.warn("Could not record chat history to DB:", dbErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: {
        sender: "ai",
        text: aiResponse,
        type,
        remediation,
        conceptHighlight,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
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
