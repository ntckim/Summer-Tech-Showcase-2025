// Configuration for OpenRouter API
// Set your OpenRouter API key in a .env file in the root directory
// Example: VITE_OPENROUTER_API_KEY=your_actual_api_key_here

export const OPENROUTER_CONFIG = {
  apiKey: import.meta.env.VITE_OPENROUTER_API_KEY,
  baseUrl: 'https://openrouter.ai/api/v1',
  model: 'deepseek/deepseek-chat-v3-0324:free', // Correct model ID for DeepSeek V3
  temperature: 0.7,
  maxTokens: 2000
};

// Validation function to check if API key is configured
export function validateConfig() {
  if (!OPENROUTER_CONFIG.apiKey || OPENROUTER_CONFIG.apiKey === 'undefined') {
    throw new Error(
      'OpenRouter API key not configured. Please create a .env file in the root directory with:\n' +
      'VITE_OPENROUTER_API_KEY=your_actual_openrouter_api_key_here'
    );
  }
  return true;
} 