# Mock Interview Setup Guide

## Quick Setup

### 1. Get Your OpenRouter API Key
1. Go to [OpenRouter](https://openrouter.ai/)
2. Sign up for a free account
3. Navigate to "API Keys" in your dashboard
4. Click "Create API Key"
5. Copy the generated API key

**🎉 ADVANTAGES:**
- **Multiple AI Models**: Access to Claude, GPT-4, Gemini, and more
- **Competitive Pricing**: Often cheaper than direct API access
- **Unified Interface**: Single API for multiple providers
- **Free Credits**: New users get free credits to start
- **DeepSeek V3**: Currently using this excellent free model!

### 2. Create Environment File
In the root directory of this project, create a file named `.env`:

```bash
# Create .env file in the root directory
touch .env
```

Add your API key to the `.env` file:

```bash
VITE_OPENROUTER_API_KEY=your_actual_openrouter_api_key_here
```

**Important**: Replace `your_actual_openrouter_api_key_here` with your real OpenRouter API key.

### 3. Restart Development Server
If you're running the development server, restart it to load the new environment variables:

```bash
npm run dev
```

## File Structure
```
Summer-Tech-Showcase-2025/
├── .env                    # Your API key (create this file)
├── src/pages/MockInterview/
│   ├── MockInterview.jsx   # Main component
│   ├── InterviewForm.jsx   # Form component
│   ├── openRouterService.js # OpenRouter AI integration
│   └── config.js           # Configuration (auto-loads from .env)
└── README.md
```

## Current Model: DeepSeek V3

### 🚀 **Why DeepSeek V3?**
- **Free**: No cost for usage within limits
- **High Quality**: Excellent reasoning and question generation
- **Fast**: Quick response times
- **Reliable**: Consistent performance
- **Latest**: Released in March 2024 with cutting-edge capabilities

### 📊 **Model Details**
- **Provider**: DeepSeek AI
- **Model**: DeepSeek V3 (0324)
- **Model ID**: `deepseek/deepseek-chat-v3-0324:free`
- **Cost**: Free tier available
- **Context**: 163,840 tokens
- **Parameters**: 685B mixture-of-experts model
- **Quality**: Comparable to GPT-4 and Claude 3.5
- **Specialty**: Excellent at structured tasks like interview questions

## Verification
1. Navigate to the Mock Interview page
2. Upload a resume and fill out the form
3. Click "Start Interview"
4. If configured correctly, you'll see "Generating personalized interview questions with AI…"
5. If there's an error, check that your `.env` file is in the root directory and contains the correct API key

## Troubleshooting

### "OpenRouter API key not configured"
- Ensure `.env` file is in the root directory (same level as `package.json`)
- Check that the API key is correct
- Restart your development server after creating the `.env` file

### "Failed to generate questions"
- Verify your API key is valid
- Check your OpenRouter account has sufficient credits
- Ensure you're not hitting rate limits

## Why OpenRouter?

### ✅ **Advantages**
- **Model Choice**: Access to best models from multiple providers
- **Cost Effective**: Often cheaper than direct API access
- **Unified API**: Single integration for multiple AI services
- **Free Credits**: New users get free credits to start
- **Reliable**: Professional service with good uptime
- **DeepSeek V3**: Currently using this excellent free model!

### 📊 **Available Models**
- **DeepSeek V3**: High quality, free tier (current choice)
- **Claude 3.5 Sonnet**: High quality, good pricing
- **GPT-4**: OpenAI's latest model
- **Gemini Pro**: Google's advanced model
- **Llama 3**: Meta's open-source model
- **And many more...**

### 💰 **Pricing**
- **Free Credits**: New users get free credits
- **Pay-per-use**: Only pay for what you use
- **Competitive Rates**: Often cheaper than direct access
- **No Hidden Fees**: Transparent pricing
- **DeepSeek V3**: Free tier available!

## Security Notes
- **Never commit your `.env` file** to version control
- The `.env` file is already in `.gitignore` to prevent accidental commits
- In production, API keys should be stored server-side, not in the frontend 