const { GoogleGenAI } = require("@google/genai");
require('dotenv').config();

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

async function test(version, model) {
    console.log(`\n--- Testing ${model} with version ${version} ---`);
    try {
        // Note: The SDK constructor might not take apiVersion directly, 
        // but we can try to pass it or just rely on default.
        // Actually, the new SDK might use a different way to set version.
        // But let's try just the model name first.

        const ai = new GoogleGenAI({ apiKey: apiKey });

        const response = await ai.models.generateContent({
            model: model,
            contents: [
                {
                    role: 'user',
                    parts: [{ text: "Hello" }]
                }
            ],
            config: {
                responseMimeType: 'text/plain'
            }
        });
        console.log(`SUCCESS with ${model}! Response:`, response.text);
        return true;
    } catch (error) {
        console.error(`FAILED with ${model}:`);
        console.error(error.message);
        return false;
    }
}

async function main() {
    const models = ["gemini-1.5-flash", "gemini-1.5-flash-001", "gemini-2.0-flash-exp", "gemini-2.5-flash"];

    for (const model of models) {
        if (await test("default", model)) return;
    }
}

main();
