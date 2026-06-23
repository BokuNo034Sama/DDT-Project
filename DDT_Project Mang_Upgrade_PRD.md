# Product Requirement Document (PRD) — DDT Project Management Upgrade

**Feature Title:** Site Visit Log \& Inspection Workflow  
**Author:** Senior Product Manager \& Senior Software Engineer  
**Status:** Ready for Implementation  
**Target Build Agent:** Antigravity

\---

## \## Executive Summary \& Objectives

The DDT project management Upgrade introduces a structured, closed-loop workflow for physical site inspections. The objective is to bridge communication between office-based Project Managers and field-based Team Leads. This feature enables managers to provision contextual operational instructions, enforces mandatory field reporting from technicians, and structures image evidence gathering into clear architectural profiles.

\---

## \## User Personas \& Core Workflows

### 1\. Project Manager (Office Console)

* **Need:** Ability to attach contextual operational instructions or reminders to a scheduled site visit.
* **Need:** Complete visibility into the field data, compressed technical notes, and classified site imagery captured by the team lead once execution is finalized.

### 2\. Team Lead (Mobile Web PWA)

* **Need:** Clear access to manager reminders directly on-site.
* **Need:** A highly optimized, low-friction mobile interface to record compulsory field observation text and cleanly upload up to 6 classified structural images.

\---

## \## Technical Architecture \& Data Requirements

### \### 1. Database Schema Additions (Supabase SQL)

Antigravity must execute the following migration to provision the inspection logging engine:

```sql
CREATE TABLE site\\\_visit\\\_logs (
  id UUID PRIMARY KEY DEFAULT gen\\\_random\\\_uuid(),
  project\\\_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  team\\\_lead\\\_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  manager\\\_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Manager Input Layer
  manager\\\_instruction\\\_note TEXT,
  
  -- Team Lead Submission Layer
  field\\\_notes TEXT NOT NULL,
  images JSONB NOT NULL DEFAULT '\\\[]'::jsonb, -- Array of objects: { url: string, type: string, capturedAt: string }
  
  -- Lifecycle Tracking States
  status VARCHAR(20) NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'completed')),
  assigned\\\_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  completed\\\_at TIMESTAMP WITH TIME ZONE,
  
  created\\\_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated\\\_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Optimization Indices
CREATE INDEX idx\\\_site\\\_visit\\\_logs\\\_project\\\_id ON site\\\_visit\\\_logs(project\\\_id);
CREATE INDEX idx\\\_site\\\_visit\\\_logs\\\_status ON site\\\_visit\\\_logs(status);
```

### \### 2. Backend API Layer (tRPC Routers)

Modify `src/server/routers/` to export the following transactional endpoints:

* `assignVisitInstruction`: Updates `manager\\\_instruction\\\_note` and dispatches an automated Web Push payload to the assigned Team Lead.
* `submitInspectionLog`: Mutates the row state to `completed`, captures the current timestamp for `completed\\\_at`, writes the structural `field\\\_notes`, and accepts the structured asset JSON array.
* `getInspectionDataByProject`: Queries and aggregates all recorded historical logs mapped to a distinct project ID for the manager's data grid.

\---

## \## Functional Specifications \& User Interface (UX) Requirements

### \### 1. Manager Project Panel Additions

* **Instruction Dispatcher:** Add an optional text area input block to the Project Assignment card allowing managers to outline reminders.
* **Comprehensive Log Reel UI:** Add a dedicated **"Site Inspections"** tab to the Project Overview section. When active, it displays a timeline card containing:

  * The submitting Team Lead's profile data, execution timestamp, and full `field\\\_notes` prose.
  * A clean grid displaying up to 6 uploaded images, with each image overlaid with an explicit badge denoting its classification type.

### \### 2. Team Lead Mobile Submission Form (PWA)

* **Instruction Toast:** If a `manager\\\_instruction\\\_note` is present, render it prominently at the top of the completion screen as an alert callout box.
* **Compulsory Observations Input:** A mandatory text input field for technical findings. The form submission CTA must remain programmatically disabled until text is typed into this container.
* **Classified Image Grid Matrix:** Present exactly 6 structured media upload modules. To maximize system performance on cellular connections, the client interface must run a compression process on all files down to a maximum layout dimension of 1200px before pushing the binary package to storage.

\---

## \## Structured UX Writing \& Copy Guidelines

All text must be presented in a crisp, clean, and highly professional tone suited for enterprise operations.

### 1\. Field Observations Copy

* **Field Label:** Technical Field Observations
* **Placeholder Text:** Enter comprehensive technical details regarding structural observations, deviations, and test metrics gathered during site presence.
* **Validation Message:** Technical observations are mandatory to complete the site logging sequence.

### 2\. Photo Grid Matrix Requirements

The application must present 6 explicit upload placeholders mapped directly to these programmatic structural slots:

|Target Slot|Label Hierarchy|Helper Microcopy Specification|Requirement|
|-|-|-|-|
|**Slot 1**|Front View|Capture the primary perimeter entrance or main structural facade cleanly.|**Mandatory**|
|**Slot 2**|Overview|Step back to secure a wide-angle reference composition of the active workspace.|**Mandatory**|
|**Slot 3**|Test Process|Photograph the equipment configuration, NDT calibration setups, or active testing.|**Mandatory**|
|**Slot 4**|Group Picture|Secure an operational group image of onsite personnel for compliance verification.|**Mandatory**|
|**Slot 5**|Additional Evidence A|Supplementary detail shot documenting structural variances or technical anomalies.|Optional|
|**Slot 6**|Additional Evidence B|Supplementary detail shot documenting structural variances or technical anomalies.|Optional|

### 3\. Submission Confirmation

* **Action Button Text:** Finalize Log \& Mark Site Completed
* **Confirmation Modal Header:** Submit Inspection Log?
* **Confirmation Modal Body:** This will lock the inspection entry, flag the project status as completed, and transmit full compliance data back to the office dashboard. This action cannot be undone.

\---

## \## Acceptance Criteria

1. **Schema Integrity:** The `site\\\_visit\\\_logs` table correctly handles cascade deletions on the project level and enforces non-nullable constraints on `field\\\_notes` during completion.
2. **Form Validation:** The submission execution pipeline stays completely disabled until the validation rules for the notes and the 4 primary mandatory images are met.
3. **Data Uniformity:** Image payloads are parsed, compressed, and committed to the database as a structured JSONB matrix mapping URLs to specific profile view types.
4. **Dashboard Synchronization:** Managers can instantly view notes and expand images into an overlaid media viewer directly from the desktop panel layout.

