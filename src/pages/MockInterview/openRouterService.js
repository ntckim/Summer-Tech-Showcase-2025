import { OPENROUTER_CONFIG, validateConfig } from "./config.js";
const fs = require('fs');

export async function generateInterviewQuestions(formData) {
  try {
    // Validate configuration first
    validateConfig();

    // Read the resume file content
    let resumeText = "";
    if (formData.resume) {
      resumeText = await readResumeFile(formData.resume); //assuming this pulls the resume file and not metadata or anything else
    }

    // Create a comprehensive prompt for the AI model
    const prompt = createPrompt(formData, resumeText);

    // read master prompt from .txt file
    const master_prompt = fs.readFileSync('./model_output.txt', 'utf-8');

    // Make HTTP request to OpenRouter
    const response = await fetch(`${OPENROUTER_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_CONFIG.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Mock Interview App'
      },
      body: JSON.stringify({
        model: OPENROUTER_CONFIG.model,
        messages: [
          {
            role: "system",
            content: master_prompt
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: OPENROUTER_CONFIG.temperature,
        max_tokens: OPENROUTER_CONFIG.maxTokens
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`
      );
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response content received from OpenRouter');
    }

    // Parse the response to extract questions
    return parseQuestionsFromResponse(aiResponse);
  } catch (error) {
    console.error("Error generating questions:", error);
    if (error.message.includes("API key")) {
      throw new Error(
        "OpenRouter API key not configured. Please create a .env file in the root directory with:\n" +
        "VITE_OPENROUTER_API_KEY=your_actual_openrouter_api_key_here"
      );
    }
    if (error.message.includes("OpenRouter API error")) {
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
  const { companies, improvementAreas, notes } = formData;

  let prompt = `Generate 10 interview questions for a interviewee based on the following information:

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
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    let firstLineRedacted = false;
    let processedText = '';
    const sectionHeaderRegex = /^([A-Z ]{2,})\s*[_-]*$/;

    const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
    const phoneRegex = /\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g;
    const linkedinRegex = /https?:\/\/(www\.)?linkedin\.com\/[A-Za-z0-9_-]+\/?/gi;
    const githubRegex = /https?:\/\/(www\.)?github\.com\/[A-Za-z0-9_-]+\/?/gi;

    for (let line of lines) {
        if (!firstLineRedacted) {
            line = '[REDACTED NAME]';
            firstLineRedacted = true;
        } else {
            line = line
                .replace(emailRegex, '[REDACTED EMAIL]')
                .replace(phoneRegex, '[REDACTED PHONE]')
                .replace(linkedinRegex, '[REDACTED LINKEDIN]')
                .replace(githubRegex, '[REDACTED GITHUB]');
        }

        const match = line.match(sectionHeaderRegex);
        if (match) {
            const section = match[1].trim();
            processedText += `\n--- SECTION: ${section} ---\n`;
        } else {
            processedText += line + ' ';
        }
    }

    return processedText;
}

async function readResumeFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        let rawText;

        if (file.type === "application/pdf") {
          // PDF files need proper parsing — this is a placeholder
          rawText = `[PDF Resume: ${file.name}] - Content would be extracted here.`;
        } else if (
          file.type === "text/plain" ||
          file.type === "text/markdown"
        ) {
          rawText = e.target.result;
        } else {
          rawText = `[Resume File: ${file.name}] - Please ensure your resume highlights your key skills, experiences, and achievements.`;
        }

        // Process the raw text through your existing function
        const processed = process_resume(rawText);
        resolve(processed);

      } catch (err) {
        resolve(
          `[Resume File: ${file.name}] - Content could not be read.`
        );
      }
    };

    reader.onerror = () => {
      resolve(
        `[Resume File: ${file.name}] - Content could not be read.`
      );
    };

    reader.readAsText(file);
  });
}

function parseQuestionsFromResponse(response) {
  const rawLines = response.split("\n");
  const questions = [];
  let buffer = "";

  rawLines.forEach((line) => {
    // Detect new question by checking either [Company] or **[Company]**
    if (line.match(/^\d+\.\s*(\*\*)?\[[^\]]+\](\*\*)?/)) {
      if (buffer) {
        questions.push(parseSingleQuestion(buffer));
      }
      buffer = line.trim();
    } else if (line.trim()) {
      buffer += " " + line.trim();
    }
  });

  if (buffer) {
    questions.push(parseSingleQuestion(buffer));
  }

  return questions;
}

function parseSingleQuestion(text) {
  // Match both **[Company]** and [Company]
  const match = text.match(/^\d+\.\s*(?:\*\*)?\[([^\]]+)\](?:\*\*)?\s*(.+)/);
  if (match) {
    return {
      company: match[1].trim(),
      question: match[2].trim(),
      fullText: text
    };
  } else {
    return {
      company: "General",
      question: text.replace(/^\d+\.\s*/, "").trim(),
      fullText: text
    };
  }
}

