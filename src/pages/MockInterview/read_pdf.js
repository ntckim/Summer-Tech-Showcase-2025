import fs from 'fs';
import pdfParse from 'pdf-parse';

/*
* Removes personal information (name, email, phone, linked in and github profiles)
* Identifies sections (education, skills, etc) by adding a tag "SECTION: " for the 
* AI to better interpret 
*
* @param {string} text - full text parsed from PDF
* @returns {string} processed text
*/
function process_resume(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    let firstLineRedacted = false;
    let processedText = '';
    const sectionHeaderRegex = /^([A-Z ]{2,})\s*[_-]*$/;

    // Regex patterns for personal info
    const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
    const phoneRegex = /\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}/g;
    const linkedinRegex = /https?:\/\/(www\.)?linkedin\.com\/[A-Za-z0-9_-]+\/?/gi;
    const githubRegex = /https?:\/\/(www\.)?github\.com\/[A-Za-z0-9_-]+\/?/gi;

    for (let line of lines) {
        // Step 1: Redact first line (name)
        if (!firstLineRedacted) {
            line = '[REDACTED NAME]';
            firstLineRedacted = true;
        } else {
            // Step 2: Redact other personal info
            line = line
                .replace(emailRegex, '[REDACTED EMAIL]')
                .replace(phoneRegex, '[REDACTED PHONE]')
                .replace(linkedinRegex, '[REDACTED LINKEDIN]')
                .replace(githubRegex, '[REDACTED GITHUB]');
        }

        // Step 3: Identify section headers
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
        const pdfPath = './Martin Utrera Tech Resume - 2025.pdf';
        const pdffile = fs.readFileSync(pdfPath);

        const data = await pdfParse(pdffile);
        console.log('=== Original Text ===\n', data.text.slice(0, 500), '...\n');

        const processedText = process_resume(data.text);
        console.log('=== Processed Text ===\n', processedText.slice(0, 3000), '...\n');

        // Now processedText is ready to feed to your AI
    } catch (err) {
        console.error('Error parsing PDF:', err);
    }
}

main();
