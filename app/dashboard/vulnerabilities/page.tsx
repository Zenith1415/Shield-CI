"use client"

import { useState, useEffect } from "react"
import { ShieldAlert, Filter } from "lucide-react"

const severityConfig: Record<string, { color: string; bg: string; border: string }> = {
  Critical: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.3)" },
  High:     { color: "#f97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.3)" },
  Medium:   { color: "#eab308", bg: "rgba(234,179,8,0.12)",  border: "rgba(234,179,8,0.3)"  },
  Low:      { color: "#3b82f6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)" },
}

const statusConfig: Record<string, { color: string; bg: string }> = {
  "Fix PR Raised": { color: "#a855f7", bg: "rgba(168,85,247,0.12)" },
  "Pending":       { color: "#eab308", bg: "rgba(234,179,8,0.12)"  },
  "Resolved":      { color: "#22c55e", bg: "rgba(34,197,94,0.12)"  },
}

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

export default function VulnerabilitiesPage() {
  const [vulnerabilities, setVulnerabilities] = useState<any[]>([])
  const [severityFilter, setSeverityFilter] = useState("All")
  const [statusFilter, setStatusFilter]     = useState("All")
  const [repoFilter, setRepoFilter]         = useState("All")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/vulnerabilities")
      .then(res => res.json())
      .then(data => {
        const vulns = (data.vulnerabilities || []).map((v: any, i: number) => ({
          id: v._id || i + 1,
          repo: v.repo || "",
          file: v.file || "",
          line: v.line || 0,
          type: v.type || "Unknown",
          severity: v.severity || "Medium",
          commit: v.commit || "",
          status: v.status || "Pending",
          date: v.createdAt ? timeAgo(v.createdAt) : "",
        }))
        setVulnerabilities(vulns)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const repos = Array.from(new Set(vulnerabilities.map(v => v.repo).filter(Boolean)))

  const filtered = vulnerabilities.filter(v =>
    (severityFilter === "All" || v.severity === severityFilter) &&
    (statusFilter   === "All" || v.status   === statusFilter)   &&
    (repoFilter     === "All" || v.repo     === repoFilter)
  )

  const FilterBtn = ({ label, value, current, setter }: any) => (
    <button onClick={() => setter(value)} style={{
      padding: "5px 12px", borderRadius: "8px", fontSize: "12px",
      fontFamily: "'Trebuchet MS', sans-serif", cursor: "pointer",
      fontWeight: current === value ? 600 : 400,
      background: current === value ? "rgba(168,85,247,0.2)" : "rgba(106,13,173,0.08)",
      border: current === value ? "1px solid rgba(168,85,247,0.4)" : "1px solid rgba(90,11,145,0.2)",
      color: current === value ? "#c084fc" : "rgba(180,140,255,0.5)",
    }}>{label}</button>
  )

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "26px", fontWeight: 800, color: "white", fontFamily: "'Georgia', serif", letterSpacing: "-0.02em", marginBottom: "4px" }}>Vulnerabilities</h1>
          <p style={{ fontSize: "14px", color: "rgba(150,100,220,0.6)", fontFamily: "'Trebuchet MS', sans-serif" }}>All detected security issues across connected repositories</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {["Critical","High","Medium","Low"].map(s => {
            const c = severityConfig[s]
            const count = vulnerabilities.filter(v => v.severity === s).length
            return (
              <div key={s} style={{ padding: "8px 14px", borderRadius: "10px", background: c.bg, border: `1px solid ${c.border}`, textAlign: "center", minWidth: "56px" }}>
                <p style={{ fontSize: "18px", fontWeight: 800, color: c.color, fontFamily: "'Georgia', serif", lineHeight: 1 }}>{count}</p>
                <p style={{ fontSize: "10px", color: c.color, opacity: 0.7, fontFamily: "'Trebuchet MS', sans-serif", marginTop: "2px" }}>{s}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px", padding: "14px 18px", background: "rgba(106,13,173,0.08)", border: "1px solid rgba(90,11,145,0.2)", borderRadius: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Filter size={13} color="rgba(150,100,220,0.5)" />
          <span style={{ fontSize: "12px", color: "rgba(150,100,220,0.5)", fontFamily: "'Trebuchet MS', sans-serif" }}>Severity:</span>
          {["All","Critical","High","Medium","Low"].map(s => <FilterBtn key={s} label={s} value={s} current={severityFilter} setter={setSeverityFilter} />)}
        </div>
        <div style={{ width: "1px", height: "20px", background: "rgba(90,11,145,0.25)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12px", color: "rgba(150,100,220,0.5)", fontFamily: "'Trebuchet MS', sans-serif" }}>Status:</span>
          {["All","Fix PR Raised","Pending","Resolved"].map(s => <FilterBtn key={s} label={s} value={s} current={statusFilter} setter={setStatusFilter} />)}
        </div>
        <div style={{ width: "1px", height: "20px", background: "rgba(90,11,145,0.25)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "12px", color: "rgba(150,100,220,0.5)", fontFamily: "'Trebuchet MS', sans-serif" }}>Repo:</span>
          {["All",...repos].map(r => <FilterBtn key={r} label={r} value={r} current={repoFilter} setter={setRepoFilter} />)}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "linear-gradient(135deg, rgba(106,13,173,0.08), rgba(10,0,20,0.6))", border: "1px solid rgba(90,11,145,0.2)", borderRadius: "16px", overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 50px 1.5fr 90px 120px 90px 80px", padding: "12px 20px", borderBottom: "1px solid rgba(90,11,145,0.2)", background: "rgba(106,13,173,0.12)" }}>
          {["Repo","File","Line","Type","Severity","Status","Commit","Time"].map(h => (
            <span key={h} style={{ fontSize: "11px", color: "rgba(150,100,220,0.5)", fontFamily: "'Trebuchet MS', sans-serif", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</span>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "56px", textAlign: "center" }}>
            <ShieldAlert size={32} color="rgba(150,100,220,0.3)" style={{ margin: "0 auto 12px" }} />
            <p style={{ color: "rgba(150,100,220,0.4)", fontFamily: "'Trebuchet MS', sans-serif" }}>No vulnerabilities match the selected filters</p>
          </div>
        ) : filtered.map((v, i) => {
          const sev = severityConfig[v.severity]
          const sta = statusConfig[v.status]
          return (
            <div key={v.id}
              style={{ display: "grid", gridTemplateColumns: "1.5fr 2fr 50px 1.5fr 90px 120px 90px 80px", padding: "13px 20px", borderBottom: i < filtered.length - 1 ? "1px solid rgba(90,11,145,0.1)" : "none", alignItems: "center", transition: "background 0.15s", cursor: "default" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(106,13,173,0.1)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontSize: "13px", color: "rgba(200,170,255,0.8)", fontFamily: "'Trebuchet MS', sans-serif", fontWeight: 500 }}>{v.repo}</span>
              <span style={{ fontSize: "12px", color: "#c084fc", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.file}</span>
              <span style={{ fontSize: "12px", color: "rgba(150,100,220,0.5)", fontFamily: "monospace" }}>:{v.line}</span>
              <span style={{ fontSize: "13px", color: "rgba(200,170,255,0.7)", fontFamily: "'Trebuchet MS', sans-serif" }}>{v.type}</span>
              <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "999px", background: sev.bg, border: `1px solid ${sev.border}`, color: sev.color, fontFamily: "'Trebuchet MS', sans-serif", fontWeight: 600, width: "fit-content" }}>{v.severity}</span>
              <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "999px", background: sta.bg, color: sta.color, fontFamily: "'Trebuchet MS', sans-serif", fontWeight: 500, width: "fit-content" }}>{v.status}</span>
              <span style={{ fontSize: "11px", color: "rgba(150,100,220,0.5)", fontFamily: "monospace" }}>{v.commit}</span>
              <span style={{ fontSize: "11px", color: "rgba(150,100,220,0.4)", fontFamily: "'Trebuchet MS', sans-serif" }}>{v.date}</span>
            </div>
          )
        })}
      </div>
      <p style={{ fontSize: "12px", color: "rgba(150,100,220,0.4)", fontFamily: "'Trebuchet MS', sans-serif", textAlign: "right" }}>Showing {filtered.length} of {vulnerabilities.length} vulnerabilities</p>
    </div>
  )
}