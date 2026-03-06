import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Scan from "@/models/Scan"
import Vulnerability from "@/models/Vulnerability"

const API_KEY = process.env.SHIELDCI_API_KEY

// POST — engine pushes scan results
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!API_KEY || authHeader !== `Bearer ${API_KEY}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { repo, branch, commit, commitMessage, status, duration, triggeredBy, reportMarkdown, vulnerabilities } = body

    if (!repo) {
      return NextResponse.json({ error: "repo is required" }, { status: 400 })
    }

    await connectDB()

    const scan = await Scan.create({
      repo,
      branch: branch || "main",
      commit: commit || "",
      commitMessage: commitMessage || "",
      status: status || (vulnerabilities?.length > 0 ? "Issues Found" : "Clean"),
      vulnsFound: vulnerabilities?.length || 0,
      duration: duration || "",
      triggeredBy: triggeredBy || "PR",
      reportMarkdown: reportMarkdown || "",
    })

    if (vulnerabilities && vulnerabilities.length > 0) {
      const vulnDocs = vulnerabilities.map((v: any) => ({
        repo,
        file: v.file || "",
        line: v.line || 0,
        type: v.type || "Unknown",
        severity: v.severity || "Medium",
        status: "Pending",
        commit: commit || "",
        description: v.description || "",
        codeSnippet: v.codeSnippet || "",
        fixSnippet: v.fixSnippet || "",
        scanId: scan._id,
      }))
      await Vulnerability.insertMany(vulnDocs)
    }

    return NextResponse.json({ message: "Scan recorded", scanId: scan._id }, { status: 201 })
  } catch (error) {
    console.error("POST /api/scans error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET — dashboard fetches scan history
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const repo = searchParams.get("repo")

    await connectDB()

    const filter: any = {}
    if (repo) filter.repo = repo

    const scans = await Scan.find(filter).sort({ createdAt: -1 }).limit(50).lean()

    return NextResponse.json({ scans })
  } catch (error) {
    console.error("GET /api/scans error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
