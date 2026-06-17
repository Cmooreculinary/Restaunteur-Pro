import React, { useState } from 'react';

const C = {
  primary: '#4cd6ff',
  secondary: '#d1bcff',
  tertiary: '#00dce5',
  secondaryContainer: '#7000ff',
  surface: '#111318',
  surfaceContainer: '#1e2024',
  surfaceContainerHigh: '#282a2e',
  surfaceContainerHighest: '#333539',
  surfaceContainerLowest: '#0c0e12',
  onSurface: '#e2e2e8',
  onSurfaceVariant: '#c2c6d9',
  outline: '#8c90a2',
  outlineVariant: '#424656',
};

const electricGradient = 'linear-gradient(135deg, #4cd6ff 0%, #7000ff 100%)';

function Badge({ children, color = C.primary, bg }) {
  return (
    <span style={{
      padding: '2px 8px',
      background: bg || `${color}1a`,
      border: `1px solid ${color}4d`,
      borderRadius: '0.75rem',
      fontSize: '9px',
      fontWeight: 700,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      color,
      display: 'inline-block',
    }}>
      {children}
    </span>
  );
}

function Card({ children, style }) {
  return (
    <div style={{ padding: '4px', borderRadius: '2px', background: C.surfaceContainerHigh, ...style }}>
      <div style={{ background: C.surfaceContainer, borderRadius: '2px', padding: '16px', height: '100%' }}>
        {children}
      </div>
    </div>
  );
}

function ProgressBar({ pct, color = C.primary }) {
  return (
    <div style={{ width: '100%', height: '4px', background: C.surfaceContainerLowest, borderRadius: '99px', overflow: 'hidden' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color === 'electric' ? electricGradient : color, borderRadius: '99px' }} />
    </div>
  );
}

const TABS = [
  { id: 'campaign', label: 'Campaign', icon: 'campaign' },
  { id: 'content', label: 'Content', icon: 'edit_note' },
  { id: 'promotions', label: 'Promotions', icon: 'local_offer' },
  { id: 'analytics', label: 'Analytics', icon: 'bar_chart' },
  { id: 'audience', label: 'Audience', icon: 'people' },
];

function CampaignTab() {
  return (
    <div>
      {/* Hero Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '16px' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
            <div>
              <p style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: C.outline, fontWeight: 500, marginBottom: '4px' }}>Total Campaign Reach</p>
              <p style={{ fontFamily: 'Space Grotesk', fontSize: '40px', fontWeight: 700, color: C.onSurface, lineHeight: 1 }}>48.2K</p>
              <p style={{ fontSize: '12px', color: C.onSurfaceVariant, marginTop: '4px' }}>reached this month</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <Badge>+18.4%</Badge>
              <span style={{ fontSize: '10px', color: C.outline }}>vs last month</span>
            </div>
          </div>
          <svg viewBox="0 0 300 60" style={{ width: '100%', height: '56px' }} preserveAspectRatio="none">
            <polyline points="0,60 0,42 30,38 60,35 90,30 120,28 150,32 180,22 210,18 240,12 270,8 300,5 300,60" fill="rgba(76,214,255,0.1)" stroke="none"/>
            <polyline points="0,42 30,38 60,35 90,30 120,28 150,32 180,22 210,18 240,12 270,8 300,5" fill="none" stroke="#4cd6ff" strokeWidth="1.5"/>
            <circle cx="300" cy="5" r="3" fill="#4cd6ff"/>
          </svg>
        </Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Card style={{ flex: 1 }}>
            <p style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: C.outline, fontWeight: 500, marginBottom: '8px' }}>Active Campaigns</p>
            <p style={{ fontFamily: 'Space Grotesk', fontSize: '32px', fontWeight: 700, color: C.onSurface }}>5</p>
            <p style={{ fontSize: '11px', color: C.onSurfaceVariant, marginTop: '4px', marginBottom: '12px' }}>2 High-Impact · 3 Seasonal</p>
            <ProgressBar pct={83} color="electric" />
          </Card>
          <Card style={{ flex: 1 }}>
            <p style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: C.outline, fontWeight: 500, marginBottom: '8px' }}>Avg. Engagement Rate</p>
            <p style={{ fontFamily: 'Space Grotesk', fontSize: '32px', fontWeight: 700, color: C.onSurface }}>6.8%</p>
            <p style={{ fontSize: '11px', color: C.onSurfaceVariant, marginTop: '4px', marginBottom: '12px' }}>+1.2% above industry avg</p>
            <ProgressBar pct={68} color={C.tertiary} />
          </Card>
        </div>
      </div>

      {/* Active Campaigns */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '18px', fontWeight: 500, color: C.onSurface }}>Active Campaigns</h2>
          <button style={{ color: C.primary, fontSize: '11px', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            + New Campaign
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            { name: 'Happy Hour Special', tag: 'High Performance', status: 'Live', statusColor: C.primary, icon: '🍸', metric1: ['Revenue', '$2.4K'], metric2: ['Redemptions', '142'], pct: 94, barColor: 'electric' },
            { name: 'Weekend Brunch Push', tag: 'Social · Paid', status: 'Scaling', statusColor: C.tertiary, icon: '🥂', metric1: ['Reach', '8.2K'], metric2: ['Click Rate', '3.2%'], pct: 82, barColor: C.tertiary },
            { name: 'Loyalty Rewards', tag: 'Email · SMS', status: 'Established', statusColor: C.secondary, icon: '💎', metric1: ['Members', '1.4K'], metric2: ['Repeat Visits', '68%'], pct: 68, barColor: C.secondary },
          ].map(c => (
            <Card key={c.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '2px', background: electricGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{c.icon}</div>
                <Badge color={c.statusColor}>{c.status}</Badge>
              </div>
              <p style={{ fontFamily: 'Space Grotesk', fontSize: '14px', fontWeight: 600, color: C.onSurface, marginBottom: '2px' }}>{c.name}</p>
              <p style={{ fontSize: '10px', color: C.outline, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>{c.tag}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                {[c.metric1, c.metric2].map(([label, val]) => (
                  <div key={label}>
                    <p style={{ fontSize: '9px', color: C.outline, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{label}</p>
                    <p style={{ fontFamily: 'Space Grotesk', fontSize: '16px', fontWeight: 700, color: C.onSurface }}>{val}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px' }}>
                <span style={{ color: C.onSurfaceVariant }}>Performance</span>
                <span style={{ color: c.statusColor, fontWeight: 500 }}>{c.pct}%</span>
              </div>
              <ProgressBar pct={c.pct} color={c.barColor} />
            </Card>
          ))}
        </div>
      </div>

      {/* Intelligence Feed */}
      <div style={{ padding: '4px', borderRadius: '2px', background: C.surfaceContainerHigh }}>
        <div style={{ background: C.surfaceContainer, borderRadius: '2px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderBottom: `1px solid ${C.outlineVariant}30` }}>
            <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '14px', fontWeight: 500, color: C.onSurface, display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚡ Intelligence Feed
            </h2>
            <Badge>Live</Badge>
          </div>
          {[
            { color: C.primary, icon: '📈', title: 'Instagram Post Reached 2,400 New Users', sub: 'Weekend Brunch Push · Organic reach up 31%', time: '2m ago' },
            { color: C.tertiary, icon: '🍸', title: 'Happy Hour redemptions up 12% this week', sub: '142 total today · Revenue $2,400', time: '15m ago' },
            { color: C.secondary, icon: '⭐', title: 'New 5-star review posted on Yelp', sub: '"Best brunch spot in the area!" — @foodie_jane', time: '1h ago' },
            { color: C.outlineVariant, icon: '📧', title: 'Email Blast: 34.2% open rate achieved', sub: '2,840 opened · 4.6% above industry benchmark', time: '3h ago' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', padding: '12px 16px', borderLeft: `2px solid ${item.color}`, borderBottom: i < 3 ? `1px solid ${C.outlineVariant}18` : 'none' }}>
              <span style={{ fontSize: '16px', marginTop: '2px' }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '14px', color: C.onSurface, fontWeight: 500 }}>{item.title}</p>
                <p style={{ fontSize: '11px', color: C.outline, marginTop: '2px' }}>{item.sub}</p>
              </div>
              <span style={{ fontSize: '10px', color: C.outline, whiteSpace: 'nowrap' }}>{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlaceholderTab({ label, icon }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '16px' }}>
      <span style={{ fontSize: '48px' }}>{icon}</span>
      <p style={{ fontFamily: 'Space Grotesk', fontSize: '24px', fontWeight: 600, color: C.onSurface }}>{label}</p>
      <p style={{ fontSize: '14px', color: C.onSurfaceVariant }}>Coming soon — open <code style={{ color: C.primary }}>marketeer.html</code> for the full standalone experience</p>
    </div>
  );
}

export default function Marketeer() {
  const [activeTab, setActiveTab] = useState('campaign');

  return (
    <div style={{ background: C.surfaceContainerLowest, minHeight: '100vh', color: C.onSurface, fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: C.surface, height: '64px',
        borderBottom: `1px solid ${C.outlineVariant}30`,
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: '16px',
      }}>
        <span style={{ fontFamily: 'Space Grotesk', fontSize: '16px', fontWeight: 700, letterSpacing: '0.15em', color: C.onSurface, textTransform: 'uppercase' }}>
          🔒 Marketeer
        </span>
        <nav style={{ display: 'flex', height: '100%', marginLeft: '24px' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0 16px',
                height: '100%',
                fontSize: '14px',
                fontWeight: 500,
                color: activeTab === tab.id ? C.primary : C.onSurfaceVariant,
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id ? `2px solid ${C.primary}` : '2px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Badge>Live</Badge>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: electricGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'white' }}>CM</div>
        </div>
      </header>

      {/* Live Ticker */}
      <div style={{ background: C.surfaceContainerLowest, borderBottom: `1px solid ${C.outlineVariant}30`, padding: '6px 0', overflow: 'hidden', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'inline-block', animation: 'marquee 40s linear infinite' }}>
          <span style={{ fontSize: '11px', color: C.onSurfaceVariant, paddingLeft: '24px' }}>
            <span style={{ color: C.primary }}>◆</span> New Review: 4.8⭐ on Google — 2m ago &nbsp;|&nbsp;
            <span style={{ color: C.tertiary }}>◆</span> Happy Hour: 142 redemptions today &nbsp;|&nbsp;
            <span style={{ color: C.secondary }}>◆</span> Instagram Reach: +2,400 impressions &nbsp;|&nbsp;
            <span style={{ color: C.primary }}>◆</span> Email Open Rate: 34.2% — above average &nbsp;|&nbsp;
            <span style={{ color: C.tertiary }}>◆</span> Loyalty: 68% repeat visit rate &nbsp;|&nbsp;&nbsp;&nbsp;
            <span style={{ color: C.primary }}>◆</span> New Review: 4.8⭐ on Google — 2m ago &nbsp;|&nbsp;
            <span style={{ color: C.tertiary }}>◆</span> Happy Hour: 142 redemptions today &nbsp;|&nbsp;
            <span style={{ color: C.secondary }}>◆</span> Instagram Reach: +2,400 impressions &nbsp;|&nbsp;
            <span style={{ color: C.primary }}>◆</span> Email Open Rate: 34.2% — above average &nbsp;|&nbsp;
            <span style={{ color: C.tertiary }}>◆</span> Loyalty: 68% repeat visit rate
          </span>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px 80px' }}>
        {activeTab === 'campaign' && <CampaignTab />}
        {activeTab === 'content' && <PlaceholderTab label="Content Studio" icon="✍️" />}
        {activeTab === 'promotions' && <PlaceholderTab label="Promotions" icon="🎯" />}
        {activeTab === 'analytics' && <PlaceholderTab label="Analytics" icon="📊" />}
        {activeTab === 'audience' && <PlaceholderTab label="Audience" icon="👥" />}
      </main>

      {/* Launch Campaign FAB */}
      {activeTab !== 'content' && (
        <button
          onClick={() => setActiveTab('content')}
          style={{
            position: 'fixed', bottom: '24px', right: '24px', zIndex: 50,
            background: electricGradient, color: 'white',
            padding: '12px 20px', borderRadius: '0.75rem',
            border: 'none', cursor: 'pointer',
            fontSize: '14px', fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: '8px',
            boxShadow: '0 4px 24px rgba(76,214,255,0.3)',
          }}
        >
          🚀 Deploy Campaign
        </button>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap');
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
      `}</style>
    </div>
  );
}
