# DESIGN.md — DDT Structure

## Aesthetic Direction

**Theme:** Industrial Precision
**Tone:** Authoritative, dense, trustworthy — the software equivalent of a structural engineering report.
This is a professional daily-use operations tool. It must feel like it costs money, works reliably on mid-range Android in Lagos, and respects the engineer's time. No decorative softness. No consumer-app friendliness. Every pixel earns its place.

**Unforgettable moment:** The Operations Dashboard — a live command centre where a manager sees every active project, every staff member's current task, and every bottleneck, at a glance. It should feel like a control room, not a spreadsheet.

---

## Visual Language

### Color Palette

| Token | Value | Usage |
|---|---|---|
| `--color-bg-primary` | `#0C1220` | Page background |
| `--color-bg-surface` | `#141C2E` | Cards, sidebars |
| `--color-bg-raised` | `#1C2640` | Elevated cards, modals |
| `--color-bg-input` | `#1A2235` | Input fields, table rows |
| `--color-border` | `#2A3550` | Default borders |
| `--color-border-strong` | `#3A4A6A` | Emphasis borders |
| `--color-accent` | `#F59E0B` | Primary CTA, active states, amber accent |
| `--color-accent-dim` | `#92610A` | Accent hover/pressed |
| `--color-accent-bg` | `#2A1F05` | Accent background tint |
| `--color-text-primary` | `#E8EAF0` | Headings, main content |
| `--color-text-secondary` | `#8892A4` | Labels, muted text |
| `--color-text-tertiary` | `#4A5568` | Placeholders, disabled |
| `--color-code` | `#F59E0B` | NDT report codes (e.g. K005) |

### Status Chip Colors

| Status | Background | Text | Border |
|---|---|---|---|
| Not Started | `#1A2235` | `#8892A4` | `#2A3550` |
| WIP | `#0D1F3C` | `#60A5FA` | `#1E3A5F` |
| Analysis Done | `#0D2B2B` | `#2DD4BF` | `#0F4040` |
| Sketch Done | `#1A1040` | `#A78BFA` | `#2D1F6E` |
| Report Done | `#2A1F05` | `#F59E0B` | `#4A3510` |
| Proof Ready | `#2A1505` | `#FB923C` | `#4A2A10` |
| Report Uploaded | `#10203A` | `#818CF8` | `#1E2F5A` |
| Report Verified | `#0A2E1A` | `#34D399` | `#0F4A2A` |
| Report Delivered | `#062210` | `#10B981` | `#0A3A1C` |
| Proof Failed | `#2E0A0A` | `#F87171` | `#4A1010` |

---

## Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| Display / Page titles | `Syne` | 700 | 24–32px |
| Section headings | `Syne` | 600 | 16–20px |
| Body / UI labels | `DM Sans` | 400/500 | 13–15px |
| NDT codes, timestamps | `JetBrains Mono` | 500 | 12–14px |
| Stats / Metrics | `Syne` | 700 | 28–40px |

**Font import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@400;500&family=JetBrains+Mono:wght@500&display=swap');
```

---

## Spacing & Grid

- **Base unit:** 4px
- **Page padding:** 24px (desktop), 16px (mobile)
- **Card padding:** 20px
- **Component gap:** 16px
- **Section gap:** 32px
- **Border radius:** 8px (components), 12px (cards), 16px (modals)
- **Layout:** Sidebar (240px fixed) + Main content (fluid)

---

## Component System

### Navigation (Sidebar)
- Fixed left sidebar, 240px wide
- Logo + lab name at top
- Nav items: icon + label, amber left border on active
- Bottom: user avatar + role pill + logout
- Collapse to icon-only on mobile

### Stat Cards (Dashboard row)
- 4-column grid across top of dashboard
- Dark surface background
- Large number in Syne 700 / 32px
- Label in DM Sans 13px secondary color
- Subtle amber border-left on primary stat (Active Projects)
- Trend indicator (arrow + percentage) in green/red

### Project Table
- Full-width, no outer border
- Alternating row backgrounds: `--color-bg-surface` / `--color-bg-input`
- Columns: Code | Client | Address | Date | Status | Report Handler | Sketch | Analysis | Actions
- NDT Code in JetBrains Mono, amber color
- Status as chip (pill badge)
- Sticky header
- Click row → expand inline OR navigate to project detail

### Report Pipeline (Project Detail)
- Horizontal stage bar: Analysis → Sketch → Report Writing → Proofreading → Done
- Each stage: icon + staff name + timestamp + duration
- Active stage glows amber
- Completed stages: green checkmark + timestamp
- Failed proof: red badge + fault count

### Staff Task Card (Staff View)
- Clean card per task
- Top: project code (monospace amber) + client name
- Middle: stage pill + assigned by
- Bottom: time started + elapsed timer (if active)
- Action button: "Mark Complete" or "In Progress"

### Monthly Performance Report
- Full page layout for PDF export
- Header: lab name + staff name + month/year
- Sections: Site Visits table | Report Stages table | Quality Score
- Quality score as a visual gauge (0–100)
- Fault history: timeline of proofread failures

---

## Screen List

| Screen | Roles | Priority |
|---|---|---|
| Login | All | P0 |
| Dashboard (Operations) | Admin, Lab Owner, Ops Manager | P0 |
| Projects List | Admin, Lab Owner, Ops Manager | P0 |
| Project Detail | Admin, Lab Owner, Ops Manager | P0 |
| New Project Form | Ops Manager | P0 |
| Staff Task View | Staff | P0 |
| Search & Filter (Reports) | All managers | P0 |
| Staff Management | Lab Owner, Ops Manager | P1 |
| Monthly Performance Report | Lab Owner, Ops Manager | P1 |
| Lab Settings | Lab Owner | P1 |
| Super Admin Panel | Super Admin | P2 |
| Billing / Subscription | Lab Owner | P2 |

---

## Interaction Patterns

### Status Updates
- Ops Manager changes status → animated chip transition → timestamp auto-logged
- Proofread Fail → modal: "Reason for failure?" (optional) → fault logged → staff notified

### Task Assignment
- Manager clicks staff name cell → dropdown of available staff → confirm → notification sent
- Unassigned stages shown with amber dashed border

### Notifications (In-app)
- Bell icon in sidebar with red badge count
- Notification types: New task assigned | Stage completed | Proof failed | Report delivered
- Toast notifications for real-time updates

### Search
- Global search bar (Cmd+K / Ctrl+K) — searches NDT codes, client names, addresses
- Filter panel: Date range | Status | Staff | Client
- Results highlight matching term

---

## Motion

- Page transitions: fade + 4px slide-up, 180ms ease
- Status chip change: crossfade, 200ms
- Toast notification: slide-in from right, 250ms
- Dashboard stats: count-up animation on first load, 600ms
- Table row hover: background transition, 100ms

---

## Mobile Considerations (Android mid-range)

- Touch targets minimum 44px
- Sidebar collapses to bottom tab bar on mobile
- Staff task view is mobile-primary (staff use phones)
- Optimistic UI updates — assume network is slow
- Offline-resilient: cache last-known project states

---

## Design Score Baseline

| Criterion | Score | Notes |
|---|---|---|
| Visual Distinctiveness | 9/10 | Industrial dark theme is rare in this market |
| Information Density | 8/10 | Dense without clutter |
| Role Appropriateness | 9/10 | Manager vs Staff views are clearly differentiated |
| Mobile Readiness | 7/10 | Staff view prioritised for mobile |
| Local Context Fit | 8/10 | Works on mid-range Android, offline-aware |
| **Overall** | **8.2/10** | ✅ Exceeds 7/10 threshold — proceed to Phase 3 |
