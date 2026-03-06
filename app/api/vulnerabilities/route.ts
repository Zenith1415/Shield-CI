import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Vulnerability from "@/models/Vulnerability"

// GET — dashboard fetches vulnerabilities
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const repo = searchParams.get("repo")
    const severity = searchParams.get("severity")
    const status = searchParams.get("status")

    await connectDB()

    const filter: any = {}
    if (repo) filter.repo = repo
    if (severity) filter.severity = severity
    if (status) filter.status = status

    const vulnerabilities = await Vulnerability.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()

    return NextResponse.json({ vulnerabilities })
  } catch (error) {
    console.error("GET /api/vulnerabilities error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
