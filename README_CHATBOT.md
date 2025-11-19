# Chatbot Setup Guide

## Overview
The FinMate app includes an AI-powered chatbot that provides financial advice and answers questions about your spending, savings, and financial goals. The chatbot uses Google's Gemini AI model.

## Prerequisites
- A Google account
- Internet connection

## Setup Instructions

### Step 1: Get a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### Step 2: Configure the Environment Variable

1. In the project root directory (`money-transfer/`), copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open the `.env` file and replace `your_api_key_here` with your actual API key:
   ```
   EXPO_PUBLIC_GEMINI_API_KEY=AIzaSy...your_actual_key_here
   ```

3. Save the file

### Step 3: Restart the Development Server

1. Stop the current development server (Ctrl+C)
2. Start it again:
   ```bash
   npx expo start
   ```

## Testing the Chatbot

1. Open the app in your browser or mobile device
2. Log in with a demo account (e.g., `user1@example.com` / `user123`)
3. Click the floating chatbot button (message icon) at the bottom of the screen
4. Type a message like "Hello" or "How can I save more money?"
5. The chatbot should respond with personalized financial advice

## Troubleshooting

### "Chatbot is not configured" Error
- **Cause**: The API key is not set or is invalid
- **Solution**: 
  1. Check that the `.env` file exists in the project root
  2. Verify the API key is correctly set in the `.env` file
  3. Restart the development server

### "API request failed with status 429" Error
- **Cause**: API quota exceeded
- **Solution**: 
  1. Check your API usage at [Google AI Studio](https://aistudio.google.com/)
  2. Wait for the quota to reset (usually daily for free tier)
  3. Consider upgrading to a paid plan if needed

### Chatbot Not Responding
- **Cause**: Network issues or API problems
- **Solution**:
  1. Check your internet connection
  2. Check the browser console for error messages
  3. Verify the API key is valid

## API Limits

The free tier of Gemini API includes:
- 60 requests per minute
- 1,500 requests per day

For higher limits, consider upgrading to a paid plan.

## Security Notes

- **Never commit your `.env` file to version control** - it contains your API key
- The `.env` file is already in `.gitignore` to prevent accidental commits
- Keep your API key private and don't share it publicly
- If you accidentally expose your API key, delete it immediately and create a new one

## Features

The chatbot can help with:
- Spending analysis and insights
- Budget recommendations
- Savings tips and strategies
- Financial planning advice
- Answering questions about your transactions
- Personalized financial guidance based on your data

## Privacy

- Your financial data is sent to Google's Gemini API for processing
- Conversations are not stored permanently
- Review Google's privacy policy for more information about data handling
