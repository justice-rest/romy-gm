"use client"

import { DownloadSimple } from "@phosphor-icons/react"
import jsPDF from "jspdf"
import { marked } from "marked"
import React, { useState } from "react"
import { toast } from "sonner"

type ButtonDownloadPdfProps = {
  markdown: string
}

export function ButtonDownloadPdf({ markdown }: ButtonDownloadPdfProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const onDownload = async () => {
    if (isDownloading) return

    setIsDownloading(true)
    try {
      // Convert markdown to HTML
      const html = await marked(markdown, {
        breaks: true,
        gfm: true,
      })

      // Create a temporary container for rendering HTML
      const container = document.createElement("div")
      container.style.position = "absolute"
      container.style.left = "-9999px"
      container.style.width = "800px"
      container.style.fontFamily =
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
      container.style.fontSize = "14px"
      container.style.lineHeight = "1.6"
      container.style.color = "#333"
      container.innerHTML = html

      document.body.appendChild(container)

      // Initialize jsPDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 20
      const maxWidth = pageWidth - margin * 2

      let yPosition = margin

      // Process each element in the container
      const elements = container.children
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i] as HTMLElement
        const text = element.textContent || ""

        if (!text.trim()) continue

        // Set font based on element type
        if (element.tagName.match(/^H[1-6]$/)) {
          const level = parseInt(element.tagName[1])
          const fontSize = 18 - level * 2
          pdf.setFontSize(fontSize)
          pdf.setFont("helvetica", "bold")
        } else if (element.tagName === "CODE" || element.tagName === "PRE") {
          pdf.setFontSize(11)
          pdf.setFont("courier", "normal")
        } else {
          pdf.setFontSize(12)
          pdf.setFont("helvetica", "normal")
        }

        // Split text to fit page width
        const lines = pdf.splitTextToSize(text, maxWidth)

        // Check if we need a new page
        const lineHeight = 7
        const blockHeight = lines.length * lineHeight

        if (yPosition + blockHeight > pageHeight - margin) {
          pdf.addPage()
          yPosition = margin
        }

        // Add text to PDF
        pdf.text(lines, margin, yPosition)
        yPosition += blockHeight + 5
      }

      // Clean up temporary container
      document.body.removeChild(container)

      // Save PDF
      pdf.save(`romy-response-${Date.now()}.pdf`)
      toast.success("PDF downloaded successfully")
    } catch (error) {
      console.error("Error downloading PDF:", error)
      toast.error("Failed to download PDF")
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <button
      onClick={onDownload}
      type="button"
      disabled={isDownloading}
      className="hover:bg-accent/60 text-muted-foreground hover:text-foreground flex size-7.5 items-center justify-center rounded-full bg-transparent transition disabled:opacity-50"
      aria-label="Download as PDF"
    >
      <DownloadSimple className="size-4" />
    </button>
  )
}
