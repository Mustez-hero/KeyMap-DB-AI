import { ObjectId } from "mongodb"; // Import ObjectId from MongoDB
import clientPromise from "@/lib/mongodb"; // Import your MongoDB client
import { NextResponse } from "next/server"; // Import NextResponse from Next.js

// Define the type for a message object
type Message = {
  role: "user" | "assistant"; // Role can be either "user" or "assistant"
  content: string; // Content of the message
};

// POST Handler: Create a new project
export async function POST(req: Request) {
  try {
    const { name, schema, pendingResponse } = await req.json();

    if (!schema?.messages || !Array.isArray(schema.messages)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Ensure only the latest user input and AI response are kept
    const latestUserMessage = schema.messages.findLast((msg: Message) => msg.role === "user"); // Find the latest user message
    const latestAiResponse = schema.messages.findLast((msg: Message) => msg.role === "assistant"); // Find the latest AI response

    // Create a new messages array with only the latest user message and AI response
    const recentMessages: Message[] = [];
    if (latestUserMessage) recentMessages.push(latestUserMessage);
    if (latestAiResponse) recentMessages.push(latestAiResponse);

    const client = await clientPromise; // Use the MongoDB client
    const db = client.db("keymap");

    const now = new Date().toISOString();

    // Create the project document with only the latest user message and AI response
    const projectDoc = {
      _id: new ObjectId(), // Generate a new ObjectId
      name: name || "New Database Schema",
      schema: {
        ...schema, // Preserve other schema properties
        messages: recentMessages, // Override messages with the latest user input and AI response
      },
      pendingResponse: pendingResponse || false,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection("projects").insertOne(projectDoc);

    return NextResponse.json({ message: "Project created", project: projectDoc }, { status: 201 });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}

// GET Handler: Fetch all projects
export async function GET() {
  try {
    const client = await clientPromise; // Use the MongoDB client
    const db = client.db("keymap");

    // Fetch all projects from the database
    const projects = await db.collection("projects").find().toArray();

    // Return the projects as a JSON response
    return NextResponse.json(projects, { status: 200 });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}