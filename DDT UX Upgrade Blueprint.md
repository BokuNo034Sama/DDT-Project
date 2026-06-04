# DDT UX Upgrade Blueprint
**Version:** 1.0  
**Target:** Interactive Onboarding & Time-to-Value (TTV) Optimization  
**Focus Areas:** Lab Owner Sandbox, Staff Role-Priming, Retentive Gateway  

---

## 1. Core Architecture Strategy
The objective of this upgrade is to eliminate the "Cold Start Problem" for new users across all permission tiers. By transitioning from purely administrative forms to progressive disclosure patterns, the platform maximizes engagement and dramatically lowers friction during initial product exposure.

---

## 2. Lab Owner Journey: The Interactive Sandbox Setup
Instead of dropping a newly registered Lab Owner into an empty dashboard with zero active metrics, the platform will auto-generate an interactive onboarding sandbox.

### 2.1 Registration Flow Restructuring (`/register`)
1. **Minimalist Initialization:** Request only `Company Name`, `Work Email`, and `Password`.
2. **Post-Registration Intercept:** Immediately pass execution context to a client-side layout that injects a sample data-set into the temporary view layer.

### 2.2 Seeded Sandbox Configuration
The application database hook or frontend layer will mock a dummy project to demonstrate the operational pipeline immediately:
* **Project Name:** `[Sample] 12-Story Office Complex (Lekki)`
* **Status:** `wip`
* **Current Active Stage:** `Analysis`

### 2.3 Just-In-Time (JIT) Administrative Prompts
* Do not request the tenant-wide `code_prefix` during registration.
* **Trigger Event:** When the user clicks the primary **"Create Project"** button for the first time, open a contextual modal:
  > *"We noticed your lab name is Vanguard Materials Testing. We suggest initializing your automated engineering codes with prefix **'V'** (e.g., V001). Would you like to accept this prefix or modify it?"*

---

## 3. Staff & Field Technician Journey: Role-Priming
To prevent the "Dead End" experience where an invited team member logs into an empty workspace, the `/accept-invite` completion route will intercept the user with a tailored introduction card explaining their impact on operations.

### 3.1 Onboarding Steps (`/accept-invite/success`)
After the user sets their password, route them to a specialized role screen before loading the global dashboard layout.

#### Scenario A: The User Role is `staff` (Field Tech / Report Writer)
* **Visual Anchor:** Display an operational scorecard overview.
* **Copywriting Structure:** > *"Welcome to the team! Your core focus in this workspace is moving assigned structural engineering reviews cleanly through the pipeline from 'WIP' to 'Proof Ready'. Completing reviews within our target 24-hour benchmark boosts your automated monthly Speed score. Avoiding report rejections maintains a flawless Quality score."*

#### Scenario B: The User Role is `ops_manager`
* **Visual Anchor:** Display a bottleneck monitor overview.
* **Copywriting Structure:**
  > *"Welcome to the operations deck. You are the controller of the lab pipeline. Your workspace is configured to highlight bottlenecked testing stages, process incoming project registrations, and manage the final quality control / proofreading loop before reports ship to LSMTL channels."*

### 3.2 Dynamic Awaiting-Orders State
If the user lands on `/dashboard` and the database returns zero assigned tasks for their ID, replace the blank state with a live-synchronized connection card: