"use client"

import { DownloadSimple } from "@phosphor-icons/react"
import html2pdf from "html2pdf.js"
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
      const htmlContent = await marked(markdown, {
        breaks: true,
        gfm: true,
      })

      // Create a temporary container with the content
      const container = document.createElement("div")
      container.style.position = "absolute"
      container.style.left = "-9999px"
      container.style.top = "0"
      container.style.width = "800px"
      container.style.background = "#ffffff"
      container.style.padding = "60px"
      container.style.fontFamily =
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
      container.style.color = "#1a1a1a"
      container.style.fontSize = "14px"
      container.style.lineHeight = "1.7"

      container.innerHTML = `
        <div style="font-size: 24px; font-weight: 700; color: #1a1a1a; margin-bottom: 40px;">Rōmy</div>
        <div class="pdf-content">${htmlContent}</div>
      `

      document.body.appendChild(container)

      // Apply inline styles to all elements for proper PDF rendering
      const contentDiv = container.querySelector(".pdf-content") as HTMLElement
      if (contentDiv) {
        // Style headings
        contentDiv.querySelectorAll("h1").forEach((el) => {
          ;(el as HTMLElement).style.fontSize = "26px"
          ;(el as HTMLElement).style.fontWeight = "700"
          ;(el as HTMLElement).style.marginTop = "32px"
          ;(el as HTMLElement).style.marginBottom = "16px"
          ;(el as HTMLElement).style.color = "#1a1a1a"
          ;(el as HTMLElement).style.lineHeight = "1.3"
        })

        contentDiv.querySelectorAll("h2").forEach((el) => {
          ;(el as HTMLElement).style.fontSize = "20px"
          ;(el as HTMLElement).style.fontWeight = "700"
          ;(el as HTMLElement).style.marginTop = "28px"
          ;(el as HTMLElement).style.marginBottom = "12px"
          ;(el as HTMLElement).style.color = "#1a1a1a"
          ;(el as HTMLElement).style.lineHeight = "1.4"
        })

        contentDiv.querySelectorAll("h3").forEach((el) => {
          ;(el as HTMLElement).style.fontSize = "17px"
          ;(el as HTMLElement).style.fontWeight = "600"
          ;(el as HTMLElement).style.marginTop = "24px"
          ;(el as HTMLElement).style.marginBottom = "10px"
          ;(el as HTMLElement).style.color = "#1a1a1a"
        })

        contentDiv.querySelectorAll("h4, h5, h6").forEach((el) => {
          ;(el as HTMLElement).style.fontWeight = "600"
          ;(el as HTMLElement).style.marginTop = "20px"
          ;(el as HTMLElement).style.marginBottom = "8px"
          ;(el as HTMLElement).style.color = "#1a1a1a"
        })

        // Style paragraphs
        contentDiv.querySelectorAll("p").forEach((el) => {
          ;(el as HTMLElement).style.marginBottom = "16px"
          ;(el as HTMLElement).style.color = "#1a1a1a"
          ;(el as HTMLElement).style.lineHeight = "1.7"
        })

        // Style lists
        contentDiv.querySelectorAll("ul, ol").forEach((el) => {
          ;(el as HTMLElement).style.marginBottom = "16px"
          ;(el as HTMLElement).style.marginLeft = "24px"
        })

        contentDiv.querySelectorAll("li").forEach((el) => {
          ;(el as HTMLElement).style.marginBottom = "8px"
          ;(el as HTMLElement).style.color = "#1a1a1a"
          ;(el as HTMLElement).style.lineHeight = "1.7"
        })

        // Style code blocks
        contentDiv.querySelectorAll("pre").forEach((el) => {
          ;(el as HTMLElement).style.backgroundColor = "#f5f5f5"
          ;(el as HTMLElement).style.padding = "16px"
          ;(el as HTMLElement).style.borderRadius = "6px"
          ;(el as HTMLElement).style.marginBottom = "16px"
          ;(el as HTMLElement).style.fontSize = "13px"
          ;(el as HTMLElement).style.fontFamily =
            "'SF Mono', 'Monaco', 'Consolas', monospace"
          ;(el as HTMLElement).style.color = "#1a1a1a"
        })

        contentDiv.querySelectorAll("code").forEach((el) => {
          if (!(el.parentElement instanceof HTMLPreElement)) {
            ;(el as HTMLElement).style.backgroundColor = "#f5f5f5"
            ;(el as HTMLElement).style.padding = "2px 6px"
            ;(el as HTMLElement).style.borderRadius = "3px"
            ;(el as HTMLElement).style.fontSize = "13px"
            ;(el as HTMLElement).style.fontFamily =
              "'SF Mono', 'Monaco', 'Consolas', monospace"
            ;(el as HTMLElement).style.color = "#d63384"
          }
        })

        // Style blockquotes
        contentDiv.querySelectorAll("blockquote").forEach((el) => {
          ;(el as HTMLElement).style.borderLeft = "4px solid #e5e5e5"
          ;(el as HTMLElement).style.paddingLeft = "16px"
          ;(el as HTMLElement).style.marginLeft = "0"
          ;(el as HTMLElement).style.marginBottom = "16px"
          ;(el as HTMLElement).style.color = "#666666"
          ;(el as HTMLElement).style.fontStyle = "italic"
        })

        // Style tables
        contentDiv.querySelectorAll("table").forEach((el) => {
          ;(el as HTMLElement).style.borderCollapse = "collapse"
          ;(el as HTMLElement).style.width = "100%"
          ;(el as HTMLElement).style.marginBottom = "16px"
        })

        contentDiv.querySelectorAll("th, td").forEach((el) => {
          ;(el as HTMLElement).style.border = "1px solid #e5e5e5"
          ;(el as HTMLElement).style.padding = "10px 12px"
          ;(el as HTMLElement).style.textAlign = "left"
        })

        contentDiv.querySelectorAll("th").forEach((el) => {
          ;(el as HTMLElement).style.backgroundColor = "#f9f9f9"
          ;(el as HTMLElement).style.fontWeight = "600"
        })

        // Style other elements
        contentDiv.querySelectorAll("strong, b").forEach((el) => {
          ;(el as HTMLElement).style.fontWeight = "600"
        })

        contentDiv.querySelectorAll("a").forEach((el) => {
          ;(el as HTMLElement).style.color = "#2563eb"
          ;(el as HTMLElement).style.textDecoration = "none"
        })

        contentDiv.querySelectorAll("em, i").forEach((el) => {
          ;(el as HTMLElement).style.fontStyle = "italic"
        })

        contentDiv.querySelectorAll("hr").forEach((el) => {
          ;(el as HTMLElement).style.border = "none"
          ;(el as HTMLElement).style.borderTop = "1px solid #e5e5e5"
          ;(el as HTMLElement).style.margin = "24px 0"
        })
      }

      // Generate PDF with selectable text using html2pdf
      const opt = {
        margin: 0,
        filename: `romy-response-${Date.now()}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" as const },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      }

      await html2pdf().from(container).set(opt).save()

      // Clean up
      document.body.removeChild(container)
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
