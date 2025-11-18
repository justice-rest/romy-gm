import { NextRequest, NextResponse } from 'next/server'
import markdownpdf from 'markdown-pdf'
import { Readable } from 'stream'

export async function POST(request: NextRequest) {
  try {
    const { markdown } = await request.json()

    if (!markdown || typeof markdown !== 'string') {
      return NextResponse.json(
        { error: 'Markdown content is required' },
        { status: 400 }
      )
    }

    // Create a readable stream from the markdown string
    const markdownStream = Readable.from([markdown])

    // Create a buffer to collect the PDF chunks
    const chunks: Buffer[] = []

    return new Promise<NextResponse>((resolve, reject) => {
      const pdfStream = markdownpdf({
        paperFormat: 'A4',
        paperOrientation: 'portrait',
        paperBorder: '2cm',
        cssPath: undefined, // You can add a custom CSS path if needed
        remarkable: {
          html: true,
          breaks: true,
        },
      })

      // Pipe markdown through the converter
      markdownStream
        .pipe(pdfStream)
        .on('data', (chunk: Buffer) => {
          chunks.push(chunk)
        })
        .on('end', () => {
          const pdfBuffer = Buffer.concat(chunks)

          // Return the PDF as a downloadable file
          resolve(
            new NextResponse(pdfBuffer, {
              status: 200,
              headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="romy-response-${Date.now()}.pdf"`,
                'Content-Length': pdfBuffer.length.toString(),
              },
            })
          )
        })
        .on('error', (error: Error) => {
          console.error('PDF generation error:', error)
          reject(
            NextResponse.json(
              { error: 'Failed to generate PDF', details: error.message },
              { status: 500 }
            )
          )
        })
    })
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
