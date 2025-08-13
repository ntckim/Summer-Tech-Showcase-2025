import { OPENROUTER_CONFIG, validateConfig } from "./config.js";

export async function generateInterviewQuestions(formData) {
  try {
    // Validate configuration first
    validateConfig();

    // Read the resume file content
    let resumeText = "";
    if (formData.resume) {
      resumeText = await readResumeFile(formData.resume);
    }

    // Create a comprehensive prompt for the AI model
    const prompt = createPrompt(formData, resumeText);

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
            content: "You are an expert technical interviewer and career coach. Your task is to generate 10 highly relevant interview questions based on the candidate's resume, target companies, and improvement areas. Make questions specific and tailored to the individual."
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

  let prompt = `Generate 10 interview questions for a candidate based on the following information:

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

Make the questions challenging but appropriate for the candidate's level.`;

  return prompt;
}

async function readResumeFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (file.type === "application/pdf") {
          // For PDF files, we'll extract text content if possible
          // This is a simplified approach - in production you might want to use a PDF parsing library
          resolve(
            `[PDF Resume: ${file.name}] - Content would be extracted here. For now, please ensure your resume highlights your key skills, experiences, and achievements.`
          );
        } else if (
          file.type === "text/plain" ||
          file.type === "text/markdown"
        ) {
          // For text files, we can read the content directly
          resolve(e.target.result);
        } else {
          // For other file types, provide a generic message
          resolve(
            `[Resume File: ${file.name}] - Please ensure your resume highlights your key skills, experiences, and achievements.`
          );
        }
      } catch (err) {
        resolve(
          `[Resume File: ${file.name}] - Content could not be read. Please ensure your resume highlights your key skills, experiences, and achievements.`
        );
      }
    };
    reader.onerror = () => {
      resolve(
        `[Resume File: ${file.name}] - Content could not be read. Please ensure your resume highlights your key skills, experiences, and achievements.`
      );
    };
    reader.readAsText(file);
  });
}

function parseQuestionsFromResponse(response) {
  // Parse the numbered questions from the AI response
  const lines = response.split("\n").filter((line) => line.trim());
  const questions = [];

  lines.forEach((line) => {
    // Look for numbered lines (1., 2., etc.)
    const match = line.match(/^\d+\.\s*\[([^\]]+)\]\s*(.+)/);
    if (match) {
      const company = match[1].trim();
      const question = match[2].trim();
      questions.push({
        company,
        question,
        fullText: line.trim(),
      });
    }
  });

  // If parsing fails, fallback to simple line splitting
  if (questions.length === 0) {
    return lines.slice(0, 10).map((line) => ({
      company: "General",
      question: line.replace(/^\d+\.\s*/, ""),
      fullText: line.trim(),
    }));
  }

  return questions;
}
