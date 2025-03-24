"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Star, Menu, ArrowUp, Edit, Home, Trash } from "lucide-react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import SchemaVisualization from "@/components/schema-visualization";
import FormatMessage from "@/components/format-message";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Column {
  name: string;
  type: string;
  constraints?: string[];
}

interface Table {
  name: string;
  columns: Column[];
}

interface Schema {
  tables: Table[];
}

interface DisplayMessage {
  role: "user" | "assistant";
  content: string | object;
  schema?: Schema; // Replace `any[]` with `Schema`
  isEditing?: boolean;
}

interface Project {
  _id: string;
  name: string;
  schema: {
    messages: Message[];
  };
  pendingResponse?: boolean;
}

export default function ProjectPage() {
  const { id } = useParams();
  const router = useRouter();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([]);
  const [projectName, setProjectName] = useState("Database Schema");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSchema, setCurrentSchema] = useState<Schema>({ tables: [] }); // Replace `any[]` with `Schema`
  const [pendingResponse, setPendingResponse] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all projects
  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error("Failed to fetch projects");
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  // Toggle menu open/close
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (!isMenuOpen) {
      fetchProjects();
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (event.target && isMenuOpen && !(event.target as HTMLElement).closest(".menu-container")) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  // Handle project deletion
  const handleDeleteProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Failed to delete project");

      // Remove the deleted project from the state
      setProjects((prevProjects) => prevProjects.filter((project) => project._id !== projectId));

      // If the current project is deleted, redirect to the home page
      if (projectId === id) {
        router.push("/");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  // Process messages to extract schema data
  const processMessages = (msgs: Message[]): DisplayMessage[] => {
    let latestSchema: Schema = { tables: [] };

    const processed = msgs.map((msg) => {
      if (msg.role === "assistant") {
        try {
          const parsed = JSON.parse(msg.content);
          if (parsed.schema && parsed.schema.tables && parsed.schema.tables.length > 0) {
            latestSchema = parsed.schema;
          }
          return {
            role: "assistant" as const,
            content: parsed.message || msg.content,
            schema: parsed.schema || { tables: [] },
          };
        } catch (error) {
          console.error("Error parsing assistant message:", error);
          return { role: msg.role, content: msg.content, schema: { tables: [] } };
        }
      }
      return { role: msg.role, content: msg.content };
    });

    // Set the latest schema for display at the top
    setCurrentSchema(latestSchema);

    return processed;
  };

  // Fetch project data
  const fetchProject = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/projects/${id}`);

      if (!response.ok) {
        console.error(`API returned status: ${response.status}`);
        const errorText = await response.text();
        console.error(`Error response: ${errorText}`);
        throw new Error(`Failed to fetch project: ${response.statusText}`);
      }

      const project: Project = await response.json();
      console.log("Project data fetched:", project);

      if (project.schema?.messages) {
        // Store all messages for context
        setMessages(project.schema.messages);

        // Process all messages for display
        const processedMessages = processMessages(project.schema.messages);
        // Only keep the last two messages for display
        setDisplayMessages(processedMessages.slice(-2));
      }

      if (project.name) {
        setProjectName(project.name);
      }

      // Check if we're waiting for an AI response
      if (project.pendingResponse) {
        setPendingResponse(true);
        setIsGenerating(true);

        // Start polling for updates if we're waiting for a response
        startPolling();
      } else {
        setPendingResponse(false);
        setIsGenerating(false);
      }
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Start polling for project updates
  const startPolling = () => {
    // Clear any existing polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    // Poll every 2 seconds
    pollingRef.current = setInterval(() => {
      fetchProject();
    }, 2000);
  };

  // Stop polling
  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // Fetch project data on load
  useEffect(() => {
    if (id) {
      fetchProject();
    }

    // Cleanup polling on unmount
    return () => {
      stopPolling();
    };
  }, [id]);

  // Stop polling when pendingResponse becomes false
  useEffect(() => {
    if (!pendingResponse) {
      stopPolling();
    }
  }, [pendingResponse]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [displayMessages]);

  // Handle editing a message
  const handleEditMessage = (index: number) => {
    setDisplayMessages((prev) =>
      prev.map((msg, i) =>
        i === index ? { ...msg, isEditing: true } : msg
      )
    );
  };

  // Handle updating the edited message
  const handleUpdateMessage = (index: number, newContent: string) => {
    setDisplayMessages((prev) =>
      prev.map((msg, i) =>
        i === index ? { ...msg, content: newContent } : msg
      )
    );
  };

  // Handle resending the edited message
  const handleResendMessage = async (index: number) => {
    const editedMessage = displayMessages[index];

    if (!editedMessage.content) return;

    setIsLoading(true);
    setIsGenerating(true);

    try {
      // Step 1: Update the user's message in the messages array
      const updatedMessages = [...messages];
      updatedMessages[index * 2] = { role: "user", content: editedMessage.content as string };

      // Step 2: Regenerate the AI response for the edited message
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages.slice(0, index * 2 + 1), existingSchema: currentSchema }),
      });

      if (!response.ok) throw new Error("Failed to fetch AI response");
      const data = await response.json();

      // Step 3: Create AI message with structured content
      const aiMessageContent = JSON.stringify({
        message: data.message,
        schema: data.schema || { tables: [] },
      });

      const aiMessage: Message = {
        role: "assistant",
        content: aiMessageContent,
      };

      // Step 4: Update the AI response in the messages array
      updatedMessages[index * 2 + 1] = aiMessage;

      // Step 5: Update the messages array in the local state
      setMessages(updatedMessages);

      // Step 6: Update displayMessages to reflect the edited user input and regenerated AI response
      setDisplayMessages((prev) => {
        const newMessages = [
          ...prev.slice(0, index),
          { role: "user" as const, content: editedMessage.content as string },
          { role: "assistant" as const, content: data.message, schema: data.schema || { tables: [] } },
        ];
        return newMessages.slice(-2);
      });

      // Step 7: Update the project in the database
      const updateResponse = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schema: {
            messages: updatedMessages,
          },
          pendingResponse: false,
        }),
      });

      if (!updateResponse.ok) {
        throw new Error("Failed to update project in the database");
      }

      console.log("Project updated successfully in the database");
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong!");
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  // Merge new schema with existing schema
  const mergeSchemas = (existingSchema: Schema, newSchema: Schema): Schema => {
    const mergedSchema = { ...existingSchema };

    newSchema.tables.forEach((newTable) => {
      const existingTableIndex = mergedSchema.tables.findIndex(
        (table) => table.name === newTable.name
      );

      if (existingTableIndex === -1) {
        // If the table doesn't exist, add it to the schema
        mergedSchema.tables.push(newTable);
      } else {
        // If the table exists, merge the columns
        const existingTable = mergedSchema.tables[existingTableIndex];
        const mergedColumns = [...existingTable.columns];

        newTable.columns.forEach((newColumn) => {
          const existingColumnIndex = mergedColumns.findIndex(
            (col) => col.name === newColumn.name
          );

          if (existingColumnIndex === -1) {
            // If the column doesn't exist, add it to the table
            mergedColumns.push(newColumn);
          }
        });

        // Update the table with merged columns
        mergedSchema.tables[existingTableIndex] = {
          ...existingTable,
          columns: mergedColumns,
        };
      }
    });

    return mergedSchema;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: inputValue };

    // Update display messages immediately to show user input
    setDisplayMessages((prev) => {
      const newMessages = [...prev, { role: "user" as const, content: inputValue }];
      return newMessages.slice(-2);
    });

    setInputValue("");
    setIsLoading(true);
    setIsGenerating(true);

    try {
      // Get all messages for context
      const allMessages = [...messages, userMessage];

      // Update messages array immediately
      setMessages(allMessages);

      // Update the project with the new user message
      await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schema: {
            messages: allMessages,
          },
          pendingResponse: true,
        }),
      });

      // Start the API request for AI response
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMessages, existingSchema: currentSchema }), // Pass existing schema
      });

      if (!response.ok) throw new Error("Failed to fetch AI response");
      const data = await response.json();

      // Create AI message with structured content
      const aiMessageContent = JSON.stringify({
        message: data.message,
        schema: data.schema || { tables: [] },
      });

      const aiMessage: Message = {
        role: "assistant",
        content: aiMessageContent,
      };

      // Update all messages for context
      const updatedMessages = [...allMessages, aiMessage];
      setMessages(updatedMessages);

      // Update display messages
      setDisplayMessages((prev) => {
        const newMessages = [
          ...prev,
          {
            role: "assistant" as const,
            content: data.message,
            schema: data.schema || { tables: [] },
          },
        ];
        return newMessages.slice(-2);
      });

      // Update current schema if new schema is provided
      if (data.schema && data.schema.tables && data.schema.tables.length > 0) {
        // Merge new schema with existing schema
        const mergedSchema = mergeSchemas(currentSchema, data.schema);
        setCurrentSchema(mergedSchema);

        // Update project name based on schema if it's still the default
        if (projectName === "Database Schema" || projectName === "New Database Schema") {
          const newName = generateProjectName(mergedSchema);
          setProjectName(newName);

          // Update the project name in the database
          await fetch(`/api/projects/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: newName,
            }),
          });
        }
      }

      // Update the project in the database
      await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schema: {
            messages: updatedMessages,
          },
          pendingResponse: false,
        }),
      });
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong!");
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  // Generate a project name based on schema
  const generateProjectName = (schema: Schema): string => {
    if (!schema.tables || schema.tables.length === 0) return "Database Schema Project";

    // Get the main entity names
    const entityNames = schema.tables.map((table) => table.name);

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

  return (
    <div className="min-h-screen bg-[#ffffff] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#e5e5e5] px-4 py-3 flex items-center">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-[#000000]" />
          <span className="font-semibold text-[#000000]">KeyMap</span>
        </div>
        <div className="flex-1 flex justify-center">
          <span className="font-semibold text-[#000000] truncate max-w-[60%]">{projectName}</span>
        </div>
        <div className="flex items-center gap-4 menu-container">
          <button onClick={toggleMenu} className="p-1 rounded-full hover:bg-gray-100">
            <Menu className="h-5 w-5 text-[#000000]" />
          </button>
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
          </Avatar>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 top-10 bg-white border border-[#d1d5db] rounded-lg shadow-lg w-64 z-10">
              <div className="p-3 border-b border-[#d1d5db] bg-[#f9fafb]">
                <h3 className="font-semibold text-black text-sm">Your Projects</h3>
              </div>

              {isLoading ? (
                <div className="p-3 flex items-center justify-center">
                  <div className="animate-pulse flex space-x-2">
                    <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
                    <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
                    <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
                  </div>
                  <span className="ml-2 text-sm text-gray-500">Loading...</span>
                </div>
              ) : projects.length === 0 ? (
                <p className="p-3 text-sm text-gray-500 text-center">No projects created</p>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {projects.map((project) => (
                    <div
                      key={project._id}
                      className="flex items-center justify-between p-3 text-sm text-[#000000] hover:bg-[#f0f9ff] border-b border-[#d1d5db] last:border-b-0 transition"
                    >
                      <Link
                        href={`/project/${project._id}`}
                        className="hover:text-[#007aff] flex-1"
                      >
                        {project.name}
                      </Link>
                      <button
                        onClick={() => handleDeleteProject(project._id)}
                        className="p-1 hover:text-red-500 transition"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="p-3 border-t border-[#d1d5db]">
                <button
                  onClick={() => router.push("/")}
                  className="w-full flex items-center gap-2 text-sm text-[#000000] hover:text-[#007aff]"
                >
                  <Home className="h-4 w-4" />
                  <span>Home</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col px-4 py-6">
        <div className="w-full max-w-3xl mx-auto flex-1">
          {/* Schema Visualization at the top */}
          {currentSchema.tables && currentSchema.tables.length > 0 && (
            <div className="mb-6">
              <SchemaVisualization tables={currentSchema.tables} className="border border-gray-300 rounded-lg" />
            </div>
          )}

          {isLoading && displayMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-pulse flex space-x-2">
                <div className="h-3 w-3 bg-gray-500 rounded-full"></div>
                <div className="h-3 w-3 bg-gray-500 rounded-full"></div>
                <div className="h-3 w-3 bg-gray-500 rounded-full"></div>
              </div>
              <span className="ml-2 text-gray-500">Loading conversation...</span>
            </div>
          ) : (
            /* Chat Messages */
            <div className="space-y-4 mb-6">
              {displayMessages.map((msg, index) => (
                <div key={index} className="space-y-4">
                  {/* Message bubble */}
                  <div
                    className={`p-4 rounded-lg relative ${
                      msg.role === "user"
                        ? "bg-[#E0EDE0] text-black ml-auto max-w-fit rounded-2xl"
                        : "border border-gray-300 text-black max-w-[80%] rounded-2xl"
                    }`}
                  >
                    {msg.isEditing ? (
                      <textarea
                        value={typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content)}
                        onChange={(e) => handleUpdateMessage(index, e.target.value)}
                        className="w-full p-2 rounded-lg border border-gray-300"
                        autoFocus
                      />
                    ) : typeof msg.content === "string" ? (
                      // Use FormatMessage to render the content
                      <FormatMessage content={msg.content} />
                    ) : (
                      <pre>{JSON.stringify(msg.content, null, 2)}</pre>
                    )}

                    {/* Edit icon for user messages */}
                    {msg.role === "user" && !msg.isEditing && (
                      <button
                        onClick={() => handleEditMessage(index)}
                        className="absolute -bottom-2 -right-2 p-1 rounded-full bg-white border border-gray-300 hover:bg-gray-100"
                      >
                        <Edit className="h-4 w-4 text-gray-600" />
                      </button>
                    )}

                    {/* Resend button for edited messages */}
                    {msg.role === "user" && msg.isEditing && (
                      <button
                        onClick={() => handleResendMessage(index)}
                        className="absolute -bottom-2 -right-2 p-1 rounded-full bg-blue-500 text-white hover:bg-blue-600"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isGenerating && (
                <div className="p-4 rounded-lg border border-gray-300 text-black flex items-center gap-2 max-w-[80%]">
                  <div className="animate-pulse flex space-x-2">
                    <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
                    <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
                    <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
                  </div>
                  <span className="text-gray-500">Generating response...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Field */}
        <div className="w-full max-w-3xl mx-auto mt-auto">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              placeholder="Ask anything about your database schema"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full py-4 px-6 rounded-[12px] border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#47c2ff] text-[#3b3b3b]"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#000000] text-white p-3 rounded-full"
              disabled={isLoading}
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}