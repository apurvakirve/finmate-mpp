const { GoogleGenAI } = require("@google/genai");
require('dotenv').config();

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

async function main() {
    try {
        console.log("Testing Gemini SDK with key:", apiKey ? "Present" : "Missing");

        // Try to generate content with gemini-1.5-flash
        console.log("Attempting to generate content with gemini-1.5-flash...");
        const response = await ai.models.generateContent({
            model: "gemini-1.5-flash",
            contents: [
                {
                    role: 'user',
                    parts: [{ text: "Hello, are you working?" }]
                }
            ]
        });
        console.log("Response:", response.text);
    } catch (error) {
        console.error("Error with gemini-1.5-flash:", error.message);

        // If that fails, try to list models (if supported by this SDK version)
        // Note: The new SDK might not have a direct listModels method on the client instance like the old one.
        // We'll try a few other model names.

        const modelsToTry = ["gemini-1.5-flash-001", "gemini-1.5-pro", "gemini-1.0-pro", "gemini-2.0-flash-exp"];

        for (const model of modelsToTry) {
            try {
                console.log(`\nAttempting with ${model}...`);
                const res = await ai.models.generateContent({
                    model: model,
                    contents: [
                        {
                            role: 'user',
                            parts: [{ text: "Hello" }]
                        }
                    ]
                });
                console.log(`Success with ${model}! Response:`, res.text);
                break;
            } catch (e) {
                console.log(`Failed with ${model}:`, e.message);
            }
        }
    }
}

main();
