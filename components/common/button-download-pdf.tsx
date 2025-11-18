"use client"

import { DownloadSimple } from "@phosphor-icons/react"
import html2canvas from "html2canvas"
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

      // Create an isolated iframe for rendering
      const iframe = document.createElement("iframe")
      iframe.style.position = "absolute"
      iframe.style.left = "-9999px"
      iframe.style.top = "0"
      iframe.style.width = "920px"
      iframe.style.height = "1000px"
      document.body.appendChild(iframe)

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (!iframeDoc) {
        throw new Error("Could not access iframe document")
      }

      // Write complete HTML with inline styles to avoid any CSS inheritance
      iframeDoc.open()
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              background: #ffffff;
              color: #1a1a1a;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              padding: 60px;
              width: 800px;
            }
            .header {
              font-size: 24px;
              font-weight: 700;
              color: #1a1a1a;
              margin-bottom: 40px;
            }
            .content {
              color: #1a1a1a;
              font-size: 14px;
              line-height: 1.7;
            }
            .content h1 {
              font-size: 26px;
              font-weight: 700;
              margin-top: 32px;
              margin-bottom: 16px;
              color: #1a1a1a;
              line-height: 1.3;
            }
            .content h2 {
              font-size: 20px;
              font-weight: 700;
              margin-top: 28px;
              margin-bottom: 12px;
              color: #1a1a1a;
              line-height: 1.4;
            }
            .content h3 {
              font-size: 17px;
              font-weight: 600;
              margin-top: 24px;
              margin-bottom: 10px;
              color: #1a1a1a;
            }
            .content h4, .content h5, .content h6 {
              font-weight: 600;
              margin-top: 20px;
              margin-bottom: 8px;
              color: #1a1a1a;
            }
            .content p {
              margin-bottom: 16px;
              color: #1a1a1a;
              line-height: 1.7;
            }
            .content ul, .content ol {
              margin-bottom: 16px;
              margin-left: 24px;
            }
            .content li {
              margin-bottom: 8px;
              color: #1a1a1a;
              line-height: 1.7;
            }
            .content pre {
              background-color: #f5f5f5;
              padding: 16px;
              border-radius: 6px;
              margin-bottom: 16px;
              overflow-x: auto;
              font-size: 13px;
              font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
            }
            .content code {
              background-color: #f5f5f5;
              padding: 2px 6px;
              border-radius: 3px;
              font-size: 13px;
              font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
              color: #d63384;
            }
            .content pre code {
              background-color: transparent;
              padding: 0;
              color: #1a1a1a;
            }
            .content blockquote {
              border-left: 4px solid #e5e5e5;
              padding-left: 16px;
              margin-left: 0;
              margin-bottom: 16px;
              color: #666666;
              font-style: italic;
            }
            .content table {
              border-collapse: collapse;
              width: 100%;
              margin-bottom: 16px;
            }
            .content th, .content td {
              border: 1px solid #e5e5e5;
              padding: 10px 12px;
              text-align: left;
            }
            .content th {
              background-color: #f9f9f9;
              font-weight: 600;
            }
            .content strong, .content b {
              font-weight: 600;
            }
            .content a {
              color: #2563eb;
              text-decoration: none;
            }
            .content em, .content i {
              font-style: italic;
            }
            .content hr {
              border: none;
              border-top: 1px solid #e5e5e5;
              margin: 24px 0;
            }
          </style>
        </head>
        <body>
          <div class="header">Rōmy</div>
          <div class="content">${html}</div>
        </body>
        </html>
      `)
      iframeDoc.close()

      // Wait for iframe to render
      await new Promise((resolve) => setTimeout(resolve, 300))

      const container = iframeDoc.body

      // Use html2canvas to render the iframe content
      const canvas = await html2canvas(container, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      })

      // Clean up iframe
      document.body.removeChild(iframe)

      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      // Add first page
      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        0,
        position,
        imgWidth,
        imgHeight,
        undefined,
        "FAST"
      )
      heightLeft -= pageHeight

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(
          canvas.toDataURL("image/png"),
          "PNG",
          0,
          position,
          imgWidth,
          imgHeight,
          undefined,
          "FAST"
        )
        heightLeft -= pageHeight
      }

      // Add footer with generation timestamp
      const pageCount = (pdf.internal as any).getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i)
        pdf.setFontSize(9)
        pdf.setTextColor(150)
        pdf.text(
          `Generated by Rōmy • ${new Date().toLocaleDateString()}`,
          105,
          290,
          { align: "center" }
        )
        pdf.text(`Page ${i} of ${pageCount}`, 195, 290, { align: "right" })
      }

      // Save the PDF
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
