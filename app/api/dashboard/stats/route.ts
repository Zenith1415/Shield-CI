import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import Scan from "@/models/Scan"
import Vulnerability from "@/models/Vulnerability"

// GET — dashboard overview stats
export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const [totalVulns, totalScans, recentScans, severityCounts, recentVulns] = await Promise.all([
      Vulnerability.countDocuments({}),
      Scan.countDocuments({}),
      Scan.find({}).sort({ createdAt: -1 }).limit(10).lean(),
      Vulnerability.aggregate([
        { $group: { _id: "$severity", count: { $sum: 1 } } },
      ]),
      Vulnerability.find({}).sort({ createdAt: -1 }).limit(6).lean(),
    ])

    const cleanScans = await Scan.countDocuments({ status: "Clean" })
    const issueScans = await Scan.countDocuments({ status: "Issues Found" })

    // Build score history from recent scans (simple heuristic)
    const scoreHistory = recentScans.reverse().map((scan: any, i: number) => {
      const vulnPenalty = scan.vulnsFound * 10
      const base = Math.max(20, 100 - vulnPenalty)
      return { commit: scan.commit?.slice(0, 5) || `s${i}`, score: Math.min(100, base) }
    })

    // Build recent activity from recent vulnerabilities
    const recentActivity = recentVulns.map((v: any) => {
      const sevColorMap: Record<string, string> = {
        Critical: "#ef4444",
        High: "#f97316",
        Medium: "#eab308",
        Low: "#3b82f6",
      }
      return {
        type: "vuln",
        message: `${v.type} detected in`,
        file: v.file,
        repo: v.repo,
        time: timeAgo(v.createdAt),
        severity: v.severity,
        sevColor: sevColorMap[v.severity] || "#a855f7",
      }
    })

    const sevMap: Record<string, number> = {}
    severityCounts.forEach((s: any) => { sevMap[s._id] = s.count })

    return NextResponse.json({
      totalVulns,
      totalScans,
      cleanScans,
      issueScans,
      scoreHistory,
      recentActivity,
      severities: {
        Critical: sevMap["Critical"] || 0,
        High: sevMap["High"] || 0,
        Medium: sevMap["Medium"] || 0,
        Low: sevMap["Low"] || 0,
      },
    })
  } catch (error) {
    console.error("GET /api/dashboard/stats error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? "s" : ""} ago`
}
