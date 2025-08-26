const fs = require('fs');
const pdfParse = require('pdf-parse');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../', '.env') });

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));



const OPENROUTER_CONFIG = {
  apiKey: process.env.VITE_OPENROUTER_API_KEY,
  baseUrl: 'https://openrouter.ai/api/v1',
  model: 'deepseek/deepseek-chat-v3-0324:free',
  temperature: 0.7,
  maxTokens: 6000
};

// Validation function to check if API key is configured
function validateConfig() {
  if (!OPENROUTER_CONFIG.apiKey || OPENROUTER_CONFIG.apiKey === 'undefined') {
    throw new Error(
      'OpenRouter API key not configured. Please create a .env file in the root directory with:\n' +
      'VITE_OPENROUTER_API_KEY=your_actual_openrouter_api_key_here'
    );
  }
  return true;
} 

// Your combined helper function
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

function createPrompt(resumeText) {
  let prompt = `Generate 10 interview questions for the interviewee based on the following information:

RESUME CONTENT:
${resumeText}

TARGET COMPANIES:
1. Google
2. Amazon

IMPROVEMENT AREAS:
I need to practice speaking about conflict resolution for project developments

ADDITIONAL NOTES:
"None provided"

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
async function main() {
    try {
        // Read and parse PDF
        const pdfPath = './Martin Utrera Tech Resume - 2025.pdf';
        const pdffile = fs.readFileSync(pdfPath);
        const data = await pdfParse(pdffile);

        // Redact + identify sections (reuse your combined function)
        const processedText = process_resume(data.text);

        // 

        // Build the prompt
        const prompt = createPrompt(processedText)

        // Validate API key
        validateConfig()

        // Send to OpenRouter
        const response = await fetch(`${OPENROUTER_CONFIG.baseUrl}/chat/completions`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${OPENROUTER_CONFIG.apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: OPENROUTER_CONFIG.model,
                messages: [
                  {
                    role: "system",
                    content: "You are an expert technical interviewer and career coach."
                  },
                  {
                    role: "user",
                    content: prompt
                  }
                ],
                temperature: 0.7,
                max_tokens: 2000
              })
            });
        
            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(
                `OpenRouter API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`
              );
            }

        const result = await response.json();
        const aiReply = result.choices?.[0]?.message?.content;

        console.log('=== AI Response ===\n', aiReply);

    } catch (err) {
        console.error('Error:', err);
    }
}

main();