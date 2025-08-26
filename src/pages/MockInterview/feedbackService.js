import { OPENROUTER_CONFIG, validateConfig } from "./config.js";
const fs = require('fs');

const masterPrompt = fs.readFileSync('./model_prompt.txt', 'utf-8');

export async function generateFeedback(
  answer,
  question,
  company,
  improvementAreas
) {
  try {
    validateConfig();

    const prompt = createFeedbackPrompt(
      answer,
      question,
      company,
      improvementAreas
    );

    const response = await fetch(
      `${OPENROUTER_CONFIG.baseUrl}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_CONFIG.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": window.location.origin,
          "X-Title": "Mock Interview App",
        },
        body: JSON.stringify({
          model: OPENROUTER_CONFIG.model,
          messages: [
            { role: "system", content: masterPrompt },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 1200,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText}. ${
          errorData.error?.message || ""
        }`
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;
    if (!aiResponse)
      throw new Error("No response content received from OpenRouter");

    return sanitize(aiResponse);
  } catch (error) {
    console.error("Error generating feedback:", error);
    return generateFallbackFeedback(
      answer,
      question,
      company,
      improvementAreas
    );
  }
}

function createFeedbackPrompt(answer, question, company, improvementAreas) {
  return `Provide clear, constructive feedback on the answer below.

QUESTION: ${question}
COMPANY: ${company}
IMPROVEMENT AREAS: ${improvementAreas.join(", ")}

CANDIDATE'S ANSWER:
${answer}

Write the feedback as short paragraphs with plain sentences.
Do NOT use markdown, bullets, numbers, asterisks, or headings.
Start with one sentence of encouragement, then give specific suggestions tailored to the improvement areas. Keep it concise.`;
}

function sanitize(text) {
  // strip common markdown artifacts just in case
  return String(text)
    .replace(/[*#`>-]/g, (c) => (c === "-" ? "—" : "")) // replace list dashes with em dashes, drop other md chars
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function generateFallbackFeedback(answer, question, company, improvementAreas) {
  const tips = [];
  tips.push(
    "Good start. With clearer structure and one concrete example, your answer will land more strongly."
  );

  if (answer.length < 100) {
    tips.push(
      "Add a little more context and include one specific moment so the listener can follow your reasoning."
    );
  }
  if (!/\bI\b|\bmy\b/i.test(answer)) {
    tips.push(
      "Use first-person language to highlight your own actions and decisions."
    );
  }
  if (!improvementAreas.includes("Answer structure (STAR method)")) {
    tips.push(
      "Explain the (S)ituation, the (T)ask, your (A)ction/s, and the (R)estults you achieved, in that order. This follows the STAR method"
    );
  }
  if (company && company !== "General") {
    tips.push(
      `Tailor one line to ${company} by referencing a value or initiative that matters to them.`
    );
  }

  const areaMap = {
    "Clarity & communication":
      "Prefer short sentences and define any technical term once.",
    Confidence: "State your main point first and keep a steady pace.",
    Storytelling: "Describe a brief, vivid moment that shows your decisions.",
    "Highlighting achievements":
      "Quantify an outcome such as time saved or quality improved.",
    "Teamwork & leadership examples":
      "Mention how you coordinated with others and one decision you led.",
    "Conflict resolution":
      "Show how you understood the other perspective and how the issue was resolved.",
    "Explaining failures & lessons learned":
      "Share one lesson you now apply to avoid a repeat.",
    "General interview etiquette":
      "Close with a quick check-back like ‘does that address your question?’.",
  };
  improvementAreas.forEach((a) => {
    if (areaMap[a]) tips.push(areaMap[a]);
  });

  tips.push(
    "Keep practicing; small tweaks in structure and tone add up quickly."
  );

  return tips.join(" ");
}
