import React, { useState } from "react";

// ── Design System Tokens ──────────────────────────────────────────────────────
const C = {
  primary: "#4cd6ff",
  secondary: "#d1bcff",
  tertiary: "#00dce5",
  error: "#ffb4ab",
  surface: "#111318",
  surfaceLow: "#1a1c20",
  surfaceContainer: "#1e2024",
  surfaceContainerHigh: "#282a2e",
  surfaceContainerHighest: "#333539",
  surfaceContainerLowest: "#0c0e12",
  primaryContainer: "#007995",
  secondaryContainer: "#7000ff",
  tertiaryContainer: "#007c81",
  onPrimary: "#003543",
  onSecondary: "#3c0090",
  onTertiary: "#003739",
  onSurface: "#e2e2e8",
  onSurfaceVariant: "#c2c6d9",
  outline: "#8c90a2",
  outlineVariant: "#424656",
};

const styles = {
  page: {
    minHeight: "100dvh",
    background: C.surface,
    color: C.onSurface,
    fontFamily: "'Inter', sans-serif",
    paddingTop: "64px",
    paddingBottom: "80px",
  },
  topbar: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    height: "64px",
    background: C.surface,
    borderBottom: `1px solid ${C.surfaceContainerHighest}33`,
    display: "flex",
    alignItems: "center",
    padding: "0 1rem",
    gap: "0.75rem",
  },
  brand: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    letterSpacing: "0.15em",
    fontSize: "0.75rem",
    color: C.primary,
    textTransform: "uppercase",
    marginRight: "1rem",
  },
  navTab: (active) => ({
    padding: "0 0.75rem",
    height: "64px",
    fontSize: "0.7rem",
    fontWeight: 500,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: active ? C.onSurface : C.onSurfaceVariant,
    background: "none",
    border: "none",
    borderBottom: active ? `2px solid ${C.primary}` : "2px solid transparent",
    cursor: "pointer",
    transition: "color 0.15s, border-color 0.15s",
  }),
  main: {
    maxWidth: "900px",
    margin: "0 auto",
    padding: "1.5rem 1rem",
  },
  sectionTitle: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "1.2rem",
    fontWeight: 500,
    letterSpacing: "-0.02em",
    color: C.onSurface,
    marginBottom: "1rem",
  },
  cardOuter: {
    padding: "4px",
    borderRadius: "2px",
    background: C.surfaceContainerHigh,
  },
  cardInner: {
    borderRadius: "2px",
    background: C.surfaceContainer,
    padding: "1rem",
  },
  badge: (color, bg) => ({
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: "999px",
    fontSize: "9px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: color,
    background: `${bg}22`,
    border: `1px solid ${color}44`,
  }),
  progressTrack: {
    width: "100%",
    height: "4px",
    background: C.surfaceContainerLowest,
    borderRadius: "999px",
    overflow: "hidden",
  },
  label: {
    fontSize: "9px",
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    color: C.outline,
  },
  statNumber: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: "1.1rem",
    fontWeight: 700,
    color: C.onSurface,
    fontVariantNumeric: "tabular-nums",
  },
  glassPanel: {
    background: "rgba(51,53,57,0.4)",
    backdropFilter: "blur(20px)",
    border: `1px solid ${C.outline}1a`,
    borderRadius: "2px",
    overflow: "hidden",
  },
  launchBtn: {
    background: "linear-gradient(135deg, #4cd6ff 0%, #7000ff 100%)",
    color: C.onPrimary,
    fontWeight: 700,
    fontSize: "0.7rem",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    border: "none",
    borderRadius: "2px",
    padding: "0.75rem 1.25rem",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function ProgressBar({ pct, color = C.primary }) {
  return (
    <div style={styles.progressTrack}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: "999px" }} />
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div style={styles.cardOuter}>
      <div style={styles.cardInner}>
        <p style={styles.label}>{label}</p>
        <p style={{ ...styles.statNumber, marginTop: "0.35rem" }}>{value}</p>
        {sub && <p style={{ fontSize: "0.625rem", color: C.onSurfaceVariant, marginTop: "0.25rem" }}>{sub}</p>}
      </div>
    </div>
  );
}

function CampaignCard({ name, badge, badgeColor, metric1Label, metric1, metric2Label, metric2, pct, barColor }) {
  return (
    <div style={styles.cardOuter}>
      <div style={styles.cardInner}>
        <div style={{ marginBottom: "0.75rem" }}>
          <span style={styles.badge(badgeColor, badgeColor)}>{badge}</span>
        </div>
        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: C.onSurface, marginBottom: "0.75rem" }}>{name}</p>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.625rem", color: C.onSurfaceVariant, marginBottom: "0.25rem" }}>
          <span>{metric1Label}</span>
          <span style={{ color: C.onSurface, fontWeight: 500 }}>{metric1}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.625rem", color: C.onSurfaceVariant, marginBottom: "0.75rem" }}>
          <span>{metric2Label}</span>
          <span style={{ color: C.onSurface, fontWeight: 500 }}>{metric2}</span>
        </div>
        <ProgressBar pct={pct} color={barColor} />
        <p style={{ fontSize: "9px", color: C.outline, textAlign: "right", marginTop: "0.25rem" }}>{pct}% target</p>
      </div>
    </div>
  );
}

function IntelItem({ icon, iconColor, title, sub, accentBorder }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "flex-start",
      gap: "1rem",
      padding: "0.75rem",
      borderLeft: accentBorder ? `2px solid ${accentBorder}` : `1px solid ${C.outlineVariant}33`,
      cursor: "default",
    }}>
      <span style={{ fontSize: "1rem", color: iconColor, marginTop: "1px" }}>{icon}</span>
      <div>
        <p style={{ fontSize: "0.6875rem", fontWeight: 500, color: C.onSurface }}>{title}</p>
        <p style={{ fontSize: "0.625rem", color: C.onSurfaceVariant, marginTop: "2px" }}>{sub}</p>
      </div>
    </div>
  );
}

// ── Tab Views ─────────────────────────────────────────────────────────────────

function CampaignCommand() {
  return (
    <div>
      {/* Hero */}
      <section style={{ marginBottom: "1.5rem" }}>
        <p style={styles.label}>Total Campaign Reach</p>
        <div style={{ display: "flex", alignItems: "flex-end", gap: "1rem", margin: "0.35rem 0 0.25rem" }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "2.5rem", fontWeight: 700, color: C.onSurface }}>$48.2K</span>
          <span style={{ color: C.onSurfaceVariant, fontSize: "0.875rem", marginBottom: "4px" }}>reached this month</span>
        </div>
        {/* Sparkline */}
        <svg width="200" height="36" viewBox="0 0 200 36" fill="none" style={{ display: "block", marginBottom: "0.5rem" }}>
          <polyline points="0,28 30,22 60,26 90,14 120,18 150,8 180,12 200,4"
            stroke={C.primary} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="0,28 30,22 60,26 90,14 120,18 150,8 180,12 200,4 200,36 0,36"
            fill="url(#sg)" opacity="0.15" />
          <defs>
            <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.primary} />
              <stop offset="100%" stopColor={C.primary} stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
        <span style={{ fontSize: "0.6875rem", color: C.tertiary, fontWeight: 500 }}>↑ +18.4% vs last month</span>
      </section>

      {/* Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <StatCard label="Active Campaigns" value="5" sub="2 High-Impact · 3 Seasonal" />
        <div style={styles.cardOuter}>
          <div style={styles.cardInner}>
            <p style={styles.label}>Avg. Engagement Rate</p>
            <p style={{ ...styles.statNumber, marginTop: "0.35rem" }}>6.8%</p>
            <div style={{ marginTop: "0.5rem" }}>
              <ProgressBar pct={68} color={C.primary} />
            </div>
          </div>
        </div>
      </div>

      {/* Active Campaigns */}
      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={styles.sectionTitle}>Active Campaigns</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "0.75rem" }}>
          <CampaignCard
            name="Happy Hour Special"
            badge="Live · High Performance"
            badgeColor={C.primary}
            metric1Label="Revenue" metric1="$2.4K"
            metric2Label="Redemptions" metric2="142"
            pct={94}
            barColor={C.primary}
          />
          <CampaignCard
            name="Weekend Brunch Push"
            badge="Live · Scaling"
            badgeColor={C.tertiary}
            metric1Label="Reach" metric1="8.2K"
            metric2Label="Click Rate" metric2="3.2%"
            pct={82}
            barColor={C.tertiary}
          />
          <CampaignCard
            name="Loyalty Rewards"
            badge="Live · Established"
            badgeColor={C.secondary}
            metric1Label="Members" metric1="1.4K"
            metric2Label="Repeat Visits" metric2="68%"
            pct={68}
            barColor={C.secondary}
          />
        </div>
      </section>

      {/* Intelligence Feed */}
      <section style={{ marginBottom: "1.5rem" }}>
        <h2 style={styles.sectionTitle}>Intelligence Feed</h2>
        <div style={styles.glassPanel}>
          <IntelItem
            icon="↑"
            iconColor={C.primary}
            title="Happy Hour engagement up 22% this week"
            sub="Recommend boosting Friday 4–7 PM slot · 14m ago"
            accentBorder={C.primary}
          />
          <IntelItem
            icon="👥"
            iconColor={C.tertiary}
            title='New audience segment detected: "Brunch Explorers"'
            sub="340 users matching profile — create targeted campaign · 1h ago"
          />
          <IntelItem
            icon="⭐"
            iconColor={C.secondary}
            title="Google Reviews average up to 4.8 — promote this milestone"
            sub="Share on social to build trust signal · 3h ago"
          />
        </div>
      </section>

      {/* Launch Campaign Button */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button style={styles.launchBtn}>
          🚀 Launch Campaign
        </button>
      </div>
    </div>
  );
}

function ContentStudio() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h2 style={styles.sectionTitle}>Content Studio</h2>
        <span style={styles.badge(C.tertiary, C.tertiaryContainer)}>AI Confidence: 94%</span>
      </div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        {["Social", "Email", "SMS"].map((t, i) => (
          <button key={t} style={{
            padding: "0.35rem 0.75rem",
            borderRadius: "2px",
            background: i === 0 ? C.primary : C.surfaceContainerHigh,
            color: i === 0 ? C.onPrimary : C.onSurfaceVariant,
            border: "none",
            fontSize: "0.6875rem",
            fontWeight: 500,
            cursor: "pointer",
          }}>{t}</button>
        ))}
      </div>
      <div style={{ ...styles.cardOuter, marginBottom: "1rem" }}>
        <div style={styles.cardInner}>
          <p style={{ ...styles.label, marginBottom: "0.75rem" }}>✨ AI-Suggested Post</p>
          <p style={{ fontSize: "0.875rem", color: C.onSurface, lineHeight: 1.6, marginBottom: "1rem" }}>
            "🍹 Your Friday just got better. Happy Hour starts NOW — half-price cocktails and shareable plates until 7 PM. No reservations needed. Bring the crew. #HappyHour #RestaurantLife #FridayVibes"
          </p>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            {["📸", "👤", "🔍", "✉️"].map((icon) => (
              <span key={icon} style={{ width: "28px", height: "28px", borderRadius: "2px", background: C.surfaceContainerHigh, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem" }}>{icon}</span>
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button style={{ ...styles.launchBtn, flex: 1, justifyContent: "center" }}>Publish Now</button>
            <button style={{ padding: "0.5rem 0.75rem", borderRadius: "2px", background: C.surfaceContainerHigh, color: C.onSurfaceVariant, border: "none", fontSize: "0.6875rem", cursor: "pointer" }}>Schedule</button>
          </div>
        </div>
      </div>
      <h3 style={{ ...styles.sectionTitle, fontSize: "1rem", marginBottom: "0.75rem" }}>Recent Content</h3>
      {[
        { icon: "📸", name: "Sunday Brunch Reel", sub: "Instagram · Posted 2d ago", stat: "2.4K", statLabel: "reach", color: C.primary },
        { icon: "✉️", name: "Weekly Newsletter", sub: "Email · Sent 3d ago · 420 recipients", stat: "34.2%", statLabel: "open rate", color: C.tertiary },
        { icon: "💬", name: "Happy Hour SMS Blast", sub: "SMS · Sent 5d ago · 310 recipients", stat: "68%", statLabel: "CTR", color: C.secondary },
      ].map((item) => (
        <div key={item.name} style={{ ...styles.cardOuter, marginBottom: "0.5rem" }}>
          <div style={{ ...styles.cardInner, display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.5rem" }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "0.6875rem", fontWeight: 500, color: C.onSurface }}>{item.name}</p>
              <p style={{ fontSize: "0.625rem", color: C.onSurfaceVariant }}>{item.sub}</p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "0.875rem", fontWeight: 700, color: item.color }}>{item.stat}</p>
              <p style={{ fontSize: "9px", color: C.outline }}>{item.statLabel}</p>
            </div>
          </div>
        </div>
      ))}
      <h3 style={{ ...styles.sectionTitle, fontSize: "1rem", margin: "1.25rem 0 0.75rem" }}>Platform Performance</h3>
      <div style={styles.glassPanel}>
        <div style={{ padding: "1rem" }}>
          {[
            { name: "Instagram", pct: 78, color: C.primary },
            { name: "Facebook", pct: 54, color: C.secondary },
            { name: "Google", pct: 62, color: C.tertiary },
            { name: "Email", pct: 34, color: C.primary },
          ].map((p, i) => (
            <div key={p.name} style={{ marginBottom: i < 3 ? "0.75rem" : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.625rem", color: C.onSurfaceVariant, marginBottom: "0.25rem" }}>
                <span>{p.name}</span><span style={{ color: p.color }}>{p.pct}%</span>
              </div>
              <ProgressBar pct={p.pct} color={p.color} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Promotions() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
        <h2 style={styles.sectionTitle}>Promotions</h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {["Filter", "Export"].map((lbl) => (
            <button key={lbl} style={{ padding: "0.35rem 0.75rem", borderRadius: "2px", background: C.surfaceContainerHigh, color: C.onSurfaceVariant, border: "none", fontSize: "0.6875rem", cursor: "pointer" }}>{lbl}</button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
        {[
          { label: "Active Promos", value: "7", color: C.primary },
          { label: "Redemptions", value: "638", color: C.tertiary },
          { label: "Revenue Gen.", value: "$9.2K", color: C.secondary },
        ].map((s) => (
          <div key={s.label} style={styles.cardOuter}>
            <div style={styles.cardInner}>
              <p style={styles.label}>{s.label}</p>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.25rem", fontWeight: 700, color: s.color, marginTop: "0.25rem" }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>
      {[
        { code: "HAPPYHOUR20", badge: "Active", badgeColor: C.primary, desc: "20% off all drinks · Mon–Fri 4–7 PM", uses: "284", rev: "$3.4K", exp: "Jul 31" },
        { code: "BRUNCHSUNDAY", badge: "Active", badgeColor: C.tertiary, desc: "Free mimosa with any brunch entrée · Sundays", uses: "142", rev: "$2.8K", exp: "Aug 31" },
        { code: "LOYALTYVIP", badge: "Loyalty", badgeColor: C.secondary, desc: "10% off for returning customers (5+ visits)", uses: "212", rev: "$3.0K", exp: "Ongoing" },
      ].map((p) => (
        <div key={p.code} style={{ ...styles.cardOuter, marginBottom: "0.75rem" }}>
          <div style={styles.cardInner}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, color: C.onSurface }}>{p.code}</p>
              <span style={styles.badge(p.badgeColor, p.badgeColor)}>{p.badge}</span>
            </div>
            <p style={{ fontSize: "0.625rem", color: C.onSurfaceVariant, marginBottom: "0.5rem" }}>{p.desc}</p>
            <div style={{ display: "flex", gap: "1rem", fontSize: "0.625rem", color: C.onSurfaceVariant }}>
              <span>Uses: <span style={{ color: C.onSurface, fontWeight: 500 }}>{p.uses}</span></span>
              <span>Revenue: <span style={{ color: C.onSurface, fontWeight: 500 }}>{p.rev}</span></span>
              <span>Exp: <span style={{ color: C.onSurface, fontWeight: 500 }}>{p.exp}</span></span>
            </div>
          </div>
        </div>
      ))}
      <h3 style={{ ...styles.sectionTitle, fontSize: "1rem", margin: "1.25rem 0 0.75rem" }}>Promo Timeline</h3>
      <div style={styles.glassPanel}>
        <div style={{ padding: "1rem" }}>
          {[
            { color: C.primary, label: "Jun — Happy Hour" },
            { color: C.tertiary, label: "Jun–Jul — Summer Splash" },
            { color: C.secondary, label: "Jul — Loyalty VIP" },
            { color: C.outline, label: "Aug — Fall Preview" },
          ].map((t, i) => (
            <div key={t.label} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: i < 3 ? "0.75rem" : 0 }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: t.color, flexShrink: 0 }} />
              <div style={{ flex: 1, height: "1px", background: `${C.outlineVariant}44` }} />
              <p style={{ fontSize: "0.625rem", color: C.onSurfaceVariant, flexShrink: 0 }}>{t.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Analytics() {
  const bars = [
    { month: "Jan", h: 40, opacity: 0.5 },
    { month: "Feb", h: 60, opacity: 0.6 },
    { month: "Mar", h: 70, opacity: 0.7 },
    { month: "Apr", h: 80, opacity: 0.85 },
    { month: "May", h: 90, opacity: 1 },
    { month: "Jun", h: 95, gradient: true },
  ];
  return (
    <div>
      <h2 style={{ ...styles.sectionTitle, marginBottom: "1rem" }}>Analytics</h2>
      <div style={{ ...styles.cardOuter, marginBottom: "1rem" }}>
        <div style={styles.cardInner}>
          <p style={{ ...styles.label, marginBottom: "1rem" }}>Marketing Revenue — Last 6 Months</p>
          <svg viewBox="0 0 300 115" style={{ width: "100%", height: "115px", display: "block" }}>
            {bars.map((b, i) => (
              <g key={b.month}>
                <rect
                  x={10 + i * 45} y={100 - b.h} width={30} height={b.h} rx={1}
                  fill={b.gradient ? "url(#barG)" : C.primary}
                  opacity={b.gradient ? 1 : b.opacity}
                />
                <text x={25 + i * 45} y={112} textAnchor="middle" fontSize={7} fill={b.gradient ? C.primary : C.outline}>{b.month}</text>
              </g>
            ))}
            <defs>
              <linearGradient id="barG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={C.primary} />
                <stop offset="100%" stopColor="#7000ff" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
        {[
          { label: "Marketing ROI", value: "4.2x", color: C.primary, trend: "↑ 0.4x MoM", trendColor: C.tertiary },
          { label: "Cost/Acquisition", value: "$8.40", color: C.tertiary, trend: "↓ $1.20 MoM", trendColor: C.primary },
          { label: "Customer LTV", value: "$420", color: C.secondary, trend: "↑ $22 QoQ", trendColor: C.tertiary },
        ].map((s) => (
          <div key={s.label} style={styles.cardOuter}>
            <div style={styles.cardInner}>
              <p style={styles.label}>{s.label}</p>
              <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.25rem", fontWeight: 700, color: s.color, marginTop: "0.25rem" }}>{s.value}</p>
              <p style={{ fontSize: "9px", color: s.trendColor, marginTop: "0.25rem" }}>{s.trend}</p>
            </div>
          </div>
        ))}
      </div>
      <div style={{ ...styles.cardOuter, marginBottom: "1rem" }}>
        <div style={styles.cardInner}>
          <p style={{ ...styles.label, marginBottom: "0.75rem" }}>Marketing Spend vs Revenue</p>
          {[
            { label: "Spend", value: "$11.5K", color: C.error, pct: 38 },
            { label: "Revenue Generated", value: "$48.2K", color: C.primary, pct: 100, gradient: true },
          ].map((r) => (
            <div key={r.label} style={{ marginBottom: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.625rem", color: C.onSurfaceVariant, marginBottom: "0.25rem" }}>
                <span>{r.label}</span><span style={{ color: r.color }}>{r.value}</span>
              </div>
              <div style={{ ...styles.progressTrack, height: "6px" }}>
                <div style={{ width: `${r.pct}%`, height: "100%", background: r.gradient ? "linear-gradient(135deg,#4cd6ff,#7000ff)" : r.color, borderRadius: "999px" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <h3 style={{ ...styles.sectionTitle, fontSize: "1rem", marginBottom: "0.75rem" }}>Conversion Events</h3>
      <div style={styles.glassPanel}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "0.5rem", padding: "0.75rem", borderBottom: `1px solid ${C.outlineVariant}33` }}>
          {["Event", "Count", "Rate", "Value"].map((h) => (
            <p key={h} style={{ ...styles.label, textAlign: h !== "Event" ? "right" : "left" }}>{h}</p>
          ))}
        </div>
        {[
          { event: "Reservation Click", count: "842", rate: "14.2%", value: "$34K", rateColor: C.primary },
          { event: "Promo Redemption", count: "638", rate: "8.8%", value: "$9.2K", rateColor: C.tertiary },
          { event: "Loyalty Sign-Up", count: "284", rate: "4.1%", value: "$5.0K", rateColor: C.secondary },
        ].map((row) => (
          <div key={row.event} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: "0.5rem", padding: "0.75rem" }}>
            <p style={{ fontSize: "0.6875rem", color: C.onSurface }}>{row.event}</p>
            <p style={{ fontSize: "0.6875rem", color: C.onSurface, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{row.count}</p>
            <p style={{ fontSize: "0.6875rem", color: row.rateColor, textAlign: "right" }}>{row.rate}</p>
            <p style={{ fontSize: "0.6875rem", color: C.onSurface, textAlign: "right" }}>{row.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Audience() {
  return (
    <div>
      <h2 style={{ ...styles.sectionTitle, marginBottom: "1rem" }}>Audience</h2>
      <h3 style={{ ...styles.sectionTitle, fontSize: "1rem", marginBottom: "0.75rem" }}>Customer Segments</h3>
      {[
        { icon: "🏆", label: "VIP Loyalists", sub: "10+ visits · High spend · NPS 9+", count: "218", color: C.primary },
        { icon: "🔥", label: "Regulars", sub: "3–9 visits · Moderate spend", count: "512", color: C.tertiary },
        { icon: "⭐", label: "Occasionals", sub: "1–2 visits · Discovery phase", count: "940", color: C.secondary },
        { icon: "👤", label: "Lapsed", sub: "No visit in 90+ days", count: "344", color: C.outline },
      ].map((s) => (
        <div key={s.label} style={{ ...styles.cardOuter, marginBottom: "0.5rem" }}>
          <div style={{ ...styles.cardInner, display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontSize: "1.25rem" }}>{s.icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "0.6875rem", fontWeight: 500, color: C.onSurface }}>{s.label}</p>
              <p style={{ fontSize: "0.625rem", color: C.onSurfaceVariant }}>{s.sub}</p>
            </div>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.count}</p>
          </div>
        </div>
      ))}
      <h3 style={{ ...styles.sectionTitle, fontSize: "1rem", margin: "1.25rem 0 0.75rem" }}>Demographics</h3>
      <div style={{ ...styles.glassPanel, marginBottom: "1.25rem" }}>
        <div style={{ padding: "1rem" }}>
          {[
            { age: "25–34", pct: 38, color: C.primary },
            { age: "35–44", pct: 28, color: C.tertiary },
            { age: "18–24", pct: 22, color: C.secondary },
            { age: "45+", pct: 12, color: C.outline },
          ].map((d, i) => (
            <div key={d.age} style={{ marginBottom: i < 3 ? "0.75rem" : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.625rem", color: C.onSurfaceVariant, marginBottom: "0.25rem" }}>
                <span>{d.age}</span><span style={{ color: d.color }}>{d.pct}%</span>
              </div>
              <ProgressBar pct={d.pct} color={d.color} />
            </div>
          ))}
        </div>
      </div>
      <h3 style={{ ...styles.sectionTitle, fontSize: "1rem", marginBottom: "0.75rem" }}>Top Customer Profiles</h3>
      {[
        { initials: "JM", name: "Jamie M.", sub: "24 visits · Avg. $82/visit", tag: "VIP", tagColor: C.primary, bg: "linear-gradient(135deg,#4cd6ff,#7000ff)", initColor: C.onPrimary },
        { initials: "SR", name: "Sara R.", sub: "18 visits · Avg. $65/visit", tag: "Regular", tagColor: C.tertiary, bg: C.tertiaryContainer, initColor: C.onTertiary },
        { initials: "TK", name: "Tom K.", sub: "14 visits · Avg. $58/visit", tag: "Regular", tagColor: C.secondary, bg: C.secondaryContainer, initColor: C.onSecondary },
      ].map((p) => (
        <div key={p.name} style={{ ...styles.cardOuter, marginBottom: "0.5rem" }}>
          <div style={{ ...styles.cardInner, display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: p.bg, display: "flex", alignItems: "center", justifyContent: "center", color: p.initColor, fontSize: "0.75rem", fontWeight: 700, flexShrink: 0 }}>{p.initials}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "0.6875rem", fontWeight: 500, color: C.onSurface }}>{p.name}</p>
              <p style={{ fontSize: "0.625rem", color: C.onSurfaceVariant }}>{p.sub}</p>
            </div>
            <span style={styles.badge(p.tagColor, p.tagColor)}>{p.tag}</span>
          </div>
        </div>
      ))}
      <h3 style={{ ...styles.sectionTitle, fontSize: "1rem", margin: "1.25rem 0 0.75rem" }}>Re-engagement Timeline</h3>
      <div style={styles.glassPanel}>
        <div style={{ padding: "1rem" }}>
          {[
            { color: C.primary, text: 'Day 30 — SMS "We miss you" offer', stat: "42% open", statColor: C.primary },
            { color: C.tertiary, text: "Day 60 — Email with 15% off coupon", stat: "28% CTR", statColor: C.tertiary },
            { color: C.secondary, text: "Day 90 — Final win-back social retarget", stat: "12% return", statColor: C.secondary },
          ].map((r, i) => (
            <div key={r.text} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: i < 2 ? "0.75rem" : 0 }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: r.color, flexShrink: 0 }} />
              <p style={{ fontSize: "0.625rem", color: C.onSurfaceVariant, flex: 1 }}>{r.text}</p>
              <p style={{ fontSize: "0.625rem", color: r.statColor, fontWeight: 500, flexShrink: 0 }}>{r.stat}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

const TABS = [
  { id: "campaign", label: "Campaign", component: CampaignCommand },
  { id: "content", label: "Content", component: ContentStudio },
  { id: "promotions", label: "Promotions", component: Promotions },
  { id: "analytics", label: "Analytics", component: Analytics },
  { id: "audience", label: "Audience", component: Audience },
];

export default function Marketeer() {
  const [activeTab, setActiveTab] = useState("campaign");

  const ActiveView = TABS.find((t) => t.id === activeTab)?.component || CampaignCommand;

  return (
    <div style={styles.page}>
      {/* Top App Bar */}
      <header style={styles.topbar}>
        <span style={{ fontSize: "1.25rem", color: C.primary }}>🔒</span>
        <span style={styles.brand}>MARKETEER</span>
        <nav style={{ display: "flex", alignItems: "stretch", flex: 1, height: "64px" }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={styles.navTab(activeTab === tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div style={{ marginLeft: "auto" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "50%",
            background: C.secondaryContainer,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: C.onSecondary, fontSize: "0.75rem", fontWeight: 700,
            fontFamily: "'Space Grotesk', sans-serif",
          }}>RP</div>
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        <ActiveView />
      </main>
    </div>
  );
}
