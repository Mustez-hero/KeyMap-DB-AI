"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Star, Menu, ArrowUp, Edit, Home, Trash } from "lucide-react" // Import Trash icon
import { Avatar, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import TextareaAutosize from "react-textarea-autosize"

export default function NewProject() {
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showUserMessage, setShowUserMessage] = useState(false)
  const [userMessage, setUserMessage] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const router = useRouter()

  // Fetch all projects
  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      if (!response.ok) throw new Error("Failed to fetch projects")
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error("Error fetching projects:", error)
    }
  }

  // Toggle dropdown menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
    if (!isMenuOpen) {
      fetchProjects() // Fetch projects when the menu is opened
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (event.target && isMenuOpen && !(event.target as HTMLElement).closest(".menu-container")) {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isMenuOpen])

  // Handle project deletion
  const handleDeleteProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) throw new Error("Failed to delete project")

      // Remove the deleted project from the state
      setProjects((prevProjects) => prevProjects.filter((project) => project._id !== projectId))
    } catch (error) {
      console.error("Error deleting project:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    setUserMessage(inputValue)
    setShowUserMessage(true)
    setIsLoading(true)
    setIsGenerating(true)

    try {
      const projectResponse = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "New Database Schema",
          schema: {
            messages: [{ role: "user", content: inputValue }],
          },
          pendingResponse: true,
        }),
      })

      if (!projectResponse.ok) {
        throw new Error("Failed to create project")
      }

      const projectData = await projectResponse.json()
      const projectId = projectData.project._id

      const chatPromise = fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: inputValue,
            },
          ],
          isInitial: true,
        }),
      })

      setTimeout(() => {
        router.push(`/project/${projectId}`)
      }, 1500)

      chatPromise
        .then(async (response) => {
          if (!response.ok) throw new Error("Failed to fetch AI response")
          const chatData = await response.json()

          await fetch(`/api/projects/${projectId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: chatData.projectName || "Database Schema Project",
              schema: {
                messages: [
                  { role: "user", content: inputValue },
                  {
                    role: "assistant",
                    content: JSON.stringify({
                      message: chatData.message,
                      schema: chatData.schema || [],
                    }),
                  },
                ],
              },
              pendingResponse: false,
            }),
          })
        })
        .catch((error) => {
          console.error("Background processing error:", error)
        })
    } catch (error) {
      console.error("Error:", error)
      alert("Something went wrong!")
      setShowUserMessage(false)
      setIsLoading(false)
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#ffffff] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#e5e5e5] px-4 py-3 flex items-center">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-[#000000]" />
          <span className="font-semibold text-[#000000]">KeyMap</span>
        </div>
        <div className="flex-1 flex justify-center">
          <span className="font-semibold text-[#000000]">New Project</span>
        </div>
        <div className="flex items-center gap-4 menu-container">
          {/* Menu Button */}
          <button onClick={toggleMenu} className="p-1 rounded-full hover:bg-gray-100">
            <Menu className="h-5 w-5 text-[#000000]" />
          </button>

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

              {/* Home Button */}
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

          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
          </Avatar>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center px-4">
        {!showUserMessage ? (
          <div className="text-center space-y-2 mt-80">
            <h1 className="text-2xl font-medium text-[#000000]">
              Let's design your <span className="italic">database schema</span>.
            </h1>
            <p className="text-xl text-[#7d8187]">What kind of application are you building?</p>
          </div>
        ) : (
          <div className="w-full max-w-3xl mx-auto mt-20">
            <div className="space-y-4 mb-6">
              {/* User Message with Edit Icon */}
              <div className="relative p-4 rounded-2xl bg-[#E0EDE0] text-black ml-auto max-w-fit">
                {userMessage}
                <button
                  className="absolute -bottom-2 -right-2 p-1 rounded-full bg-white border border-gray-300 cursor-not-allowed"
                  disabled
                >
                  <Edit className="h-4 w-4 text-gray-600" />
                </button>
              </div>

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
            </div>
          </div>
        )}

        {/* Input Field */}
        <div className="w-full max-w-3xl mx-auto flex flex-col flex-grow justify-end pb-10">
          <form onSubmit={handleSubmit} className="relative">
            <TextareaAutosize
              placeholder="Describe your application or ask a question"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full py-4 px-6 rounded-[12px] border border-[#e5e5e5] focus:outline-none focus:ring-2 focus:ring-[#47c2ff] text-[#3b3b3b] resize-none"
              disabled={isLoading || showUserMessage}
              minRows={1}
              maxRows={Infinity}
              style={{
                width: "100%",
                paddingRight: "4rem",
                whiteSpace: "pre-wrap",
                overflowWrap: "break-word",
                overflow: "hidden",
              }}
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#000000] text-white p-3 rounded-full"
              disabled={isLoading || showUserMessage}
            >
              <ArrowUp className="h-5 w-5" />
            </button>
          </form>
        </div>
      </main>
    </div>
  )
}