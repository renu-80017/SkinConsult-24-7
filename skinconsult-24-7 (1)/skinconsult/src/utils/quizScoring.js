import { QUIZ_QUESTIONS } from "../data/quizQuestions";

const MAX_SCORE_PER_QUESTION = 3;

/**
 * Deterministic scoring — pure arithmetic, no AI/LLM involvement.
 * answers: { [questionId]: optionIndex }
 */
export function scoreQuiz(answers) {
  const categoryTotals = {};
  const categoryMax = {};

  QUIZ_QUESTIONS.forEach((q) => {
    const chosenIndex = answers[q.id];
    const option = q.options[chosenIndex];
    const points = option ? option.score : 0;

    categoryTotals[q.category] = (categoryTotals[q.category] || 0) + points;
    categoryMax[q.category] = (categoryMax[q.category] || 0) + MAX_SCORE_PER_QUESTION;
  });

  const totalPoints = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
  const totalMax = QUIZ_QUESTIONS.length * MAX_SCORE_PER_QUESTION;
  const overallScore = Math.round((totalPoints / totalMax) * 100);

  const categoryScores = Object.keys(categoryTotals).map((category) => ({
    category,
    score: Math.round((categoryTotals[category] / categoryMax[category]) * 100),
  }));

  const grade = getGrade(overallScore);

  const sorted = [...categoryScores].sort((a, b) => b.score - a.score);
  const strengths = sorted.filter((c) => c.score >= 75).slice(0, 3);
  const improvements = sorted
    .filter((c) => c.score < 75)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  const suggestions = improvements.map((c) => SUGGESTIONS[c.category] || GENERIC_SUGGESTION);

  return {
    overallScore,
    grade,
    categoryScores,
    strengths,
    improvements,
    suggestions,
    disclaimer:
      "This score reflects reported skin-care habits and is not a medical diagnosis.",
  };
}

function getGrade(score) {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "E";
}

const SUGGESTIONS = {
  "Skincare Routine":
    "Consider a consistent twice-daily cleansing routine with a gentle, non-stripping cleanser.",
  Hydration: "Try increasing your daily water intake gradually toward 2–3 liters.",
  "Sun Protection": "Apply broad-spectrum sunscreen daily, even on cloudy days, and reapply outdoors.",
  Sleep: "Aim for 7–8 hours of consistent sleep to support skin repair and recovery.",
  Nutrition: "Incorporate more fruits, vegetables, and whole foods while reducing processed sugar.",
  Hygiene: "Change pillowcases weekly and clean your skin promptly after sweating.",
  Exercise: "Regular movement supports circulation, which can benefit overall skin health.",
  Lifestyle: "Reducing smoke exposure can meaningfully improve skin tone and elasticity over time.",
  "Skin Comfort": "Track dryness or oiliness patterns and consider adjusting your moisturizer accordingly.",
};

const GENERIC_SUGGESTION =
  "Small, consistent daily habits tend to have the biggest long-term impact on skin health.";
