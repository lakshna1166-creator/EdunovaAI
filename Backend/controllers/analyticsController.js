import supabase from "../config/supabase.js";

/**
 * Get Knowledge Mastery Map for Student
 * GET /api/analytics/mastery-map
 */
export const getMasteryMap = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { data: rows, error } = await supabase
      .from("learning_analytics")
      .select("id, topic, mastery_score, misconceptions_count, last_reviewed_at")
      .eq("student_id", userId)
      .order("last_reviewed_at", { ascending: false });
    if (error) throw error;

    const data = (rows || []).map((r, index) => ({
      id: r.id || `node-${index + 1}`,
      title: r.topic,
      mastery: Number(r.mastery_score || 0),
      status: Number(r.mastery_score || 0) >= 80 ? "Mastered" : Number(r.mastery_score || 0) > 0 ? "In Progress" : "Not Started",
      prerequisites: [],
      connectedTo: [],
      misconceptionsCount: Number(r.misconceptions_count || 0),
      lastPracticed: r.last_reviewed_at
    }));
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Misconception Radar summary
 * GET /api/analytics/misconceptions
 */
export const getMisconceptionsSummary = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { data: rows, error } = await supabase
      .from("learning_analytics")
      .select("topic, misconceptions_count, last_reviewed_at")
      .eq("student_id", userId)
      .gt("misconceptions_count", 0)
      .order("last_reviewed_at", { ascending: false });
    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: (rows || []).map(r => ({
        category: "Learning",
        misconception: r.topic,
        frequency: `${Number(r.misconceptions_count || 0)} recorded`,
        remediationSuccess: null,
        lastPracticed: r.last_reviewed_at
      }))
    });
  } catch (error) {
    next(error);
  }
};
