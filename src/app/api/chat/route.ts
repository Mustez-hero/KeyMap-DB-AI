import { NextResponse } from "next/server";

// Define types
interface Attribute {
  name: string;
  type: string;
}

interface Entity {
  name: string;
  attributes: Attribute[];
}

interface Relationship {
  from: string;
  to: string;
  type: string;
}

interface EntityAnalysis {
  entities: Entity[];
  relationships: Relationship[];
}

interface Column {
  name: string;
  type: string;
  isPrimary: boolean;
  isForeign?: boolean;
  reference?: string;
}

interface Table {
  name: string;
  columns: Column[];
}

// Hugging Face API endpoint and token
const HF_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";
const HF_API_TOKEN = process.env.HUGGING_FACE_API_TOKEN!;

// Helper function to generate a project name based on the schema
const generateProjectName = (schema: Table[]): string => {
  if (!schema || schema.length === 0) return "Database Schema Project";

  // Get the main entity names
  const entityNames = schema.map((table) => table.name);

  if (entityNames.length === 1) {
    return `${entityNames[0]} Database`;
  } else if (entityNames.length === 2) {
    return `${entityNames[0]} & ${entityNames[1]} System`;
  } else {
    // Find the most likely "main" entity
    const mainEntities = entityNames.filter(
      (name) =>
        !name.toLowerCase().includes("log") &&
        !name.toLowerCase().includes("history") &&
        !name.toLowerCase().includes("setting"),
    );

    if (mainEntities.length > 0) {
      return `${mainEntities[0]} Management System`;
    } else {
      return `${entityNames[0]} Database System`;
    }
  }
};

export async function POST(req: Request) {
  try {
    const { messages, isInitial, existingSchema, projectId } = (await req.json()) as {
      messages: { role: string; content: string }[];
      isInitial?: boolean;
      existingSchema?: Table[];
      projectId?: string;
    };

    // Validate the request body
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Extract the user's input (last message)
    const userInput = messages[messages.length - 1].content.trim();
    const userInputLower = userInput.toLowerCase();

    // Check message type for optimized response
    const isGreeting = /^(hi|hello|hey|greetings|howdy)/i.test(userInputLower);
    const isGeneralQuestion =
      /^(what|how|why|when|where|who|can you|could you|would you|is there|are there|do you|explain|define)/i.test(
        userInputLower,
      );
    const isDatabaseRequest = /(database|schema|table|field|column|entity|model|collection|document|record)/i.test(
      userInput,
    );
    const isHelpful = /(thank|thanks|good|great|excellent|awesome|nice|helpful)/i.test(userInputLower);
    const isSchemaDescription =
      /(manage|track|log|store|organize|handle|employees|companies|roles|activities|projects|tasks)/i.test(userInput);

    // Initialize schema from existing or empty array
    let schema: Table[] = existingSchema || [];

    // Handle simple responses without calling the API
    if (isGreeting) {
      return NextResponse.json(
        {
          message: "Hello! I'm your database assistant. What kind of database schema do you need help with?",
          projectName: isInitial ? "Database Schema Project" : undefined,
          schema: isInitial ? schema : undefined,
        },
        { status: 200 },
      );
    }

    // Handle "thank you" messages
    if (isHelpful && !isDatabaseRequest) {
      return NextResponse.json(
        {
          message: "You're welcome! Need help with anything else?",
          schema: undefined,
        },
        { status: 200 },
      );
    }

    // Handle general questions about databases
    if (isGeneralQuestion && !isDatabaseRequest) {
      const isSchemaQuestion = /(what is a schema|define schema|explain schema)/i.test(userInputLower);

      if (isSchemaQuestion) {
        return NextResponse.json(
          {
            message:
              "A database schema is the structure that defines how data is organized in a database. It includes tables/collections, fields/columns, relationships, and constraints.",
            schema: undefined,
          },
          { status: 200 },
        );
      }

      // For other general questions, generate a dynamic response
      const generalQuestionPrompt = `<s>[INST] You are a database expert. Answer this question concisely: "${userInput}" (max 2-3 sentences). Use simple language. [/INST]`;

      const response = await fetch(HF_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HF_API_TOKEN}`,
        },
        body: JSON.stringify({
          inputs: generalQuestionPrompt,
          parameters: {
            max_new_tokens: 150,
            temperature: 0.7,
            top_p: 0.95,
            do_sample: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch response");
      }

      const responseData = await response.json();
      let aiResponse = responseData[0]?.generated_text || "I couldn't generate a response. Could you rephrase your question?";

      // Extract only the new content after the prompt
      if (aiResponse.includes(generalQuestionPrompt)) {
        aiResponse = aiResponse.substring(generalQuestionPrompt.length).trim();
      }

      // Clean up any remaining instruction tags
      aiResponse = aiResponse.replace(/\[INST\]|\[\/INST\]/g, "").trim();

      return NextResponse.json(
        {
          message: aiResponse,
          schema: undefined,
        },
        { status: 200 },
      );
    }

    // Handle schema-related requests
    if (isSchemaDescription || isDatabaseRequest) {
      // First analyze the entities and relationships
      const analysisPrompt = `<s>[INST] You are a database expert. Analyze this request and identify the entities, attributes, and relationships:
"${userInput}"

Format your response as a structured JSON with these exact keys:
1. "entities": Array of entity objects with "name" and "attributes" (array of attribute objects with "name" and "type")
2. "relationships": Array of relationship objects with "from", "to", and "type" (one-to-one, one-to-many, many-to-many)

Be precise and only include entities and attributes explicitly mentioned or strongly implied in the request.
Use appropriate data types (uuid, varchar, text, integer, decimal, boolean, date, timestamp).
Ensure all entities have an id attribute.
[/INST]`;

      const analysisResponse = await fetch(HF_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${HF_API_TOKEN}`,
        },
        body: JSON.stringify({
          inputs: analysisPrompt,
          parameters: {
            max_new_tokens: 800,
            temperature: 0.3,
            top_p: 0.95,
            do_sample: true,
          },
        }),
      });

      if (!analysisResponse.ok) {
        throw new Error("Failed to analyze request");
      }

      const analysisData = await analysisResponse.json();
      let analysisText = analysisData[0]?.generated_text || "";

      // Extract only the new content after the prompt
      if (analysisText.includes(analysisPrompt)) {
        analysisText = analysisText.substring(analysisPrompt.length).trim();
      }

      // Extract JSON from the analysis
      let entityAnalysis: EntityAnalysis = { entities: [], relationships: [] };
      try {
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/m);
        if (jsonMatch) {
          const jsonText = jsonMatch[0];
          entityAnalysis = JSON.parse(jsonText);
        }
      } catch (e) {
        console.error("Error parsing entity analysis:", e);
        return NextResponse.json(
          {
            message: "I had trouble understanding your request. Could you provide more specific details about the database schema you need?",
            schema: schema,
          },
          { status: 200 },
        );
      }

      // Convert entities to tables
      if (entityAnalysis.entities && entityAnalysis.entities.length > 0) {
        const newTables = entityAnalysis.entities.map((entity: Entity) => {
          const hasId = entity.attributes.some((attr: Attribute) => attr.name.toLowerCase() === "id");
          const attributes = hasId ? entity.attributes : [{ name: "id", type: "uuid" }, ...entity.attributes];

          return {
            name: entity.name.toLowerCase().replace(/\s+/g, "_"),
            columns: attributes.map((attr: Attribute) => {
              return {
                name: attr.name.toLowerCase().replace(/\s+/g, "_"),
                type: attr.type || "varchar",
                isPrimary: attr.name.toLowerCase() === "id",
              };
            }),
          };
        });

        // Append new tables to the existing schema
        schema = [...schema, ...newTables];

        // Handle relationships
        if (entityAnalysis.relationships && entityAnalysis.relationships.length > 0) {
          entityAnalysis.relationships.forEach((rel: Relationship) => {
            const fromTable = schema.find((t: Table) => t.name === rel.from.toLowerCase().replace(/\s+/g, "_"));
            const toTable = schema.find((t: Table) => t.name === rel.to.toLowerCase().replace(/\s+/g, "_"));

            if (fromTable && toTable) {
              if (rel.type === "one-to-many" || rel.type === "many-to-one") {
                const manyTable = rel.type === "one-to-many" ? toTable : fromTable;
                const oneTable = rel.type === "one-to-many" ? fromTable : toTable;

                const fkName = `${oneTable.name}_id`;
                const fkExists = manyTable.columns.some((col: Column) => col.name === fkName);

                if (!fkExists) {
                  manyTable.columns.push({
                    name: fkName,
                    type: "uuid",
                    isPrimary: false,
                    isForeign: true,
                    reference: `${oneTable.name}.id`,
                  });
                }
              } else if (rel.type === "many-to-many") {
                const junctionName = `${fromTable.name}_${toTable.name}`;
                const junctionExists = schema.some((t: Table) => t.name === junctionName);

                if (!junctionExists) {
                  schema.push({
                    name: junctionName,
                    columns: [
                      { name: "id", type: "uuid", isPrimary: true },
                      {
                        name: `${fromTable.name}_id`,
                        type: "uuid",
                        isPrimary: false,
                        isForeign: true,
                        reference: `${fromTable.name}.id`,
                      },
                      {
                        name: `${toTable.name}_id`,
                        type: "uuid",
                        isPrimary: false,
                        isForeign: true,
                        reference: `${toTable.name}.id`,
                      },
                    ],
                  });
                }
              }
            }
          });
        }
      }

      // Generate a dynamic response
      const dynamicResponse = `I've created a schema based on your request. Here's what I came up with:\n\n${schema
        .map((table) => `• ${table.name} (${table.columns.map((col) => col.name).join(", ")})`)
        .join("\n")}\n\nWould you like to make any adjustments?`;

      // Generate project name if this is the first schema
      let projectName = "Database Schema Project";
      if (!existingSchema || existingSchema.length === 0) {
        projectName = generateProjectName(schema);

        // Update project name if projectId exists
        if (projectId) {
          await fetch(`/api/projects/${projectId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: projectName,
            }),
          });
        }
      }

      return NextResponse.json(
        {
          message: dynamicResponse,
          schema: schema,
          projectName: projectName,
        },
        { status: 200 },
      );
    }

    // Default response for unrelated requests
    return NextResponse.json(
      {
        message: "I specialize in database schemas. Could you tell me more about what you're trying to build?",
        schema: undefined,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        error: "An error occurred while processing your request. Please try again.",
        schema: undefined,
      },
      { status: 500 },
    );
  }
}