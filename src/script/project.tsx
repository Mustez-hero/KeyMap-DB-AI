// src/app/new-project/page.tsx
"use client"; // Mark this component as a Client Component

import { useState } from "react";
import { Star, Menu, ArrowUp } from "lucide-react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

export default function NewProject() {
  // State for the input value
  const [inputValue, setInputValue] = useState("");

  // State for loading
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate the input value
      if (!inputValue.trim()) {
        alert("Please enter a valid input.");
        return;
      }

      // Call the /api/chat endpoint to get the AI response
      const chatResponse = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: inputValue }],
        }),
      });

      // Handle chat API errors
      if (!chatResponse.ok) {
        const errorData = await chatResponse.json();
        throw new Error(errorData.error || "Failed to fetch AI response");
      }

      const chatData = await chatResponse.json();
      const aiMessage = chatData.message;

      // Prepare the schema object for saving the project
      const schema = {
        messages: [
          { role: "user", content: inputValue }, // User's input
          { role: "assistant", content: aiMessage }, // AI's response
        ],
      };

      // Call the /api/projects endpoint to save the project
      const projectResponse = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ schema }), // Send the schema object
      });

      // Handle project API errors
      if (!projectResponse.ok) {
        const errorData = await projectResponse.json();
        throw new Error(errorData.error || "Failed to save project");
      }

      const projectData = await projectResponse.json();
      const projectId = projectData.id;

      // Redirect to the new project page
      window.location.href = `/project/${projectId}`; // Use correct URL format
    } catch (error) {
      console.error("Error:", error);
      alert(error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false); // Reset loading state
    }
  };

  return (
    <div className="min-h-screen bg-[#ffffff] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#e5e5e5] px-4 py-3 flex items-center">
        {/* Left Section: KeyMap */}
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-[#000000]" />
          <span className="font-semibold text-[#000000]">KeyMap</span>
        </div>

        {/* Center Section: New Project */}
        <div className="flex-1 flex justify-center">
          <span className="font-semibold text-[#000000]">New Project</span>
        </div>

        {/* Right Section: Menu and Avatar */}
        <div className="flex items-center gap-4">
          <Menu className="h-5 w-5 text-[#000000]" />
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
          </Avatar>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        {/* Welcome Message */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-2xl font-medium text-[#000000]">
            let start your <span className="italic">project</span>.
          </h1>
          <p className="text-xl text-[#7d8187]">What are we building today?</p>
        </div>

        {/* Input Field */}
        <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto mt-20">
          <div className="relative">
            <input
              type="text"
              placeholder="Ask anything"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full py-4 px-6 rounded-[12px] border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#47c2ff] text-[#3b3b3b]"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#000000] text-white p-2 rounded-full"
              disabled={isLoading}
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}