import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";

interface ProjectSchema {
  _id: string;
  schema: {
    messages: { role: "user" | "assistant"; content: string }[];
  };
  createdAt: string;
  updatedAt: string;
}

// GET Handler: Fetch a project by ID
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  console.log(`Received GET request for project ID: ${id}`);

  try {
    const client = await clientPromise;
    const db = client.db("keymap");
    const project = await db.collection<ProjectSchema>("projects").findOne({ _id: id });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project, { status: 200 });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

// PUT Handler: Update a project by ID
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  console.log(`Received PUT request for project ID: ${id}`);

  try {
    const { schema } = await req.json();

    if (!schema?.messages || !Array.isArray(schema.messages)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const validRoles = ["user", "assistant"];
    for (const message of schema.messages) {
      if (!validRoles.includes(message.role)) {
        return NextResponse.json({ error: `Invalid role: ${message.role}` }, { status: 400 });
      }
    }

    const client = await clientPromise;
    const db = client.db("keymap");

    const updatedProject = await db.collection<ProjectSchema>("projects").findOneAndUpdate(
      { _id: id },
      { $set: { schema, updatedAt: new Date().toISOString() } },
      { returnDocument: "after" }
    );

    if (!updatedProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Project updated", project: updatedProject }, { status: 200 });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}
