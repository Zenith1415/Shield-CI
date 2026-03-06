"use client"

import { ExternalLink, GitPullRequest, GitMerge, XCircle, Clock } from "lucide-react"
import { useState, useEffect } from "react"

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

const severityConfig: Record<string, { color: string; bg: string; border: string }> = {
  Critical: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)" },
  High:     { color: "#f97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.3)" },
  Medium:   { color: "#eab308", bg: "rgba(234,179,8,0.12)",  border: "rgba(234,179,8,0.3)"  },
  Low:      { color: "#3b82f6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)" },
}

const statusConfig: Record<string, { color: string; bg: string; icon: any }> = {
  "Open":     { color: "#a855f7", bg: "rgba(168,85,247,0.12)", icon: GitPullRequest },
  "Merged":   { color: "#22c55e", bg: "rgba(34,197,94,0.12)",  icon: GitMerge       },
  "Rejected": { color: "#ef4444", bg: "rgba(239,68,68,0.12)",  icon: XCircle        },
}

export default function FixPRTrackerPage() {
  const [prs, setPrs] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState("All")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load vulnerabilities and map them as "fix PR" entries
    fetch("/api/vulnerabilities")
      .then(res => res.json())
      .then(data => {
        const items = (data.vulnerabilities || []).map((v: any, i: number) => ({
          id: i + 1,
          repo: v.repo || "",
          title: `Fix ${v.type || "issue"} in ${v.file || "unknown"}`,
          severity: v.severity || "Medium",
          status: v.status === "Resolved" ? "Merged" : v.status === "Fix PR Raised" ? "Open" : "Open",
          branch: `shieldci/fix-${(v.type || "issue").toLowerCase().replace(/\s+/g, "-")}`,
          raised: v.createdAt ? timeAgo(v.createdAt) : "",
          url: v.fixPrUrl || "#",
        }))
        setPrs(items)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = prs.filter(p => statusFilter === "All" || p.status === statusFilter)

  const counts = { Open: prs.filter(p => p.status === "Open").length, Merged: prs.filter(p => p.status === "Merged").length, Rejected: prs.filter(p => p.status === "Rejected").length }

  const FilterBtn = ({ label, value }: any) => (
    <button onClick={() => setStatusFilter(value)} style={{
      padding: "6px 16px", borderRadius: "8px", fontSize: "13px",
      fontFamily: "'Trebuchet MS', sans-serif", cursor: "pointer",
      fontWeight: statusFilter === value ? 600 : 400,
      background: statusFilter === value ? "rgba(168,85,247,0.2)" : "rgba(106,13,173,0.08)",
      border: statusFilter === value ? "1px solid rgba(168,85,247,0.4)" : "1px solid rgba(90,11,145,0.2)",
      color: statusFilter === value ? "#c084fc" : "rgba(180,140,255,0.5)",
    }}>{label}</button>
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: "white", fontFamily: "'Georgia', serif", letterSpacing: "-0.02em", marginBottom: "4px" }}>Fix PR Tracker</h1>
          <p style={{ fontSize: "14px", color: "rgba(150,100,220,0.6)", fontFamily: "'Trebuchet MS', sans-serif" }}>All pull requests raised by ShieldCI across your repositories</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {(["Open","Merged","Rejected"] as const).map(s => {
            const c = statusConfig[s]
            const Icon = c.icon
            return (
              <div key={s} style={{ padding: "10px 16px", borderRadius: "10px", background: c.bg, border: `1px solid ${c.color}30`, display: "flex", alignItems: "center", gap: "8px" }}>
                <Icon size={14} color={c.color} />
                <span style={{ fontSize: "18px", fontWeight: 800, color: c.color, fontFamily: "'Georgia', serif" }}>{counts[s]}</span>
                <span style={{ fontSize: "12px", color: c.color, opacity: 0.7, fontFamily: "'Trebuchet MS', sans-serif" }}>{s}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px" }}>
        {["All","Open","Merged","Rejected"].map(s => <FilterBtn key={s} label={s} value={s} />)}
      </div>

      {/* PR Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {filtered.map(pr => {
          const sev = severityConfig[pr.severity]
          const sta = statusConfig[pr.status]
          const StatusIcon = sta.icon
          return (
            <div key={pr.id}
              style={{
                background: "linear-gradient(135deg, rgba(106,13,173,0.1), rgba(10,0,20,0.5))",
                border: "1px solid rgba(90,11,145,0.2)",
                borderRadius: "14px",
                padding: "18px 22px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(168,85,247,0.3)"; e.currentTarget.style.boxShadow = "0 0 20px rgba(106,13,173,0.15)" }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(90,11,145,0.2)"; e.currentTarget.style.boxShadow = "none" }}
            >
              {/* PR number */}
              <div style={{ width: "52px", height: "52px", borderRadius: "12px", background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontSize: "10px", color: "rgba(168,85,247,0.6)", fontFamily: "'Trebuchet MS', sans-serif" }}>PR</span>
                <span style={{ fontSize: "16px", fontWeight: 800, color: "#c084fc", fontFamily: "'Georgia', serif", lineHeight: 1 }}>#{pr.id}</span>
              </div>

              {/* Title + branch */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "rgba(220,200,255,0.9)", fontFamily: "'Trebuchet MS', sans-serif", marginBottom: "6px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {pr.title}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "12px", color: "rgba(150,100,220,0.6)", fontFamily: "'Trebuchet MS', sans-serif" }}>{pr.repo}</span>
                  <span style={{ fontSize: "11px", color: "rgba(168,85,247,0.5)", fontFamily: "monospace", background: "rgba(168,85,247,0.08)", padding: "2px 8px", borderRadius: "4px" }}>{pr.branch}</span>
                </div>
              </div>

              {/* Severity badge */}
              <span style={{ fontSize: "11px", padding: "4px 12px", borderRadius: "999px", background: sev.bg, border: `1px solid ${sev.border}`, color: sev.color, fontFamily: "'Trebuchet MS', sans-serif", fontWeight: 600, flexShrink: 0 }}>{pr.severity}</span>

              {/* Status badge */}
              <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", borderRadius: "999px", background: sta.bg, flexShrink: 0 }}>
                <StatusIcon size={12} color={sta.color} />
                <span style={{ fontSize: "12px", color: sta.color, fontFamily: "'Trebuchet MS', sans-serif", fontWeight: 600 }}>{pr.status}</span>
              </div>

              {/* Time */}
              <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                <Clock size={11} color="rgba(150,100,220,0.4)" />
                <span style={{ fontSize: "12px", color: "rgba(150,100,220,0.4)", fontFamily: "'Trebuchet MS', sans-serif", whiteSpace: "nowrap" }}>{pr.raised}</span>
              </div>

              {/* GitHub link */}
              <a href={pr.url} style={{ flexShrink: 0, padding: "8px", borderRadius: "8px", background: "rgba(106,13,173,0.15)", border: "1px solid rgba(90,11,145,0.3)", display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}>
                <ExternalLink size={14} color="rgba(168,85,247,0.7)" />
              </a>
            </div>
          )
        })}
      </div>
    </div>
  )
}