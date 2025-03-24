"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Star, Menu, Plus, Trash } from "lucide-react" // Import Trash icon
import { Avatar, AvatarImage } from "@/components/ui/avatar"

interface Project {
  _id: string
  name: string
}

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch saved projects from the database when the menu is opened
  useEffect(() => {
    if (isMenuOpen) {
      const fetchProjects = async () => {
        try {
          setIsLoading(true)
          const response = await fetch("/api/projects", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store", // Ensures fresh data is always fetched
          })

          if (!response.ok) throw new Error("Failed to fetch projects")

          const data = await response.json()

          // Map the data to the expected format
          const formattedProjects = data.map((project: any) => ({
            _id: project._id,
            name: project.name || "Untitled Project",
          }))

          setProjects(formattedProjects)
        } catch (error) {
          console.error("Error fetching projects:", error)
        } finally {
          setIsLoading(false)
        }
      }

      fetchProjects()
    }
  }, [isMenuOpen])

  // Function to handle project deletion
  const handleDeleteProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      })

      if (!response.ok) throw new Error("Failed to delete project")

      // Remove the deleted project from the state
      setProjects((prevProjects) =>
        prevProjects.filter((project) => project._id !== projectId)
      )
    } catch (error) {
      console.error("Error deleting project:", error)
    }
  }

  return (
    <div className="min-h-screen bg-[#ffffff] flex flex-col">
      {/* Header */}
      <header className="border-b border-[#e5e5e5] px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-[#000000]" />
          <span className="font-semibold text-[#000000]">KeyMap</span>
        </div>
        <div className="flex items-center gap-4 relative">
          {/* Menu Icon */}
          <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
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
            </div>
          )}

          {/* Avatar */}
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
          </Avatar>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-2xl font-medium text-[#000000]">
            Welcome, <span className="italic">User</span>.
          </h1>
          <p className="text-xl text-[#7d8187]">What are we building today?</p>
        </div>

        {/* New Project Button */}
        <Link href="/new-project">
          <button className="flex items-center gap-2 py-3 px-6 rounded-full bg-[#000000] text-white text-center hover:bg-[#333333] transition">
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </button>
        </Link>
      </main>
    </div>
  )
}