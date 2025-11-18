import { NextRequest, NextResponse } from "next/server"
import { mdToPdf } from "md-to-pdf"

export async function POST(request: NextRequest) {
  try {
    const { markdown } = await request.json()

    if (!markdown) {
      return NextResponse.json(
        { error: "Markdown content is required" },
        { status: 400 }
      )
    }

    // Generate PDF from markdown
    const pdf = await mdToPdf(
      { content: markdown },
      {
        pdf_options: {
          format: "A4",
          margin: {
            top: "20mm",
            right: "20mm",
            bottom: "20mm",
            left: "20mm",
          },
        },
        stylesheet: [
          `
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
          }
          h1, h2, h3, h4, h5, h6 {
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            font-weight: 600;
          }
          h1 { font-size: 2em; }
          h2 { font-size: 1.5em; }
          h3 { font-size: 1.25em; }
          code {
            background-color: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', Courier, monospace;
          }
          pre {
            background-color: #f4f4f4;
            padding: 12px;
            border-radius: 6px;
            overflow-x: auto;
          }
          pre code {
            background-color: transparent;
            padding: 0;
          }
          blockquote {
            border-left: 4px solid #ddd;
            margin-left: 0;
            padding-left: 1em;
            color: #666;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px 12px;
            text-align: left;
          }
          th {
            background-color: #f4f4f4;
            font-weight: 600;
          }
        `,
        ],
      }
    )

    if (!pdf || !pdf.content) {
      throw new Error("Failed to generate PDF")
    }

    // Return PDF as binary response
    return new NextResponse(pdf.content, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="romy-response-${Date.now()}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    )
  }
}
