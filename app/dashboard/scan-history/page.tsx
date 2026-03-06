"use client"

import { useState, useEffect } from "react"
import { ScanLine, Clock, GitCommit, CheckCircle2, AlertTriangle, XCircle } from "lucide-react"

const statusConfig: Record<string, { color: string; bg: string; border: string; icon: any }> = {
  "Issues Found": { color: "#f97316", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.25)", icon: AlertTriangle },
  "Clean":        { color: "#22c55e", bg: "rgba(34,197,94,0.1)",  border: "rgba(34,197,94,0.25)",  icon: CheckCircle2  },
  "Failed":       { color: "#ef4444", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.25)",  icon: XCircle       },
}

const repoColorPalette = ["#a855f7", "#3b82f6", "#22c55e", "#f97316", "#ef4444", "#eab308"]

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? "s" : ""} ago`
}

export default function ScanHistoryPage() {
  const [scans, setScans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/scans")
      .then(res => res.json())
      .then(data => {
        const mapped = (data.scans || []).map((s: any, i: number) => ({
          id: s._id || i + 1,
          repo: s.repo || "",
          branch: s.branch || "main",
          commit: s.commit || "",
          message: s.commitMessage || "",
          vulnsFound: s.vulnsFound || 0,
          duration: s.duration || "",
          status: s.status || "Clean",
          triggered: s.createdAt ? timeAgo(s.createdAt) : "",
        }))
        setScans(mapped)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Build dynamic repo color map
  const repoColors: Record<string, string> = {}
  const uniqueRepos = Array.from(new Set(scans.map(s => s.repo).filter(Boolean)))
  uniqueRepos.forEach((r, i) => { repoColors[r] = repoColorPalette[i % repoColorPalette.length] })

  const totalScans   = scans.length
  const cleanScans   = scans.filter(s => s.status === "Clean").length
  const issueScans   = scans.filter(s => s.status === "Issues Found").length
  const totalVulns   = scans.reduce((a, s) => a + s.vulnsFound, 0)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: "26px", fontWeight: 800, color: "white", fontFamily: "'Georgia', serif", letterSpacing: "-0.02em", marginBottom: "4px" }}>Scan History</h1>
        <p style={{ fontSize: "14px", color: "rgba(150,100,220,0.6)", fontFamily: "'Trebuchet MS', sans-serif" }}>Complete audit trail of all security scans</p>
      </div>

      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
        {[
          { label: "Total Scans", value: totalScans, color: "#a855f7", bg: "rgba(168,85,247,0.1)", border: "rgba(168,85,247,0.2)" },
          { label: "Clean Scans", value: cleanScans, color: "#22c55e", bg: "rgba(34,197,94,0.1)", border: "rgba(34,197,94,0.2)" },
          { label: "Issues Found", value: issueScans, color: "#f97316", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.2)" },
          { label: "Total Vulns", value: totalVulns, color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)" },
        ].map(s => (
          <div key={s.label} style={{ padding: "16px 18px", borderRadius: "12px", background: s.bg, border: `1px solid ${s.border}` }}>
            <p style={{ fontSize: "28px", fontWeight: 800, color: s.color, fontFamily: "'Georgia', serif", lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: "12px", color: s.color, opacity: 0.6, fontFamily: "'Trebuchet MS', sans-serif", marginTop: "4px" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {scans.map((scan, i) => {
          const sta = statusConfig[scan.status]
          const StatusIcon = sta.icon
          const repoColor = repoColors[scan.repo] || "#a855f7"
          return (
            <div key={scan.id}
              style={{ background: "linear-gradient(135deg, rgba(106,13,173,0.08), rgba(10,0,20,0.5))", border: "1px solid rgba(90,11,145,0.18)", borderRadius: "14px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "16px", transition: "border-color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(168,85,247,0.3)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(90,11,145,0.18)"}
            >
              {/* Scan icon */}
              <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: sta.bg, border: `1px solid ${sta.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ScanLine size={18} color={sta.color} />
              </div>

              {/* Repo + commit */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: repoColor, fontFamily: "'Trebuchet MS', sans-serif" }}>{scan.repo}</span>
                  <span style={{ fontSize: "11px", color: "rgba(150,100,220,0.5)", fontFamily: "monospace", background: "rgba(106,13,173,0.15)", padding: "1px 8px", borderRadius: "4px" }}>{scan.branch}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <GitCommit size={11} color="rgba(150,100,220,0.4)" />
                  <span style={{ fontSize: "11px", color: "rgba(150,100,220,0.5)", fontFamily: "monospace" }}>{scan.commit}</span>
                  <span style={{ fontSize: "12px", color: "rgba(180,140,255,0.6)", fontFamily: "'Trebuchet MS', sans-serif" }}>— {scan.message}</span>
                </div>
              </div>

              {/* Vulns found */}
              <div style={{ textAlign: "center", flexShrink: 0 }}>
                <p style={{ fontSize: "20px", fontWeight: 800, color: scan.vulnsFound > 0 ? "#f97316" : "#22c55e", fontFamily: "'Georgia', serif", lineHeight: 1 }}>{scan.vulnsFound}</p>
                <p style={{ fontSize: "10px", color: "rgba(150,100,220,0.4)", fontFamily: "'Trebuchet MS', sans-serif" }}>vulns</p>
              </div>

              {/* Duration */}
              <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 12px", borderRadius: "8px", background: "rgba(106,13,173,0.1)", border: "1px solid rgba(90,11,145,0.2)", flexShrink: 0 }}>
                <Clock size={11} color="rgba(150,100,220,0.5)" />
                <span style={{ fontSize: "12px", color: "rgba(180,140,255,0.6)", fontFamily: "'Trebuchet MS', sans-serif" }}>{scan.duration}</span>
              </div>

              {/* Status */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 14px", borderRadius: "999px", background: sta.bg, border: `1px solid ${sta.border}`, flexShrink: 0 }}>
                <StatusIcon size={12} color={sta.color} />
                <span style={{ fontSize: "12px", color: sta.color, fontFamily: "'Trebuchet MS', sans-serif", fontWeight: 600 }}>{scan.status}</span>
              </div>

              {/* Time */}
              <span style={{ fontSize: "11px", color: "rgba(150,100,220,0.4)", fontFamily: "'Trebuchet MS', sans-serif", flexShrink: 0, minWidth: "70px", textAlign: "right" }}>{scan.triggered}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}