"use client"

import { DownloadSimple } from "@phosphor-icons/react"
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
      // Call the API route to generate PDF
      const response = await fetch("/api/download-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ markdown }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to generate PDF")
      }

      // Get the PDF blob from the response
      const blob = await response.blob()

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `romy-response-${Date.now()}.pdf`
      document.body.appendChild(link)
      link.click()

      // Clean up
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success("PDF downloaded successfully")
    } catch (error) {
      console.error("Error downloading PDF:", error)
      toast.error(
        error instanceof Error ? error.message : "Failed to download PDF"
      )
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
