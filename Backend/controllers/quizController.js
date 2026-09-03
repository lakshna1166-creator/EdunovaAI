import supabase from "../config/supabase.js";

// Fallback questions if database table is empty (for immediate testing)
const defaultQuestions = [
  {
    id: "1",
    question: "In a deep neural network, why does calculating ∂L/∂w₁ require multiplying partial derivatives across each layer instead of adding them?",
    options: [
      "Because layers are composite mathematical functions f(g(h(x))) following the Chain Rule.",
      "Because matrix addition is computationally prohibited on GPUs.",
      "Because learning rates require multiplicative scaling to remain stable.",
      "Because bias weights cancel out additive error vectors."
    ],
    correct: 0,
    distractors: {
      "1": "Misconception: Believing calculus operations are caused by hardware GPU limitations.",
      "2": "Misconception: Confusing hyperparameter learning rates with the Chain Rule derivation.",
      "3": "Misconception: Believing bias weights eliminate additive gradients."
    },
    difficulty: "medium"
  },
  {
    id: "2",
    question: "What is the primary catalyst of the Vanishing Gradient Problem during backpropagation?",
    options: [
      "Having too high a learning rate causing divergence.",
      "Repeated multiplication of derivatives that are strictly less than 1 across many layers.",
      "Zero-initialized biases causing division by zero errors.",
      "Using excessive training epochs on small datasets."
    ],
    correct: 1,
    distractors: {
      "0": "Misconception: Conflating exploding gradients with vanishing gradients.",
      "2": "Misconception: Assuming biases cause mathematical division by zero.",
      "3": "Misconception: Assuming epoch count causes mathematical vanishing derivatives."
    },
    difficulty: "hard"
  },
  {
    id: "3",
    question: "How does EduMind AI distinguish between a computational slip and a fundamental cognitive misconception?",
    options: [
      "By comparing the student answer against typical wrong-option distractor mental models.",
      "By measuring the exact typing speed of the user.",
      "By randomly assigning difficulty ratings to student answers.",
      "By resetting the entire course upon any incorrect submission."
    ],
    correct: 0,
    distractors: {
      "1": "Misconception: Typing speed does not reflect cognitive conceptual models.",
      "2": "Misconception: Assuming AI adaptive difficulty is non-deterministic.",
      "3": "Misconception: Assuming modern tutoring forces full course resets."
    },
    difficulty: "easy"
  }
];

/**
 * Get Quiz Questions for a lesson or topic
 * GET /api/quiz
 */
export const getQuizQuestions = async (req, res, next) => {
  try {
    const { lessonId } = req.query;

    let dbQuestions = null;

    if (lessonId) {
      const { data } = await supabase
        .from("quiz_questions")
        .select("id, question_text, options, difficulty_level, order_index")
        .order("order_index", { ascending: true });
      dbQuestions = data;
    }

    if (dbQuestions && dbQuestions.length > 0) {
      const formatted = dbQuestions.map(q => ({
        id: q.id,
        question: q.question_text,
        options: q.options,
        difficulty: q.difficulty_level
      }));
      return res.status(200).json({ success: true, questions: formatted });
    }

    // Return default questions (without revealing the correct answer directly to the client)
    const sanitized = defaultQuestions.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      difficulty: q.difficulty
    }));

    return res.status(200).json({
      success: true,
      questions: sanitized
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit Quiz Answers & Get Cognitive Diagnostic Report
 * POST /api/quiz/submit
 */
export const submitQuiz = async (req, res, next) => {
  try {
    const { answers, quizId = null } = req.body || {};
    const userId = req.user?.userId;

    if (!answers || typeof answers !== "object") {
      return res.status(400).json({
        success: false,
        message: "Answers payload is required as a key-value map of questionId -> chosenIndex."
      });
    }

    let score = 0;
    const totalQuestions = defaultQuestions.length;
    const detectedMisconceptions = [];
    const questionResults = [];

    defaultQuestions.forEach(q => {
      const selectedIndex = answers[q.id];
      const isCorrect = selectedIndex === q.correct;

      if (isCorrect) {
        score += 1;
      } else if (selectedIndex !== undefined) {
        const misconceptionNote = q.distractors[String(selectedIndex)];
        if (misconceptionNote) {
          detectedMisconceptions.push({
            questionId: q.id,
            question: q.question,
            selectedOption: q.options[selectedIndex],
            misconception: misconceptionNote
          });
        }
      }

      questionResults.push({
        id: q.id,
        isCorrect,
        correctIndex: q.correct,
        selectedIndex: selectedIndex !== undefined ? selectedIndex : null
      });
    });

    const percentage = Math.round((score / totalQuestions) * 100);

    // Determine next adaptive difficulty
    let nextDifficulty = "medium";
    if (percentage >= 80) nextDifficulty = "hard";
    else if (percentage <= 50) nextDifficulty = "easy";

    // Save submission to Supabase if student is logged in
    if (userId) {
      try {
        await supabase.from("quiz_submissions").insert({
          student_id: userId,
          ...(quizId ? { quiz_id: quizId } : {}),
          score,
          total_questions: totalQuestions,
          percentage,
          answers,
          detected_misconceptions: detectedMisconceptions,
          feedback: `Scored ${score}/${totalQuestions} (${percentage}%). ${detectedMisconceptions.length} misconceptions flagged for Socratic remediation.`
        });

        // Update learning analytics topic record
        await supabase.from("learning_analytics").upsert({
          student_id: userId,
          topic: "Neural Networks & Backpropagation",
          mastery_score: percentage,
          misconceptions_count: detectedMisconceptions.length,
          last_reviewed_at: new Date().toISOString()
        }, { onConflict: "student_id,topic" });
      } catch (err) {
        console.warn("Could not record submission to Supabase:", err.message);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        score,
        totalQuestions,
        percentage,
        questionResults,
        detectedMisconceptions,
        nextAdaptiveDifficulty: nextDifficulty,
        feedback: percentage >= 80
          ? "Outstanding! You demonstrate solid mastery of the Chain Rule and gradient backpropagation."
          : "Good effort! EduMind AI has generated a targeted Socratic remediation plan for flagged concepts."
      }
    });
  } catch (error) {
    next(error);
  }
};
