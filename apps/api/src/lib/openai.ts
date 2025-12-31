import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
    throw new Error("Missing OpenAI API Key");
}

export const openai = new OpenAI({
    apiKey: apiKey,
});
