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

      // Create a container with Perplexity-like styling
      const container = document.createElement("div")
      container.style.position = "absolute"
      container.style.left = "-9999px"
      container.style.top = "0"
      container.style.width = "800px"
      container.style.padding = "60px"
      container.style.backgroundColor = "#ffffff"
      container.style.fontFamily =
        "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"

      // Add branding header
      const header = document.createElement("div")
      header.style.marginBottom = "40px"
      header.innerHTML = `
        <div style="font-size: 24px; font-weight: 700; color: #1a1a1a; margin-bottom: 24px;">
          Rōmy
        </div>
      `

      // Style the markdown content
      const content = document.createElement("div")
      content.innerHTML = html
      content.style.color = "#1a1a1a"
      content.style.fontSize = "14px"
      content.style.lineHeight = "1.7"

      // Apply styles to elements
      const styleElements = () => {
        // Headings
        content.querySelectorAll("h1").forEach((el) => {
          ;(el as HTMLElement).style.fontSize = "26px"
          ;(el as HTMLElement).style.fontWeight = "700"
          ;(el as HTMLElement).style.marginTop = "32px"
          ;(el as HTMLElement).style.marginBottom = "16px"
          ;(el as HTMLElement).style.color = "#1a1a1a"
          ;(el as HTMLElement).style.lineHeight = "1.3"
        })

        content.querySelectorAll("h2").forEach((el) => {
          ;(el as HTMLElement).style.fontSize = "20px"
          ;(el as HTMLElement).style.fontWeight = "700"
          ;(el as HTMLElement).style.marginTop = "28px"
          ;(el as HTMLElement).style.marginBottom = "12px"
          ;(el as HTMLElement).style.color = "#1a1a1a"
          ;(el as HTMLElement).style.lineHeight = "1.4"
        })

        content.querySelectorAll("h3").forEach((el) => {
          ;(el as HTMLElement).style.fontSize = "17px"
          ;(el as HTMLElement).style.fontWeight = "600"
          ;(el as HTMLElement).style.marginTop = "24px"
          ;(el as HTMLElement).style.marginBottom = "10px"
          ;(el as HTMLElement).style.color = "#1a1a1a"
        })

        // Paragraphs
        content.querySelectorAll("p").forEach((el) => {
          ;(el as HTMLElement).style.marginBottom = "16px"
          ;(el as HTMLElement).style.color = "#1a1a1a"
          ;(el as HTMLElement).style.lineHeight = "1.7"
        })

        // Lists
        content.querySelectorAll("ul, ol").forEach((el) => {
          ;(el as HTMLElement).style.marginBottom = "16px"
          ;(el as HTMLElement).style.marginLeft = "24px"
        })

        content.querySelectorAll("li").forEach((el) => {
          ;(el as HTMLElement).style.marginBottom = "8px"
          ;(el as HTMLElement).style.color = "#1a1a1a"
          ;(el as HTMLElement).style.lineHeight = "1.7"
        })

        // Code blocks
        content.querySelectorAll("pre").forEach((el) => {
          ;(el as HTMLElement).style.backgroundColor = "#f5f5f5"
          ;(el as HTMLElement).style.padding = "16px"
          ;(el as HTMLElement).style.borderRadius = "6px"
          ;(el as HTMLElement).style.marginBottom = "16px"
          ;(el as HTMLElement).style.overflowX = "auto"
          ;(el as HTMLElement).style.fontSize = "13px"
          ;(el as HTMLElement).style.fontFamily =
            "'SF Mono', 'Monaco', 'Consolas', monospace"
        })

        content.querySelectorAll("code").forEach((el) => {
          if ((el.parentElement as HTMLElement)?.tagName !== "PRE") {
            ;(el as HTMLElement).style.backgroundColor = "#f5f5f5"
            ;(el as HTMLElement).style.padding = "2px 6px"
            ;(el as HTMLElement).style.borderRadius = "3px"
            ;(el as HTMLElement).style.fontSize = "13px"
            ;(el as HTMLElement).style.fontFamily =
              "'SF Mono', 'Monaco', 'Consolas', monospace"
            ;(el as HTMLElement).style.color = "#d63384"
          }
        })

        // Blockquotes
        content.querySelectorAll("blockquote").forEach((el) => {
          ;(el as HTMLElement).style.borderLeft = "4px solid #e5e5e5"
          ;(el as HTMLElement).style.paddingLeft = "16px"
          ;(el as HTMLElement).style.marginLeft = "0"
          ;(el as HTMLElement).style.marginBottom = "16px"
          ;(el as HTMLElement).style.color = "#666"
          ;(el as HTMLElement).style.fontStyle = "italic"
        })

        // Tables
        content.querySelectorAll("table").forEach((el) => {
          ;(el as HTMLElement).style.borderCollapse = "collapse"
          ;(el as HTMLElement).style.width = "100%"
          ;(el as HTMLElement).style.marginBottom = "16px"
        })

        content.querySelectorAll("th, td").forEach((el) => {
          ;(el as HTMLElement).style.border = "1px solid #e5e5e5"
          ;(el as HTMLElement).style.padding = "10px 12px"
          ;(el as HTMLElement).style.textAlign = "left"
        })

        content.querySelectorAll("th").forEach((el) => {
          ;(el as HTMLElement).style.backgroundColor = "#f9f9f9"
          ;(el as HTMLElement).style.fontWeight = "600"
        })

        // Strong/Bold
        content.querySelectorAll("strong").forEach((el) => {
          ;(el as HTMLElement).style.fontWeight = "600"
        })

        // Links
        content.querySelectorAll("a").forEach((el) => {
          ;(el as HTMLElement).style.color = "#2563eb"
          ;(el as HTMLElement).style.textDecoration = "none"
        })
      }

      styleElements()

      container.appendChild(header)
      container.appendChild(content)
      document.body.appendChild(container)

      // Wait for fonts and styles to load
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Convert all oklch colors to standard RGB format
      const convertOklchColors = (element: HTMLElement) => {
        const allElements = element.querySelectorAll("*")
        allElements.forEach((el) => {
          const htmlEl = el as HTMLElement
          const computedStyle = window.getComputedStyle(htmlEl)

          // Convert color properties
          const colorProps = [
            "color",
            "backgroundColor",
            "borderColor",
            "borderTopColor",
            "borderRightColor",
            "borderBottomColor",
            "borderLeftColor",
          ]

          colorProps.forEach((prop) => {
            const value = computedStyle.getPropertyValue(prop)
            if (value && value.includes("oklch")) {
              // Force browser to compute the color
              const tempDiv = document.createElement("div")
              tempDiv.style.color = value
              document.body.appendChild(tempDiv)
              const computed = window.getComputedStyle(tempDiv).color
              document.body.removeChild(tempDiv)
              htmlEl.style.setProperty(prop, computed)
            }
          })
        })
      }

      convertOklchColors(container)

      // Use html2canvas to render the styled HTML
      const canvas = await html2canvas(container, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          // Additional cleanup in cloned document
          const clonedContainer = clonedDoc.body.querySelector(
            "div"
          ) as HTMLElement
          if (clonedContainer) {
            convertOklchColors(clonedContainer)
          }
        },
      })

      // Clean up
      document.body.removeChild(container)

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
