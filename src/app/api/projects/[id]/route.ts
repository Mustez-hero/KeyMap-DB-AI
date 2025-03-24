import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { NextResponse } from "next/server"

interface ProjectSchema {
  _id: ObjectId
  name: string
  schema: {
    messages: { role: "user" | "assistant"; content: string }[]
  }
  pendingResponse?: boolean
  createdAt: string
  updatedAt: string
}

// GET Handler: Fetch a project by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } } // Correct type for App Router
) {
  const { id } = params
  console.log(`Received GET request for project ID: ${id}`)

  try {
    const client = await clientPromise
    const db = client.db("keymap")

    // Convert the string ID to an ObjectId
    const objectId = new ObjectId(id)

    console.log(`Querying MongoDB for project with _id: ${objectId}`)

    const project = await db.collection("projects").findOne({ _id: objectId })

    if (!project) {
      console.log(`Project with ID ${id} not found`)
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    console.log(`Project found: ${project._id}`)
    return NextResponse.json(project)
  } catch (error) {
    console.error("Error fetching project:", error)
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 })
  }
}

// PUT Handler: Update a project by ID
export async function PUT(
  req: Request,
  { params }: { params: { id: string } } // Correct type for App Router
) {
  const { id } = params
  console.log(`Received PUT request for project ID: ${id}`)

  try {
    const { schema, name, pendingResponse } = await req.json()
    const updateData: Partial<ProjectSchema> = { updatedAt: new Date().toISOString() }

    if (schema?.messages && Array.isArray(schema.messages)) {
      updateData.schema = schema
    }

    if (name) {
      updateData.name = name
    }

    if (pendingResponse !== undefined) {
      updateData.pendingResponse = pendingResponse
    }

    if (Object.keys(updateData).length <= 1) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db("keymap")

    const objectId = new ObjectId(id)

    const result = await db.collection("projects").updateOne({ _id: objectId }, { $set: updateData })

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Project updated" }, { status: 200 })
  } catch (error) {
    console.error("Error updating project:", error)
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 })
  }
}

// DELETE Handler: Delete a project by ID
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } } // Correct type for App Router
) {
  const { id } = params
  console.log(`Received DELETE request for project ID: ${id}`)

  try {
    const client = await clientPromise
    const db = client.db("keymap")

    // Convert the string ID to an ObjectId
    const objectId = new ObjectId(id)

    console.log(`Attempting to delete project with _id: ${objectId}`)

    const result = await db.collection("projects").deleteOne({ _id: objectId })

    if (result.deletedCount === 0) {
      console.log(`Project with ID ${id} not found`)
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    console.log(`Project deleted: ${id}`)
    return NextResponse.json({ message: "Project deleted successfully" }, { status: 200 })
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 })
  }
}