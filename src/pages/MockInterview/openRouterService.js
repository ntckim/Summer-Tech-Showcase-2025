import { OPENROUTER_CONFIG, validateConfig } from "./config.js";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import masterPrompt from "./model_prompt.txt?raw";

// Tell pdfjs where the worker is
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

export async function generateInterviewQuestions(formData) {
  try {
    // Validate configuration first
    validateConfig();

    // Read the resume file content
    let resumeText = "";
    if (formData?.resume) {
      resumeText = await readResumeFile(formData.resume);
    }

    // Create a comprehensive prompt for the AI model
    const prompt = createPrompt(formData, resumeText);

    // Make HTTP request to OpenRouter
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
          temperature: OPENROUTER_CONFIG.temperature,
          max_tokens: OPENROUTER_CONFIG.maxTokens,
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
    if (!aiResponse) {
      throw new Error("No response content received from OpenRouter");
    }

    // Parse the response to extract questions
    return parseQuestionsFromResponse(aiResponse);
  } catch (error) {
    console.error("Error generating questions:", error);
    if (error?.message?.includes("API key")) {
      throw new Error(
        "OpenRouter API key not configured. Please create a .env file in the root directory with:\nVITE_OPENROUTER_API_KEY=your_actual_openrouter_api_key_here"
      );
    }
    if (error?.message?.includes("OpenRouter API error")) {
      throw new Error(
        `API Error: ${error.message}. Please check your API key and try again.`
      );
    }
    throw new Error(
      "Failed to generate interview questions. Please try again."
    );
  }
}

function createPrompt(formData, resumeText) {
  const {
    companies = [],
    improvementAreas = [],
    notes = "",
  } = formData || {};

  const prompt = `Generate 10 interview questions for a interviewee based on the following information:

RESUME CONTENT:
${resumeText}

TARGET COMPANIES:
${companies.join(", ")}

IMPROVEMENT AREAS:
${improvementAreas.join(", ")}

ADDITIONAL NOTES:
${notes || "None provided"}

REQUIREMENTS:
1. Generate exactly 10 questions
2. Tag each question with the company that typically asks it (e.g., "Google", "Meta", "General")
3. Make questions specific to the candidate's background and experience
4. Include a mix of technical, behavioral, and company-specific questions
5. Focus on the improvement areas mentioned
6. Add 2-3 general questions that are commonly asked

FORMAT YOUR RESPONSE AS:
1. [Company Tag] Question text here
2. [Company Tag] Question text here
...and so on

Make the questions challenging but appropriate for the candidate's level.
Do not provide any other output besides the 10 questions`;

  return prompt;
}

function process_resume(text) {

  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  let firstLineRedacted = false;
  let processedText = "";
  const sectionHeaderRegex = /^([A-Z ]{2,})\s*[_-]*$/;

  const emailRegex =
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
  const phoneRegex = /\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g;
  const linkedinRegex =
    /https?:\/\/(www\.)?linkedin\.com\/[A-Za-z0-9/_-]+\/?/gi;
  const githubRegex =
    /https?:\/\/(www\.)?github\.com\/[A-Za-z0-9/_-]+\/?/gi;

  for (let line of lines) {
    if (!firstLineRedacted) {
      line = "[REDACTED NAME]";
      firstLineRedacted = true;
    } else {
      line = line
        .replace(emailRegex, "[REDACTED EMAIL]")
        .replace(phoneRegex, "[REDACTED PHONE]")
        .replace(linkedinRegex, "[REDACTED LINKEDIN]")
        .replace(githubRegex, "[REDACTED GITHUB]");
    }

    const match = line.match(sectionHeaderRegex);
    if (match) {
      const section = match[1].trim();
      processedText += `\n--- SECTION: ${section} ---\n`;
    } else {
      processedText += line + " ";
    }
  }


  return processedText;
}

export async function readResumeFile(file) {
  try {
    if (file.type === "application/pdf") {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        let currentY = null;
        let line = "";

        content.items.forEach((item) => {
          const y = item.transform?.[5];
          const str = item.str ?? "";
          if (currentY === null) currentY = y;

          if (typeof y === "number" && Math.abs(y - currentY) > 1) {
            // new line detected
            text += line.trim() + "\n";
            line = str + " ";
            currentY = y;
          } else {
            line += str + " ";
          }
        });

        if (line) text += line.trim() + "\n";
      }

      return process_resume(text);
    } else if (
      file.type === "text/plain" ||
      file.type === "text/markdown"
    ) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () =>
          resolve(process_resume(String(reader.result || "")));
        reader.onerror = () => resolve("");
        reader.readAsText(file);
      });
    } else {
      return `[Resume File: ${file.name}] - Unsupported format.`;
    }
  } catch (err) {
    console.error("Error reading resume file:", err);
    return `[Resume File: ${file.name}] - Could not read content.`;
  }
}

function parseQuestionsFromResponse(response) {
  const rawLines = response.split("\n");
  const questions = [];
  let buffer = "";

  rawLines.forEach((line) => {
    // Detect new question by checking either [Company] or *[Company]*
    if (line.match(/^\d+\.\s*(\\)?\[[^\]]+\](\\)?/)) {
      if (buffer) questions.push(parseSingleQuestion(buffer));
      buffer = line.trim();
    } else if (line.trim()) {
      buffer += " " + line.trim();
    }
  });

  if (buffer) questions.push(parseSingleQuestion(buffer));

  return questions;
}

function parseSingleQuestion(text) {
  // Match both *[Company]* and [Company]
  const match = text.match(/^\d+\.\s*(?:\\)?\[([^\]]+)\](?:\\)?\s*(.+)/);
  if (match) {
    return {
      company: match[1].trim(),
      question: match[2].trim(),
      fullText: text,
    };
  } else {
    return {
      company: "General",
      question: text.replace(/^\d+\.\s*/, "").trim(),
      fullText: text,
    };
  }
}
