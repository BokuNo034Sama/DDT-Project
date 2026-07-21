# PROMPT PACK — V4 REPORT BOT
**Feature Name:** Report Bot
**Appended to:** DDT Structure Prompt Pack (after Step 42)
**Steps:** V4-01 through V4-07
**Prerequisite:** All Steps 01–42 complete. V3 Proofread Bot working.

---

## WHAT REPORT BOT DOES

Report Bot is an AI agent that compiles a near-complete LSMTL-format NDT structural
integrity report draft from site data, scientific observation (Excel), and rebar
measurements. The staff then completes the Visual Inspection section and adds photos,
sketches, and signatures. The completed draft is sent to Proofread Bot (V3) before
manager approval.

## WORKFLOW

```
Manager opens Report Bot on project detail page
              ↓
Concrete grade modal: "Was a structural drawing provided?"
  YES → "What is the concrete design grade?" (e.g. C25, C30)
  NO  → Default assumed grade = 25N/mm²
              ↓
Staff uploads: Excel analysis file (.xlsx)
              ↓
Staff fills rebar measurements form:
  Column: Main bar (mm), Links (mm), Spacing (mm), Cover depth (mm)
  Beam:   Main bar (mm), Links (mm), Spacing (mm), Cover depth (mm)
  Slab:   Main bar (mm), Links (mm), Spacing (mm), Cover depth (mm)
              ↓
Report Bot generates near-complete .docx draft:
  ✅ Front page (from project data)
  ✅ Executive Summary (template)
  ✅ Introduction (template + site data)
  ✅ Purpose of Investigation (fixed boilerplate)
  ✅ Literature Review (fixed boilerplate + staff names)
  ✅ Field Work (fixed boilerplate + site date)
  ⬜ Visual Test → [PLACEHOLDER — STAFF TO COMPLETE]
  ✅ Methodology (fixed boilerplate)
  ✅ Rebar Assessment (fixed boilerplate)
  ✅ Rebar Assessment Table (from form input)
  ✅ Analysis of Test Results (from Excel data)
  ✅ Recommendation (rule-based, matches Proofread Bot templates)
  ✅ Conclusion (template-based)
  ⬜ Appendix → [PLACEHOLDERS for sketch, photos, Google Maps]
              ↓
Draft saved to Supabase + downloadable as .docx
              ↓
Staff edits Visual Inspection + adds sketch/photos manually in Word
              ↓
Staff re-uploads completed report → Manager sends to Proofread Bot
```

---

## FIXED CONTENT (AI uses exactly as written — never paraphrases)

### PURPOSE OF INVESTIGATION (always identical)
```
The purpose of the investigation is to:
1. Determine the stability and integrity of structural members (i.e., column, beam,
   slab et cetera) of the existing building structure. See pictures in the Appendix
   (photographs of the building).
2. Determine the existing concrete strength of the building structure with respect to
   BS CODE 8110: Part 1 1997.
3. Provide engineering advice and/or remedial solutions to avert any accident/disaster.
4. Offer further actionable recommendation(s) based on the visual test conducted.
```

### LITERATURE REVIEW BODY (always identical)
```
The Ultrasonic Pulse Velocity (UPV) testing is a widely utilized non-destructive testing
(NDT) technique employed to evaluate the quality, uniformity, and integrity of concrete
and other construction materials. The method operates by measuring the time taken for
ultrasonic waves to travel through a material, providing insights into its density,
elasticity, and potential internal defects.

The UPV test operates on the principle that the velocity of ultrasonic waves is directly
influenced by the material's elastic properties and density. Higher velocities typically
indicate denser and more homogenous materials, while lower velocities may signify cracks,
voids, or other anomalies. Researchers such as Malhotra and Carino (2004) have extensively
detailed the theoretical framework underpinning UPV testing, linking wave propagation
characteristics to material properties.

UPV testing has broad applications in the construction and infrastructure sectors. Studies
by Al-Amoudi et al. (2007) have demonstrated its efficacy in assessing the compressive
strength of concrete, identifying regions of potential structural weakness. Moreover, UPV
has been employed to monitor the progression of micro cracks and assess the impact of
environmental factors, such as freeze-thaw cycles and chloride ingress (Neville, 2011).
Emerging research highlights its application in 3D printing technologies and sustainable
materials, enabling rapid quality assessments (Zhang et al., 2020).

Various international standards govern the determination of ultrasonic pulse velocity in
concrete, ensuring consistency and reliability in testing procedures. The most widely
recognized standard is ASTM C597 "Standard Test Method for Pulse Velocity Through
Concrete," which outlines the methodology for conducting UPV tests, including equipment
requirements, specimen preparation, and data interpretation. Another significant standard
is BS EN 12504-4:2004, which provides guidelines for assessing the uniformity and
estimating the strength of concrete using ultrasonic pulse velocity. These standards
emphasize the importance of proper calibration, surface preparation, and consistent
testing conditions to obtain accurate results.

References
Malhotra, V. M., & Carino, N. J. (2004). Handbook on Nondestructive Testing of Concrete.
CRC Press.
Al-Amoudi, O. S. B., Maslehuddin, M., & Shameem, M. (2007). Role of UPV in assessing
concrete quality. Cement and Concrete Research, 37(6), 995-1003.
Neville, A. M. (2011). Properties of Concrete. Pearson Education Limited.
ASTM C597-16. Standard Test Method for Pulse Velocity Through Concrete. ASTM International.
BS EN 12504-4:2004. Testing Concrete – Part 4: Determination of Ultrasonic Pulse Velocity.
British Standards Institution.
Zhang, H., Liu, Q., & Xu, Y. (2020). Application of UPV in 3D printed concrete.
Materials and Structures, 53(4), 1-12.
```

### METHODOLOGY SECTION (always identical)
```
NON-DESTRUCTIVE CONCRETE STRENGTH AND REBAR DETERMINATION.

This test is determined by using the Portable Ultrasonic Non-Destructive Digital
Indicating Tester (PUNDIT) and Profoscope. Non-Destructive, as the name implies means
that the materials being tested are not damaged during the test.

In the Non-Destructive Test, some properties of concrete and Rebar (the reinforcing steel
used as rod in concrete to give additional strength) were measured. These were used to
estimate the strength of the concrete, its elastic behavior and durability, hence
determining the integrity of the structural member.

CONCRETE
Pulse velocity measurements made on concrete structures are used for quality control
purposes. In comparison with mechanical tests on control samples such as cubes or
cylinders, pulse velocity measurements have the advantage that they relate directly to
the concrete in the structure rather than to samples, which may not be always truly
representative of the concrete in situ.

A pulse of longitudinal vibrations is produced by an electro-acoustical transducer,
which is held in contact with one surface of the concrete under test. When the pulse
generated is transmitted into concrete from the transducer using a certified coupling
gel material such as (couplant or cellulose paste) it undergoes multiple reflections as
the boundaries of the different materials phases within the concrete.

A complex system of stress waves develops, which includes both longitudinal and shear
waves, and propagates through the concrete. The first waves to reach the receiving
transducer are the longitudinal waves, which are converted into an electrical signal by
a second transducer.

Electronic timing circuits enable the transit time (T) of the pulse to be measured.
This test is conducted to assess the quality & integrity of concrete by passing ultrasound
waves through the specimen under test.

The Pundit test equipment can also determine the followings:
- The homogeneity of the concrete,
- The presence of cracks, voids and other imperfections,
- Changes in the structure of the concrete which may occur with time,
- The quality of the concrete in relation to standard requirements,
- The quality of one element of concrete in relation to another, and
- The values of dynamic elastic modulus of the concrete
```

### REBAR ASSESSMENT BODY (always identical)
```
During testing, Profoscope was used to check the depth from the face of the concrete to
the top of the reinforcing steel (concrete cover), locate the Rebar's exact position
within the structural member and the Rebar diameter estimated.

In addition, the essence of using the Profoscope was to check for the following:
If the configuration of the Rebar conforms to necessary design and construction standards,
To deduce if the Rebar was placed correctly during casting, which determines the integrity
of the structural members.

NOTE: That this assessment does not cover the reinforcement design strength as we are
not consulted before casting.
```

### FIELD WORK BODY (always identical except date)
```
The field work was carried out on {DAY_ORDINAL} of {MONTH} {YEAR} and was completed on
the same day. Visual test was carried out on the building to ascertain any possible
structural defects (e.g. Cracks, differential settlement, spalling, honeycombs, hogging
and Sagging). This is a vital aspect of non-destructive tests. The Standard Portable
Ultrasonic Non-Destructive Digital Indicating Tester (Pundit) was employed for the
estimation of compressive strength of the hardened concrete on the structural elements.
Profoscope was used to locate the position of reinforcement bars (Rebar).

It is important to note that during the test some factors were taken into consideration,
which may impact the result of the compressive strength of the structural members and
Rebar. These are as follows:
- Surface conditions and moisture content of the existing concrete
- Path length, shape and size of the concrete member
- Temperature of concrete
- Concrete stress
- Effect of reinforcing bars

The scope of the work done are as follows:
1. Initial visual test was carried out on the building structure tested (i.e column,
   beam, slab, wall etc.)
2. Calibration of the Portable Ultrasonic Non-Destructive Digital Indicating Tester
   (PUNDIT) was done before commencing the test
3. Profoscope, Rebar locator was used to locate the reinforcement position, concrete
   cover measurement and Rebar size embedded in the structural members.
4. Indirect method was employed using 120mm spacing then, three (3) test points were
   randomly selected to get a good representation and result on each structural member,
   according to BS EN12504-4:2004, for testing concrete.
```

### RECOMMENDATION TEMPLATES (same as Proofread Bot rules)
```
Template A — Defects present:
"the client was referred to a qualified structural engineer for further evaluation to
provide technical, structural and remedial recommendations, and to assess the building's
suitability for continued use."

Template B — Under construction:
"the client was referred to a qualified structural engineer and other building professionals
for further evaluation to provide technical and structural recommendations, and to assess
the building's suitability for continued use."

Template C — No defects:
"{CLIENT_NAME} was referred to a qualified structural engineer for further evaluation to
provide technical and structural recommendations, and to assess the building's suitability
for continued use."

Template D — General/unclear:
"the client was referred to a qualified structural engineer or other building professionals
for further evaluation to provide technical or structural or remedial recommendations, and
to assess the building's suitability for continued use."
```

---

## EXCEL DATA STRUCTURE

Sheets are named by floor abbreviation:
- `Gf` = Ground Floor
- `FF` = First Floor
- `SF` = Second Floor
- `TF` = Third Floor
- Additional floors follow same pattern

Element ID prefixes:
- `C` = Column (e.g. C1, C2, C3...)
- `B` = Beam (e.g. B1, B2, B3...)
- `S` = Slab (e.g. S1, S2, S3...)
- `SH` = Shear Wall (e.g. SH1, SH2, SH3...)

Each element has 3 trials (A, B, C) with columns:
STRUCTURAL ELEMENT | TRIALS | TRANSMISSION TIME (µs) | PATH LENGTH (mm) |
VELOCITY (Km/s) | EQUIVALENT COMPRESSIVE STRENGTH (E.C.S) | AVERAGE (E.C.S) (N/mm²) | REMARK

All calculations are pre-done in the Excel — the Report Bot reads and reproduces them,
it does NOT recalculate (Proofread Bot handles verification of arithmetic).

---

# ════════════════════════════════════════
# ⟳ CONTEXT REFRESH — V4 Report Bot
# ════════════════════════════════════════

```
PROJECT: DDT Structure — NDT Lab SaaS
FEATURE: V4 Report Bot — AI agent that generates near-complete NDT report drafts

EXISTING SYSTEM:
- Next.js 14, tRPC, Supabase, TypeScript strict
- V3 = Proofread Bot (already built — /api/v3/proofread)
- Projects pipeline ends at: report_done → proof_ready → ...
- Packages already installed: mammoth, docx, @anthropic-ai/sdk, xlsx (SheetJS)
- adminClient pattern established for all DB operations

WHAT REPORT BOT BUILDS:
- New pipeline stage: "Report Bot" appears before "Proofread Bot" stage
- Staff uploads Excel + fills rebar form → AI generates .docx draft
- Draft has placeholder for Visual Inspection section
- Staff completes Visual Inspection in Word, re-uploads
- Manager sends completed report to Proofread Bot

COMPANY DETAILS (hardcoded in all reports):
  Name:    SKAAP CONSULT
  Address: SUITE 202, ALL SEASON'S PLACE, 74 ISHERI ROAD,
           BESIDE FRSC, OJODU BERGER, LAGOS STATE
  LSMTL:   LSMTL/2020/LAB-REG/D/003

CONCRETE GRADE LOGIC:
  If structural drawing provided → use stated grade
  If NO structural drawing → assume 25N/mm² (written as 25N/MM2 in reports)
  Must be confirmed before generation starts

NDT CODE FORMAT: e.g. REF: SKAAP/NDT/K007 (lab code + project NDT code)

CRITICAL: Report Bot uses Claude API (same ANTHROPIC_API_KEY as Proofread Bot)
Model: claude-sonnet-4-5
Max tokens: 8000 per section call
All Claude prompts end with: "Respond ONLY in the exact format specified. No preamble."
```

---

## [V4-STEP-01] — Database Migration & New Types

**Context:**
Starting V4 Report Bot. We need a new table to store draft reports and their generation
status, plus TypeScript types for all Report Bot data structures.

**Task:**

1. Create `supabase/migrations/010_v4_report_drafts.sql`:
```sql
CREATE TYPE draft_status_enum AS ENUM (
  'generating', 'draft_ready', 'staff_editing',
  'ready_for_proofread', 'sent_to_proofread'
);

CREATE TABLE report_drafts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tenant_id         UUID NOT NULL REFERENCES tenants(id),
  generated_by      UUID NOT NULL REFERENCES users(id),
  generated_at      TIMESTAMPTZ DEFAULT NOW(),
  concrete_grade    VARCHAR(10) NOT NULL DEFAULT '25',
  drawing_provided  BOOLEAN DEFAULT FALSE,
  excel_data        JSONB,
  rebar_data        JSONB,
  draft_filename    VARCHAR(300),
  storage_path      TEXT,
  status            draft_status_enum DEFAULT 'generating',
  iteration         INTEGER DEFAULT 1,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_report_drafts_project ON report_drafts(project_id);
CREATE INDEX idx_report_drafts_tenant ON report_drafts(tenant_id);

ALTER TABLE report_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_report_drafts ON report_drafts
  USING (
    tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
  )
  WITH CHECK (
    tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid())
  );
```

2. Update `src/types/index.ts` with V4 types:
```typescript
export interface RebarMeasurements {
  column: { mainBar: number; links: number; spacing: number; coverDepth: number }
  beam:   { mainBar: number; links: number; spacing: number; coverDepth: number }
  slab:   { mainBar: number; links: number; spacing: number; coverDepth: number }
}

export interface ExcelFloorData {
  floorName: string      // e.g. "Ground Floor", "First Floor"
  sheetKey: string       // e.g. "Gf", "FF"
  columns: ElementData[]
  beams: ElementData[]
  slabs: ElementData[]
  shearWalls: ElementData[]
}

export interface ElementData {
  elementId: string       // e.g. "C1", "B2", "S3"
  trials: {
    trial: 'A' | 'B' | 'C'
    transmissionTime: number
    pathLength: number
    velocity: number
    ecs: number
  }[]
  averageEcs: number
  remark: string          // "GOOD" or "POOR"
}

export interface ReportDraftInput {
  projectId: string
  concreteGrade: string
  drawingProvided: boolean
  rebarData: RebarMeasurements
}
```

3. Run migration:
```bash
npx supabase db push
```

**File Targets:**
- `supabase/migrations/010_v4_report_drafts.sql`
- `src/types/index.ts` (updated)

**Dependencies:** All previous steps

**→ After this step: /careful** (migration)

---

## [V4-STEP-02] — Excel Parser for Scientific Observations

**Context:**
Database ready. Now build the Excel parser that reads the scientific observation file
and converts it into structured JSON that the Report Bot can use to generate analysis
tables.

**Task:**
Create `src/lib/v4/excel-parser.ts`:

```typescript
import * as XLSX from 'xlsx'

// Sheet name to floor name mapping
const FLOOR_NAMES: Record<string, string> = {
  'Gf': 'Ground Floor',
  'GF': 'Ground Floor',
  'FF': 'First Floor',
  'SF': 'Second Floor',
  'TF': 'Third Floor',
  'FoF': 'Fourth Floor',
  'FiF': 'Fifth Floor',
}

// Element ID prefix to type mapping
function getElementType(id: string): 'column' | 'beam' | 'slab' | 'shearWall' {
  const prefix = id.replace(/[0-9]/g, '').toUpperCase()
  if (prefix === 'C') return 'column'
  if (prefix === 'B') return 'beam'
  if (prefix === 'S') return 'slab'
  if (prefix === 'SH') return 'shearWall'
  return 'column'
}

export async function parseExcelAnalysis(buffer: Buffer): Promise<ExcelFloorData[]>
```

**Implementation details:**

1. Load workbook using SheetJS: `XLSX.read(buffer, { type: 'buffer' })`

2. For each sheet:
   - Map sheet name to floor name using `FLOOR_NAMES`
   - Convert sheet to array of arrays: `XLSX.utils.sheet_to_json(ws, { header: 1 })`
   - Skip header row (row 0)
   - Group rows by element ID (first column when not empty = new element)
   - Each element has exactly 3 trial rows (A, B, C)
   - Extract: transmissionTime, pathLength, velocity, ecs, averageEcs (from trial A row), remark

3. Handle the two-column layout in the Excel:
   - The Excel has elements in two side-by-side groups per sheet
   - Columns 1-8 = left group, Columns 10-17 = right group
   - Parse both groups separately and combine

4. Return array of `ExcelFloorData` sorted by floor order:
   Ground → First → Second → Third etc.

5. Generate summary per floor:
```typescript
export function generateFloorSummary(floor: ExcelFloorData): FloorSummary {
  return {
    floorName: floor.floorName,
    columns: { count: floor.columns.length, pointsTaken: floor.columns.length * 3 },
    beams: { count: floor.beams.length, pointsTaken: floor.beams.length * 3 },
    slabs: { count: floor.slabs.length, pointsTaken: floor.slabs.length * 3 },
    shearWalls: { count: floor.shearWalls.length, pointsTaken: floor.shearWalls.length * 3 }
  }
}
```

6. Determine overall result:
```typescript
export function getOverallResult(floors: ExcelFloorData[]): 'all_good' | 'majority_good' | 'mixed' {
  // Count GOOD vs POOR across all elements
  // Returns 'all_good' if all GOOD, 'majority_good' if >50% GOOD, 'mixed' otherwise
}
```

**File Targets:**
- `src/lib/v4/excel-parser.ts`
- `src/types/v4.ts` (new — all V4 TypeScript interfaces)

**Dependencies:** V4-STEP-01

**→ After this step: /review**

---

## [V4-STEP-03] — Report Bot AI Engine (Claude Integration)

**Context:**
Excel parser is ready. Now build the AI engine that generates each report section
using Claude. Each section is a separate API call to maintain quality and stay within
token limits.

**Task:**
Create `src/lib/v4/report-engine.ts`:

The engine generates 6 variable sections. Fixed sections are written directly in code
(no AI needed — they're always identical).

**Section 1 — generateFrontPage()**
No AI needed. Pure data assembly:
```typescript
export function generateFrontPage(data: ReportBotInput): FrontPageData {
  return {
    ref: `SKAAP/NDT/${data.ndtCode}`,
    buildingState: data.buildingState,  // "AN EXISTING BUILDING" or "ONGOING CONSTRUCTION"
    clientName: data.clientName,
    address: data.address,
    email: data.clientEmail || '',
    phone: data.clientPhone || '',
    date: formatReportDate(data.siteDate),  // "6th, March, 2026"
  }
}
```

**Section 2 — generateExecutiveSummary()** — Claude
```typescript
const prompt = `
You are writing the Executive Summary for an NDT structural integrity report.
Write exactly 3 bullet points following this EXACT format:

Bullet 1 (always identical):
"In situ Integrity Test (Non-Destructive) of compressive strength of structural members."

Bullet 2 (variable — fill in the data):
"[building state description] belonging to [CLIENT NAME] at [ADDRESS]. The Non-Destructive
Integrity Test was carried out on the [date] with the intention to determine the residual
compressive strength of concrete components of the structural members considered to be
critical to stability, robustness and general safety of the entire building structure in
its present state."

Bullet 3 (variable — based on overall result):
"The test analysis revealed that [all/the accessible] structural members tested on the
building were of good strength indicating overall structural integrity. The visual
inspection revealed [PLACEHOLDER — TO BE COMPLETED BY STAFF AFTER VISUAL INSPECTION].
[CLIENT NAME] was referred to a qualified structural engineer [RECOMMENDATION TEMPLATE]."

DATA:
Client Name: ${data.clientName}
Address: ${data.address}
Building State: ${data.buildingState}
Site Date: ${data.siteDate}
Overall Test Result: ${data.overallResult}
Recommendation Template: ${data.recommendationTemplate}

RULES:
- Building state description: if ongoing construction say "An ongoing construction"
  if existing building say "An existing building"
- Use exact recommendation wording from template provided
- Bullet 3 visual inspection part: write exactly:
  "[VISUAL INSPECTION SUMMARY — TO BE COMPLETED BY STAFF]"
- Respond with ONLY the 3 bullet points, no other text.
`
```

**Section 3 — generateIntroduction()** — Claude
```typescript
const prompt = `
Write the INTRODUCTION section for an NDT structural integrity report.

TEMPLATE (follow this exactly, fill in the [VARIABLES]):
"Non-Destructive Test (NDT), as the name implies, means that the material under the test
is not damaged during test. Direct measurement of the strength of concrete involves
destructive stress and cannot be used for determining the quality of already cast concrete.
It is for this reason that direct methods are not employed in determining the strength of
in-situ concrete. As a result, indirect methods were used.

A Non-Destructive compressive strength test (Integrity Test) was conducted on [BUILDING
DESCRIPTION: e.g. "an existing 4-floor building" or "an ongoing 3-floor construction"]
located at [ADDRESS].

The map showing the exact location of the site is on page 7.

[DRAWING STATEMENT — choose one]:
  IF drawing provided: "Architectural and Structural drawing were provided, and a concrete
  design strength of [GRADE]N/MM2 was used for the analysis of the structural members.
  To aid the intending test a sketch was drawn."
  IF NOT provided: "Architectural drawing and Structural drawing were not provided,
  therefore, an assumed design strength of 25N/MM2 was used for the analysis of the
  structural members. To aid the intending test a sketch was drawn."

Additionally, the soil test report was not provided before and after the test."

DATA:
Building State: ${data.buildingState}
Number of Floors: ${data.numberOfFloors}
Address: ${data.address}
Drawing Provided: ${data.drawingProvided}
Concrete Grade: ${data.concreteGrade}

Respond with ONLY the introduction text, no headers, no labels.
`
```

**Section 4 — generateAnalysisSummary()** — No AI
Parse Excel data and format tables directly in code. No Claude needed.
The analysis section contains:
1. Summary of Test Analysis table (per floor — count of elements and test points)
2. Individual element tables per floor (exact reproduction of Excel data)

```typescript
export function generateAnalysisContent(floors: ExcelFloorData[]): AnalysisContent {
  // Generate summary tables from floor data
  // Generate individual UPV result tables
  // Each table: STRUCTURAL ELEMENT | TRIALS | TRANSMISSION TIME | PATH LENGTH |
  //             VELOCITY | ECS | AVERAGE ECS (N/mm²) | REMARK
  // Format numbers to 2 decimal places
  // Use exactly the data from Excel — do NOT recalculate
}
```

**Section 5 — generateRecommendation()** — No AI
Rule-based, same as Proofread Bot:
```typescript
export function generateRecommendation(
  buildingState: string,
  visualInspectionNotes: string  // will be "[PLACEHOLDER]" at draft stage
): string {
  // B = under construction → Template B
  // Template B wording for ongoing construction
  // Returns full recommendation paragraph
}
```

**Section 6 — generateConclusion()** — Claude
```typescript
const prompt = `
Write the CONCLUSION section for an NDT structural integrity report.

TEMPLATE (follow this exactly, fill in the [VARIABLES]):
"The visual and structural integrity test was conducted in accordance with BS EN 12504-4:2004,
BS 1881: Part 201: 1986, BS 4408: Part 5: 1974. The outcome of the test results analyzed
is represented through Bar charts on page ([PAGE_NUMBER]) of this report.

1. The bar chart shows the summary of all the test results, in percentage of strength for
   each structural member which revealed that [ALL/MAJORITY] the accessible structural
   elements tested have strength above the [assumed/stated] design strength of [GRADE]N/mm²
   and were rated good. [CORRECTIVE MEASURE STATEMENT if any poor results]

2. However, it is imperative to state clearly that non-adherence to the recommendation
   excludes us from any responsibility.

Note: The test assumed [GRADE]N/mm² as the strength of the structural members, however
a substructure probe is required to ascertain the integrity of the building foundation."

DATA:
Concrete Grade: ${data.concreteGrade}
Drawing Provided: ${data.drawingProvided}
Overall Result: ${data.overallResult}
Poor Elements Found: ${data.poorElementsFound}

Respond with ONLY the conclusion text.
`
```

**Main orchestrator function:**
```typescript
export async function runReportBot(input: ReportBotInput): Promise<ReportSections> {
  const [
    frontPage,
    executiveSummary,
    introduction,
    conclusion
  ] = await Promise.all([
    Promise.resolve(generateFrontPage(input)),
    generateExecutiveSummary(input),
    generateIntroduction(input),
    generateConclusion(input),
  ])

  const analysisContent = generateAnalysisContent(input.excelData)
  const recommendation = generateRecommendation(input.buildingState, '[PLACEHOLDER]')

  return {
    frontPage,
    executiveSummary,
    introduction,
    // purposeOfInvestigation: FIXED — hardcoded string constant
    // literatureReview: FIXED — hardcoded string constant + staff names
    // fieldWork: FIXED — hardcoded string constant with date
    // visualTest: PLACEHOLDER
    // methodology: FIXED — hardcoded string constant
    // rebarAssessment: FIXED — hardcoded string constant
    rebarTable: input.rebarData,
    analysisContent,
    recommendation,
    conclusion,
  }
}
```

**All Claude API calls use this pattern:**
```typescript
import Anthropic from '@anthropic-ai/sdk'
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-5',
  max_tokens: 4000,
  messages: [{ role: 'user', content: prompt }]
})
const text = response.content[0].type === 'text' ? response.content[0].text : ''
```

**File Targets:**
- `src/lib/v4/report-engine.ts`
- `src/lib/v4/constants.ts` (all fixed boilerplate sections as string constants)

**Dependencies:** V4-STEP-02

**→ After this step: /careful** (Claude API calls — test each section independently)

---

## [V4-STEP-04] — .docx Writer for Report Bot Output

**Context:**
Engine is ready. Now build the Word document writer that assembles all sections into
a properly formatted .docx file matching the SKAAP CONSULT report style.

**Task:**
Create `src/lib/v4/docx-writer.ts`:

Use the `docx` npm package to generate the report.

**Document structure and formatting rules:**

```typescript
import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, AlignmentType, BorderStyle,
  WidthType, TableOfContents, Header, PageBreak
} from 'docx'

export async function generateReportDocx(
  sections: ReportSections,
  project: Project,
  staffNames: StaffMember[]
): Promise<Buffer>
```

**Formatting specifications (from report analysis):**

1. **Front Page:**
   - Reference: right-aligned, bold
   - Title: centered, bold, all caps: "REPORT ON AN IN-SITU INTEGRITY TEST (NON-DESTRUCTIVE) OF COMPRESSIVE STRENGTH OF STRUCTURAL ELEMENTS"
   - Company: centered, bold: "SKAAP CONSULT"
   - Company address: centered
   - LSMTL number: centered
   - "ON": centered
   - Building state: centered, bold, all caps
   - "FOR": centered
   - Client name: centered, bold, all caps
   - "AT": centered (if separate from client section)
   - Address: centered, bold, all caps
   - Email/Phone: as table, centered
   - Date: bold, ordinal format (e.g. "6th March, 2026")

2. **Section headings:**
   - Executive Summary: Heading 1
   - 1.0. INTRODUCTION: Heading 1
   - All numbered sections: Heading 1 with numbering

3. **Visual Test placeholder:**
```
## VISUAL TEST

From the visual inspection conducted on the building the following observations were
noted and recorded as at the time of test.

[⚠ REPORT BOT PLACEHOLDER — STAFF TO COMPLETE THIS SECTION]

Please add the visual inspection findings from the site visit before sending to
Proofread Bot. Include:
- Building type and number of floors
- Building usage/purpose
- Structural defects observed (cracks, spalling, honeycombs, settlement, etc.)
- Condition of structural members (columns, beams, slabs)
- Any sagging, hogging, or settlement observed

Following the aforementioned, a Non-Destructive Test was conducted. The photograph in
the appendix of this report shows the physical state of the building structure as at
test time.
```

4. **Staff table in Literature Review:**
```typescript
// Generate staff table from site_visits data
// Each staff member: Name | Signature (empty cell)
// Table format matching report style
const staffTable = createStaffTable(staffNames)
```

5. **Analysis tables:**
   - Table title bold and centered
   - Header row: dark background or bold
   - Alternate row shading
   - Average ECS column: values formatted to 2 decimal places
   - Unit: N/mm² with superscript 2
   - REMARK column: "GOOD" in green, "POOR" in red

6. **Appendix placeholders:**
```
# APPENDIX

## I. SKETCH OF THE BUILDING
[⚠ STAFF: Please add AutoCAD sketch of the building here]

## II. PHOTOGRAPHS OF THE BUILDING

Page 7 — Location Map:
[⚠ STAFF: Please add Google Maps screenshot showing site coordinates here]

[⚠ STAFF: Please add site photographs here]
```

7. **Signature block at end:**
```typescript
// Signing officers table
// 4 columns: MD + 3 Field Officers
// Each with name, title, and signature image space
```

8. **Superscript handling for N/mm²:**
```typescript
// When writing "N/mm²" or "25N/MM²":
new TextRun({ text: "N/mm" }),
new TextRun({ text: "2", subScript: true }),
// OR for the full grade:
new TextRun({ text: "25N/MM" }),
new TextRun({ text: "2", subScript: true }),
```

**Filename generation:**
```typescript
export function generateDraftFilename(ndtCode: string): string {
  // Output: "SKAAP_NDT_{ndtCode}_Draft.docx"
  // e.g. "SKAAP_NDT_K007_Draft.docx"
  return `SKAAP_NDT_${ndtCode}_Draft.docx`
}
```

**File Targets:**
- `src/lib/v4/docx-writer.ts`

**Dependencies:** V4-STEP-03

**→ After this step: /review**

---

## [V4-STEP-05] — Report Bot API Route

**Context:**
Parser, engine, and writer are all ready. Wire them into a single Next.js API route.

**Task:**
Create `src/app/api/v4/generate-report/route.ts` (POST):

```typescript
// Request: multipart/form-data
// Fields:
//   projectId: string
//   concreteGrade: string  (e.g. "25", "30")
//   drawingProvided: "true" | "false"
//   rebarData: JSON string of RebarMeasurements
// File: excelFile (.xlsx)

// Validation:
// - Auth: ops_manager+ role (read from public.users via adminClient)
// - File must be .xlsx
// - Project must exist in tenant

// Processing flow:
// 1. Parse Excel file → ExcelFloorData[]
// 2. Fetch project data from DB (client name, address, date, floors, etc.)
// 3. Fetch site visit staff from DB (who attended site)
// 4. Run runReportBot() → ReportSections
// 5. Generate .docx via generateReportDocx()
// 6. Upload .docx to Supabase Storage:
//    "report-drafts/{tenantId}/{projectId}/{timestamp}_{filename}"
// 7. Insert report_drafts row:
//    { projectId, tenantId, generatedBy, concreteGrade, drawingProvided,
//      excelData: parsedData, rebarData, draftFilename, storagePath,
//      status: 'draft_ready' }
// 8. Return: { draftId, downloadUrl, filename, status: 'draft_ready' }
```

**Error handling:**
- Excel parse fails → return 400 with "Could not parse Excel file"
- Claude API fails → return 500 with "Report generation failed — please try again"
- Always clean up uploaded file on error

**Supabase Storage bucket:**
- Bucket name: `report-drafts` (create in Supabase dashboard, private)
- Lifecycle: delete after 30 days

**Also create** `src/app/api/v4/download-draft/route.ts` (POST):
- Body: `{ draftId }`
- Fetches .docx from Storage
- Returns file with headers:
  `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  `Content-Disposition: attachment; filename="{draftFilename}"`

**File Targets:**
- `src/app/api/v4/generate-report/route.ts`
- `src/app/api/v4/download-draft/route.ts`

**Dependencies:** V4-STEP-04

**→ After this step: /careful** (file upload + AI + docx generation + storage)

---

## [V4-STEP-06] — Report Bot UI

**Context:**
API routes are ready. Now build the UI that fits into the existing project pipeline.

**Task:**

**1. Add Report Bot stage to pipeline:**
Update `src/components/projects/PipelineBar.tsx`:

The pipeline now has a new stage between "Report Writing" and "Proofreading":
```
Analysis → Sketch → Report Writing → [REPORT BOT] → Proofreading
```

**Report Bot stage shows:**
- Before generation: "Generate Report Draft" button (Neon Lime, ops_manager+ only)
- Generating: spinner + "Report Bot is writing your report..."
- Draft ready: green "Draft Ready" chip + "Download Draft" button
- Staff editing: amber "Staff Editing" chip
- Ready for proofread: "Send to Proofread Bot" button

**2. Create `src/components/v4/ConcreteGradeModal.tsx`:**
Modal that appears when manager clicks "Generate Report Draft":

```
Title: "Report Bot — Before We Start"

Question 1: "Were structural drawings provided for this project?"
  [ ] Yes    [ ] No (default)

If YES:
  Question 2: "What is the concrete design grade?"
  Input: number field, placeholder "e.g. 25, 30, 35"
  Helper: "This is the design compressive strength in N/mm²"

If NO:
  Display info: "Assumed strength of 25N/mm² will be used"

[ Cancel ]  [ Next → ]
```

**3. Create `src/components/v4/RebarForm.tsx`:**
Form for entering rebar measurements (shown after concrete grade modal):

```
Title: "Rebar Measurements from Site"
Subtitle: "Enter the measurements recorded during testing"

Three sections: Column | Beam | Slab

Each section has 4 fields:
  Main Bar (mm): number input
  Links (mm):    number input
  Spacing (mm):  number input
  Cover Depth (mm): number input

Default values pre-filled: Column: 16/10/300/45, Beam: 16/10/300/55, Slab: 12/-/200/50
(staff can adjust from defaults)

[ Back ]  [ Generate Report → ]
```

**4. Create `src/components/v4/ExcelUploadPanel.tsx`:**
Upload panel shown between rebar form and generation:

```
Drop zone: accepts .xlsx only
"Upload Scientific Observation Excel"
Shows file name + size after selection
[ Generate Report → ] button triggers API call
```

**5. Create `src/components/v4/ReportBotPanel.tsx`:**
Full panel that manages the multi-step Report Bot flow:

```
Step 1: Concrete Grade Modal
Step 2: Rebar Form  
Step 3: Excel Upload + Generate
Step 4: Draft Ready (download button)
```

Progress states:
- Uploading: "Uploading Excel file..."
- Generating: animated progress with cycling messages:
  - "Compiling site information..."
  - "Parsing scientific observations..."
  - "Writing Introduction section..."
  - "Generating Analysis tables..."
  - "Writing Recommendation..."
  - "Assembling complete report..."
- Complete: "Draft ready — {filename}"

**Design tokens (Part 2 dark theme):**
- Report Bot stage active: Neon Lime border glow
- Draft ready chip: bg #0A2018, text #50D898, border #0F4A2A
- Generate button: --color-core-tactical (Neon Lime)
- Progress messages: Inter 14px, --color-text-secondary
- Modal: --color-bg-raised (#1C2640), 16px radius

**6. Update project detail page:**
`src/app/(app)/projects/[id]/page.tsx`:
- Render `<ReportBotPanel>` when user is ops_manager+ AND project status is `report_done`
- Report Bot appears as Stage 4.5 between Report Writing and Proofreading

**File Targets:**
- `src/components/v4/ConcreteGradeModal.tsx`
- `src/components/v4/RebarForm.tsx`
- `src/components/v4/ExcelUploadPanel.tsx`
- `src/components/v4/ReportBotPanel.tsx`
- `src/components/projects/PipelineBar.tsx` (updated)
- `src/app/(app)/projects/[id]/page.tsx` (updated)

**Dependencies:** V4-STEP-05

**→ After this step: /qa**

---

## [V4-STEP-07] — Report Bot Integration & Pipeline Wiring

**Context:**
UI is complete. Final step: wire Report Bot into the project status pipeline and
connect the handoff to Proofread Bot.

**Task:**

**1. Add `report_bot_draft` to project status pipeline:**

Update `src/types/index.ts` and `src/lib/status-transitions.ts`:
```typescript
// New status inserted between report_done and proof_ready
// not_started → wip → analysis_done → sketch_done → report_done
// → report_bot_draft → proof_ready → report_uploaded → report_verified → report_delivered
```

Update the status enum in `supabase/migrations/011_add_report_bot_status.sql`:
```sql
ALTER TYPE project_status_enum ADD VALUE 'report_bot_draft' 
  AFTER 'report_done';
```

**2. Update project status flow:**

When Report Bot draft is generated:
- Project status advances: `report_done` → `report_bot_draft`
- Notification sent to staff: "Report Bot has generated a draft report for {ndtCode}.
  Download it, complete the Visual Inspection section, and re-upload."

When staff re-uploads completed report (existing upload mechanism):
- Status advances: `report_bot_draft` → `proof_ready`

**3. Add tRPC procedures for Report Bot:**

Add to `src/server/routers/reportBot.ts` (new file):
```typescript
// getDraftByProject — get latest draft for a project
// updateDraftStatus — update draft status
// getDraftDownloadUrl — get signed URL for draft download
```

Register in `_app.ts`.

**4. Status chip for `report_bot_draft`:**

Update design system in `src/lib/design-tokens.ts`:
```typescript
report_bot_draft: {
  bg: '#0A1E38',
  text: '#70AEFF',
  border: '#1E3A5F'
}
```

**5. Add "Send to Proofread Bot" button:**

In `PipelineBar.tsx`, when status is `proof_ready`:
- Show "Send to Proofread Bot" button (Neon Lime)
- This triggers the existing V3 Proofread Bot upload panel
- The two features connect seamlessly:
  Report Bot → staff edits → re-upload → Proofread Bot → manager approves

**6. Update `SMOKE_TEST.md` with Report Bot section:**
```markdown
## V4 Report Bot

### Happy Path
- [ ] Open project at report_done status
- [ ] Click "Generate Report Draft"
- [ ] Concrete grade modal appears
- [ ] Select "No structural drawing" → 25N/mm² confirmed
- [ ] Rebar form appears with default values
- [ ] Adjust rebar measurements and click Next
- [ ] Upload Excel analysis file
- [ ] Click "Generate Report"
- [ ] Progress messages cycle through stages
- [ ] Draft .docx downloads as "SKAAP_NDT_{code}_Draft.docx"
- [ ] Open in Word → all sections present
- [ ] Visual Test section shows placeholder
- [ ] Appendix shows placeholder for sketch/photos
- [ ] Project status → report_bot_draft

### Report Content Checks
- [ ] Front page: correct client name, address, date, NDT code
- [ ] Executive Summary: 3 bullets, visual placeholder present
- [ ] Introduction: correct floors, address, concrete grade statement
- [ ] Purpose of Investigation: matches template exactly
- [ ] Literature Review: boilerplate present + staff names from site visits
- [ ] Analysis tables: match Excel data exactly (no rounding errors)
- [ ] Rebar table: matches form input
- [ ] Recommendation: correct template for building type
- [ ] Conclusion: references correct concrete grade
- [ ] Appendix: placeholder text visible

### Edge Cases
- [ ] Project with structural drawing → custom grade used in report
- [ ] Multi-floor building → all floors present in analysis
- [ ] Missing client email/phone → handled gracefully
- [ ] Excel with only columns (no beams/slabs) → summary table correct
```

**File Targets:**
- `src/server/routers/reportBot.ts` (new)
- `src/server/routers/_app.ts` (updated)
- `src/lib/status-transitions.ts` (updated)
- `src/types/index.ts` (updated)
- `src/lib/design-tokens.ts` (updated)
- `supabase/migrations/011_add_report_bot_status.sql`
- `src/components/projects/PipelineBar.tsx` (updated)
- `SMOKE_TEST.md` (updated)

**Dependencies:** V4-STEP-06

**→ After this step: /ship** — then run full SMOKE_TEST.md V4 section

---

# V4 BUILD COMPLETE

## V4 Delivery Summary

| Step | What Was Built |
|---|---|
| V4-01 | Database migration (report_drafts table), TypeScript types |
| V4-02 | Excel parser (multi-sheet, element extraction, floor summaries) |
| V4-03 | Report Bot AI engine (section generators, Claude integration, fixed constants) |
| V4-04 | .docx writer (formatted Word document with all sections, placeholders) |
| V4-05 | API routes (generate-report, download-draft) |
| V4-06 | UI (ConcreteGradeModal, RebarForm, ExcelUploadPanel, ReportBotPanel) |
| V4-07 | Pipeline integration, status wiring, Proofread Bot handoff |

## Key Technical Decisions

| Decision | Rationale |
|---|---|
| Fixed sections as string constants | Purpose of Investigation, Literature Review, Methodology are 100% identical across all reports — no AI needed, faster and cheaper |
| Claude only for variable narrative sections | Executive Summary, Introduction, Conclusion need contextual language — Claude handles these 3 calls |
| Analysis tables built in code not AI | Excel data is structured — parse and reproduce directly, more reliable than asking AI to format tables |
| Recommendation rule-based | Same 4-template system as Proofread Bot — consistent, deterministic |
| Visual Inspection left as placeholder | Staff writes this from site observations — AI cannot fabricate structural defect observations |
| .docx output not PDF | Matches existing workflow — staff edits in Word, adds photos/sketches, then sends to Proofread Bot |
| 3 separate Claude calls | Executive Summary + Introduction + Conclusion — allows failure retry per section |
| Concrete grade modal before generation | Must be confirmed first — affects Introduction wording and Conclusion |
| Rebar form with defaults | Pre-filled with common values (16/10/300/45 for columns) speeds up form completion |

## Report Bot System Prompt (used across all Claude calls)

```
You are an expert NDT (Non-Destructive Testing) structural integrity report writer
for SKAAP CONSULT, an LSMTL-accredited laboratory in Lagos, Nigeria (LSMTL/2020/LAB-REG/D/003).

You write sections of formal engineering reports following LSMTL guidelines.

WRITING RULES:
- Use formal engineering language at all times
- Never use casual or conversational language
- All concrete strength units: N/mm² (with superscript 2) or N/MM2 in text
- All measurements in SI units
- Client names always in full as provided
- Addresses always verbatim as provided
- Dates in format: "6th of March 2026" or "6TH MAY, 2026"
- Building state: use "ongoing construction" or "existing building" as appropriate
- Never invent structural details not in the provided data
- Never fabricate test results or observations
- If visual inspection data is not provided, leave explicit placeholder
```
