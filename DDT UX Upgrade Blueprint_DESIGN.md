# DESIGN.md — DDT Structure

## Aesthetic Metamorphosis: The Two-Act Narrative

DDT Structure splits its visual system into two distinct operational paradigms tied together by a single, cohesive color thread. 

*   **Part 1: The Gateway Experience (Marketing, Registration, Authentication):** Focused on high-conversion clarity, human accessibility, and trust[cite: 1, 2]. It uses an approachable, futuristic, and minimalist layout with expansive whitespace, large rounded shapes, and organic image-driven palettes.
*   **Part 2: The Product Core (Operations Command Center, Pipelines, JIT Modals):** Focused on raw data utility, extreme information density, and authoritative precision[cite: 2]. It preserves the dark, glare-free workspace built for multi-hour daily deployment on mid-range devices[cite: 2].

---

## Part 1: The Gateway Experience Spec

### 1. Creative Direction
*   **Mood:** Futuristic, confident, and distinctly human.
*   **Tone:** Highly professional yet deeply approachable—crafted to convey structural tech innovation without alienating non-technical lab stakeholders.
*   **Style Foundations:** Large sweeping rounded rectangles, pill-shaped action boundaries, and layered parallax depths.

### 2. Image Asset Generation Specification
The foundational visual asset for Part 1 is an AI-generated hero background graphic. 
*   **Prompt Architecture:** 
    > *A minimalist, wide-angle cinematic shot dominated by a vast, vibrant sky-blue atmosphere transitioning smoothly downwards into crisp, bright-white cumulus clouds blanketed along the lower third of the frame. Nestled deep on the far horizon line, barely breaking through the soft cloud layer, stands the subtle, highly detailed silhouette of a modern glass-and-steel high-rise structural tower. Crisp lighting, volumetric depth, clean tech aesthetic, architectural scale, high contrast.*
*   **UX Execution Strategy:** The high-rise structure must remain exceptionally far away in the composition to prevent visual clutter, preserving generous open whitespace for typography overlays[cite: 1].

### 3. Color Palette Strategy (The 60-30-10 Rhythm)
The gateway palette adapts dynamically to the dominant colors extracted from the primary hero asset[cite: 2]:
*   **Primary (60%):** Vibrant, clean Sky Blue canvas (`#3B82F6` baseline or image matching)—establishes the open, trustworthy atmospheric baseline.
*   **Secondary (30%):** Neutral whites and balanced grays—used for content backing plates, clean borders, and text readability layers.
*   **Accent (10%):** High-visibility, hyper-vibrant Neon Lime Green (`#A3E635` baseline)—reserved strictly for primary call-to-actions, conversion vectors, and interactive focus indicators.

### 4. Layout, Grid & Typography Scale
*   **Grid System:** 12-column responsive grid with a 1200px maximum container width.
*   **Spacing scale:** 4px base structural unit (4, 8, 16, 24, 32, 48, 64).
*   **Container Padding:** 64px desktop padding, 32px tablet, 16px mobile.
*   **Section Rhythm:** All vertical block pacing follows a strict 8× multiplier pattern for balanced asymmetry.
*   **Core Font:** `Inter` or modern geometric equivalents (e.g., `Satoshi`, `Space Grotesk`).
    *   *Headline Layout:* Inter Bold / 64px
    *   *Subtext Layout:* Inter Regular / 20px
    *   *Body / Form Input Text:* Inter Regular / 14px

### 5. Specialized Component System (Part 1)
*   **Hero Container:** Includes an immersive layout framing the main headline, description subtext, dual action-driven CTAs (large, pill-shaped, enhanced with directional micro-icons), and the parallax-mapped hero asset.
*   **Feature Rectangles:** Content cards engineered with a wide **24px rounded corner radius**. They merge short explanatory text snippets with structural images. Hovering triggers an intentional elevation shift via an isolated drop shadow (`0 8px 24px`) moving smoothly over a **200ms ease-in-out** transition.
*   **The Split Auth Form (`/login`, `/register`, `/accept-invite`):** A geometric 50/50 split-screen structure[cite: 1]. The left frame locks onto a domain-aligned AI structural graphic; the right frame handles data entry over clean inputs featuring a softer **12px rounded radius**. Submit inputs are enhanced with micro-animations that shift icons outward on click or hover.

---

## Part 2: The Product Core Spec

Once a user passes the gates of authentication, the application naturally compresses into a dense, high-efficiency operational command center[cite: 2].

### 1. Visual Language Tokens
The baseline environment retains its authoritative, dark "Industrial Precision" palette, but strips away industrial amber (`#F59E0B`) entirely[cite: 2]. It re-allocates the color tokens discovered in Part 1 to establish a cohesive brand ecosystem[cite: 2].

| Token Variable | Assigned Hex Value | Workspace Usage Mapping |
| --- | --- | --- |
| `--color-bg-primary` | `#0C1220` | Base page shell canvas[cite: 2] |
| `--color-bg-surface` | `#141C2E` | Dense workspace cards, tables, fixed sidebars[cite: 2] |
| `--color-bg-raised` | `#1C2640` | JIT configuration modals, focus components[cite: 2] |
| `--color-bg-input` | `#1A2235` | Technical form text fields, inset table grid rows[cite: 2] |
| `--color-border` | `#2A3550` | Standard low-contrast component borders[cite: 2] |
| `--color-border-strong` | `#3A4A6A` | High-visibility structural delineation borders[cite: 2] |
| `--color-text-primary` | `#E8EAF0` | Standard headings, bold table cell readouts[cite: 2] |
| `--color-text-secondary` | `#8892A4` | Technical data labels, muted status tracking values[cite: 2] |
| **`--color-core-brand`** | `var(--part1-primary)` | Primary tracking accent, code text, standard active highlights (Sky Blue alternative)[cite: 2] |
| **`--color-core-tactical`** | `var(--part1-accent)` | High-intensity operational alerts, glowing active pipeline stages, JIT call-to-actions (Neon Lime alternative)[cite: 1, 2] |

### 2. Upgraded Status Chip Blueprint
Status badges use low-contrast background tints balanced against high-contrast text strings to maintain visibility across complex data matrices[cite: 2]:

| Operational State | Background Color | Text Color | Border Tint |
| --- | --- | --- | --- |
| **Not Started** | `#1A2235` | `#8892A4` | `#2A3550` |
| **WIP (Work in Progress)** | `#0D1F3C` | `#60A5FA` | `#1E3A5F` |
| **Analysis Done** | `#0D2B2B` | `#2DD4BF` | `#0F4040` |
| **Sketch Done** | `#1A1040` | `#A78BFA` | `#2D1F6E` |
| **Report Done** | `#2A1F05` | `--color-core-brand` | `#4A3510` |
| **Proof Ready** | `#2A1505` | `#FB923C` | `#4A2A10` |
| **Report Uploaded** | `#10203A` | `#818CF8` | `#1E2F5A` |
| **Report Verified** | `#0A2E1A` | `#34D399` | `#0F4A2A` |
| **Report Delivered** | `#062210` | `#10B981` | `#0A3A1C` |
| **Proof Failed (Fault Logged)** | `#2E0A0A` | `#F87171` | `#4A1010` |

### 3. Typography Integration
To eliminate design disconnect, typography bridges the two halves of the system:
*   `Inter` serves as the unifying baseline font for all body copy, dense data tables, operational input labels, and paragraph fields across Part 1 and Part 2.
*   `Syne` is reserved strictly as a geometric display font for large page header labels and high-impact metric counters (Syne 700 / 32px) on the core dashboard row[cite: 2].
*   `JetBrains Mono` handles NDT alphanumeric tracking strings (e.g., `K013`) and system-generated timestamps to emphasize computational precision[cite: 1, 2].

### 4. Spacing, Scaling & Component Proportions
The spacious layouts of Part 1 compress into a high-density footprint built to maximize structural screen real estate[cite: 2]:
*   **Component Boundary Radius:** Corner radiuses tighten cleanly from 24px down to an industrial **8px radius** for standard application blocks, **12px radius** for command cards, and **16px radius** for focused overlay modals[cite: 2].
*   **Grid Gaps:** Structured tightly around a standard fluid 16px component step gap[cite: 2].
*   **Navigation Sidebar:** Formatted to a fixed 240px width tracking layout[cite: 2]. Displays the active workspace company name via `Syne` 600, applies an animated left-border highlight in `--color-core-tactical` to identify active locations, and collapses smoothly into an icon-only format when rendered on smaller mobile device views[cite: 2].

### 5. Interactive Workspace Context States
*   **The Connected Empty State ("Awaiting Orders"):** If a field technician or report writer loads their profile queue and the database returns zero assigned tasks[cite: 1], the empty container switches to a live status module. It displays an animated connection banner colored to track the WIP palette (Background: `#0D1F3C`, Text: `#60A5FA`) featuring a bold readout: `🕒 System Status: Active & Connected`[cite: 1, 2]. The layout explicitly confirms that the local application is securely synchronized with the central laboratory command tower and will trigger real-time push alerts as soon as an inspection sequence is routed to their ID[cite: 1].
*   **The JIT (Just-In-Time) Configuration Modal:** This modal uses an overlay window formatted to a 16px corner radius using `--color-bg-raised` (`#1C2640`)[cite: 2]. It blocks out the background workspace view when a new Lab Owner clicks the primary project creation button for the first time[cite: 1]. It features a bold configuration query in `Syne` 600, presenting their automatically mapped unique tracking sequence code (e.g., `V001`)[cite: 1] in large `JetBrains Mono` type highlighted in the sharp `--color-core-brand` token[cite: 2].

---

## Technical Performance Guardrails (Lagos Edge Network Deployment)

Because the software must run reliably on mid-range Android hardware over volatile networks in Lagos, the frontend build enforces strict technical rules[cite: 2]:
1.  **Image Asset Optimization:** All AI-generated imagery and support graphics utilized in Part 1 must be encoded using optimized Next.js wrapper components (`next/image`) targeting next-gen compression formats (`WebP`/`AVIF`) with explicit layout dimensional constraints to completely prevent layout shifts.
2.  **Hardware-Accelerated Animation Layers:** Heavy parallax scroll tracking and container fade-in states in Part 1 must run exclusively on CSS-driven transform layers (`transform: translate3d`) to bypass costly JavaScript engine calculation loops, ensuring smooth animations on lower-powered mobile GPUs[cite: 2].
3.  **Local Context Persistence:** To power the "Remember Workspace" authentication layout, successful session handshakes cache the tenant name, user full name, and avatar source locally. On subsequent visits, the login layout instantly pulls this metadata from local storage, shifting the view to the cached portal card and requesting only the user password string—reducing data payload requirements by 50% on initialization.