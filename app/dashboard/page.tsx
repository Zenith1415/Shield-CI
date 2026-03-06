"use client"

import { useState, useEffect } from "react"
import {
  ShieldAlert,
  GitPullRequest,
  ScanLine,
  GitMerge,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

// ── Security Score Gauge ───────────────────────────────────
function SecurityScoreGauge({ score }: { score: number }) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      let current = 0
      const interval = setInterval(() => {
        current += 2
        if (current >= score) {
          setDisplayed(score)
          clearInterval(interval)
        } else {
          setDisplayed(current)
        }
      }, 16)
    }, 300)
    return () => clearTimeout(timer)
  }, [score])

  const radius = 80
  const stroke = 10
  const normalizedRadius = radius - stroke / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const progress = (displayed / 100) * circumference
  const offset = circumference - progress

  const scoreColor =
    displayed >= 80 ? "#22c55e" :
    displayed >= 60 ? "#a855f7" :
    displayed >= 40 ? "#eab308" : "#ef4444"

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
      <div style={{ position: "relative", width: `${radius * 2}px`, height: `${radius * 2}px` }}>
        <svg height={radius * 2} width={radius * 2}>
          {/* Background ring */}
          <circle
            stroke="rgba(90,11,145,0.2)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress ring */}
          <circle
            stroke={scoreColor}
            fill="transparent"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={offset}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "50% 50%",
              transition: "stroke-dashoffset 0.05s linear",
              filter: `drop-shadow(0 0 8px ${scoreColor})`,
            }}
          />
        </svg>

        {/* Score number in center */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}>
          <span style={{
            fontSize: "36px", fontWeight: 800,
            color: scoreColor,
            fontFamily: "'Georgia', serif",
            lineHeight: 1,
            textShadow: `0 0 20px ${scoreColor}`,
          }}>{displayed}</span>
          <span style={{
            fontSize: "11px",
            color: "rgba(180,140,255,0.5)",
            fontFamily: "'Trebuchet MS', sans-serif",
            letterSpacing: "0.05em",
          }}>/100</span>
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <p style={{
          fontSize: "15px", fontWeight: 700,
          color: scoreColor,
          fontFamily: "'Trebuchet MS', sans-serif",
        }}>
          {displayed >= 80 ? "🛡️ Strong" : displayed >= 60 ? "⚠️ Moderate" : "🔴 At Risk"}
        </p>
        <p style={{
          fontSize: "12px",
          color: "rgba(150,100,220,0.5)",
          fontFamily: "'Trebuchet MS', sans-serif",
          marginTop: "4px",
        }}>Security Score</p>
      </div>
    </div>
  )
}

// ── Custom Tooltip ─────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div style={{
        background: "rgba(15,0,30,0.95)",
        border: "1px solid rgba(160,80,255,0.3)",
        borderRadius: "8px",
        padding: "10px 14px",
      }}>
        <p style={{ color: "rgba(180,140,255,0.6)", fontSize: "11px", fontFamily: "'Trebuchet MS', sans-serif" }}>
          commit: {label}
        </p>
        <p style={{ color: "#a855f7", fontSize: "18px", fontWeight: 700, fontFamily: "'Georgia', serif" }}>
          {payload[0].value}<span style={{ fontSize: "12px", color: "rgba(180,140,255,0.5)" }}>/100</span>
        </p>
      </div>
    )
  }
  return null
}

// ── Main Overview Page ─────────────────────────────────────
export default function DashboardOverview() {
  const [scoreHistory, setScoreHistory] = useState<{commit: string; score: number}[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [stats, setStats] = useState({ totalVulns: 0, totalScans: 0, cleanScans: 0, issueScans: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then(res => res.json())
      .then(data => {
        setScoreHistory(data.scoreHistory || [])
        setRecentActivity(data.recentActivity || [])
        setStats({
          totalVulns: data.totalVulns || 0,
          totalScans: data.totalScans || 0,
          cleanScans: data.cleanScans || 0,
          issueScans: data.issueScans || 0,
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const securityScore = stats.totalScans > 0
    ? Math.max(0, Math.min(100, 100 - stats.totalVulns * 5))
    : 0

  const statCards = [
    {
      label: "Vulnerabilities Found",
      value: String(stats.totalVulns),
      icon: ShieldAlert,
      color: "#ef4444",
      glow: "rgba(239,68,68,0.3)",
      bg: "rgba(239,68,68,0.08)",
      border: "rgba(239,68,68,0.2)",
      change: `${stats.totalVulns} total`,
      changeNeg: stats.totalVulns > 0,
    },
    {
      label: "Issue Scans",
      value: String(stats.issueScans),
      icon: GitPullRequest,
      color: "#a855f7",
      glow: "rgba(168,85,247,0.3)",
      bg: "rgba(168,85,247,0.08)",
      border: "rgba(168,85,247,0.2)",
      change: `of ${stats.totalScans} scans`,
      changeNeg: false,
    },
    {
      label: "Scans Run",
      value: String(stats.totalScans),
      icon: ScanLine,
      color: "#3b82f6",
      glow: "rgba(59,130,246,0.3)",
      bg: "rgba(59,130,246,0.08)",
      border: "rgba(59,130,246,0.2)",
      change: `${stats.cleanScans} clean`,
      changeNeg: false,
    },
    {
      label: "Clean Scans",
      value: String(stats.cleanScans),
      icon: GitMerge,
      color: "#22c55e",
      glow: "rgba(34,197,94,0.3)",
      bg: "rgba(34,197,94,0.08)",
      border: "rgba(34,197,94,0.2)",
      change: `${stats.totalScans > 0 ? Math.round((stats.cleanScans / stats.totalScans) * 100) : 0}% pass rate`,
      changeNeg: false,
    },
  ]

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "400px" }}>
        <p style={{ color: "rgba(150,100,220,0.6)", fontFamily: "'Trebuchet MS', sans-serif" }}>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

      {/* Page header */}
      <div>
        <h1 style={{
          fontSize: "26px", fontWeight: 800,
          color: "white",
          fontFamily: "'Georgia', serif",
          letterSpacing: "-0.02em",
          marginBottom: "4px",
        }}>Overview</h1>
        <p style={{
          fontSize: "14px",
          color: "rgba(150,100,220,0.6)",
          fontFamily: "'Trebuchet MS', sans-serif",
        }}>Security status across all connected repositories</p>
      </div>

      {/* Top row — Score + Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "20px" }}>

        {/* Security Score card */}
        <div style={{
          background: "linear-gradient(135deg, rgba(106,13,173,0.15), rgba(90,11,145,0.08))",
          border: "1px solid rgba(90,11,145,0.3)",
          borderRadius: "16px",
          padding: "28px 20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          boxShadow: "0 0 40px rgba(106,13,173,0.1)",
        }}>
          <SecurityScoreGauge score={securityScore} />

          <div style={{
            width: "100%",
            marginTop: "8px",
            padding: "10px 12px",
            borderRadius: "8px",
            background: "rgba(34,197,94,0.08)",
            border: "1px solid rgba(34,197,94,0.2)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}>
            <TrendingUp size={13} color="#22c55e" />
            <span style={{
              fontSize: "12px",
              color: "#22c55e",
              fontFamily: "'Trebuchet MS', sans-serif",
            }}>+18 pts from last month</span>
          </div>
        </div>

        {/* Stat cards grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <div key={card.label} style={{
                background: `linear-gradient(135deg, ${card.bg}, rgba(10,0,20,0.5))`,
                border: `1px solid ${card.border}`,
                borderRadius: "14px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                boxShadow: `0 0 20px ${card.glow}20`,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{
                    fontSize: "13px",
                    color: "rgba(180,140,255,0.6)",
                    fontFamily: "'Trebuchet MS', sans-serif",
                  }}>{card.label}</span>
                  <div style={{
                    width: "30px", height: "30px",
                    borderRadius: "8px",
                    background: card.bg,
                    border: `1px solid ${card.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon size={15} color={card.color} />
                  </div>
                </div>

                <div>
                  <p style={{
                    fontSize: "36px", fontWeight: 800,
                    color: "white",
                    fontFamily: "'Georgia', serif",
                    lineHeight: 1,
                  }}>{card.value}</p>
                  <p style={{
                    fontSize: "12px",
                    color: card.changeNeg ? "#ef4444" : "#22c55e",
                    fontFamily: "'Trebuchet MS', sans-serif",
                    marginTop: "6px",
                  }}>{card.change}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Bottom row — Graph + Activity */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "20px" }}>

        {/* Score over time graph */}
        <div style={{
          background: "linear-gradient(135deg, rgba(106,13,173,0.1), rgba(10,0,20,0.6))",
          border: "1px solid rgba(90,11,145,0.25)",
          borderRadius: "16px",
          padding: "24px",
        }}>
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{
              fontSize: "16px", fontWeight: 700,
              color: "white",
              fontFamily: "'Georgia', serif",
              marginBottom: "4px",
            }}>Security Score Over Time</h2>
            <p style={{
              fontSize: "12px",
              color: "rgba(150,100,220,0.5)",
              fontFamily: "'Trebuchet MS', sans-serif",
            }}>Tracking improvement across commits</p>
          </div>

          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={scoreHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(90,11,145,0.15)" />
              <XAxis
                dataKey="commit"
                tick={{ fill: "rgba(150,100,220,0.5)", fontSize: 11, fontFamily: "'Trebuchet MS', sans-serif" }}
                axisLine={{ stroke: "rgba(90,11,145,0.2)" }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: "rgba(150,100,220,0.5)", fontSize: 11, fontFamily: "'Trebuchet MS', sans-serif" }}
                axisLine={{ stroke: "rgba(90,11,145,0.2)" }}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#a855f7"
                strokeWidth={2.5}
                dot={{ fill: "#a855f7", strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: "#c084fc", boxShadow: "0 0 10px #a855f7" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity feed */}
        <div style={{
          background: "linear-gradient(135deg, rgba(106,13,173,0.1), rgba(10,0,20,0.6))",
          border: "1px solid rgba(90,11,145,0.25)",
          borderRadius: "16px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{
              fontSize: "16px", fontWeight: 700,
              color: "white",
              fontFamily: "'Georgia', serif",
            }}>Recent Activity</h2>
            <span style={{
              fontSize: "11px",
              color: "rgba(168,85,247,0.7)",
              fontFamily: "'Trebuchet MS', sans-serif",
              cursor: "pointer",
            }}>View all →</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, overflowY: "auto" }}>
            {recentActivity.map((item, i) => (
              <div key={i} style={{
                padding: "10px 12px",
                borderRadius: "10px",
                background: "rgba(106,13,173,0.05)",
                border: "1px solid rgba(90,11,145,0.12)",
                display: "flex",
                alignItems: "flex-start",
                gap: "10px",
                marginBottom: "6px",
              }}>
                {/* Icon */}
                <div style={{
                  width: "28px", height: "28px",
                  borderRadius: "7px",
                  background: `${item.sevColor}15`,
                  border: `1px solid ${item.sevColor}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  marginTop: "1px",
                }}>
                  {item.type === "vuln" && <AlertTriangle size={13} color={item.sevColor} />}
                  {item.type === "pr" && <GitPullRequest size={13} color={item.sevColor} />}
                  {item.type === "merged" && <CheckCircle2 size={13} color={item.sevColor} />}
                  {item.type === "scan" && <ScanLine size={13} color={item.sevColor} />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: "12px",
                    color: "rgba(200,170,255,0.85)",
                    fontFamily: "'Trebuchet MS', sans-serif",
                    lineHeight: 1.4,
                  }}>
                    {item.message}{" "}
                    <span style={{ color: "#c084fc", fontWeight: 600 }}>{item.file}</span>
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "5px" }}>
                    <span style={{
                      fontSize: "10px",
                      color: "rgba(150,100,220,0.5)",
                      fontFamily: "'Trebuchet MS', sans-serif",
                    }}>{item.repo}</span>
                    <span style={{
                      fontSize: "10px",
                      padding: "1px 7px",
                      borderRadius: "999px",
                      background: `${item.sevColor}15`,
                      color: item.sevColor,
                      fontFamily: "'Trebuchet MS', sans-serif",
                      fontWeight: 600,
                    }}>{item.severity}</span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                  <Clock size={10} color="rgba(150,100,220,0.4)" />
                  <span style={{
                    fontSize: "10px",
                    color: "rgba(150,100,220,0.4)",
                    fontFamily: "'Trebuchet MS', sans-serif",
                    whiteSpace: "nowrap",
                  }}>{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}