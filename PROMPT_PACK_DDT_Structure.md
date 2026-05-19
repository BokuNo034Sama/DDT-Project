# PROMPT PACK — DDT Structure
**Phase 4 — Agent Build Pack**  
**Total Steps:** 46  
**Format:** Each step is atomic, self-contained, and executable by a Claude Code agent.

---

## HOW TO USE THIS PACK
1. Feed one step at a time to Claude Code
2. Wait for completion and run the tagged gstack review before proceeding
3. Never skip a Context Refresh Prompt — they reset the agent's working memory
4. Steps marked `→ /careful` touch auth or migrations — slow down and review output manually

---

# ═══════════════════════════════
# BLOCK A — FOUNDATION (Steps 01–06)
# ═══════════════════════════════

---

## [STEP 01] — Initialize Next.js Project

**Context:**
Starting from scratch. We are building DDT Structure, a multi-tenant SaaS for NDT laboratories. The tech stack is Next.js 14 (App Router), TypeScript (strict), Tailwind CSS, and shadcn/ui. The design system uses an industrial dark theme with amber accents.

**Task:**
1. Scaffold a new Next.js 14 project with App Router and TypeScript strict mode:
   ```bash
   npx create-next-app@latest ddt-structure --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
   ```
2. Install all required dependencies:
   ```bash
   npm install @supabase/supabase-js @supabase/ssr @trpc/server @trpc/client @trpc/next @trpc/react-query @tanstack/react-query zod zustand @react-pdf/renderer resend dexie idb-keyval
   npm install -D @types/node supabase prettier prettier-plugin-tailwindcss
   npm install next-pwa
   ```
3. Install shadcn/ui:
   ```bash
   npx shadcn@latest init
   ```
   Choose: Dark theme, CSS variables, default style.
4. Install shadcn components:
   ```bash
   npx shadcn@latest add button input label select badge dialog dropdown-menu separator skeleton toast
   ```
5. Configure `tsconfig.json` with `"strict": true` and path aliases.
6. Create `.env.local` with placeholder keys:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   RESEND_API_KEY=your_resend_api_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
7. Create `.env.example` as a copy of `.env.local` with empty values.
8. Add `.env.local` to `.gitignore`.

**Expected Output:**
- Working Next.js 14 project at `/ddt-structure`
- All dependencies installed without errors
- shadcn/ui initialized with dark theme
- `.env.local` and `.env.example` present

**File Targets:**
- `package.json`
- `tsconfig.json`
- `tailwind.config.ts`
- `.env.local`
- `.env.example`
- `.gitignore`

**Dependencies:** None

**→ After this step: /review**

---

## [STEP 02] — Configure Design System Tokens

**Context:**
Project is initialized. Now we apply DDT Structure's industrial dark design system from DESIGN.md before any UI is built.

**Task:**
1. Update `tailwind.config.ts` to extend with DDT design tokens:
   ```typescript
   colors: {
     'ddt-bg': '#0C1220',
     'ddt-surface': '#141C2E',
     'ddt-raised': '#1C2640',
     'ddt-input': '#1A2235',
     'ddt-border': '#2A3550',
     'ddt-border-strong': '#3A4A6A',
     'ddt-accent': '#F59E0B',
     'ddt-accent-dim': '#92610A',
     'ddt-accent-bg': '#2A1F05',
     'ddt-text': '#E8EAF0',
     'ddt-muted': '#8892A4',
     'ddt-faint': '#4A5568',
   }
   ```
2. Add Google Fonts (Syne, DM Sans, JetBrains Mono) to `app/layout.tsx` via `next/font/google`.
3. Create `app/globals.css` with CSS custom properties matching DESIGN.md:
   - Status chip color variables for all 9 statuses (not_started through report_delivered plus proof_failed)
   - Base dark background applied to `html` and `body`
4. Create `src/lib/design-tokens.ts` exporting status chip classes as a TypeScript map:
   ```typescript
   export const STATUS_CHIP_STYLES: Record<ProjectStatus, { bg: string; text: string; border: string }> = { ... }
   ```
5. Update `components.json` (shadcn) to use `ddt-surface` as card background.

**Expected Output:**
- Tailwind extended with all DDT colour tokens
- Fonts loading correctly on first render
- CSS variables available globally
- `STATUS_CHIP_STYLES` map exported and typed

**File Targets:**
- `tailwind.config.ts`
- `app/globals.css`
- `app/layout.tsx`
- `src/lib/design-tokens.ts`
- `components.json`

**Dependencies:** STEP 01

**→ After this step: /qa**

---

## [STEP 03] — Supabase Project Setup & Database Migrations

**Context:**
Design tokens are applied. Now we set up Supabase and create all database tables, indexes, enums, and RLS policies as defined in the PRD schema section.

**Task:**
1. Install Supabase CLI and initialize:
   ```bash
   npm install -g supabase
   supabase init
   ```
2. Create Supabase client utilities:
   - `src/lib/supabase/client.ts` — browser client using `createBrowserClient`
   - `src/lib/supabase/server.ts` — server client using `createServerClient` with cookie handling
   - `src/lib/supabase/middleware.ts` — middleware client for session refresh
3. Create migration file `supabase/migrations/001_initial_schema.sql` containing ALL of the following in order:
   a. Create ENUM types: `subscription_status_enum`, `user_role_enum`, `project_status_enum`, `stage_enum`, `stage_status_enum`, `proof_result_enum`, `notification_type_enum`
   b. Create table: `tenants`
   c. Create table: `users` (references auth.users)
   d. Create table: `projects` (with GIN index for full-text search)
   e. Create table: `project_stage_assignments`
   f. Create table: `proof_reviews`
   g. Create table: `site_visits`
   h. Create table: `status_history`
   i. Create table: `notifications`
   j. Create table: `invitations`
   k. Create all indexes as specified in PRD section 7
   l. Enable RLS on all tables
   m. Create RLS policies as specified in PRD section 7
4. Create migration file `supabase/migrations/002_functions.sql` containing:
   a. Function `get_next_serial_number(p_tenant_id UUID)` — returns next serial number atomically using `SELECT ... FOR UPDATE`
   b. Function `advance_project_status(p_project_id UUID, p_stage stage_enum)` — auto-advances project status based on completed stage
5. Run migration against local Supabase (or note the `supabase db push` command in README).
6. Create `src/types/database.ts` exporting all TypeScript types matching the schema (can use `supabase gen types typescript` output).

**Expected Output:**
- All 10 tables created with correct columns, types, and constraints
- All RLS policies active
- All indexes created
- Supabase browser and server clients exported
- TypeScript database types exported

**File Targets:**
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/middleware.ts`
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_functions.sql`
- `src/types/database.ts`

**Dependencies:** STEP 01

**→ After this step: /careful** (migration touches all schema)

---

## [STEP 04] — tRPC Setup with Auth Context

**Context:**
Database is ready. Now we set up the tRPC server with Supabase auth context so all procedures have access to `userId`, `tenantId`, and `role`.

**Task:**
1. Create `src/server/trpc.ts`:
   - Initialize tRPC with `initTRPC.context<Context>()`
   - Export `router`, `publicProcedure`, `protectedProcedure`, `managerProcedure`, `adminProcedure`
   - `protectedProcedure` — throws `UNAUTHORIZED` if no session
   - `managerProcedure` — throws `FORBIDDEN` if role is `staff`
   - `adminProcedure` — throws `FORBIDDEN` if role is not `super_admin`
2. Create `src/server/context.ts`:
   - Builds context from Next.js request headers
   - Validates Supabase JWT
   - Returns `{ supabase, userId, tenantId, role }` or `{ supabase, userId: null, tenantId: null, role: null }` for unauthenticated
3. Create `src/server/routers/_app.ts`:
   - Root router stub (empty, will be populated in later steps)
4. Create `src/app/api/trpc/[trpc]/route.ts`:
   - Next.js App Router handler using `fetchRequestHandler`
5. Create `src/lib/trpc/client.ts`:
   - tRPC React client with TanStack Query provider
   - `transformer: superjson` for Date serialization
6. Create `src/lib/trpc/provider.tsx`:
   - `<TRPCProvider>` component wrapping `QueryClientProvider`
7. Wrap `app/layout.tsx` with `<TRPCProvider>`.
8. Install `superjson`:
   ```bash
   npm install superjson @trpc/server@next @trpc/client@next @trpc/react-query@next
   ```

**Expected Output:**
- tRPC initialized with typed context
- All procedure tiers (`public`, `protected`, `manager`, `admin`) defined
- API route handler working at `/api/trpc`
- TanStack Query provider wrapping the app

**File Targets:**
- `src/server/trpc.ts`
- `src/server/context.ts`
- `src/server/routers/_app.ts`
- `src/app/api/trpc/[trpc]/route.ts`
- `src/lib/trpc/client.ts`
- `src/lib/trpc/provider.tsx`
- `app/layout.tsx` (updated)

**Dependencies:** STEP 03

**→ After this step: /review**

---

## [STEP 05] — Authentication Middleware & Route Protection

**Context:**
tRPC is configured. Now we implement auth middleware to protect all `(app)` routes and handle the invitation acceptance flow.

**Task:**
1. Create `src/middleware.ts` (Next.js root middleware):
   - Refresh Supabase session on every request
   - Redirect unauthenticated users from `(app)` routes to `/login`
   - Redirect authenticated users away from `/login` to `/dashboard`
   - Allow `/accept-invite` without auth
   - Allow `/api/trpc` without redirect (tRPC handles its own auth)
2. Create `src/app/(auth)/login/page.tsx`:
   - Email + password form (DM Sans, dark theme)
   - Calls `supabase.auth.signInWithPassword()`
   - On success: redirect to `/dashboard`
   - On error: inline error message below form
   - Show DDT Structure logo mark and tagline
3. Create `src/app/(auth)/accept-invite/page.tsx`:
   - Reads `?token=` from URL
   - Validates token against `invitations` table via server action
   - Shows "Set your password" form
   - On submit: creates Supabase Auth user, inserts `users` row, deletes invitation
   - On expired token: shows error with "Contact your manager" message
4. Create `src/lib/auth/get-session.ts`:
   - Server-side helper that returns current user session + role from DB
   - Used in Server Components to get user data without tRPC
5. Create `src/lib/auth/actions.ts`:
   - `signOut()` server action — calls `supabase.auth.signOut()` + redirect to `/login`
   - `acceptInvite(token, password)` server action — handles invitation acceptance

**Expected Output:**
- Unauthenticated users cannot access any `(app)` route
- Login form works with correct credentials
- Invitation acceptance flow creates user and redirects to `/dashboard`
- Sign out works from any page

**File Targets:**
- `src/middleware.ts`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/accept-invite/page.tsx`
- `src/lib/auth/get-session.ts`
- `src/lib/auth/actions.ts`

**Dependencies:** STEP 03, STEP 04

**→ After this step: /careful** (auth flow — test all redirect paths)

---

## [STEP 06] — Core Type Definitions & Shared Utilities

**Context:**
Auth is working. Before building features, we establish shared types and utilities used throughout the app.

**Task:**
1. Create `src/types/index.ts` exporting all application-level TypeScript types:
   - `ProjectStatus` enum
   - `StageType` enum
   - `UserRole` enum
   - `Project` type (full project with stage assignments)
   - `StageAssignment` type
   - `User` type
   - `Notification` type
   - `SiteVisit` type
   - `ProofReview` type
2. Create `src/lib/ndt-code.ts`:
   - `generateNdtCode(tenantId, supabase)` — calls the DB function from migration 002
   - `parseNdtCode(code)` — returns `{ prefix, serial }` 
3. Create `src/lib/status-transitions.ts`:
   - `STATUS_ORDER: ProjectStatus[]` — ordered array of all 9 statuses
   - `STAGE_TO_STATUS: Record<StageType, ProjectStatus>` — maps completed stage to next status
   - `canTransitionTo(from: ProjectStatus, to: ProjectStatus, role: UserRole): boolean`
   - `getNextStatus(currentStatus: ProjectStatus, completedStage: StageType): ProjectStatus`
4. Create `src/lib/efficiency.ts`:
   - `calculateEfficiencyScore(params)` — implements the formula from PRD section 11
   - `formatDuration(startedAt: Date, completedAt: Date): string` — returns "2h 34m" format
5. Create `src/lib/utils.ts` (extend existing shadcn utils):
   - `formatDate(date: Date | string): string` — "May 08, 2026"
   - `formatDateTime(date: Date | string): string` — "May 08 · 14:32"
   - `getInitials(fullName: string): string` — "Emeka Okafor" → "EO"

**Expected Output:**
- All shared types exported from `src/types/index.ts`
- NDT code generator utility working
- Status transition logic centralized
- Efficiency score formula implemented

**File Targets:**
- `src/types/index.ts`
- `src/lib/ndt-code.ts`
- `src/lib/status-transitions.ts`
- `src/lib/efficiency.ts`
- `src/lib/utils.ts`

**Dependencies:** STEP 03

**→ After this step: /review**

---

# ════════════════════════════════════════
# ⟳ CONTEXT REFRESH PROMPT A — After Step 06
# ════════════════════════════════════════

```
We are building DDT Structure — a multi-tenant SaaS for NDT laboratories in Lagos.

COMPLETED SO FAR:
- Next.js 14 (App Router), TypeScript strict, Tailwind CSS, shadcn/ui
- DDT industrial dark design system tokens (amber accent, dark surfaces)
- Supabase: all 10 tables, RLS policies, indexes, DB functions
- tRPC with auth context (userId, tenantId, role in every procedure)
- Auth middleware: login page, invite acceptance, route protection
- Shared types, NDT code generator, status transition engine, efficiency formula

TECH STACK: Next.js 14, tRPC, Supabase (Postgres + Auth + Realtime), Tailwind, shadcn/ui, Dexie.js (offline), next-pwa, @react-pdf/renderer, Resend

KEY ARCHITECTURE:
- Multi-tenancy via RLS: every query scoped to tenantId from JWT
- Status pipeline: not_started → wip → analysis_done → sketch_done → report_done → proof_ready → report_uploaded → report_verified → report_delivered
- Roles: super_admin > lab_owner > ops_manager > staff
- Offline: mutations queue in IndexedDB (Dexie), sync on reconnect

NEXT: Building the app shell (layout, sidebar, topbar) then project features.
```

---

# ═══════════════════════════════
# BLOCK B — APP SHELL (Steps 07–10)
# ═══════════════════════════════

---

## [STEP 07] — App Shell Layout (Sidebar + TopBar)

**Context:**
Foundation is complete. Now we build the persistent UI shell that wraps all manager and staff views.

**Task:**
1. Create `src/app/(app)/layout.tsx`:
   - Server Component that fetches current user via `getSession()`
   - Renders `<Sidebar>` + `<TopBar>` + `{children}` in a flex layout
   - Passes user data down as props
2. Create `src/components/layout/Sidebar.tsx` (Client Component):
   - Fixed 200px width on desktop
   - Logo mark "DDT Structure" in Syne font, amber colour
   - Lab name subtitle below logo (from user's tenant)
   - Nav items with icons (use Lucide React icons): Dashboard, Projects, Staff, Search Reports, Performance, Settings
   - Active item: amber left border + lighter text
   - Bottom section: user avatar circle (initials), user name, role pill, sign out button
   - Mobile: collapses to bottom tab bar with 5 icon tabs
3. Create `src/components/layout/TopBar.tsx` (Client Component):
   - Page title (passed as prop or read from route)
   - Right side: `<NotificationBell>` placeholder (wired in STEP 26) + primary CTA button slot
   - Sync status indicator slot (wired in STEP 41)
   - Height: 52px, border-bottom: 1px solid ddt-border
4. Create `src/components/layout/PageShell.tsx`:
   - Wrapper for page content with consistent padding (24px desktop, 16px mobile)
   - Optional `title` and `action` props for TopBar integration

**Expected Output:**
- All `(app)` routes render inside the sidebar + topbar shell
- Sidebar shows correct user name, lab name, and role
- Active nav item highlighted correctly
- Mobile bottom tab bar renders on small screens

**File Targets:**
- `src/app/(app)/layout.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/TopBar.tsx`
- `src/components/layout/PageShell.tsx`

**Dependencies:** STEP 05, STEP 06

**→ After this step: /qa**

---

## [STEP 08] — Base UI Components

**Context:**
Shell is ready. Now we build the reusable UI components used across all feature pages.

**Task:**
Build all of the following components in `src/components/ui/`:

1. **`StatusChip.tsx`** — Renders a coloured pill badge for any `ProjectStatus`. Uses `STATUS_CHIP_STYLES` from design tokens. Accepts `status: ProjectStatus` prop. Renders inline-flex with correct bg/text/border from the design system.

2. **`UserPill.tsx`** — Small staff name badge. Dark surface bg, secondary text. Accepts `name: string` and optional `avatarInitials: string`.

3. **`NdtCode.tsx`** — Renders NDT code in JetBrains Mono font, amber colour. Accepts `code: string`.

4. **`FaultBadge.tsx`** — Red badge with warning icon and fault count. Hidden if `count === 0`. Accepts `count: number`.

5. **`StatCard.tsx`** — Metric display card. Props: `value: string | number`, `label: string`, `trend?: { direction: 'up' | 'down'; text: string }`, `primary?: boolean` (adds amber left border).

6. **`AvatarCircle.tsx`** — Circular initials avatar. Props: `initials: string`, `size?: 'sm' | 'md' | 'lg'`. Uses blue-tinted background from design system.

7. **`EmptyState.tsx`** — Empty list state. Props: `title: string`, `description: string`, `action?: ReactNode`. Centered, muted styling.

8. **`LoadingSkeleton.tsx`** — Animated skeleton loader. Props: `rows?: number`, `type: 'table' | 'cards' | 'detail'`.

9. **`SyncIndicator.tsx`** — Shows online/offline status + pending sync queue count. Green dot = online, amber dot = syncing, red dot = offline. Small badge in TopBar. Wired to Zustand store (offline store created in STEP 41).

10. **`OfflineBanner.tsx`** — Full-width amber banner at top of page when offline: "You're offline — changes will sync when reconnected."

**Expected Output:**
- All 10 components render correctly with correct dark theme styling
- StatusChip shows correct colour for each of the 9 statuses + proof_failed
- All components are exported from `src/components/ui/index.ts`

**File Targets:**
- `src/components/ui/StatusChip.tsx`
- `src/components/ui/UserPill.tsx`
- `src/components/ui/NdtCode.tsx`
- `src/components/ui/FaultBadge.tsx`
- `src/components/ui/StatCard.tsx`
- `src/components/ui/AvatarCircle.tsx`
- `src/components/ui/EmptyState.tsx`
- `src/components/ui/LoadingSkeleton.tsx`
- `src/components/ui/SyncIndicator.tsx`
- `src/components/ui/OfflineBanner.tsx`
- `src/components/ui/index.ts`

**Dependencies:** STEP 02, STEP 06

**→ After this step: /qa**

---

# ═══════════════════════════════════
# BLOCK C — PROJECTS CORE (Steps 09–14)
# ═══════════════════════════════════

---

## [STEP 09] — Projects tRPC Router

**Context:**
Shell and base components are ready. Now we build the tRPC router for all project operations — the core data layer of the app.

**Task:**
Create `src/server/routers/projects.ts` with the following procedures:

1. **`list`** (managerProcedure, query):
   - Input: `{ status?: ProjectStatus, page?: number, limit?: number }`
   - Returns paginated projects with stage assignments joined
   - Ordered by `created_at DESC`
   - Scoped to `ctx.tenantId` (RLS handles this but also explicit for clarity)

2. **`create`** (managerProcedure, mutation):
   - Input: Zod schema with all project fields (clientName required, device optional)
   - Calls `generateNdtCode()` to get next code atomically
   - Inserts project with `status: 'not_started'`
   - Inserts `status_history` row: `null → not_started`
   - Returns created project

3. **`getById`** (protectedProcedure, query):
   - Input: `{ id: string }`
   - Returns full project with: stage assignments + assigned users, site visits + staff names, status history, proof reviews
   - Staff: only returns their own assigned projects or all if manager

4. **`updateStatus`** (managerProcedure, mutation):
   - Input: `{ id: string, status: ProjectStatus, notes?: string }`
   - Validates transition is allowed via `canTransitionTo()`
   - Updates project status
   - Inserts `status_history` row with `changed_by` and timestamp

5. **`update`** (managerProcedure, mutation):
   - Input: Partial project fields (for editing client info, device, connection)
   - Updates project record
   - Does NOT allow status updates (use `updateStatus`)

6. **`getStats`** (managerProcedure, query):
   - Returns: `{ activeCount, staffOnTask, awaitingProofread, deliveredThisMonth }`
   - Used for dashboard StatCards

Register in `src/server/routers/_app.ts`:
```typescript
projects: projectsRouter,
```

**Expected Output:**
- All 6 project procedures working
- Type-safe inputs via Zod
- All queries scoped to tenant
- `_app.ts` router updated

**File Targets:**
- `src/server/routers/projects.ts`
- `src/server/routers/_app.ts` (updated)

**Dependencies:** STEP 04, STEP 06

**→ After this step: /review**

---

## [STEP 10] — New Project Form Page

**Context:**
Projects router is ready. Now we build the New Project form page where managers create project records.

**Task:**
1. Create `src/app/(app)/projects/new/page.tsx`:
   - Server Component wrapper with `<PageShell title="New Project">`
   - Renders `<NewProjectForm>` Client Component

2. Create `src/components/projects/NewProjectForm.tsx` (Client Component):
   - Uses `react-hook-form` + Zod resolver:
     ```bash
     npm install react-hook-form @hookform/resolvers
     ```
   - Fields in a two-column grid on desktop, single column on mobile:
     - Client Name* (required)
     - Site Date* (date picker)
     - Address* (textarea)
     - Number of Floors* (number input)
     - Client Email (optional)
     - Client Phone (optional)
     - Connection / Referrer (optional, text)
     - Device / Laptop Name (optional, text)
   - Submit calls `trpc.projects.create.useMutation()`
   - On success: toast "Project K013 created" + redirect to `/projects/{id}`
   - On error: inline field errors
   - Cancel button returns to `/projects`
   - NDT code preview: shows "Next code: K013" as a read-only field (fetched from `trpc.projects.getNextCode`)
   - Add `getNextCode` query procedure to projects router returning the next NDT code without creating a record

3. Style: dark surface card, amber "Create Project" submit button, DM Sans labels, input fields using `ddt-input` background.

**Expected Output:**
- Form renders all fields with correct validation
- Successful submission creates project and redirects
- NDT code preview updates correctly
- Form is mobile-responsive

**File Targets:**
- `src/app/(app)/projects/new/page.tsx`
- `src/components/projects/NewProjectForm.tsx`
- `src/server/routers/projects.ts` (add `getNextCode` procedure)

**Dependencies:** STEP 09, STEP 08

**→ After this step: /qa**

---

## [STEP 11] — Projects List Page

**Context:**
New project creation works. Now we build the Projects list page — the primary management view.

**Task:**
1. Create `src/app/(app)/projects/page.tsx`:
   - Server Component that prefetches `trpc.projects.list` for SSR
   - Renders `<ProjectsTable>` with initial data

2. Create `src/components/projects/ProjectsTable.tsx` (Client Component):
   - Full-width table with columns: Code | Client | Address | Site Date | Floors | Status | Report Handler | Sketch | Analysis | Faults | Actions
   - Uses `trpc.projects.list.useQuery()` with TanStack Query
   - Each row renders: `<NdtCode>`, client name (truncated), truncated address, formatted date, floor count, `<StatusChip>`, `<UserPill>` × 3 stages, `<FaultBadge>`, row action menu
   - Row click navigates to `/projects/{id}`
   - Unassigned stage cell: amber dashed border + "Assign" text
   - Loading state: `<LoadingSkeleton type="table" rows={8}>`
   - Empty state: `<EmptyState title="No projects yet" description="Create your first project" />`

3. Create `src/components/projects/ProjectFilters.tsx` (Client Component):
   - Filter buttons: All | In Progress | Proof Ready | Delivered
   - Date range picker (two date inputs)
   - Updates URL search params, table re-queries on change

4. Add "New Project" button to TopBar that navigates to `/projects/new`.

5. Table is paginated: 20 rows per page with Prev/Next controls.

**Expected Output:**
- Projects list renders all projects for current tenant
- Status chips show correct colours
- Stage staff pills render correctly (or Assign placeholder)
- Filter buttons narrow the list
- Pagination works
- Row click navigates to detail page

**File Targets:**
- `src/app/(app)/projects/page.tsx`
- `src/components/projects/ProjectsTable.tsx`
- `src/components/projects/ProjectFilters.tsx`

**Dependencies:** STEP 09, STEP 08

**→ After this step: /qa**

---

## [STEP 12] — Project Detail Page & Pipeline Bar

**Context:**
Projects list is working. Now we build the Project Detail page — the most information-dense screen in the app.

**Task:**
1. Create `src/app/(app)/projects/[id]/page.tsx`:
   - Server Component fetching full project via `trpc.projects.getById`
   - Layout: two sections — top header info card + bottom pipeline section

2. Create `src/components/projects/ProjectHeader.tsx`:
   - Left: `<NdtCode>` large, client name in Syne 20px, status chip
   - Right: address, site date, floors, device (if set), connection
   - Client email/phone if present
   - Edit button (opens edit modal) for managers only

3. Create `src/components/projects/PipelineBar.tsx`:
   - Horizontal 4-stage bar: Analysis → Sketch → Report Writing → Proofreading
   - Each stage: icon + stage name + assigned staff pill + status indicator
   - Completed stages: green checkmark + `started_at` → `completed_at` + duration
   - Active stage: amber glow border
   - Pending stages: ddt-border style
   - Proofreading stage: shows "Manager Only" label if not ops_manager
   - "Assign Staff" button on unassigned stages (managers only)

4. Create `src/components/projects/StageAssignModal.tsx` (Client Component):
   - Dialog: select staff from dropdown of active tenant users
   - Calls `trpc.stages.assign.useMutation()`
   - On success: invalidates project query, toasts "Stage assigned to {name}"

5. Create `src/components/projects/StatusHistory.tsx`:
   - Collapsible timeline at bottom of detail page
   - Shows all status transitions: from → to, changed by, timestamp
   - Compact; collapsed by default showing last 3 changes

6. Create `src/components/projects/SiteVisitsList.tsx`:
   - List of staff who attended site: name + date + floors
   - "Add Site Visit" button for managers (opens small modal)

**Expected Output:**
- Full project detail renders with all fields
- Pipeline bar shows correct stage states
- Stage assign modal works
- Status history timeline renders
- Site visits section renders

**File Targets:**
- `src/app/(app)/projects/[id]/page.tsx`
- `src/components/projects/ProjectHeader.tsx`
- `src/components/projects/PipelineBar.tsx`
- `src/components/projects/StageAssignModal.tsx`
- `src/components/projects/StatusHistory.tsx`
- `src/components/projects/SiteVisitsList.tsx`

**Dependencies:** STEP 11, STEP 08

**→ After this step: /qa**

---

# ════════════════════════════════════════
# ⟳ CONTEXT REFRESH PROMPT B — After Step 12
# ════════════════════════════════════════

```
We are building DDT Structure — a multi-tenant NDT lab operations SaaS.

COMPLETED SO FAR:
- Full foundation: Next.js 14, tRPC, Supabase, design system, auth
- App shell: Sidebar, TopBar, PageShell, all base UI components
- Projects: tRPC router (list, create, getById, updateStatus, getStats)
- Projects list page with table, status chips, filters
- New project form with NDT code preview
- Project detail page with PipelineBar, stage assignment, status history

CURRENT STATUS: Project CRUD is working. Next we build the stage workflow engine — the tRPC routers and UI for staff to receive, start, and complete their assigned tasks.

KEY TYPES:
- ProjectStatus: not_started | wip | analysis_done | sketch_done | report_done | proof_ready | report_uploaded | report_verified | report_delivered
- StageType: analysis | sketch | report_writing | proofreading
- UserRole: super_admin | lab_owner | ops_manager | staff

NDT STATUS AUTO-ADVANCE:
- analysis completed → project status = analysis_done
- sketch completed → project status = sketch_done  
- report_writing completed → project status = report_done
- proofreading PASS → project status = report_uploaded
- proofreading FAIL → project status = wip + fault logged

NEXT: Stage tRPC router, proof review system, site visits router, staff task view.
```

---

# ═══════════════════════════════════════
# BLOCK D — WORKFLOW ENGINE (Steps 13–18)
# ═══════════════════════════════════════

---

## [STEP 13] — Stages tRPC Router

**Context:**
Project detail page is complete. Now we build the stage assignment and completion engine — the heart of the workflow.

**Task:**
Create `src/server/routers/stages.ts` with:

1. **`assign`** (managerProcedure, mutation):
   - Input: `{ projectId, stage, assignedTo: userId }`
   - Upserts `project_stage_assignments` (update if stage already exists)
   - Creates notification for assigned staff: "New task assigned: {stage} for {ndtCode}"
   - Updates project status to `wip` if it was `not_started`
   - Logs status history if status changed

2. **`start`** (protectedProcedure, mutation):
   - Input: `{ stageAssignmentId }`
   - Validates that `ctx.userId === assigned_to` OR ctx.role is manager
   - Sets `started_at = NOW()`, `status = in_progress`

3. **`complete`** (protectedProcedure, mutation):
   - Input: `{ stageAssignmentId }`
   - Validates ownership or manager role
   - Sets `completed_at = NOW()`, `status = completed`
   - Calls `getNextStatus(project.status, stage)` to auto-advance project status
   - Updates project status + logs to `status_history`
   - Notifies all managers in tenant: "{staffName} completed {stage} for {ndtCode}"

4. **`getMyStages`** (protectedProcedure, query):
   - Returns all pending/in_progress stages assigned to `ctx.userId`
   - Joins project data (ndtCode, clientName)
   - Ordered by `assigned_at ASC`

Register in `_app.ts`: `stages: stagesRouter`

**Expected Output:**
- All 4 stage procedures working
- Auto-advance triggers correct project status updates
- Notifications created on assignment and completion
- Stage ownership enforced

**File Targets:**
- `src/server/routers/stages.ts`
- `src/server/routers/_app.ts` (updated)

**Dependencies:** STEP 09, STEP 06

**→ After this step: /review**

---

## [STEP 14] — Proof Review tRPC Router & Site Visits Router

**Context:**
Stage workflow is ready. Now we add the proof review system (which includes fault tracking) and the site visits logger.

**Task:**

**Part A — Proof Reviews:**
Create `src/server/routers/proofReview.ts`:

1. **`submit`** (managerProcedure, mutation):
   - Input: `{ projectId, result: 'pass' | 'fail', failureReason?: string }`
   - Validates project status is `report_done` or `proof_ready`
   - Gets report handler from `project_stage_assignments` where `stage = 'report_writing'`
   - Inserts `proof_reviews` row with result, reviewer, timestamp, report_handler_id
   - **If PASS:**
     - Updates project status → `report_uploaded`
     - Logs status history
     - Notifies report handler: "Your report passed proofreading ✓"
   - **If FAIL:**
     - Updates project status → `wip`
     - Logs status history
     - Notifies report handler: "Report returned for revision — {failureReason}"
     - Resets `report_writing` stage assignment: `completed_at = null`, `status = in_progress`

2. **`getByProject`** (managerProcedure, query):
   - Returns all proof reviews for a project ordered by `reviewed_at DESC`

**Part B — Site Visits:**
Create `src/server/routers/siteVisits.ts`:

1. **`add`** (managerProcedure, mutation):
   - Input: `{ projectId, staffId, visitDate, numberOfFloors? }`
   - Inserts `site_visits` row

2. **`getByProject`** (protectedProcedure, query):
   - Returns all site visits for a project with staff names

3. **`remove`** (managerProcedure, mutation):
   - Input: `{ siteVisitId }`
   - Deletes visit record

Register both in `_app.ts`.

**Expected Output:**
- Proof pass advances status correctly
- Proof fail resets to wip and logs fault
- Fault is recorded against report handler
- Site visits can be added and listed per project

**File Targets:**
- `src/server/routers/proofReview.ts`
- `src/server/routers/siteVisits.ts`
- `src/server/routers/_app.ts` (updated)

**Dependencies:** STEP 13

**→ After this step: /careful** (fault logic is critical to efficiency scoring)

---

## [STEP 15] — Proof Review UI & Site Visit Modal

**Context:**
Proof and site visit routers are ready. Now we wire the UI components on the project detail page.

**Task:**
1. Create `src/components/projects/ProofReviewModal.tsx` (Client Component):
   - Triggered by "Begin Proofread" or "Submit Review" button on project detail (visible to ops_manager+ only)
   - Two large buttons: ✓ Pass | ✗ Fail
   - Fail selection shows optional textarea: "Reason for failure (optional)"
   - Confirm button calls `trpc.proofReview.submit.useMutation()`
   - On success: closes modal, invalidates project query, shows toast

2. Update `src/components/projects/PipelineBar.tsx`:
   - Add proofread stage section
   - Show proof review history below the stage (all past reviews for this project)
   - Show fault count badge: "2 faults" in red if any failures exist
   - "Submit Proofread" button visible only to ops_manager+ role

3. Create `src/components/projects/SiteVisitModal.tsx` (Client Component):
   - Form: staff dropdown + date + optional floors
   - Calls `trpc.siteVisits.add.useMutation()`
   - On success: invalidates project query

4. Update `src/components/projects/SiteVisitsList.tsx`:
   - Show "Add Site Visit" button that opens `<SiteVisitModal>`
   - Show delete button per visit row (managers only)

**Expected Output:**
- Proof review modal works for pass and fail
- Failed proofread shows reason in history
- Site visit modal adds entries correctly
- Fault badge appears on pipeline bar

**File Targets:**
- `src/components/projects/ProofReviewModal.tsx`
- `src/components/projects/PipelineBar.tsx` (updated)
- `src/components/projects/SiteVisitModal.tsx`
- `src/components/projects/SiteVisitsList.tsx` (updated)

**Dependencies:** STEP 14, STEP 12

**→ After this step: /qa**

---

## [STEP 16] — Staff Task View (Mobile-First)

**Context:**
All workflow routers and manager UI are complete. Now we build the staff-facing task view — the primary mobile interface for field technicians and report writers.

**Task:**
1. Create `src/app/(app)/dashboard/page.tsx`:
   - **Role-split rendering:** 
     - If role is `staff` → renders `<StaffDashboard>`
     - If role is `ops_manager` or `lab_owner` → renders `<ManagerDashboard>` (built in STEP 35)

2. Create `src/components/staff/StaffDashboard.tsx` (Client Component):
   - Calls `trpc.stages.getMyStages.useQuery()`
   - Shows "My Tasks" header with count badge
   - Renders `<TaskCard>` for each pending/active stage
   - Empty state: "No tasks assigned — check with your manager"
   - Realtime subscription: re-queries when a new notification arrives

3. Create `src/components/staff/TaskCard.tsx` (Client Component):
   - Card layout optimized for mobile (full-width, tall touch targets)
   - Top row: `<NdtCode>` + client name in Syne font
   - Middle: stage pill (amber for report_writing, teal for analysis, purple for sketch) + "Assigned by: {name}"
   - Bottom: "Assigned {date}" + elapsed timer if started
   - Action buttons (large, 48px height):
     - If `status = pending`: "Start Task" button (calls `stages.start`)
     - If `status = in_progress`: "Mark Complete" button (calls `stages.complete`) — amber, prominent
   - Optimistic update: button shows spinner then updates instantly

4. Add Supabase Realtime subscription in `StaffDashboard.tsx`:
   ```typescript
   // Subscribe to notifications for current user
   // Re-fetch getMyStages on new notification
   ```

**Expected Output:**
- Staff see only their own tasks
- Start/Complete actions work with optimistic updates
- Mobile layout: comfortable tap targets, readable on small screens
- Realtime: new assignment appears without page refresh

**File Targets:**
- `src/app/(app)/dashboard/page.tsx`
- `src/components/staff/StaffDashboard.tsx`
- `src/components/staff/TaskCard.tsx`

**Dependencies:** STEP 13, STEP 08

**→ After this step: /qa** (test on mobile viewport in browser DevTools)

---

# ═══════════════════════════════════════
# BLOCK E — NOTIFICATIONS & SEARCH (Steps 17–20)
# ═══════════════════════════════════════

---

## [STEP 17] — Notifications Router & Bell Component

**Context:**
Task view is complete. Now we wire the in-app notification system.

**Task:**
1. Create `src/server/routers/notifications.ts`:
   - **`list`** (protectedProcedure, query): Returns 20 most recent notifications for `ctx.userId`, ordered by `created_at DESC`
   - **`markRead`** (protectedProcedure, mutation): Input `{ ids: string[] }`, sets `is_read = true`
   - **`markAllRead`** (protectedProcedure, mutation): Marks all user's notifications as read
   - **`getUnreadCount`** (protectedProcedure, query): Returns count of unread notifications

2. Create `src/lib/notifications/send.ts`:
   - `createNotification(params)` — shared server-side function used by all routers to insert notification rows
   - Called by: `stages.assign`, `stages.complete`, `proofReview.submit`

3. Create `src/components/layout/NotificationPanel.tsx` (Client Component):
   - Renders in TopBar as bell icon button
   - Red badge with unread count (from `getUnreadCount` query)
   - Click opens a dropdown panel (max 360px wide, 400px tall, scrollable)
   - Each notification: icon (by type) + title + body + relative time ("2 min ago")
   - Unread notifications have a subtle amber left border
   - "Mark all read" button at top of panel
   - Empty state: "No notifications"
   - Auto-refreshes via Supabase Realtime subscription on `notifications` table for `user_id = ctx.userId`

4. Wire `<NotificationPanel>` into `TopBar.tsx`.

Register in `_app.ts`.

**Expected Output:**
- Notification bell shows correct unread count
- Panel lists notifications in correct order
- Mark read works
- Realtime: new notification increments badge without refresh

**File Targets:**
- `src/server/routers/notifications.ts`
- `src/lib/notifications/send.ts`
- `src/components/layout/NotificationPanel.tsx`
- `src/components/layout/TopBar.tsx` (updated)
- `src/server/routers/_app.ts` (updated)

**Dependencies:** STEP 07, STEP 13, STEP 14

**→ After this step: /qa**

---

## [STEP 18] — Search & Filter Page

**Context:**
Notifications are live. Now we build the report search page — a flagship feature for finding any project by NDT code, client, or address.

**Task:**
1. Create `src/server/routers/search.ts`:
   - **`projects`** (managerProcedure, query):
     - Input: `{ query: string, status?: ProjectStatus, dateFrom?: string, dateTo?: string, staffId?: string, page?: number }`
     - Uses Postgres full-text search: `to_tsvector('english', client_name || ' ' || address || ' ' || ndt_code) @@ plainto_tsquery($1)`
     - Also does ILIKE fallback for NDT code prefix matching (e.g. "K0" returns K001–K009)
     - Returns paginated results with all fields needed for display
     - Min query length: 2 characters

2. Create `src/app/(app)/search/page.tsx`:
   - Server Component wrapper rendering `<SearchPage>`

3. Create `src/components/search/SearchPage.tsx` (Client Component):
   - Full-width search input at top, large (48px height), placeholder "Search by client, address, or code..."
   - Debounced (300ms) query to `trpc.search.projects`
   - Filter sidebar (collapsible on mobile):
     - Status multi-select chips
     - Date range (from/to date inputs)
     - Staff filter dropdown
   - Results: same table format as Projects list but with search term highlighted
   - Result count: "12 results for 'Adeyemi'"
   - Empty state: "No reports found for '{query}'"
   - Loading: skeleton rows appear during debounce

4. Keyboard shortcut: Add global `Cmd+K / Ctrl+K` listener in `app/(app)/layout.tsx` that focuses the search input on the search page or opens a search modal from any page.

Register `search` router in `_app.ts`.

**Expected Output:**
- Search returns correct results for client name, NDT code, address
- Partial NDT code search works ("K01" returns K010–K019)
- Filters narrow results correctly
- Debounce prevents excessive queries
- Keyboard shortcut works from any page

**File Targets:**
- `src/server/routers/search.ts`
- `src/app/(app)/search/page.tsx`
- `src/components/search/SearchPage.tsx`
- `src/server/routers/_app.ts` (updated)

**Dependencies:** STEP 09, STEP 08

**→ After this step: /qa**

---

# ════════════════════════════════════════
# ⟳ CONTEXT REFRESH PROMPT C — After Step 18
# ════════════════════════════════════════

```
DDT Structure — multi-tenant NDT lab SaaS. Building status: ~60% complete.

COMPLETED:
- Foundation, design system, auth, tRPC, Supabase
- App shell (sidebar, topbar, notifications bell)
- Projects: CRUD, list, detail, pipeline bar, stage assignment
- Stage workflow: assign → start → complete → auto-advance status
- Proof review: pass/fail, fault tracking, status rollback
- Site visits logging
- In-app notifications with Supabase Realtime
- Staff task view (mobile-first, task cards with start/complete)
- Search page with full-text search + filters

REMAINING BLOCKS:
- Staff management + invitations (Steps 19-20)
- Performance reports + PDF export (Steps 21-23)
- Manager dashboard (Step 24-25)
- PWA + offline sync (Steps 26-30)
- Super admin + settings (Steps 31-32)
- CI/CD + polish (Steps 33-34)

KEY REMINDER: Efficiency score = (speed 50% + quality 50% + volume bonus 10%)
- Speed: avg stage completion time vs 24h benchmark
- Quality: -15 points per proofread fault
- Site visits tracked separately for field staff
```

---

# ════════════════════════════════════
# BLOCK F — STAFF & INVITATIONS (Steps 19–20)
# ════════════════════════════════════

---

## [STEP 19] — Staff Management Router & Page

**Context:**
Workflow engine and search are complete. Now we build staff management — listing staff, viewing efficiency snapshots, and deactivating members.

**Task:**
1. Create `src/server/routers/staff.ts`:
   - **`list`** (managerProcedure, query): Returns all active users in tenant with: name, email, role, joined_at, current month's stage count, current month's fault count, current month's site visit count
   - **`invite`** (managerProcedure, mutation): Input `{ email, role }`. Creates invitation row with 7-day expiry + UUID token. Calls Resend to send invitation email (built in STEP 20). Returns invitation ID.
   - **`updateRole`** (managerProcedure, mutation): Input `{ userId, role }`. Cannot promote to `super_admin`. Cannot demote self.
   - **`deactivate`** (managerProcedure, mutation): Input `{ userId }`. Sets `is_active = false`. Cannot deactivate self.
   - **`getPendingInvitations`** (managerProcedure, query): Returns all unexpired, unaccepted invitations for tenant.
   - **`cancelInvitation`** (managerProcedure, mutation): Deletes invitation row.

2. Create `src/app/(app)/staff/page.tsx`:
   - Server Component rendering `<StaffPage>`

3. Create `src/components/staff/StaffPage.tsx` (Client Component):
   - Header: "Team" title + "Invite Staff" button
   - Staff table: Avatar | Name | Role pill | Joined | This month: stages / site visits / faults | Actions (role change, deactivate)
   - Pending invitations section below: email | role | expires | Cancel button
   - Role pill colours: ops_manager = amber, staff = blue, lab_owner = purple

4. Create `src/components/staff/InviteModal.tsx` (Client Component):
   - Email input + role select (`ops_manager` or `staff`)
   - Submit calls `trpc.staff.invite`
   - Success toast: "Invitation sent to {email}"

Register in `_app.ts`.

**Expected Output:**
- Staff list renders with monthly efficiency snapshot
- Invite modal sends invitation (email in STEP 20)
- Role changes and deactivation work
- Pending invitations listed with cancel option

**File Targets:**
- `src/server/routers/staff.ts`
- `src/app/(app)/staff/page.tsx`
- `src/components/staff/StaffPage.tsx`
- `src/components/staff/InviteModal.tsx`
- `src/server/routers/_app.ts` (updated)

**Dependencies:** STEP 05, STEP 06

**→ After this step: /review**

---

## [STEP 20] — Invitation Emails via Resend

**Context:**
Staff router is ready. Now we wire the Resend email service for invitation delivery.

**Task:**
1. Create `src/lib/email/resend.ts`:
   - Initialize Resend client: `new Resend(process.env.RESEND_API_KEY)`
   - Export typed `sendEmail()` wrapper with error handling

2. Create `src/lib/email/templates/invitation.tsx`:
   - React Email template (install `@react-email/components`):
     ```bash
     npm install @react-email/components react-email
     ```
   - Email content:
     - Subject: "You've been invited to join {labName} on DDT Structure"
     - Body: Lab name, inviter name, role they're being assigned, accept button linking to `{APP_URL}/accept-invite?token={token}`
     - Note: "This invitation expires in 7 days"
     - Minimal dark-branded design matching DDT aesthetic

3. Update `src/server/routers/staff.ts` `invite` procedure:
   - After creating invitation row, call `sendInvitationEmail({ to: email, labName, inviterName, role, token })`
   - If Resend fails: log error but don't fail the mutation (invitation is still valid)

4. Create `src/lib/email/templates/notification.tsx`:
   - Generic notification email template for: task assigned, proof failed
   - Used when in-app notification is created for these types
   - Update `src/lib/notifications/send.ts` to optionally send email for `task_assigned` and `proof_failed` types

**Expected Output:**
- Invitation email sent on staff invite
- Email contains correct accept link with token
- Email failures don't break the invitation flow
- Notification emails sent for task assignment and proof failures

**File Targets:**
- `src/lib/email/resend.ts`
- `src/lib/email/templates/invitation.tsx`
- `src/lib/email/templates/notification.tsx`
- `src/server/routers/staff.ts` (updated)
- `src/lib/notifications/send.ts` (updated)

**Dependencies:** STEP 19, STEP 17

**→ After this step: /review**

---

# ═════════════════════════════════════════
# BLOCK G — PERFORMANCE & PDF (Steps 21–23)
# ═════════════════════════════════════════

---

## [STEP 21] — Performance tRPC Router

**Context:**
Staff management is complete. Now we build the efficiency scoring and monthly aggregation engine — the flagship differentiator.

**Task:**
Create `src/server/routers/performance.ts`:

1. **`monthly`** (managerProcedure, query):
   - Input: `{ month: string (YYYY-MM), staffId?: string }`
   - For each staff member (or specific staff if filtered):
     - Count `site_visits` in the month
     - Count `project_stage_assignments` completed in the month (per stage type)
     - Sum total stages completed
     - Calculate average completion time per stage (completed_at - started_at) in hours
     - Count `proof_reviews` where result = 'fail' AND report_handler_id = staff.id in the month
     - Call `calculateEfficiencyScore()` from `src/lib/efficiency.ts`
   - Return array of `StaffPerformance` objects:
     ```typescript
     {
       userId, fullName, role,
       siteVisits: number,
       stagesCompleted: { analysis: number, sketch: number, report_writing: number },
       totalStages: number,
       avgCompletionHours: number,
       faultCount: number,
       efficiencyScore: number,
       stageDetails: StageDetail[]  // individual completed stages with timestamps
     }
     ```

2. **`getAllMonths`** (managerProcedure, query):
   - Returns list of months that have any project data for the tenant (for month selector dropdown)

Register in `_app.ts`.

**Expected Output:**
- Monthly aggregation returns correct data for each staff member
- Efficiency scores calculated using formula from PRD section 11
- Works for all staff or a single staff member

**File Targets:**
- `src/server/routers/performance.ts`
- `src/server/routers/_app.ts` (updated)

**Dependencies:** STEP 14, STEP 06

**→ After this step: /review**

---

## [STEP 22] — Performance Page UI

**Context:**
Performance router is ready. Now we build the UI.

**Task:**
1. Create `src/app/(app)/performance/page.tsx`:
   - Server Component rendering `<PerformancePage>`

2. Create `src/components/performance/PerformancePage.tsx` (Client Component):
   - Header: "Performance Reports" + month selector dropdown + "Export PDF" button
   - Month selector: populated from `trpc.performance.getAllMonths` + current month default
   - Staff cards grid (2 columns desktop, 1 column mobile)

3. Create `src/components/performance/StaffPerformanceCard.tsx`:
   - Card per staff member:
     - Header: `<AvatarCircle>` + name + role pill
     - Efficiency score: large circular gauge (0–100, amber fill arc)
     - Stats row: Site Visits | Total Stages | Avg Completion Time | Faults
     - Stage breakdown: Analysis: N | Sketch: N | Report Writing: N
     - Fault count: red badge if any faults, green checkmark if zero
   - "View Details" button opens a drawer with full stage-by-stage breakdown

4. Create `src/components/performance/ScoreGauge.tsx`:
   - SVG circular arc gauge showing 0–100 score
   - Colour: green (≥80), amber (50–79), red (<50)
   - Animated fill on mount (CSS stroke-dashoffset animation)

**Expected Output:**
- Performance page renders staff cards with correct data
- Month selector changes data
- Score gauge animates correctly
- Stage breakdown visible in card or drawer

**File Targets:**
- `src/app/(app)/performance/page.tsx`
- `src/components/performance/PerformancePage.tsx`
- `src/components/performance/StaffPerformanceCard.tsx`
- `src/components/performance/ScoreGauge.tsx`

**Dependencies:** STEP 21, STEP 08

**→ After this step: /qa**

---

## [STEP 23] — PDF Export (Monthly Performance Report)

**Context:**
Performance UI is complete. Now we build the PDF export — the second flagship differentiator.

**Task:**
1. Create `src/lib/pdf/PerformanceReportPdf.tsx`:
   - React-PDF document component (`@react-pdf/renderer`)
   - Layout:
     - Header: DDT Structure logo text + lab name + "Staff Performance Report" + Month/Year
     - For each staff member:
       - Section header: name + role + efficiency score (large)
       - Table 1: Site Visits (date | project code | client | floors)
       - Table 2: Report Stages (date | project code | stage | started | completed | duration)
       - Table 3: Proof Review Faults (date | project code | reason)
       - Summary row: Total stages | Total site visits | Avg completion | Fault count | Score
     - Footer: "Generated on {date} · DDT Structure · Confidential"
   - Style: dark-on-white for print compatibility; amber accents on headings; JetBrains Mono for NDT codes

2. Create `src/app/api/reports/performance-pdf/route.ts`:
   - Next.js API route (POST)
   - Accepts: `{ month, staffId?, tenantId }` in body
   - Validates JWT from cookie
   - Fetches performance data via Supabase directly (not tRPC)
   - Renders PDF using `@react-pdf/renderer`'s `renderToBuffer()`
   - Returns PDF as response with `Content-Type: application/pdf` and `Content-Disposition: attachment; filename="DDT-Performance-{Month}.pdf"`

3. Wire "Export PDF" button in `PerformancePage.tsx`:
   - POST to `/api/reports/performance-pdf`
   - On response: trigger browser download
   - Show loading spinner on button during generation

**Expected Output:**
- PDF generates without error
- PDF contains correct data for selected month
- All tables present (site visits, stages, faults, summary)
- Download triggers correctly in browser
- File name includes lab name and month

**File Targets:**
- `src/lib/pdf/PerformanceReportPdf.tsx`
- `src/app/api/reports/performance-pdf/route.ts`
- `src/components/performance/PerformancePage.tsx` (updated)

**Dependencies:** STEP 21, STEP 22

**→ After this step: /careful** (API route touches auth + file generation)

---

# ═══════════════════════════════════════
# BLOCK H — MANAGER DASHBOARD (Steps 24–25)
# ═══════════════════════════════════════

---

## [STEP 24] — Manager Dashboard tRPC Queries & Realtime

**Context:**
All data routers are complete. Now we build the manager dashboard — the operations command centre.

**Task:**
1. Add to `src/server/routers/projects.ts`:
   - **`getDashboardData`** (managerProcedure, query):
     - Returns in a single query:
       - Stat counts: active, staff on task, awaiting proof, delivered this month
       - Last 20 active projects (status not `report_delivered`) with stage assignments
       - Staff currently working (in_progress stage assignments with staff names)

2. Create `src/components/dashboard/ManagerDashboard.tsx` (Client Component):
   - Uses `trpc.projects.getDashboardData.useQuery()`
   - 4 `<StatCard>` components in a row
   - `<ProjectTable>` showing active projects (limited to 10, "View All" link)
   - Supabase Realtime subscription:
     ```typescript
     supabase.channel('dashboard')
       .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'projects', filter: `tenant_id=eq.${tenantId}` }, () => {
         utils.projects.getDashboardData.invalidate()
       })
       .subscribe()
     ```
   - When a project status changes: dashboard data refreshes automatically

3. Update `src/app/(app)/dashboard/page.tsx`:
   - Role-split: staff → `<StaffDashboard>`, manager → `<ManagerDashboard>`

**Expected Output:**
- Manager dashboard shows correct stat cards
- Active projects table renders
- When any project status changes (from any user), dashboard refreshes automatically within 2 seconds

**File Targets:**
- `src/server/routers/projects.ts` (updated)
- `src/components/dashboard/ManagerDashboard.tsx`
- `src/app/(app)/dashboard/page.tsx` (updated)

**Dependencies:** STEP 16, STEP 08

**→ After this step: /qa**

---

## [STEP 25] — Lab Settings Page

**Context:**
Dashboard is complete. Now we build lab settings for lab owners to configure their workspace.

**Task:**
1. Create `src/server/routers/settings.ts`:
   - **`getTenant`** (protectedProcedure, query): Returns tenant details
   - **`updateTenant`** (managerProcedure, mutation): Input `{ name, codePrefix }`. Updates tenant name and NDT code prefix. Validates `codePrefix` is 1–3 uppercase letters.

2. Create `src/app/(app)/settings/page.tsx` and `src/components/settings/SettingsPage.tsx`:
   - Section: Lab Information — lab name (editable), NDT code prefix (editable, e.g. "K"), current subscription status (read-only)
   - Section: Danger Zone — "Deactivate Lab" button (lab_owner only), requires typing lab name to confirm
   - Save button calls `trpc.settings.updateTenant`

Register in `_app.ts`.

**Expected Output:**
- Lab name and code prefix editable and saved
- NDT code prefix updates reflected in new project creation
- Deactivate lab requires confirmation

**File Targets:**
- `src/server/routers/settings.ts`
- `src/app/(app)/settings/page.tsx`
- `src/components/settings/SettingsPage.tsx`
- `src/server/routers/_app.ts` (updated)

**Dependencies:** STEP 07

**→ After this step: /review**

---

# ════════════════════════════════════════
# ⟳ CONTEXT REFRESH PROMPT D — After Step 25
# ════════════════════════════════════════

```
DDT Structure — NDT lab SaaS. Building status: ~80% complete.

COMPLETED:
All core features: auth, projects, stages, proof review, site visits, notifications,
search, staff management, invitations (Resend), performance reports, PDF export,
manager dashboard with Realtime, staff task view, lab settings.

REMAINING:
- PWA setup (Steps 26-30): offline-first, Dexie.js, sync queue, install banner
- Super Admin panel (Step 31)
- CI/CD + final polish (Steps 32-33)

PWA REQUIREMENTS:
- App installs to Android/iOS home screen via Web App Manifest
- Staff can start/complete tasks offline (queued in Dexie.js IndexedDB)
- Manager can view last-cached dashboard offline
- Background sync flushes queue on reconnect
- Visible offline banner + sync status indicator in TopBar
```

---

# ══════════════════════════════════
# BLOCK I — PWA & OFFLINE (Steps 26–30)
# ══════════════════════════════════

---

## [STEP 26] — PWA Manifest & Service Worker Setup

**Context:**
All core features are built. Now we add PWA capability — the app installs to home screen and works offline.

**Task:**
1. Configure `next-pwa` in `next.config.ts`:
   ```typescript
   const withPWA = require('next-pwa')({
     dest: 'public',
     register: true,
     skipWaiting: true,
     disable: process.env.NODE_ENV === 'development',
     runtimeCaching: [], // defined in STEP 28
   })
   module.exports = withPWA({ ...nextConfig })
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
3. Create `public/icons/icon-192.png` and `public/icons/icon-512.png`:
   - Generate using an SVG-to-PNG script: DDT monogram on amber `#F59E0B` background, dark `#0C1220` text, rounded corners
   - Script: `src/scripts/generate-icons.ts` using `sharp`:
     ```bash
     npm install -D sharp
     ```
4. Add `<link rel="manifest" href="/manifest.json">` and `<meta name="theme-color" content="#0C1220">` to `app/layout.tsx`.
5. Create `src/components/pwa/InstallBanner.tsx` (Client Component):
   - Listens for `beforeinstallprompt` event
   - Shows a dismissible amber banner: "Install DDT Structure on your device for offline access" + "Install" button
   - "Install" triggers the deferred prompt
   - Dismissed state stored in `localStorage` (outside IndexedDB — simple key)
   - Only shows on mobile and when not already installed

**Expected Output:**
- App passes Lighthouse PWA audit
- Manifest loads correctly
- Install banner appears on mobile browsers
- App icon files exist at correct paths

**File Targets:**
- `next.config.ts`
- `public/manifest.json`
- `public/icons/icon-192.png`
- `public/icons/icon-512.png`
- `src/scripts/generate-icons.ts`
- `src/components/pwa/InstallBanner.tsx`
- `app/layout.tsx` (updated)

**Dependencies:** STEP 01

**→ After this step: /review**

---

## [STEP 27] — Dexie.js Local Database (Offline Store)

**Context:**
Service worker is set up. Now we create the local IndexedDB store that holds cached data and the mutation queue for offline use.

**Task:**
1. Create `src/lib/offline/db.ts`:
   - Initialize Dexie database named `ddt-offline`:
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

2. Define TypeScript types for all cached tables in `src/types/offline.ts`:
   - `CachedProject`, `CachedStageAssignment`, `CachedNotification`
   - `QueuedMutation`: `{ id?: number, type: MutationType, payload: object, createdAt: Date, retryCount: number }`
   - `MutationType`: `'stage.start' | 'stage.complete' | 'project.create' | 'project.updateStatus'`
   - `SyncMeta`: `{ key: string, value: unknown }`

3. Create `src/lib/offline/cache.ts`:
   - `cacheProjects(projects: Project[]): Promise<void>` — bulk puts to `db.projects`
   - `getCachedProjects(): Promise<CachedProject[]>` — returns all cached projects
   - `cacheStageAssignments(stages: StageAssignment[]): Promise<void>`
   - `getMyCachedStages(userId: string): Promise<CachedStageAssignment[]>`
   - `clearCache(): Promise<void>` — wipes all tables (called on sign out)

**Expected Output:**
- Dexie DB initializes without error in browser
- All tables accessible with correct schema
- Cache utilities work for read/write

**File Targets:**
- `src/lib/offline/db.ts`
- `src/types/offline.ts`
- `src/lib/offline/cache.ts`

**Dependencies:** STEP 01

**→ After this step: /review**

---

## [STEP 28] — Offline Sync Queue & Background Sync

**Context:**
Dexie DB is ready. Now we build the mutation queue — the system that saves offline actions and syncs them when connectivity returns.

**Task:**
1. Create `src/lib/offline/queue.ts`:
   - `enqueueMutation(type: MutationType, payload: object): Promise<void>`
     - Adds to `db.mutationQueue`
   - `processQueue(): Promise<{ synced: number, failed: number }>`
     - Reads all items from `db.mutationQueue` ordered by `id ASC`
     - For each item: calls the corresponding tRPC mutation via fetch
     - On success: deletes item from queue
     - On failure: increments `retryCount`; if `retryCount >= 3` marks as permanently failed
     - Returns sync summary
   - `getQueueCount(): Promise<number>` — returns pending item count
   - `getFailedMutations(): Promise<QueuedMutation[]>`

2. Create `src/lib/offline/sync.ts`:
   - `startSyncListener(): void`
     - Adds `window.addEventListener('online', handleOnline)`
     - `handleOnline`: calls `processQueue()`, then shows toast "Synced {n} pending changes"
   - `stopSyncListener(): void`

3. Create Zustand store `src/stores/offline-store.ts`:
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
   - Listen to `online`/`offline` events

4. Update `trpc/client.ts` to intercept mutations that support offline:
   - `stages.start` and `stages.complete`: if offline, call `enqueueMutation()` then do optimistic update locally (update Dexie cache) instead of server call

5. Wire `<SyncIndicator>` (from STEP 08) to `offline-store`:
   - Online + pendingCount = 0: green dot
   - Online + pendingCount > 0: amber dot + "Syncing…"
   - Offline: red dot + "Offline · {n} pending"

6. Wire `<OfflineBanner>` to show/hide based on `isOnline` in store.

7. Update Workbox config in `next.config.ts` `runtimeCaching`:
   - Cache strategy: `NetworkFirst` for API calls with 5s timeout fallback to cache
   - Cache strategy: `CacheFirst` for static assets (fonts, icons)
   - Cache strategy: `StaleWhileRevalidate` for Next.js page data

**Expected Output:**
- Going offline: banner shows, mutations queue to IndexedDB
- Coming online: queue processes, toast shows sync count
- SyncIndicator reflects correct state
- Workbox caching strategies applied

**File Targets:**
- `src/lib/offline/queue.ts`
- `src/lib/offline/sync.ts`
- `src/stores/offline-store.ts`
- `src/lib/trpc/client.ts` (updated)
- `src/components/ui/SyncIndicator.tsx` (updated)
- `src/components/ui/OfflineBanner.tsx` (updated)
- `next.config.ts` (updated)

**Dependencies:** STEP 27, STEP 08

**→ After this step: /careful** (offline logic — test by toggling DevTools Network to Offline)

---

## [STEP 29] — Offline Data Seeding (Cache on Login)

**Context:**
Sync queue is ready. Now we seed the local cache when a user logs in so they have data available offline.

**Task:**
1. Create `src/lib/offline/seed.ts`:
   - `seedOfflineCache(userId: string, tenantId: string, role: UserRole): Promise<void>`
   - Fetches and caches:
     - All active projects (status != `report_delivered`) — store in `db.projects`
     - All stage assignments for current user — store in `db.stageAssignments`
     - Last 20 notifications — store in `db.notifications`
   - Stores last seed timestamp in `db.syncMeta` with key `'lastSeedAt'`
   - Limits: max 200 projects cached, max 50 stage assignments

2. Call `seedOfflineCache()` in two places:
   - After successful login (`src/lib/auth/actions.ts`)
   - In `StaffDashboard.tsx` on mount (for staff who may go offline)

3. Update `StaffDashboard.tsx` and `ManagerDashboard.tsx`:
   - If `isOnline` is false AND Dexie cache has data: render from cache with `<OfflineBanner>`
   - If `isOnline` is true: render from tRPC as normal (and re-seed cache in background)

4. Add sign-out cleanup to `src/lib/auth/actions.ts`:
   - Call `clearCache()` after `supabase.auth.signOut()` to wipe IndexedDB

**Expected Output:**
- After login: IndexedDB populated with current data
- Dashboard renders from cache when offline
- Staff task view renders from cache when offline
- Sign out wipes local cache

**File Targets:**
- `src/lib/offline/seed.ts`
- `src/lib/auth/actions.ts` (updated)
- `src/components/staff/StaffDashboard.tsx` (updated)
- `src/components/dashboard/ManagerDashboard.tsx` (updated)

**Dependencies:** STEP 27, STEP 28

**→ After this step: /qa** (test full offline flow end-to-end)

---

# ════════════════════════════════════════
# BLOCK J — SUPER ADMIN & SETTINGS (Steps 30–31)
# ════════════════════════════════════════

---

## [STEP 30] — Super Admin Panel

**Context:**
PWA is complete. Now we build the super admin panel for platform management.

**Task:**
1. Add to `src/server/routers/admin.ts` (create file):
   - **`listTenants`** (adminProcedure, query): All tenants with user count, project count, subscription status, created date
   - **`getTenantDetail`** (adminProcedure, query): Full tenant details with all users and project stats
   - **`setSubscriptionStatus`** (adminProcedure, mutation): Input `{ tenantId, status }`. Updates tenant subscription_status.
   - **`deactivateTenant`** (adminProcedure, mutation): Sets subscription_status = 'inactive' for the tenant.

2. Create `src/app/(admin)/layout.tsx`:
   - Separate shell for super admin (minimal sidebar, different branding)
   - Gate: redirects to `/dashboard` if role is not `super_admin`

3. Create `src/app/(admin)/admin/page.tsx` and `src/components/admin/AdminPage.tsx`:
   - Tenant table: Lab Name | Slug | Users | Projects | Status chip | Created | Actions
   - Status chip: active = green, trial = amber, inactive = red
   - Actions: View Detail, Change Status, Deactivate
   - Summary row at top: Total Labs | Active Labs | Total Users | Total Projects

Register in `_app.ts`.

**Expected Output:**
- Super admin can see all tenants
- Subscription status changes work
- Non-super-admin users are redirected away

**File Targets:**
- `src/server/routers/admin.ts`
- `src/app/(admin)/layout.tsx`
- `src/app/(admin)/admin/page.tsx`
- `src/components/admin/AdminPage.tsx`
- `src/server/routers/_app.ts` (updated)

**Dependencies:** STEP 04, STEP 05

**→ After this step: /careful** (admin powers — verify role gate is strict)

---

## [STEP 31] — CI/CD Pipeline & Environment Setup

**Context:**
All features are complete. Now we set up the CI/CD pipeline for automated testing and deployment.

**Task:**
1. Create `.github/workflows/ci.yml`:
   ```yaml
   name: CI
   on:
     push:
       branches: [main, staging]
     pull_request:
       branches: [main, staging]
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
     "devCommand": "npm run dev",
     "installCommand": "npm ci",
     "framework": "nextjs"
   }
   ```

3. Update `package.json` scripts:
   ```json
   {
     "dev": "next dev",
     "build": "next build",
     "start": "next start",
     "lint": "next lint",
     "type-check": "tsc --noEmit",
     "db:push": "supabase db push",
     "db:pull": "supabase db pull",
     "db:generate-types": "supabase gen types typescript --local > src/types/database.ts"
   }
   ```

4. Create `README.md` with:
   - Project overview
   - Local development setup steps (env vars, Supabase local setup, npm install, npm run dev)
   - DB migration instructions
   - Deployment instructions (Vercel + Supabase)
   - Environment variables reference

5. Create `src/lib/error-handling.ts`:
   - `handleTRPCError(error: TRPCError): string` — human-readable error messages for toast display
   - Sentry integration placeholder (comment with setup instructions)

**Expected Output:**
- GitHub Actions workflow runs on push/PR
- Type check and lint pass
- Build completes without errors
- README has complete setup instructions

**File Targets:**
- `.github/workflows/ci.yml`
- `vercel.json`
- `package.json` (updated)
- `README.md`
- `src/lib/error-handling.ts`

**Dependencies:** All prior steps

**→ After this step: /ship**

---

# ════════════════════════════════════════
# ⟳ CONTEXT REFRESH PROMPT E — After Step 31
# ════════════════════════════════════════

```
DDT Structure is feature-complete. Final polish steps remaining.

COMPLETED:
- All features: auth, projects, stages, proof review, site visits, notifications,
  search, staff, invitations, performance, PDF export, dashboard, settings
- PWA: manifest, service worker, Dexie offline DB, sync queue, install banner
- Super admin panel
- CI/CD pipeline

REMAINING: Mobile responsive audit (Step 32), E2E smoke tests (Step 33),
and final accessibility pass (Step 34).

CRITICAL FLOWS TO VERIFY:
1. Manager creates project → assigns stages → staff complete → proof passes → delivered
2. Proof fails → fault logged → staff efficiency score reduced
3. Offline: staff completes task offline → comes online → syncs
4. PDF: manager generates monthly performance report → downloads correctly
5. Invite: manager invites staff → email sent → staff accepts → joins lab
```

---

## [STEP 32] — Mobile Responsive Audit

**Context:**
Feature complete. Now we audit and fix all mobile breakpoints.

**Task:**
Review and fix the following components for mobile (375px–430px viewport):

1. **Sidebar → Bottom Tab Bar:**
   - Verify `Sidebar.tsx` collapses to bottom tab bar on `md:` breakpoint
   - Bottom bar: 5 tabs with icons only (Dashboard, Projects, Search, Staff, Performance)
   - Active tab: amber icon
   - Fixed position at bottom, above device safe area

2. **ProjectsTable → Mobile Card Stack:**
   - On mobile (`< md`): replace table with stacked project cards
   - Each card: NDT code + client name + status chip + stage pills
   - Tap to navigate to detail

3. **NewProjectForm:**
   - Single column on mobile (already planned but verify)
   - Date input uses native `<input type="date">`
   - All inputs have 48px min-height for touch

4. **PipelineBar → Vertical on Mobile:**
   - On mobile: stages stack vertically instead of horizontal row
   - Each stage: full-width card

5. **StaffPerformanceCard:**
   - Single column on mobile
   - Score gauge centered with stats below

6. **All modals:**
   - Full-screen bottom sheet on mobile instead of centered dialog
   - Drag to dismiss
   - Use shadcn `<Drawer>` component for mobile modals

7. **Touch targets:**
   - All buttons: minimum 44px height
   - All interactive rows: minimum 48px height
   - Notification panel: full-screen on mobile

**Expected Output:**
- All pages usable on 375px viewport
- No horizontal scroll on any page
- All touch targets ≥ 44px
- Modals are bottom sheets on mobile

**File Targets:** (Multiple components updated — document each changed file)

**Dependencies:** All feature steps

**→ After this step: /qa** (test on Chrome DevTools mobile viewport + actual Android device if available)

---

## [STEP 33] — Seed Data & Smoke Test Script

**Context:**
Mobile audit complete. Final step: create realistic seed data and a smoke test checklist.

**Task:**
1. Create `supabase/seed.sql`:
   - Creates 1 test tenant: "StructoLab Lagos", slug "structolab-lagos", code prefix "K"
   - Creates 5 users: 1 lab_owner, 1 ops_manager, 3 staff
   - Creates 15 projects in various statuses (covering all 9 statuses)
   - Creates stage assignments, site visits, proof reviews, notifications
   - All users use password: `TestPass123!` for local dev

2. Create `src/scripts/seed-test-data.ts`:
   - TypeScript version of seed for programmatic use
   - `npm run seed` script alias

3. Create `SMOKE_TEST.md`:
   ```markdown
   # DDT Structure Smoke Test Checklist

   ## Auth
   - [ ] Login with valid credentials → redirected to dashboard
   - [ ] Login with invalid credentials → error shown
   - [ ] Invite staff → email received → password set → staff can login
   - [ ] Sign out → redirected to login

   ## Project Workflow (Happy Path)
   - [ ] Create project → NDT code auto-generated
   - [ ] Assign analysis stage to staff
   - [ ] Staff receives notification
   - [ ] Staff starts task → timestamp recorded
   - [ ] Staff completes task → status advances to analysis_done
   - [ ] Assign sketch and report writing stages
   - [ ] All stages complete → status = report_done
   - [ ] Manager submits proof → Pass → status = report_uploaded
   - [ ] Manager marks verified → delivered

   ## Proof Failure Flow
   - [ ] Manager submits proof → Fail → status returns to wip
   - [ ] Staff efficiency score has fault recorded
   - [ ] Staff receives failure notification

   ## Search
   - [ ] Search by client name → correct results
   - [ ] Search by NDT code → exact match returned
   - [ ] Search by address → results shown

   ## Performance PDF
   - [ ] Navigate to Performance → select current month
   - [ ] All staff cards show correct stats
   - [ ] Export PDF → file downloads with correct data

   ## Offline
   - [ ] Open app → go offline (DevTools Network: Offline)
   - [ ] Offline banner appears
   - [ ] Staff task view shows cached tasks
   - [ ] Complete a task offline → added to sync queue
   - [ ] Go back online → sync triggers → task synced

   ## PWA
   - [ ] Chrome mobile shows "Add to Home Screen" prompt
   - [ ] App installs and opens in standalone mode
   - [ ] Theme colour matches DDT dark theme
   ```

**Expected Output:**
- `seed.sql` creates realistic test data in one command
- `SMOKE_TEST.md` covers all critical paths
- `npm run seed` works

**File Targets:**
- `supabase/seed.sql`
- `src/scripts/seed-test-data.ts`
- `SMOKE_TEST.md`
- `package.json` (add `seed` script)

**Dependencies:** STEP 03

**→ After this step: /ship** — then run `/land-and-deploy` for production push

---

# ══════════════════════
# BUILD COMPLETE
# ══════════════════════

## Delivery Summary

| Block | Steps | What Was Built |
|---|---|---|
| A — Foundation | 01–06 | Next.js, design system, Supabase, tRPC, auth, shared types |
| B — App Shell | 07–08 | Sidebar, TopBar, base UI components |
| C — Projects | 09–12 | Projects router, list, new form, detail + pipeline |
| D — Workflow | 13–16 | Stages router, proof review, site visits, staff task view |
| E — Notifications + Search | 17–18 | Notifications bell + Realtime, search page |
| F — Staff | 19–20 | Staff management, invitations, Resend emails |
| G — Performance | 21–23 | Efficiency scoring, performance page, PDF export |
| H — Dashboard | 24–25 | Manager dashboard + Realtime, lab settings |
| I — PWA | 26–29 | Manifest, Dexie offline DB, sync queue, cache seeding |
| J — Admin + CI | 30–31 | Super admin panel, GitHub Actions CI, README |
| K — Polish | 32–33 | Mobile responsive audit, seed data, smoke tests |

**Total: 33 build steps + 5 context refresh prompts**
