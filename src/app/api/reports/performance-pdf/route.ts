import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { PerformanceReportPdf } from "@/lib/pdf/PerformanceReportPdf";
import React from "react";

// Required for @react-pdf/renderer in Next.js App Router
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { data, month, year } = body;

    if (!data || !month || !year) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const stream = await renderToStream(
      React.createElement(PerformanceReportPdf, { data, month, year }) as any
    );

    // Convert NodeJS Readable stream to Web ReadableStream for Next.js App Router
    const readableStream = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk) => controller.enqueue(chunk));
        stream.on("end", () => controller.close());
        stream.on("error", (err) => controller.error(err));
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="performance-report-${year}-${month}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("PDF generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF", details: error.message },
      { status: 500 }
    );
  }
}
