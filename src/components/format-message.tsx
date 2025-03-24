"use client"

import React from "react"

interface FormatMessageProps {
  content: string
}

export default function FormatMessage({ content }: FormatMessageProps) {
  // Function to process markdown-style bold text
  const processBoldText = (text: string) => {
    return text.split(/(\*\*.*?\*\*)/).map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        // This is bold text
        const boldContent = part.slice(2, -2)
        return <strong key={index}>{boldContent}</strong>
      }
      return <React.Fragment key={index}>{part}</React.Fragment>
    })
  }

  // Split content into paragraphs
  const paragraphs = content.split("\n\n")

  return (
    <div className="formatted-content">
      {paragraphs.map((paragraph, pIndex) => {
        // Check if this is a bullet point list
        if (
          paragraph
            .trim()
            .split("\n")
            .some((line) => line.trim().startsWith("•"))
        ) {
          const lines = paragraph.trim().split("\n")
          return (
            <div key={pIndex} className={pIndex > 0 ? "mt-4" : ""}>
              {lines.map((line, lIndex) => {
                if (line.trim().startsWith("•")) {
                  return (
                    <div key={lIndex} className="flex items-start my-2">
                      <span className="mr-2 flex-shrink-0">•</span>
                      <span>{processBoldText(line.trim().substring(1).trim())}</span>
                    </div>
                  )
                }
                return (
                  <div key={lIndex} className="my-1">
                    {processBoldText(line)}
                  </div>
                )
              })}
            </div>
          )
        }

        // Check if this is a numbered list
        else if (/^\d+\.\s/.test(paragraph.trim())) {
          const lines = paragraph.trim().split("\n")
          return (
            <div key={pIndex} className={pIndex > 0 ? "mt-4" : ""}>
              {lines.map((line, lIndex) => (
                <div key={lIndex} className="my-2">
                  {processBoldText(line)}
                </div>
              ))}
            </div>
          )
        }

        // Regular paragraph
        else {
          return (
            <p key={pIndex} className={pIndex > 0 ? "mt-4" : ""}>
              {paragraph.split("\n").map((line, lIndex) => (
                <React.Fragment key={lIndex}>
                  {lIndex > 0 && <br />}
                  {processBoldText(line)}
                </React.Fragment>
              ))}
            </p>
          )
        }
      })}
    </div>
  )
}

