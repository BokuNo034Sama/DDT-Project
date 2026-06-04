# MASTER IMPLEMENTATION PLAN — DDT STRUCTURE
**Revised Version:** 2.0
**Status:** Conflict-Free — Ready for Antigravity
**Current Build Position:** Step 23 complete
**Remaining Steps:** 24–40 + 4 Blueprint UX additions (Steps 33A–33D)
**Live URL:** https://ddt-project.vercel.app
**Project Directory:** `C:\Users\provident\Documents\034 Products\ddt-structure`

---

# ════════════════════════════════════════════════
# SECTION 0 — MANDATORY AGENT PREAMBLE
# READ THIS BEFORE EXECUTING ANY STEP
# ════════════════════════════════════════════════

```
PROJECT: DDT Structure — Multi-tenant SaaS for NDT laboratories in Lagos.
TECH STACK: Next.js 14 App Router, TypeScript strict, tRPC, Supabase
(Postgres + Auth + Realtime + Storage), Tailwind CSS, shadcn/ui,
Dexie.js (offline), next-pwa, @react-pdf/renderer, Resend, Anthropic SDK.

LIVE URL:             https://ddt-project.vercel.app
SUPABASE PROJECT REF: sypsrkgolllnfhzmqhmk
TENANT UUID:          78cd5117-3d79-4507-b286-d087e2dfa426

───────────────────────────────────────────────
CRITICAL AUTH RULE — ALREADY IMPLEMENTED
───────────────────────────────────────────────
src/server/context.ts reads role and tenant_id by querying the
public.users table directly — NOT from JWT claims or app_metadata.
Never revert this. The pattern is:

  const { data: profile } = await supabase
    .from("users")
    .select("role, tenant_id")
    .eq("id", user.id)
    .single();

Any RLS policy that references auth.jwt()->>'tenant_id' must be
replaced with a direct subquery:

  USING (
    tenant_id = (
      SELECT tenant_id FROM public.users WHERE id = auth.uid()
    )
  );

───────────────────────────────────────────────
DESIGN SYSTEM — TWO-PART VISUAL SYSTEM
───────────────────────────────────────────────

PART 1 — GATEWAY PAGES (/login, /register, /accept-invite, /accept-invite/success)
Layout:        50/50 split screen — left panel = sky blue hero structural image,
               right panel = clean white form area
Background:    Sky Blue #3B82F6 (left panel), White #FFFFFF (right panel)
CTA buttons:   Neon Lime #A3E635 (pill-shaped, directional micro-icons)
Font:          Inter Bold 64px (headlines), Inter Regular 20px (subtext),
               Inter Regular 14px (body, form inputs)
Card radius:   24px
Input radius:  12px
Transitions:   200ms ease-in-out on hover/focus states

PART 2 — APP CORE (all authenticated /app/ routes)
CSS tokens (add to globals.css and Tailwind config):

  --color-bg-primary:     #0C1220   Page shell background
  --color-bg-surface:     #141C2E   Cards, sidebar, table containers
  --color-bg-raised:      #1C2640   Modals, dropdowns, JIT overlays
  --color-bg-input:       #1A2235   Form fields, inset table rows
  --color-border:         #2A3550   Standard borders
  --color-border-strong:  #3A4A6A   Emphasis/active borders
  --color-text-primary:   #E8EAF0   Headings, main content text
  --color-text-secondary: #8892A4   Labels, muted values
  --color-core-brand:     Sky Blue  Active highlights, code text, links
                                    (REPLACES ALL legacy amber #F59E0B)
  --color-core-tactical:  Neon Lime Primary CTAs, active pipeline stages,
                                    notification badges, JIT modal accents

Typography:
  Body + tables + labels:  Inter 400/500
  Display headings:        Syne 700 / 32px (stat numbers on dashboard)
  Section headings:        Syne 600 / 20px
  NDT codes + timestamps:  JetBrains Mono 500 / 13px

Component dimensions:
  Standard blocks:    8px border-radius
  Command cards:      12px border-radius
  Modals + overlays:  16px border-radius
  Pills + chips:      999px border-radius
  Sidebar:            240px fixed width
  Touch targets:      48px minimum height on mobile

Status chip colour map:
  not_started:      bg #1A2235 / text #8892A4  / border #2A3550
  wip:              bg #0D1F3C / text #60A5FA  / border #1E3A5F
  analysis_done:    bg #0D2B2B / text #2DD4BF  / border #0F4040
  sketch_done:      bg #1A1040 / text #A78BFA  / border #2D1F6E
  report_done:      bg #2A1F05 / text --color-core-brand / border #4A3510
  proof_ready:      bg #2A1505 / text #FB923C  / border #4A2A10
  report_uploaded:  bg #10203A / text #818CF8  / border #1E2F5A
  report_verified:  bg #0A2E1A / text #34D399  / border #0F4A2A
  report_delivered: bg #062210 / text #10B981  / border #0A3A1C
  proof_failed:     bg #2E0A0A / text #F87171  / border #4A1010

PROJECT PIPELINE STATUS ORDER:
not_started → wip → analysis_done → sketch_done → report_done →
proof_ready → report_uploaded → report_verified → report_delivered

ROLES (descending authority):
super_admin → lab_owner → ops_manager → staff

NEVER USE: amber #F59E0B, Plus Jakarta Sans, DM Sans, JapBento tokens,
or any reference to --color-accent from previous design iterations.
```

---

# ════════════════════════════════════════════════
# PHASE 1 — CORE COMPLETION (Steps 23–25)
# Prerequisite: Steps 1–22 complete
# ════════════════════════════════════════════════

---

## [STEP 23] — Server-Abstracted PDF Export Engine
*(Currently in progress — complete before proceeding)*

**Context:**
Performance page UI is complete (Step 22). The monthly performance report is the flagship
differentiator. PDF generation must run server-side only — never import @react-pdf/renderer
in any Client Component or the build will fail.

**Task:**

1. Create `src/lib/pdf/PerformanceReportPdf.tsx`:
   - React-PDF document using `@react-pdf/renderer`
   - Register fonts explicitly — DO NOT use CSS variables inside React-PDF:
     ```typescript
     import { Font } from '@react-pdf/renderer'
     Font.register({
       family: 'Inter',
       src: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2'
     })
     ```
   - PDF layout sections: header (lab name + month + "Staff Performance Report"),
     then per staff: site visits table, report stages table, fault log table, efficiency score gauge
   - Footer: "Generated by DDT Structure · {date} · Confidential"
   - Style using hardcoded hex values — no CSS variables in PDF context
   - Efficiency score rendered as a text-based circular indicator (0–100)

2. Create `src/app/api/reports/performance-pdf/route.ts`:
   - POST route — SERVER SIDE ONLY
   - Validate JWT using `createServerClient` from `@supabase/ssr`
   - Read role from `public.users` table directly (not JWT claims)
   - Fetch performance data directly from Supabase — not through tRPC
   - Render using `renderToBuffer()`
   - Return with headers:
     ```
     Content-Type: application/pdf
     Content-Disposition: attachment; filename="DDT-Performance-{month}.pdf"
     ```

3. Update `src/components/performance/PerformancePage.tsx`:
   - Wire "Export PDF" button with loading state
   - Use fetch + Blob pattern for download:
     ```typescript
     const res = await fetch('/api/reports/performance-pdf', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ month: selectedMonth, staffId: selectedStaff })
     })
     const blob = await res.blob()
     const url = URL.createObjectURL(blob)
     const a = document.createElement('a')
     a.href = url
     a.download = `DDT-Performance-${selectedMonth}.pdf`
     a.click()
     URL.revokeObjectURL(url)
     ```
   - Show spinner on button during generation
   - Handle null/undefined gracefully — staff with zero site visits must not crash

**Design tokens (Part 2):**
- Export button: `--color-core-tactical` background (Neon Lime)
- Loading state: spinner in `--color-core-brand` (Sky Blue)

**Expected Output:**
- `npm run build` passes — no @react-pdf import in any Client Component
- POST to `/api/reports/performance-pdf` returns a valid PDF binary
- Browser download triggers correctly
- PDF contains all sections, handles zero-data staff gracefully

**File Targets:**
- `src/lib/pdf/PerformanceReportPdf.tsx`
- `src/app/api/reports/performance-pdf/route.ts`
- `src/components/performance/PerformancePage.tsx` (updated)

**Dependencies:** Step 22 complete

**→ After this step: /careful**

---

## [STEP 24] — Analytical Command Center (Manager Dashboard)

**Context:**
PDF export complete. The manager dashboard is the primary operations view — a live command
centre showing all active projects and staff efficiency at a glance.

**Task:**

1. Add `getDashboardData` to `src/server/routers/projects.ts`:
   ```typescript
   // Returns in ONE query:
   {
     activeCount: number,          // status != report_delivered
     staffOnTask: number,          // in_progress stage assignments
     awaitingProofread: number,    // status = proof_ready or report_done
     deliveredThisMonth: number,   // delivered in current calendar month
     activeProjects: Project[],    // last 20 active projects with stages
   }
   ```

2. Create `src/components/dashboard/ManagerDashboard.tsx` (Client Component):
   - 4-column stat card grid at top:
     - Card 1 (primary): Active Projects — Syne 700 / 32px count
     - Card 2: Staff On Task
     - Card 3: Awaiting Proofread
     - Card 4: Delivered This Month
   - Active projects table below stat cards (max 10 rows, "View All" link)
   - Supabase Realtime subscription:
     ```typescript
     supabase.channel('dashboard')
       .on('postgres_changes', {
         event: 'UPDATE',
         schema: 'public',
         table: 'projects',
         filter: `tenant_id=eq.${tenantId}`
       }, () => {
         utils.projects.getDashboardData.invalidate()
       })
       .subscribe()
     ```

3. Update `src/app/(app)/dashboard/page.tsx`:
   - Role split: `staff` role → renders `<StaffDashboard />`
   - `ops_manager`, `lab_owner`, `super_admin` → renders `<ManagerDashboard />`

**Design tokens (Part 2):**
- Stat card background: `--color-bg-surface` (#141C2E)
- Primary stat card (Active Projects): left border 3px `--color-core-tactical`
- Metric numbers: Syne 700 / 32px / `--color-text-primary`
- Metric labels: Inter 500 / 11px uppercase / `--color-text-secondary`
- Trend up: `#34D399`, Trend down: `#F87171`

**Expected Output:**
- Dashboard shows correct stat counts for current tenant
- Realtime: status change from any user refreshes dashboard within 2 seconds
- Role split works — staff cannot see manager metrics

**File Targets:**
- `src/server/routers/projects.ts` (updated — add getDashboardData)
- `src/components/dashboard/ManagerDashboard.tsx`
- `src/app/(app)/dashboard/page.tsx` (updated)

**Dependencies:** Step 16, Step 22

**→ After this step: /qa**

---

## [STEP 25] — Multi-Tenant Lab Settings Framework

**Context:**
Dashboard complete. Lab owners need a settings page to manage their workspace
configuration, including the NDT code prefix and lab name.

**Task:**

1. Create `src/server/routers/settings.ts`:
   - `getTenant` (protectedProcedure, query): Returns current tenant details
   - `updateTenant` (managerProcedure, mutation):
     - Input: `{ name: string, codePrefix: string }`
     - Validates `codePrefix` is 1–3 uppercase letters only
     - Updates `tenants` table
   - Register in `_app.ts`

2. Create `src/app/(app)/settings/page.tsx` and
   `src/components/settings/SettingsPage.tsx`:

   **Section 1 — Lab Information:**
   - Lab name (editable input)
   - NDT code prefix (editable, e.g. "K" — shows preview: K001, K002...)
   - Save button → calls `trpc.settings.updateTenant`
   - Success toast: "Lab settings saved"

   **Section 2 — Danger Zone:**
   - "Deactivate Lab" — lab_owner only
   - Requires typing exact lab slug to confirm
   - Sets `subscription_status = 'inactive'`
   - Warning text: "This will suspend access for all team members.
     Your data will be preserved."

**Design tokens (Part 2):**
- Page layout: `--color-bg-primary` (#0C1220)
- Section cards: `--color-bg-surface` (#141C2E), 12px radius
- Save button: `--color-core-tactical` background
- Danger Zone card: border `#4A1010`, background `#2E0A0A`
- Danger confirm input: `--color-bg-input` (#1A2235)
- All inputs: 8px radius, Inter 14px

**Expected Output:**
- Lab name and prefix editable and saved to database
- NDT code prefix change reflects on next project creation
- Deactivate requires exact slug confirmation

**File Targets:**
- `src/server/routers/settings.ts`
- `src/app/(app)/settings/page.tsx`
- `src/components/settings/SettingsPage.tsx`
- `src/server/routers/_app.ts` (updated)

**Dependencies:** Step 7 (shell), Step 6 (types)

**→ After this step: /review**

---

# ════════════════════════════════════════════════
# ⟳ CONTEXT REFRESH — After Step 25
# ════════════════════════════════════════════════

```
PROJECT: DDT Structure — NDT lab SaaS. Steps 23–25 complete.

WHAT IS DONE:
- Foundation, auth, projects, stages, proof review, site visits (Steps 1–15)
- Staff task view, notifications, search, staff management (Steps 16–20)
- Performance page, efficiency scoring, PDF export (Steps 21–23)
- Manager dashboard with Realtime, lab settings (Steps 24–25)

WHAT IS REMAINING:
- Steps 33A–33D: Blueprint UX additions (auth redesign, onboarding, JIT modal)
- Steps 26–29: PWA + offline (Dexie, sync queue, background sync)
- Steps 30–32: Super admin, CI/CD, mobile audit
- Step 33: Seed data + smoke tests
- Steps 34–40: V3 AI proofreader

CRITICAL AUTH RULE: context.ts reads role from public.users table directly.
Never read from JWT claims or app_metadata.

DESIGN SYSTEM: Two-part (Gateway = sky blue/neon lime/Inter,
App core = dark navy/sky blue brand/neon lime tactical/Inter+Syne).
DO NOT USE amber #F59E0B anywhere. It is fully replaced by --color-core-brand.
```

---

# ════════════════════════════════════════════════
# PHASE 2 — BLUEPRINT UX ADDITIONS (Steps 33A–33D)
# Source: DDT UX Upgrade Blueprint.md
# These 4 steps are NEW — not in any previous prompt pack
# ════════════════════════════════════════════════

---

## [STEP 33A] — Auth Gateway Redesign (Part 1 Visual System)

**Context:**
The current login page uses the dark app-core styling. The Blueprint defines a separate
visual system for all gateway pages (/login, /register, /accept-invite). These pages must
use the Part 1 design: 50/50 split screen, sky blue hero panel, neon lime CTAs, Inter font.

**Task:**

1. Update `src/app/(auth)/login/page.tsx`:
   - Layout: 50/50 horizontal split. Full viewport height.
   - **Left panel (50%):** Sky blue background `#3B82F6`. Contains:
     - AI-generated hero image of a glass-and-steel high-rise structural tower on the
       horizon, cinematic sky-blue atmosphere, wide-angle, clean tech aesthetic
       (use Next.js `<Image>` with WebP/AVIF optimization)
     - DDT Structure logo mark overlaid in white, bottom-left of panel
     - Tagline: "Engineering confidence. Report clarity." in Inter Regular 20px white
   - **Right panel (50%):** White `#FFFFFF` background. Contains:
     - "Welcome back" headline — Inter Bold 40px, text `#1A1917`
     - Subtext: "Sign in to your DDT Structure workspace" — Inter Regular 16px, `#6B6960`
     - Email input — Inter 14px, 12px radius, full-width, 44px height
     - Password input — same styling
     - "Sign In" button — pill-shaped (999px radius), Neon Lime `#A3E635` background,
       dark text, full-width, 52px height, directional arrow icon on right
     - "Forgot password?" link — Inter 14px, `#3B82F6`
   - On mobile: left panel collapses, right panel takes full width

2. Create `src/app/(auth)/register/page.tsx`:
   - Same 50/50 split layout as login
   - Right panel fields:
     - Company/Lab Name (required)
     - Work Email (required)
     - Password (required, min 8 characters)
   - Submit button: "Create your workspace" — same Neon Lime pill style
   - Below button: "Already have an account? Sign in" link
   - On success: redirect to `/dashboard` with sandbox seed triggered (Step 33B)

3. Update `src/app/(auth)/accept-invite/page.tsx`:
   - Same 50/50 split layout
   - Right panel: "Set your password" headline
   - Single password input + confirm password input
   - Submit button: "Join the workspace" — Neon Lime pill

**Design tokens (Part 1 ONLY for these pages):**
```css
Left panel:    background #3B82F6
Right panel:   background #FFFFFF
CTA button:    background #A3E635, color #1A1917, border-radius 999px
Headline:      Inter Bold 40px, color #1A1917
Subtext:       Inter Regular 16px, color #6B6960
Inputs:        border 1.5px solid #D1D5DB, border-radius 12px,
               focus border #3B82F6, focus shadow 0 0 0 4px rgba(59,130,246,0.12)
```

**Expected Output:**
- All three auth pages render with 50/50 split layout
- Neon Lime CTA buttons visible and styled correctly
- Mobile: collapses to single column cleanly
- Login and register flows work end-to-end

**File Targets:**
- `src/app/(auth)/login/page.tsx` (updated)
- `src/app/(auth)/register/page.tsx` (created)
- `src/app/(auth)/accept-invite/page.tsx` (updated)

**Dependencies:** Step 5 (auth actions)

**→ After this step: /qa**

---

## [STEP 33B] — Role-Priming Screen (Accept Invite Success)

**Context:**
When staff accept an invitation and set their password, they currently land directly on
the dashboard — an empty, confusing experience. The Blueprint requires a role-priming
intercept screen at `/accept-invite/success` that explains their role before the dashboard.

**Task:**

1. Create `src/app/(auth)/accept-invite/success/page.tsx`:
   - Reads the user's role from the session
   - Uses Part 1 styling (white background, sky blue accents)
   - Full-page centred card layout (max-width 560px, 24px radius, subtle shadow)

2. **For `staff` role — Operational Scorecard View:**
   - Header: "Welcome to the team, {first_name}!" — Inter Bold 32px
   - Lab name subtitle: "You've joined {lab_name}" — Inter Regular 16px, `#6B6960`
   - Two stat preview cards side by side:
     - Speed Score card: "24hr benchmark" label, clock icon, sky blue tint
     - Quality Score card: "Zero fault target" label, checkmark icon, sky blue tint
   - Body copy (Inter Regular 16px):
     > "Your core focus is moving assigned structural engineering reviews cleanly
     > through the pipeline from WIP to Proof Ready. Completing reviews within the
     > 24-hour benchmark boosts your Speed score. Avoiding report rejections
     > maintains a flawless Quality score."
   - CTA button: "Go to my tasks →" — Neon Lime pill, full-width → routes to `/dashboard`

3. **For `ops_manager` role — Bottleneck Monitor View:**
   - Header: "Welcome to the operations deck, {first_name}!"
   - Three preview tiles:
     - "Pipeline control" — routes and assigns tasks
     - "Quality gate" — proofreading and approval
     - "Performance tracker" — monthly staff reports
   - Body copy (Inter Regular 16px):
     > "You are the controller of the lab pipeline. Your workspace highlights
     > bottlenecked testing stages, manages incoming project registrations,
     > and oversees the final quality control loop before reports ship to LSMTL."
   - CTA: "Open the command centre →" — Neon Lime pill → routes to `/dashboard`

4. Update `src/lib/auth/actions.ts` `acceptInvite()`:
   - After creating user record, redirect to `/accept-invite/success`
   - Not directly to `/dashboard`

**Expected Output:**
- Staff see scorecard priming screen after accepting invite
- Ops manager sees bottleneck monitor priming screen
- Both routes correctly to dashboard after CTA click
- Never shows for direct login (only post-invite flow)

**File Targets:**
- `src/app/(auth)/accept-invite/success/page.tsx`
- `src/lib/auth/actions.ts` (updated — redirect target)

**Dependencies:** Step 33A, Step 5

**→ After this step: /qa**

---

## [STEP 33C] — Onboarding Sandbox + Registration Flow

**Context:**
New lab owners currently land on an empty dashboard after registering. The Blueprint
requires an automatic seeded sandbox project to demonstrate the pipeline immediately,
eliminating the "cold start problem."

**Task:**

1. Create `src/lib/onboarding/seed-sandbox.ts`:
   ```typescript
   export async function seedSandboxForTenant(
     tenantId: string,
     supabase: SupabaseClient
   ): Promise<void>
   ```
   - Creates one demo project:
     ```
     ndt_code:        "[SAMPLE]-001"
     client_name:     "[Sample] 12-Story Office Complex (Lekki)"
     status:          "wip"
     address:         "1 Admiralty Way, Lekki Phase 1, Lagos"
     number_of_floors: 12
     site_date:       today's date
     is_sample:       true   (add this boolean column to projects table)
     ```
   - Creates stage assignments for the sample project:
     - Analysis stage: assigned to the lab owner, status = `in_progress`
     - Sketch stage: unassigned
     - Report Writing stage: unassigned
   - Creates sample status history entries showing the pipeline movement

2. Add `is_sample` boolean column to projects table:
   ```sql
   ALTER TABLE projects ADD COLUMN is_sample BOOLEAN DEFAULT FALSE;
   ```
   - Sample projects display a "[SAMPLE]" badge in the project table
   - Sample projects are excluded from performance report calculations
   - Lab owner can delete the sample project at any time

3. Update `src/app/(auth)/register/page.tsx` (from Step 33A):
   - After successful registration and user creation:
     1. Create tenant record
     2. Create user record with `lab_owner` role
     3. Call `seedSandboxForTenant(tenantId, supabase)`
     4. Redirect to `/dashboard`
   - The dashboard will now show the seeded sample project immediately

4. Add sample project indicator to `src/components/projects/ProjectsTable.tsx`:
   - Sample projects show a sky blue "[SAMPLE]" pill badge next to the NDT code
   - A dismissible info banner at top of projects list:
     "This is a sample project to help you explore DDT Structure.
     Delete it when you're ready to add real projects."
   - Delete sample button: removes the project and all its stage assignments

**Expected Output:**
- New lab owner sees populated dashboard immediately after registration
- Sample project is clearly marked — no confusion with real data
- Sample project can be deleted
- Performance reports exclude sample data

**File Targets:**
- `src/lib/onboarding/seed-sandbox.ts`
- `supabase/migrations/004_add_sample_flag.sql`
- `src/app/(auth)/register/page.tsx` (updated)
- `src/components/projects/ProjectsTable.tsx` (updated)

**Dependencies:** Step 33A, Step 9 (projects router)

**→ After this step: /careful** (migration + sandbox seeding logic)

---

## [STEP 33D] — JIT Prefix Modal + Awaiting Orders Empty State

**Context:**
Two remaining Blueprint UX additions: (1) The Just-In-Time code prefix modal that fires
on first project creation instead of during registration. (2) The "Awaiting Orders" empty
state for staff with no assigned tasks — replacing a blank, confusing screen.

**Task:**

**Part A — JIT Prefix Modal:**

1. Create `src/components/onboarding/JITCodePrefixModal.tsx` (Client Component):
   - Triggers ONLY on the FIRST real project creation by a lab owner
   - Detection: query `projects` table for tenant — if `COUNT(*) = 0` (or only sample
     projects exist), show the modal before the New Project form
   - Modal styling (Part 2 design):
     - Background: `--color-bg-raised` (#1C2640), 16px radius
     - Overlay: dark backdrop
   - Modal content:
     - Headline in Syne 600: "Set your lab's project code prefix"
     - Body in Inter 14px:
       "We noticed your lab is {lab_name}. We suggest initializing
       your engineering codes with prefix '{suggested_letter}' (e.g., {suggested_letter}001).
       Accept this prefix or enter your own below."
     - Suggested prefix: auto-generated from first letter of lab name (uppercase)
     - NDT code in JetBrains Mono, `--color-core-brand` highlight: "{prefix}001"
     - Editable prefix input — max 3 characters, uppercase forced
     - "Confirm prefix" button: `--color-core-tactical` background (Neon Lime)
     - "Skip for now" ghost link
   - On confirm: calls `trpc.settings.updateTenant` with the chosen prefix
   - Never shows again after first confirmation (store flag in localStorage:
     `ddt_prefix_confirmed_{tenantId}`)

2. Integrate into `src/app/(app)/projects/new/page.tsx`:
   - Check if JIT modal should show before rendering NewProjectForm
   - If yes: render `<JITCodePrefixModal>` first, then form after confirmation

**Part B — Awaiting Orders Empty State:**

3. Update `src/components/staff/StaffDashboard.tsx`:
   - When `getMyStages` returns empty array, replace blank space with:

   **Awaiting Orders Card:**
   ```
   Background: #0D1F3C
   Border:     1px solid #1E3A5F
   Border-radius: 12px
   Padding: 32px
   ```
   Content:
   - Animated connection dot (pulsing, sky blue `#60A5FA`)
   - Status text in Syne 600 / 20px / `#60A5FA`:
     "🕒 System Status: Active & Connected"
   - Subtext in Inter 14px / `#8892A4`:
     "Your workspace is synchronized with {lab_name} operations.
     You will receive a real-time notification as soon as an inspection
     sequence is routed to your ID."
   - Lab name + current time display
   - Supabase Realtime subscription active — card updates live

**Expected Output:**
- JIT modal appears on first real project creation for new lab owners
- Prefix is saved and used for all subsequent project codes
- Modal never appears again after confirmation
- Staff with zero tasks see Awaiting Orders card instead of blank screen
- Awaiting Orders card receives real-time push when a task is assigned

**File Targets:**
- `src/components/onboarding/JITCodePrefixModal.tsx`
- `src/app/(app)/projects/new/page.tsx` (updated)
- `src/components/staff/StaffDashboard.tsx` (updated)

**Dependencies:** Step 25 (settings router), Step 16 (staff dashboard)

**→ After this step: /qa**

---

# ════════════════════════════════════════════════
# ⟳ CONTEXT REFRESH — After Step 33D
# ════════════════════════════════════════════════

```
PROJECT: DDT Structure. Steps 23–25 + 33A–33D complete.

COMPLETED IN THIS SESSION:
- PDF export engine (Step 23)
- Manager dashboard with Realtime (Step 24)
- Lab settings page (Step 25)
- Auth gateway redesign — 50/50 split, sky blue/neon lime (Step 33A)
- Role-priming intercept screen post invite acceptance (Step 33B)
- Onboarding sandbox with seeded sample project (Step 33C)
- JIT prefix modal + Awaiting Orders empty state (Step 33D)

REMAINING:
- Steps 26–29: PWA + offline (Dexie, sync queue, background sync)
- Step 30: Super Admin panel
- Steps 31–32: CI/CD + mobile audit
- Step 33: Seed data + smoke tests
- Steps 34–40: V3 AI proofreader

DESIGN SYSTEM REMINDER:
Part 1 (gateway pages): Sky Blue + Neon Lime + Inter + 24px/12px radius
Part 2 (app core): Dark navy tokens + Inter/Syne/JetBrains Mono + 8/12/16px radius
NO AMBER. NO PLUS JAKARTA SANS. NO JAPPBENTO TOKENS.

CRITICAL: All RLS policies must use direct users table subquery,
not auth.jwt()->>'tenant_id'.
```

---

# ════════════════════════════════════════════════
# PHASE 3 — PWA + OFFLINE (Steps 26–29)
# ════════════════════════════════════════════════

---

## [STEP 26] — PWA Manifest & Service Worker

**Context:**
App features are complete. Now we add PWA capability so the app installs to Android
home screens and works offline. Critical for Lagos field techs on mid-range devices.

**Task:**

1. Configure `next-pwa` in `next.config.mjs`:
   ```javascript
   import withPWA from 'next-pwa'
   const pwaConfig = withPWA({
     dest: 'public',
     register: true,
     skipWaiting: true,
     disable: process.env.NODE_ENV === 'development',
     runtimeCaching: [
       {
         urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
         handler: 'NetworkFirst',
         options: { cacheName: 'supabase-api', networkTimeoutSeconds: 5 }
       },
       {
         urlPattern: /\/_next\/static\/.*/i,
         handler: 'CacheFirst',
         options: { cacheName: 'static-assets' }
       }
     ]
   })
   ```

2. Create `public/manifest.json`:
   ```json
   {
     "name": "DDT Structure",
     "short_name": "DDT",
     "description": "NDT Laboratory Operations Management",
     "start_url": "/dashboard",
     "display": "standalone",
     "orientation": "portrait",
     "theme_color": "#0C1220",
     "background_color": "#0C1220",
     "icons": [
       { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
       { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
     ]
   }
   ```

3. Generate icons at `public/icons/icon-192.png` and `public/icons/icon-512.png`:
   - "DDT" monogram on Sky Blue `#3B82F6` background
   - White bold text, rounded corners matching Part 1 brand

4. Create `src/components/pwa/InstallBanner.tsx`:
   - Listens for `beforeinstallprompt` event
   - Dismissible banner styled with Part 2 tokens:
     - Background `--color-bg-raised` (#1C2640)
     - Border `--color-core-brand` (Sky Blue)
     - Install button `--color-core-tactical` (Neon Lime), pill-shaped
   - Text: "Install DDT Structure on your device for offline access"
   - Dismissed state stored in localStorage: `ddt_install_dismissed`
   - Only shows on mobile and when not already installed

5. Add manifest link and theme-color meta to `app/layout.tsx`

**Expected Output:**
- Lighthouse PWA score ≥ 90
- "Add to Home Screen" prompt appears on Android Chrome
- App installs with correct icon and theme colour
- Service worker registered and active

**File Targets:**
- `next.config.mjs` (updated)
- `public/manifest.json`
- `public/icons/icon-192.png`
- `public/icons/icon-512.png`
- `src/components/pwa/InstallBanner.tsx`
- `app/layout.tsx` (updated)

**Dependencies:** Step 1 (project setup)

**→ After this step: /review**

---

## [STEP 27] — Dexie.js Local Database

**Context:**
PWA is set up. Now we create the local IndexedDB store that holds offline cached data
and the mutation queue for offline actions.

**Task:**

1. Create `src/lib/offline/db.ts`:
   ```typescript
   import Dexie, { Table } from 'dexie'

   class DDTOfflineDB extends Dexie {
     projects!: Table<CachedProject>
     stageAssignments!: Table<CachedStageAssignment>
     notifications!: Table<CachedNotification>
     mutationQueue!: Table<QueuedMutation>
     syncMeta!: Table<SyncMeta>

     constructor() {
       super('ddt-offline')
       this.version(1).stores({
         projects: 'id, tenantId, status, updatedAt',
         stageAssignments: 'id, projectId, assignedTo, status',
         notifications: 'id, userId, isRead, createdAt',
         mutationQueue: '++id, type, createdAt, retryCount',
         syncMeta: 'key',
       })
     }
   }
   export const db = new DDTOfflineDB()
   ```

2. Create `src/types/offline.ts`:
   ```typescript
   export type MutationType = 'stage.start' | 'stage.complete' |
     'project.create' | 'project.updateStatus'

   export interface QueuedMutation {
     id?: number
     type: MutationType
     payload: Record<string, unknown>
     createdAt: Date
     retryCount: number
   }

   export interface CachedProject { /* mirrors Project type */ }
   export interface CachedStageAssignment { /* mirrors StageAssignment */ }
   export interface CachedNotification { /* mirrors Notification */ }
   export interface SyncMeta { key: string; value: unknown }
   ```

3. Create `src/lib/offline/cache.ts`:
   - `cacheProjects(projects)` — bulk put to db.projects
   - `getCachedProjects()` — returns all cached projects
   - `cacheStageAssignments(stages)` — bulk put
   - `getMyCachedStages(userId)` — returns assigned stages
   - `clearCache()` — wipes all tables on sign out

**Expected Output:**
- Dexie DB initialises without error in browser
- All 5 tables accessible with correct schema
- Cache utilities read/write correctly

**File Targets:**
- `src/lib/offline/db.ts`
- `src/types/offline.ts`
- `src/lib/offline/cache.ts`

**Dependencies:** Step 1

**→ After this step: /review**

---

## [STEP 28] — Offline Sync Queue & Background Sync

**Context:**
Dexie DB is ready. Now we build the mutation queue and Zustand store so offline
actions sync automatically when connectivity returns.

**Task:**

1. Create `src/lib/offline/queue.ts`:
   - `enqueueMutation(type, payload)` — adds to db.mutationQueue
   - `processQueue()` — reads queue, calls tRPC mutations via fetch,
     deletes successes, increments retryCount on failures (max 3 retries)
   - `getQueueCount()` — returns pending count

2. Create `src/lib/offline/sync.ts`:
   - `startSyncListener()` — window.addEventListener('online', handleOnline)
   - `handleOnline()` — calls processQueue(), shows toast "Synced {n} changes"
   - `stopSyncListener()`

3. Create `src/stores/offline-store.ts` (Zustand):
   ```typescript
   interface OfflineStore {
     isOnline: boolean
     pendingCount: number
     isSyncing: boolean
     setOnline: (v: boolean) => void
     setPendingCount: (n: number) => void
     setIsSyncing: (v: boolean) => void
   }
   ```
   - Initialize with `navigator.onLine`
   - Listen to online/offline browser events

4. Update `src/components/ui/SyncIndicator.tsx` to read from offline-store:
   - Online + pending = 0: sky blue dot — "Synced"
   - Online + pending > 0: neon lime dot pulsing — "Syncing {n}..."
   - Offline: red dot — "Offline · {n} pending"
   - Wire into TopBar

5. Update `src/components/ui/OfflineBanner.tsx`:
   - Shows when `isOnline === false`
   - Background: `--color-bg-raised` (#1C2640)
   - Left border: 3px `#60A5FA` (WIP blue — matches offline comms tone)
   - Text: "You're offline — changes will sync when reconnected"

**Expected Output:**
- Offline → banner shows, mutations queue
- Back online → processQueue fires, toast shows sync count
- SyncIndicator reflects correct real-time state
- Workbox strategies cache API + static assets

**File Targets:**
- `src/lib/offline/queue.ts`
- `src/lib/offline/sync.ts`
- `src/stores/offline-store.ts`
- `src/components/ui/SyncIndicator.tsx` (updated)
- `src/components/ui/OfflineBanner.tsx` (updated)

**Dependencies:** Step 27

**→ After this step: /careful**

---

## [STEP 29] — Offline Data Seeding on Login

**Context:**
Sync queue is ready. Now we seed the local cache on login so users have data
available immediately when they go offline.

**Task:**

1. Create `src/lib/offline/seed.ts`:
   ```typescript
   export async function seedOfflineCache(
     userId: string,
     tenantId: string,
     role: UserRole
   ): Promise<void>
   ```
   - Fetches and caches: last 200 active projects, user's stage assignments,
     last 20 notifications
   - Stores last seed timestamp in db.syncMeta key `'lastSeedAt'`
   - Limits to prevent excessive storage use

2. Call `seedOfflineCache()` after successful login in `src/lib/auth/actions.ts`

3. Update `StaffDashboard.tsx` and `ManagerDashboard.tsx`:
   - If `isOnline === false` AND Dexie has cached data: render from cache
   - If `isOnline === true`: render from tRPC + reseed cache in background
   - Show `<OfflineBanner>` when rendering from cache

4. Update `src/lib/auth/actions.ts` sign-out action:
   - Call `clearCache()` after `supabase.auth.signOut()` to wipe IndexedDB

**Expected Output:**
- After login: IndexedDB populated with current data
- Dashboard renders from cache when offline
- Staff task view renders from cache when offline
- Sign out wipes all local cache

**File Targets:**
- `src/lib/offline/seed.ts`
- `src/lib/auth/actions.ts` (updated)
- `src/components/staff/StaffDashboard.tsx` (updated)
- `src/components/dashboard/ManagerDashboard.tsx` (updated)

**Dependencies:** Steps 27, 28

**→ After this step: /qa**

---

# ════════════════════════════════════════════════
# PHASE 4 — ADMIN, CI/CD & POLISH (Steps 30–33)
# ════════════════════════════════════════════════

---

## [STEP 30] — Super Admin Panel

**Context:**
PWA and offline complete. Super Admin panel gives platform-level visibility
across all lab tenants. Restricted to `super_admin` role only.

**Task:**

1. Create `src/server/routers/admin.ts`:
   - `listTenants` (adminProcedure): all tenants with user count, project count,
     subscription status, created date
   - `setSubscriptionStatus` (adminProcedure): updates tenant subscription_status
   - `deactivateTenant` (adminProcedure): sets status = 'inactive'
   - Register in `_app.ts`

2. Create `src/app/(admin)/layout.tsx`:
   - Separate shell — redirects to `/dashboard` if role !== `super_admin`
   - Minimal sidebar with DDT Structure branding

3. Create `src/app/(admin)/admin/page.tsx` and
   `src/components/admin/AdminPage.tsx`:
   - Summary row: Total Labs | Active | Trial | Inactive | Total Users | Total Projects
   - Tenant table: Lab Name | Slug | Users | Projects | Status | Created | Actions
   - Status chips use same chip map (active = verified green, trial = uploaded amber,
     inactive = proof failed red)
   - Actions: View Detail | Change Status | Deactivate

**Design tokens (Part 2):**
- All standard Part 2 dark navy tokens apply
- Admin-specific: no colour changes — same command centre aesthetic

**Expected Output:**
- Super admin sees all tenants with correct counts
- Non-super-admin roles redirected immediately
- Status changes persist to database

**File Targets:**
- `src/server/routers/admin.ts`
- `src/app/(admin)/layout.tsx`
- `src/app/(admin)/admin/page.tsx`
- `src/components/admin/AdminPage.tsx`
- `src/server/routers/_app.ts` (updated)

**Dependencies:** Steps 4, 5

**→ After this step: /careful**

---

## [STEP 31] — CI/CD Pipeline & Environment Configuration

**Context:**
All features complete. Set up automated quality checks so every push to main
runs type checks and build verification before deploying.

**Task:**

1. Create `.github/workflows/ci.yml`:
   ```yaml
   name: CI
   on:
     push:
       branches: [main]
     pull_request:
       branches: [main]
   jobs:
     check:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with: { node-version: '20' }
         - run: npm ci
         - run: npx tsc --noEmit
         - run: npm run lint
         - run: npm run build
   ```

2. Create `vercel.json`:
   ```json
   {
     "buildCommand": "npm run build",
     "installCommand": "npm ci",
     "framework": "nextjs"
   }
   ```

3. Update `package.json` scripts:
   ```json
   {
     "type-check": "tsc --noEmit",
     "db:push": "supabase db push",
     "db:generate-types": "supabase gen types typescript --local > src/types/database.ts",
     "seed": "npx tsx src/scripts/seed-test-data.ts"
   }
   ```

4. Update `README.md`:
   - Local setup steps (env vars, Supabase local, npm install, npm run dev)
   - DB migration instructions (`supabase db push`)
   - Environment variables reference table
   - Design system note: "Uses two-part visual system — see DDT UX Upgrade Blueprint_DESIGN.md"

**Expected Output:**
- GitHub Actions runs on every push to main
- Build fails fast if TypeScript errors exist
- Vercel auto-deploys on clean main push

**File Targets:**
- `.github/workflows/ci.yml`
- `vercel.json`
- `package.json` (updated scripts)
- `README.md` (updated)

**Dependencies:** All feature steps

**→ After this step: /ship**

---

## [STEP 32] — Mobile Responsive Audit

**Context:**
CI/CD set up. Final pass to ensure all pages work correctly at 375px–430px viewport.
Field technicians use the app primarily on Android phones.

**Task:**
Audit and fix the following for mobile (below 768px breakpoint):

1. **Sidebar → Bottom Tab Bar:**
   - Verify sidebar collapses to bottom tab bar at `md:` breakpoint
   - 5 tabs: Dashboard, Projects, Search, Staff, Performance
   - Active tab: `--color-core-tactical` (Neon Lime) icon
   - Fixed at bottom, above iOS safe area

2. **ProjectsTable → Card Stack:**
   - Below `md:` replace table with stacked cards
   - Each card: NDT code + client name + status chip + stage pills
   - Tap card → navigate to project detail

3. **Pipeline Bar → Vertical Stack:**
   - Below `sm:` pipeline stages stack vertically
   - Each stage becomes full-width card

4. **All Modals → Bottom Sheets:**
   - Below `md:` modals render as bottom sheets
   - Use shadcn `<Drawer>` component
   - Drag-to-dismiss

5. **Touch Targets:**
   - All buttons: minimum 48px height ✓ (per Blueprint requirement)
   - All interactive rows: minimum 48px height
   - Form inputs: 44px minimum height

6. **Auth Gateway on Mobile:**
   - 50/50 split collapses — left panel hidden, right panel full width
   - Hero image shows as compressed header strip (100px height)

**Expected Output:**
- All pages usable on 375px Chrome DevTools viewport
- No horizontal scroll on any page
- All touch targets ≥ 48px
- Modals are bottom sheets on mobile

**File Targets:** (multiple components — document each changed file)

**Dependencies:** All feature steps

**→ After this step: /qa**

---

## [STEP 33] — Seed Data & Smoke Test Checklist

**Context:**
Mobile audit complete. Create realistic test data and a comprehensive
smoke test checklist covering all user flows.

**Task:**

1. Create `supabase/seed.sql`:
   - 1 test tenant: "StructoLab Lagos", slug "structolab-lagos", prefix "K"
   - 5 users: 1 lab_owner, 1 ops_manager, 3 staff (password: `TestPass123!`)
   - 15 projects covering all 9 pipeline statuses
   - Stage assignments, site visits, proof reviews, notifications
   - Sample project with `is_sample = true`

2. Create `SMOKE_TEST.md`:

```markdown
# DDT Structure — Full Smoke Test Checklist

## Auth & Onboarding
- [ ] Register new lab → sandbox sample project auto-appears on dashboard
- [ ] First "Create Project" click → JIT prefix modal appears
- [ ] Prefix confirmed → new projects use correct code sequence
- [ ] Invite staff → email received → password set
- [ ] Staff accept invite → role-priming screen shows (staff version)
- [ ] Ops manager accept invite → role-priming screen shows (manager version)
- [ ] After priming screen → dashboard loads correctly
- [ ] Sign out → redirected to login

## Project Workflow
- [ ] Create project → NDT code auto-generated with lab prefix
- [ ] Assign analysis stage → staff receives notification
- [ ] Staff: Awaiting Orders card shows when no tasks assigned
- [ ] Staff: task appears in real-time when assigned (no refresh)
- [ ] Staff starts task → started_at recorded
- [ ] Staff completes analysis → project status → analysis_done
- [ ] All stages complete → project status → report_done
- [ ] Manager proofread pass → status → report_uploaded
- [ ] Manager proofread fail → status back to wip + fault logged
- [ ] Mark verified → mark delivered → project complete

## Gateway Design (Part 1)
- [ ] Login page: 50/50 split layout renders correctly
- [ ] Left panel: sky blue background + hero image
- [ ] CTA button: Neon Lime pill shape
- [ ] Mobile: collapses to single column cleanly

## App Core Design (Part 2)
- [ ] All pages use dark navy #0C1220 background
- [ ] No amber colour visible anywhere
- [ ] Status chips match correct colour per status
- [ ] NDT codes rendered in JetBrains Mono
- [ ] Dashboard stat numbers in Syne 700

## Search
- [ ] Search by client name → correct results
- [ ] Search by NDT code (partial "K01") → returns matches
- [ ] Filter by status → results narrowed

## Performance + PDF
- [ ] Performance page shows correct monthly stats
- [ ] Efficiency score calculated correctly (speed + quality)
- [ ] Export PDF → file downloads with correct data
- [ ] PDF contains: site visits, stages, faults, score

## Offline (PWA)
- [ ] DevTools Network → Offline → banner appears
- [ ] Staff task view shows cached tasks
- [ ] Complete task offline → queued
- [ ] Back online → sync fires → task updated
- [ ] App installs to home screen on Android

## V3 AI Proofreader (added after Steps 34–40)
- [ ] Upload .docx → AI check runs with progress messages
- [ ] Minor errors: diff view shows original vs correction
- [ ] Accept correction → applied in download
- [ ] Major error → Pass button disabled
- [ ] Download Re_ file → error block at top of document
- [ ] Re-upload fixed report → Attempt 2 shows
- [ ] Clean report → downloads as {name}_Checked.docx
```

**Expected Output:**
- `seed.sql` creates test data in one command
- Full smoke test checklist covers all flows
- `npm run seed` executes without error

**File Targets:**
- `supabase/seed.sql`
- `src/scripts/seed-test-data.ts`
- `SMOKE_TEST.md`
- `package.json` (add seed script)

**Dependencies:** Step 3 (schema)

**→ After this step: /ship** — then begin V3 (Step 34)

---

# ════════════════════════════════════════════════
# ⟳ CONTEXT REFRESH — Before Step 34 (V3)
# ════════════════════════════════════════════════

```
PROJECT: DDT Structure — all core features + PWA + Blueprint UX complete.
Starting V3: AI-powered LSMTL report proofreader.

EXISTING SYSTEM:
- Next.js 14 App Router, tRPC, Supabase, TypeScript strict
- Pipeline: not_started → wip → analysis_done → sketch_done →
  report_done → proof_ready → report_uploaded → report_verified → report_delivered
- Proofreading stage: ops_manager+ role only
- context.ts reads role/tenant_id from public.users table directly (NOT JWT)

V3 INTEGRATES INTO: Proofreading stage (project status = report_done)

NEW PACKAGES: mammoth, docx, @anthropic-ai/sdk, sharp, tesseract.js, unzipper
NEW TABLE: report_checks
NEW ROUTES: /api/v3/check-report, /api/v3/apply-corrections, /api/v3/download
NEW UI: UploadCheckPanel, FindingsPanel, MinorCorrectionsList

HARD RULES:
1. Major errors = Pass button DISABLED — hard block, no manager override
2. Minor corrections must be applied before clean download is available
3. Clean download: {name}_Checked.docx
4. Error download: Re_{name}.docx
5. Fault logging: only on formal manager proof fail — not on AI check fail
6. Supabase Storage: auto-delete after 24h
7. No PDF output, no tone/style corrections

RLS POLICY FOR NEW TABLE — use direct subquery, not JWT:
  USING (
    tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
  );

DESIGN (Part 2 tokens apply):
- Upload drop zone: 2px dashed border --color-border-strong (#3A4A6A)
  → hover: border --color-core-brand (Sky Blue) + bg #0D1F3C
- Major error cards: bg #2E0A0A, border #4A1010
- Minor correction cards: bg #0D1F3C, border #1E3A5F
- Pass button (clean): --color-core-tactical (Neon Lime) bg
- Pass button (blocked): greyed out, tooltip explanation
```

---

# ════════════════════════════════════════════════
# PHASE 5 — V3 AI PROOFREADER (Steps 34–40)
# ════════════════════════════════════════════════

---

## [STEP 34] — V3 Dependencies & Database Migration

**Task:**

1. Install all V3 dependencies:
   ```bash
   npm install mammoth docx @anthropic-ai/sdk sharp tesseract.js unzipper
   npm install -D @types/mammoth
   ```

2. Create `supabase/migrations/003_v3_report_checks.sql`:
   ```sql
   CREATE TYPE check_result_enum AS ENUM ('pass', 'major_errors', 'minor_only');

   CREATE TABLE report_checks (
     id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
     tenant_id         UUID NOT NULL REFERENCES tenants(id),
     checked_by        UUID NOT NULL REFERENCES users(id),
     checked_at        TIMESTAMPTZ DEFAULT NOW(),
     original_filename VARCHAR(300) NOT NULL,
     check_result      check_result_enum NOT NULL,
     minor_errors      JSONB DEFAULT '[]',
     major_errors      JSONB DEFAULT '[]',
     minor_accepted    JSONB DEFAULT '[]',
     iteration         INTEGER DEFAULT 1,
     storage_path      TEXT,
     created_at        TIMESTAMPTZ DEFAULT NOW()
   );

   CREATE INDEX idx_report_checks_project ON report_checks(project_id);
   CREATE INDEX idx_report_checks_tenant ON report_checks(tenant_id);

   ALTER TABLE report_checks ENABLE ROW LEVEL SECURITY;

   -- CORRECT RLS: uses direct subquery, NOT jwt() claims
   CREATE POLICY tenant_isolation_report_checks ON report_checks
     USING (
       tenant_id = (
         SELECT tenant_id FROM public.users WHERE id = auth.uid()
       )
     );
   ```

3. Add to `.env.local`:
   ```
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

4. Create Supabase Storage bucket:
   - Name: `report-uploads`
   - Set to private (not public)
   - Lifecycle rule: delete files older than 24 hours

5. Update `src/types/index.ts` with V3 types:
   ```typescript
   export interface MinorError {
     id: string; section: string; description: string;
     original: string; correction: string; accepted?: boolean
   }
   export interface MajorError {
     id: string; section: string; description: string
   }
   export interface ReportCheckResult {
     checkId: string
     result: 'pass' | 'major_errors' | 'minor_only'
     minorErrors: MinorError[]
     majorErrors: MajorError[]
     iteration: number
   }
   ```

**File Targets:**
- `package.json`
- `supabase/migrations/003_v3_report_checks.sql`
- `src/types/index.ts` (updated)
- `.env.local` (updated)
- `README.md` (updated — Storage bucket instructions)

**→ After this step: /careful**

---

## [STEP 35] — .docx Parser & Section Extractor

**Task:**
Create `src/lib/v3/parser.ts` and `src/types/v3.ts`:

1. **`parseDocx(buffer: Buffer): Promise<ParsedReport>`**
   - Uses `mammoth` to extract raw text with style information
   - Identifies each LSMTL section by heading:
     EXECUTIVE SUMMARY, 1.0. INTRODUCTION, 2.0. PURPOSE OF INVESTIGATION,
     3.0. LITERATURE REVIEW, 4.0. FIELD WORK (4.1–4.4),
     5.0. ANALYSIS OF TEST RESULT, 6.0. RECOMMENDATION,
     7.0. CONCLUSION, APPENDIX

2. **`extractImagesFromDocx(buffer: Buffer): Promise<ExtractedImage[]>`**
   - Unzips .docx using `unzipper`, extracts from `word/media/`
   - Returns `{ filename, buffer, mimeType, sectionHint }`

3. **`findImagesInSection(docxBuffer, sectionName)`**
   - Parses `word/document.xml` to locate image references near section headings

4. **`extractTablesFromDocx(buffer: Buffer): Promise<DocxTable[]>`**
   - Extracts all tables as `{ rows: string[][] }`
   - Used for Analysis section arithmetic checking

**File Targets:**
- `src/lib/v3/parser.ts`
- `src/types/v3.ts`

**→ After this step: /review**

---

## [STEP 36] — Guideline Checker Engine

**Task:**
Create `src/lib/v3/checker.ts` with `runFullCheck()` aggregating 8 check functions:

1. `checkFrontPageAddress` → Minor: Claude API address consistency check
2. `checkFrontPageContact` → Major: Regex for phone (+234/080/070/081) or email
3. `checkExecutiveSummary` → Minor: Claude API field presence + recommendation match
4. `checkIntroduction` → Minor: Floor count, drawing availability, 25N/mm² text
5. `checkVisualInspection` → Minor: Claude API spelling, grammar, conflicting statements
6. `checkLiteratureReview` → Mixed: ≥3 staff names (Minor), signature images + coordinate
   OCR via tesseract.js on Google Maps screenshots (Major)
7. `checkAnalysis` → Major: Table arithmetic re-calculation (±0.01 tolerance),
   N/mm² unit superscript check
8. `checkRecommendation` → Major: Claude API classifies building condition from Visual
   section (A=defects/B=under construction/C=no defects/D=unclear) then checks
   Recommendation matches the correct template

**Claude API pattern for all AI calls:**
```typescript
import Anthropic from '@anthropic-ai/sdk'
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 2000,
  messages: [{ role: 'user', content: prompt }]
})
```
All prompts end with: `"Respond ONLY in valid JSON. No preamble, no markdown."`

**Recommendation templates (build these into the checker prompt):**
- A (defects): "the client was referred to a qualified structural engineer for further
  evaluation to provide technical, structural and remedial recommendations..."
- B (under construction): "the client was referred to a qualified structural engineer
  and other building professionals for further evaluation to provide technical and
  structural recommendations..."
- C (no defects): "{client name} was referred to a qualified structural engineer for
  further evaluation to provide technical and structural recommendations..."
- D (general/unclear): "the client was referred to a qualified structural engineer or
  other building professionals for further evaluation to provide technical or structural
  or remedial recommendations..."

**File Targets:**
- `src/lib/v3/checker.ts`

**→ After this step: /careful**

---

## [STEP 37] — .docx Correction Writer

**Task:**
Create `src/lib/v3/writer.ts`:

1. **`applyMinorCorrections(originalBuffer, acceptedCorrections)`**
   - Uses `docx` npm package to load and write .docx
   - Finds `original` text, replaces with `correction`, preserves formatting
   - Superscript rule: when correction contains `mm²`, `N/mm²`, or `25N/mm²`,
     apply `<w:vertAlign w:val="superscript"/>` to the `2`
   - Returns corrected Buffer

2. **`generateReportWithMajorErrors(originalBuffer, majorErrors)`**
   - Inserts formatted red warning comment block at document top:
     ```
     ⚠ RE-SUBMISSION REQUIRED — MAJOR ERRORS FOUND
     ─────────────────────────────────────────────
     [1] SECTION: {section}
         ISSUE: {description}
         ACTION: {required action}
     ...
     Generated by DDT Structure V3 · {date}
     ```
   - Red text, bold section labels

3. **`generateFilename(originalName, result)`**
   - `'clean'` → `{name}_Checked.docx`
   - `'major_errors'` → `Re_{name}.docx`
   - Sanitize: remove special chars except `_` and `-`

**File Targets:**
- `src/lib/v3/writer.ts`

**→ After this step: /review**

---

## [STEP 38] — V3 API Routes

**Task:**
Create three Next.js App Router API routes (server-side only):

1. `src/app/api/v3/check-report/route.ts` (POST):
   - Accepts `multipart/form-data` with .docx + projectId
   - Validates: auth (ops_manager+), file is .docx, project exists in tenant
   - Read role/tenant from `public.users` table — NOT JWT
   - Uploads to Supabase Storage: `report-uploads/{tenantId}/{projectId}/{ts}_{filename}`
   - Runs `parseDocx → extractImages → extractTables → runFullCheck`
   - Inserts `report_checks` row, returns `ReportCheckResult`

2. `src/app/api/v3/apply-corrections/route.ts` (POST):
   - Body: `{ checkId, acceptedCorrectionIds: string[] }`
   - Validates auth + ownership
   - Fetches .docx from Storage, applies corrections in memory
   - Updates `minor_accepted` in report_checks
   - Returns corrected .docx as `application/octet-stream`

3. `src/app/api/v3/download/route.ts` (POST):
   - Body: `{ checkId, acceptedCorrectionIds?: string[] }`
   - If `major_errors` → generates Re_ file
   - If `pass` or `minor_only` → applies corrections + generates _Checked file
   - Returns with correct Content-Disposition attachment header

**File Targets:**
- `src/app/api/v3/check-report/route.ts`
- `src/app/api/v3/apply-corrections/route.ts`
- `src/app/api/v3/download/route.ts`

**→ After this step: /careful**

---

## [STEP 39] — V3 UI — Upload & Findings Panel

**Task:**

1. Update `src/components/projects/PipelineBar.tsx`:
   - When status = `report_done`: Proofreading stage shows "Upload & AI Check" button
   - After check — major errors: red chip + "Download Re_" button
   - After check — minor only: sky blue chip + findings panel
   - After check — pass: neon lime chip + Pass button active

2. Create `src/components/v3/UploadCheckPanel.tsx`:
   - Drop zone (accepts .docx only):
     - Border: 2px dashed `--color-border-strong` (#3A4A6A), 16px radius
     - Hover: border `--color-core-brand` (Sky Blue), bg `#0D1F3C`
     - Padding: 40px, centered
   - Progress states with animated text cycling:
     "Checking address consistency…" / "Reviewing executive summary…" /
     "Analysing recommendation wording…"
   - Error state: "Check failed — please try again" + retry button

3. Create `src/components/v3/FindingsPanel.tsx`:
   - Major Errors section (red): bg `#2E0A0A`, border `#4A1010`
     - "⚠ {n} Major Error(s) — Report cannot be passed"
     - List of section + description per error
     - "Download for Staff Revision (Re_)" button
   - Minor Corrections section (blue): bg `#0D1F3C`, border `#1E3A5F`
     - Renders `<MinorCorrectionsList>`
     - "Apply Accepted Corrections" button
   - Pass button: disabled with tooltip if major errors exist;
     `--color-core-tactical` (Neon Lime) background if no major errors

4. Create `src/components/v3/MinorCorrectionsList.tsx`:
   - One card per minor error (bg `--color-bg-raised`, 12px radius)
   - Section label chip
   - Two-panel diff: red strikethrough (original) | green text (correction)
   - Accept/Reject toggles (default: Accept)
   - Running count: "3 of 5 corrections accepted"

**File Targets:**
- `src/components/projects/PipelineBar.tsx` (updated)
- `src/components/v3/UploadCheckPanel.tsx`
- `src/components/v3/FindingsPanel.tsx`
- `src/components/v3/MinorCorrectionsList.tsx`

**→ After this step: /qa**

---

## [STEP 40] — V3 Integration & End-to-End Compliance

**Task:**

1. Connect V3 Pass to `proof_reviews`:
   - Manager clicks Pass → creates `proof_reviews` row with:
     `result: 'pass', notes: 'Passed via V3 AI check — no major errors found'`
   - Advances status → `report_uploaded`
   - Existing notification flow triggers

2. Update `src/server/routers/proofReview.ts`:
   - Add optional `checkId` to submit procedure
   - If `checkId` provided: validate `check_result !== 'major_errors'`
   - If major errors exist + manager tries to pass: throw `FORBIDDEN`
     "Major errors must be resolved before passing"

3. Iteration tracking:
   - Second upload for same project: increment `iteration`
   - Each resubmission = new `report_checks` row
   - Pipeline bar shows "Attempt {n}" on Proofreading stage

4. Add V3 to `src/app/(app)/projects/[id]/page.tsx`:
   - Render `<UploadCheckPanel>` when:
     - Role is `ops_manager+`
     - Project status is `report_done` or `proof_ready`

5. Update `SMOKE_TEST.md` V3 section (already scaffolded in Step 33)

**File Targets:**
- `src/server/routers/proofReview.ts` (updated)
- `src/app/(app)/projects/[id]/page.tsx` (updated)
- `SMOKE_TEST.md` (updated)

**Dependencies:** Steps 39, 15 (ProofReviewModal)

**→ After this step: /ship** — then run full SMOKE_TEST.md

---

# ════════════════════════════════════════════════
# BUILD COMPLETE — SUMMARY TABLE
# ════════════════════════════════════════════════

| Phase | Steps | Feature |
|---|---|---|
| 1 — Core completion | 23–25 | PDF export, manager dashboard, lab settings |
| 2 — Blueprint UX | 33A–33D | Auth gateway redesign, role-priming, sandbox, JIT modal, awaiting orders |
| 3 — PWA + Offline | 26–29 | Manifest, Dexie DB, sync queue, cache seeding |
| 4 — Admin + CI/CD | 30–33 | Super admin, CI/CD, mobile audit, seed + smoke tests |
| 5 — V3 | 34–40 | AI proofreader, guideline checker, correction writer, V3 UI |

**Total remaining steps: 23 (Steps 23–40 + 33A–33D)**

---

# ════════════════════════════════════════════════
# CONFLICT RESOLUTION LOG
# What was fixed from original MASTER IMPLEMENTATION PLAN
# ════════════════════════════════════════════════

| # | Original Issue | Resolution |
|---|---|---|
| 1 | Design tokens referenced --color-core-brand/tactical without definition | Full token map added to Section 0 preamble |
| 2 | Steps out of logical order (12, 15, 23, 24, 25, 16, 17...) | Re-sequenced into 5 logical phases |
| 3 | Inter font mixed with "geometric equivalents (Satoshi, Space Grotesk)" | Locked to Inter only (no substitutes) |
| 4 | RLS in Step 34 used auth.jwt()->>'tenant_id' | Corrected to direct users table subquery |
| 5 | 4 Blueprint UX flows missing (sandbox, JIT modal, role-priming, awaiting orders) | Added as Steps 33A–33D |
| 6 | Auth pages not redesigned for Part 1 gateway visual system | Added as Step 33A |
| 7 | No design system preamble — agent had no single source of truth | Section 0 added — mandatory read before all steps |
| 8 | Context refresh prompts missing — agent context drift risk | 3 context refresh prompts added at phase boundaries |
| 9 | Step 34 says "npm install ... unzipper" but doesn't npm install it separately | Unified into single install command |
| 10 | steps 12 and 15 referenced (already complete) | Removed — only remaining steps included |
