const fs = require('fs');
const pdfParse = require('pdf-parse');
const fetch = require('node-fetch'); // Install via `npm install node-fetch`

const OPENROUTER_CONFIG = {
  apiKey: process.env.OPENROUTER_API_KEY,
  baseUrl: 'https://openrouter.ai/api/v1',
  model: 'deepseek/deepseek-chat-v3-0324:free',
  temperature: 0.7,
  maxTokens: 2000
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

async function main() {
    try {
        // Read and parse PDF
        const pdfPath = './Martin Utrera Tech Resume - 2025.pdf';
        const pdffile = fs.readFileSync(pdfPath);
        const data = await pdfParse(pdffile);

        // Redact + identify sections (reuse your combined function)
        const processedText = process_resume(data.text);

        // Build the prompt
        const prompt = `Here is my resume. In your opinion, what are the biggest strenghts of this resume?\n\n${processedText}`;

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
