// src/app/api/chat/route.ts
import { OpenAI } from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface ChatRequest {
  messages: { role: "user" | "assistant" | "system"; content: string }[];
}

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as ChatRequest;

    // Validate the request body
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request body: messages array is required" },
        { status: 400 }
      );
    }

    // Call the OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    // Extract the AI's response
    const aiMessage = response.choices[0].message.content;

    return NextResponse.json({ message: aiMessage }, { status: 200 });
  } catch (error) {
    console.error("Error fetching AI response:", error);
    return NextResponse.json(
      { error: "Failed to fetch AI response" },
      { status: 500 }
    );
  }
}