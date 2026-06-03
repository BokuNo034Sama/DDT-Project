# PROMPT PACK — V3 AI Report Proofreader
**Appended to DDT Structure Prompt Pack**
**Steps:** 34–40
**Prerequisite:** All Steps 01–33 complete (core DDT Structure build)

---

## CONTEXT — What V3 Is

V3 adds an AI-powered LSMTL report proofreading module to the DDT Structure Proofreading pipeline stage. The manager uploads a .docx NDT report, the AI checks it against LSMTL guidelines, corrects Minor errors (with manager approval), and hard-blocks on Major errors until staff fix and resubmit. Output is either `Re_{filename}.docx` (major errors found) or `{filename}_Checked.docx` (clean).

### Error Type Rules
- **Minor errors** — AI proposes correction, manager accepts/rejects, applied before download
- **Major errors** — Hard block. Pass button disabled. Must resubmit until clean.
- **Fault logging** — Only triggered when manager formally fails report via existing proof review flow

### LSMTL Guideline Checks
| Section | Check | Type |
|---|---|---|
| Front page | Address consistency across document | Minor |
| Front page | Phone or email present | Major |
| Executive Summary | Required fields + recommendation wording match | Minor |
| Introduction | Floor count, drawing availability, 25N/mm² superscript | Minor |
| Visual Inspection | Spelling, grammar, conflicting statements | Minor |
| Literature Review | Min 3 staff names + embedded signature images | Minor (names) / Major (images) |
| Literature Review | Google Maps screenshot has coordinate text visible | Major |
| Analysis | Table arithmetic correct + E.C.S unit superscript | Major |
| Recommendation | Context-aware wording matches building condition from Visual section | Major |

### Recommendation Templates (Context-Aware)
```
Building condition from Visual section → required Recommendation wording:

A. Defects present:
   "the client was referred to a qualified structural engineer for further evaluation
   to provide technical, structural and remedial recommendations, and to assess the
   building's suitability for continued use."

B. Under construction:
   "the client was referred to a qualified structural engineer and other building
   professionals for further evaluation to provide technical and structural
   recommendations, and to assess the building's suitability for continued use."

C. No defects:
   "{client name} was referred to a qualified structural engineer for further
   evaluation to provide technical and structural recommendations, and to assess
   the building's suitability for continued use."

D. General/unclear:
   "the client was referred to a qualified structural engineer or other building
   professionals for further evaluation to provide technical or structural or
   remedial recommendations, and to assess the building's suitability for
   continued use."
```

---

# ════════════════════════════════════════
# ⟳ CONTEXT REFRESH PROMPT V3 — Start Here
# ════════════════════════════════════════

```
We are building V3 for DDT Structure — an AI-powered LSMTL report proofreader.

EXISTING SYSTEM:
- Next.js 14 App Router, tRPC, Supabase (Postgres + Auth + Storage), TypeScript strict
- Projects have a pipeline: not_started → wip → analysis_done → sketch_done →
  report_done → proof_ready → report_uploaded → report_verified → report_delivered
- Proofreading stage: ops_manager+ role only
- Existing: project_stage_assignments, proof_reviews tables, ProofReviewModal.tsx

V3 INTEGRATES INTO: The Proofreading stage (when project status = report_done)

NEW PACKAGES NEEDED:
- mammoth: .docx text + structure extraction
- docx (npm): read/write .docx, handle superscripts
- @anthropic-ai/sdk: Claude AI for guideline checks
- sharp: extract images from .docx
- tesseract.js: OCR on extracted images

NEW DB TABLE: report_checks (migration needed)
NEW ROUTES: /api/v3/check-report, /api/v3/apply-corrections, /api/v3/download
NEW UI: UploadCheckPanel, FindingsPanel, MinorCorrectionsList, MajorErrorsList

HARD RULES:
1. Major errors = Pass button disabled (hard block, no override)
2. Minor corrections must be applied before download is available
3. Download filename: Re_{name}.docx (major errors) or {name}_Checked.docx (clean)
4. Fault logging unchanged — only on formal manager proof fail, not AI check fail
5. Files stored in Supabase Storage, auto-deleted after 24h
6. No PDF output, no tone/style corrections
```

---

## [STEP 34] — Install V3 Dependencies & Database Migration

**Context:**
Starting V3. We need new npm packages for .docx parsing/writing, AI checking, image extraction, and OCR. We also need the `report_checks` table in the database.

**Task:**

1. Install all V3 dependencies:
```bash
npm install mammoth docx @anthropic-ai/sdk sharp tesseract.js
npm install -D @types/mammoth
```

2. Create migration `supabase/migrations/003_v3_report_checks.sql`:
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
CREATE POLICY tenant_isolation_report_checks ON report_checks
  USING (tenant_id = (auth.jwt()->>'tenant_id')::uuid);
```

3. Add Supabase Storage bucket setup instructions to `README.md`:
```
Supabase Storage:
- Create bucket: "report-uploads"
- Set to private (not public)
- Add lifecycle rule: delete files older than 24 hours
```

4. Add to `.env.local`:
```env
ANTHROPIC_API_KEY=your_anthropic_api_key
```

5. Update `src/types/index.ts` with new types:
```typescript
export interface MinorError {
  id: string
  section: string
  description: string
  original: string
  correction: string
  accepted?: boolean
}

export interface MajorError {
  id: string
  section: string
  description: string
}

export interface ReportCheckResult {
  checkId: string
  result: 'pass' | 'major_errors' | 'minor_only'
  minorErrors: MinorError[]
  majorErrors: MajorError[]
  iteration: number
}
```

**Expected Output:**
- All packages installed without errors
- Migration file created and ready to push
- New types exported
- `.env.local` updated with `ANTHROPIC_API_KEY` placeholder

**File Targets:**
- `package.json`
- `supabase/migrations/003_v3_report_checks.sql`
- `src/types/index.ts` (updated)
- `.env.local`
- `README.md` (updated)

**Dependencies:** All Steps 01–33

**→ After this step: /careful** (migration + new env var)

---

## [STEP 35] — .docx Parser & Section Extractor

**Context:**
Dependencies installed. Now we build the core document parser that extracts each LSMTL section from the uploaded .docx for guideline checking.

**Task:**
Create `src/lib/v3/parser.ts`:

1. **`parseDocx(buffer: Buffer): Promise<ParsedReport>`**
   - Uses `mammoth` to extract raw text with style information
   - Identifies each LSMTL section by heading text:
     - `EXECUTIVE SUMMARY`
     - `1.0. INTRODUCTION`
     - `2.0. PURPOSE OF INVESTIGATION`
     - `3.0. LITERATURE REVIEW`
     - `4.0. FIELD WORK` (includes subsections 4.1–4.4)
     - `5.0. ANALYSIS OF TEST RESULT`
     - `6.0. RECOMMENDATION`
     - `7.0. CONCLUSION`
     - `APPENDIX`
   - Returns `ParsedReport`:
     ```typescript
     interface ParsedReport {
       frontPage: string
       executiveSummary: string
       introduction: string
       literatureReview: string
       fieldWork: {
         visualTest: string
         methodology: string
         rebarAssessment: string
         rebarTable: string
       }
       analysis: string
       recommendation: string
       conclusion: string
       appendix: string
       rawText: string
       hasImages: boolean
       imageCount: number
     }
     ```

2. **`extractImagesFromDocx(buffer: Buffer): Promise<ExtractedImage[]>`**
   - Unzips the .docx (it's a ZIP archive) using Node.js `adm-zip` or the built-in `unzipper`:
     ```bash
     npm install unzipper
     ```
   - Extracts all files from `word/media/` directory
   - Returns array of `{ filename, buffer, mimeType, sectionHint }`
   - Install: `npm install unzipper`

3. **`findImagesInSection(docxBuffer: Buffer, sectionName: string): Promise<ExtractedImage[]>`**
   - Parses `word/document.xml` to locate image references near section headings
   - Returns images embedded within approximate section boundaries
   - Used for: Literature Review (signature images), Appendix (Google Maps screenshots)

4. **`extractTablesFromDocx(buffer: Buffer): Promise<DocxTable[]>`**
   - Extracts all tables from the .docx with cell values
   - Returns array of `DocxTable`: `{ rows: string[][] }`
   - Used for Analysis section arithmetic checking

**Expected Output:**
- `parseDocx()` correctly identifies all 8 LSMTL sections from a real NDT report
- Images extracted from .docx binary
- Tables extracted with cell values as string arrays

**File Targets:**
- `src/lib/v3/parser.ts`
- `src/types/v3.ts` (new — all V3 TypeScript interfaces)

**Dependencies:** STEP 34

**→ After this step: /review**

---

## [STEP 36] — Guideline Checker Engine

**Context:**
Parser is complete. Now we build the guideline checking engine — the core V3 logic that produces Minor and Major error findings.

**Task:**
Create `src/lib/v3/checker.ts` with the following check functions. Each returns `{ errors: (MinorError | MajorError)[] }`.

**Architecture:**
```typescript
export async function runFullCheck(
  parsedReport: ParsedReport,
  images: ExtractedImage[],
  tables: DocxTable[]
): Promise<{ minorErrors: MinorError[], majorErrors: MajorError[] }>
```

**Implement each check:**

1. **`checkFrontPageAddress(parsed: ParsedReport)`** → Minor
   - Extract address from front page text
   - Use Claude API to compare against address mentions in other sections
   - Flag if address text differs across sections

2. **`checkFrontPageContact(parsed: ParsedReport)`** → Major
   - Regex check for phone number pattern: `+234...`, `080...`, `070...`, `081...`
   - Regex check for email pattern: `\S+@\S+\.\S+`
   - Flag Major if neither found on front page

3. **`checkExecutiveSummary(parsed: ParsedReport)`** → Minor
   - Use Claude API to verify presence of: client name, site address, building state summary, floor count, test date, recommendation text
   - Check recommendation text matches text in Recommendation section
   - Return list of missing/mismatched items as Minor errors

4. **`checkIntroduction(parsed: ParsedReport)`** → Minor
   - Check floor count mentioned (digit + "floor" or "storey")
   - Check drawing availability statement present ("architectural", "structural")
   - Check 25N/mm² mention exists (text check for "25")

5. **`checkVisualInspection(parsed: ParsedReport)`** → Minor
   - Send Visual Test section to Claude API:
     ```
     Check this NDT visual inspection section for:
     1. Spelling errors
     2. Grammatical errors
     3. Conflicting statements (e.g. "no cracks observed" followed by "cracks were found")
     Return JSON array of { original, correction, description }
     ```
   - Each finding = one Minor error

6. **`checkLiteratureReview(parsed: ParsedReport, images: ExtractedImage[])`** → Mixed
   - Count staff names in Literature Review section (look for capitalized full names)
   - Flag Minor if fewer than 3 names found
   - Count images in Literature Review section
   - Flag Major if image count < number of staff names found (missing signature images)
   - Run OCR via tesseract.js on images in Literature Review section
   - Flag Major if no image contains coordinate text (format: lat,lng or decimal degrees)

7. **`checkAnalysis(parsed: ParsedReport, tables: DocxTable[])`** → Major
   - For each table in Analysis section:
     - Extract numeric columns
     - Re-calculate averages and totals
     - Compare against table values (tolerance: ±0.01)
   - Flag Major if miscalculation found
   - Check text of Analysis section for "N/mm" unit — flag Major if unit formatting is wrong

8. **`checkRecommendation(parsed: ParsedReport)`** → Major
   - Send Visual Inspection + Recommendation sections to Claude API:
     ```
     Based on the visual inspection section, classify the building condition as:
     A = defects present, B = under construction, C = no defects, D = unclear
     Then check if the recommendation section matches the correct template for that condition.
     Templates: [paste all 4 templates]
     Return JSON: { condition: 'A'|'B'|'C'|'D', matches: boolean, correction: string }
     ```
   - Flag Major if `matches === false` with the correct template text as correction

**Claude API calls — use streaming: false, max_tokens: 2000**
```typescript
import Anthropic from '@anthropic-ai/sdk'
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 2000,
  messages: [{ role: 'user', content: prompt }]
})
```

**All Claude prompts must instruct: "Respond ONLY in valid JSON. No preamble, no markdown."**

**Expected Output:**
- All 8 check functions implemented
- Each returns correctly typed MinorError[] or MajorError[]
- `runFullCheck()` aggregates all results

**File Targets:**
- `src/lib/v3/checker.ts`

**Dependencies:** STEP 35

**→ After this step: /careful** (AI API calls — test each check function independently)

---

## [STEP 37] — .docx Correction Writer

**Context:**
Checker engine is complete. Now we build the correction writer — applies accepted Minor error corrections back into the .docx binary.

**Task:**
Create `src/lib/v3/writer.ts`:

1. **`applyMinorCorrections(originalBuffer: Buffer, acceptedCorrections: MinorError[]): Promise<Buffer>`**
   - Uses `docx` npm package to load the .docx
   - For each accepted correction:
     - Finds the `original` text in the document
     - Replaces with `correction` text
     - Preserves existing formatting (bold, italic, font size)
   - Special handling for superscripts:
     - When correction contains `mm²` or `N/mm²`: apply Word superscript formatting to the `2`
     - When correction contains `25N/mm²`: ensure the `2` is rendered as `<w:vertAlign w:val="superscript"/>`
   - Returns corrected .docx as Buffer

2. **`generateReportWithMajorErrors(originalBuffer: Buffer, majorErrors: MajorError[]): Promise<Buffer>`**
   - Inserts a formatted comment block at the very top of the document (before all content):
     ```
     ⚠ RE-SUBMISSION REQUIRED — MAJOR ERRORS FOUND
     ─────────────────────────────────────────────
     The following errors must be corrected before this report can be approved:

     [1] SECTION: Literature Review
         ISSUE: Google Maps screenshot does not show location coordinates.
         ACTION: Replace screenshot with one showing coordinate display.

     [2] SECTION: Recommendation
         ISSUE: Recommendation wording does not match building condition.
         REQUIRED: "the client was referred to..."
     ...
     Generated by DDT Structure V3 · {date}
     ```
   - Comment block styled in red text, bold section labels
   - Returns modified .docx as Buffer

3. **`generateFilename(originalName: string, result: 'clean' | 'major_errors'): string`**
   - `clean` → `{name}_Checked.docx` (strip existing extension, add suffix)
   - `major_errors` → `Re_{name}.docx`
   - Sanitize filename: remove special chars except `_` and `-`

**Expected Output:**
- Minor corrections applied correctly in .docx output
- Superscripts formatted correctly in Word XML
- Major error comment block appears at top of Re_ document
- Filename generator returns correct format

**File Targets:**
- `src/lib/v3/writer.ts`

**Dependencies:** STEP 36

**→ After this step: /review**

---

## [STEP 38] — V3 API Routes

**Context:**
Parser, checker, and writer are complete. Now we wire them into three Next.js API routes.

**Task:**

1. **`src/app/api/v3/check-report/route.ts`** (POST):
   - Accepts `multipart/form-data` with `.docx` file + `projectId`
   - Validates: JWT auth (ops_manager+ role), file is .docx, project exists in tenant
   - Uploads original file to Supabase Storage: `report-uploads/{tenantId}/{projectId}/{timestamp}_{filename}`
   - Runs:
     ```typescript
     const parsed = await parseDocx(buffer)
     const images = await extractImagesFromDocx(buffer)
     const tables = await extractTablesFromDocx(buffer)
     const { minorErrors, majorErrors } = await runFullCheck(parsed, images, tables)
     ```
   - Determines `check_result`:
     - Major errors found → `'major_errors'`
     - No major, minor found → `'minor_only'`
     - No errors → `'pass'`
   - Inserts `report_checks` row with all findings
   - Returns `ReportCheckResult` JSON

2. **`src/app/api/v3/apply-corrections/route.ts`** (POST):
   - Body: `{ checkId, acceptedCorrectionIds: string[] }`
   - Validates auth + ownership
   - Fetches original .docx from Supabase Storage using `storage_path`
   - Fetches `report_checks` row to get `minor_errors`
   - Filters to accepted corrections only
   - Calls `applyMinorCorrections(buffer, accepted)`
   - Updates `report_checks.minor_accepted` with accepted IDs
   - Returns corrected .docx as binary response (`application/octet-stream`)
   - Does NOT save corrected version — returned in memory only

3. **`src/app/api/v3/download/route.ts`** (POST):
   - Body: `{ checkId, acceptedCorrectionIds?: string[] }`
   - Validates auth + ownership
   - Fetches check record + original file
   - If `check_result === 'major_errors'`:
     - Generates `Re_` file using `generateReportWithMajorErrors()`
   - If `check_result === 'pass'` or `'minor_only'`:
     - Applies accepted corrections first (if any)
     - Generates `_Checked` file
   - Returns file with headers:
     ```
     Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
     Content-Disposition: attachment; filename="{generated_filename}"
     ```
   - Schedules Supabase Storage deletion (or let lifecycle rule handle it)

**Expected Output:**
- All 3 routes return correct responses
- Auth enforced on all routes
- .docx binary returns correctly (test with curl or Postman)
- Supabase Storage upload works

**File Targets:**
- `src/app/api/v3/check-report/route.ts`
- `src/app/api/v3/apply-corrections/route.ts`
- `src/app/api/v3/download/route.ts`

**Dependencies:** STEP 37

**→ After this step: /careful** (file upload + auth + binary response)

---

## [STEP 39] — V3 UI — Upload & Findings Panel

**Context:**
API routes are complete. Now we build the V3 UI that replaces the simple ProofReviewModal with the full AI check workflow.

**Task:**

1. Update `src/components/projects/PipelineBar.tsx`:
   - When project status = `report_done`, the Proofreading stage shows:
     - **Before upload:** "Upload & AI Check" button (amber, ops_manager+ only)
     - **After check — major errors:** Red badge "Major Errors Found" + Download Re_ button
     - **After check — minor only:** Amber badge "Minor Corrections Pending" + findings panel
     - **After check — pass:** Green badge "No Errors Found" + Pass button active

2. Create `src/components/v3/UploadCheckPanel.tsx` (Client Component):
   - File drop zone (or click to upload): accepts `.docx` only
   - Shows filename + file size after selection
   - "Run AI Check" button → POST to `/api/v3/check-report`
   - Progress states:
     - Uploading: progress bar + "Uploading report…"
     - Checking: spinner + animated text cycling through: "Checking address consistency…" / "Reviewing executive summary…" / "Analysing recommendation…"
     - Complete: transitions to `FindingsPanel`
   - Error state: "Check failed — please try again" with retry button

3. Create `src/components/v3/FindingsPanel.tsx` (Client Component):
   - Two sections: Major Errors (red) + Minor Corrections (amber)
   - **Major Errors section:**
     - Red header: "⚠ {n} Major Error(s) — Report cannot be passed"
     - List: section label + description per error
     - "Download for Staff Revision (Re_)" button
   - **Minor Corrections section:**
     - Amber header: "💡 {n} Minor Correction(s) — Review and accept"
     - Renders `<MinorCorrectionsList>`
     - "Apply Accepted Corrections" button (calls apply-corrections route)
   - Pass button: disabled with tooltip if major errors exist; active (green) if no major errors

4. Create `src/components/v3/MinorCorrectionsList.tsx` (Client Component):
   - One card per minor error:
     - Section label (e.g. "Visual Inspection")
     - Description of the issue
     - Two-panel diff: Original text (red strike) | Proposed correction (green)
     - Accept / Reject toggle buttons (default: Accept)
   - Running count: "3 of 5 corrections accepted"

5. **JapBento styling rules for V3 UI:**
   - Major error cards: `background: var(--color-fault-bg); border: 1px solid var(--color-fault-border); border-radius: var(--radius-lg)`
   - Minor correction cards: `background: var(--color-accent-light); border: 1px solid rgba(232,160,32,0.2); border-radius: var(--radius-lg)`
   - Pass button active: `background: var(--color-success); color: white`
   - Upload drop zone: `border: 2px dashed var(--color-border-medium); border-radius: var(--radius-xl); padding: 40px; text-align: center`
   - Drop zone hover: `border-color: var(--color-accent); background: var(--color-accent-light)`

**Expected Output:**
- Upload zone accepts .docx and shows progress
- Findings panel renders major and minor errors correctly
- Minor correction diff view shows original vs proposed
- Pass button hard-blocked when major errors exist
- Download buttons trigger correct API routes

**File Targets:**
- `src/components/projects/PipelineBar.tsx` (updated)
- `src/components/v3/UploadCheckPanel.tsx`
- `src/components/v3/FindingsPanel.tsx`
- `src/components/v3/MinorCorrectionsList.tsx`

**Dependencies:** STEP 38, STEP 12

**→ After this step: /qa** (test full flow end to end with a real .docx)

---

## [STEP 40] — V3 Integration, Smoke Test & Prompt Pack Update

**Context:**
V3 UI is complete. Final step: wire everything together, update the proof review flow, and create V3-specific smoke tests.

**Task:**

1. **Connect V3 check result to proof_reviews table:**
   - When manager clicks "Pass" after clean AI check:
     - Creates `proof_reviews` row with `result: 'pass'`
     - Sets `notes: 'Passed via V3 AI check — no major errors found'`
     - Advances project status → `report_uploaded`
     - Existing notification flow triggers normally

2. **Update `src/server/routers/proofReview.ts`:**
   - Add optional `checkId` to `submit` procedure input
   - If `checkId` provided: validate that `report_checks` row has `check_result !== 'major_errors'`
   - If major errors exist and manager tries to pass: throw `FORBIDDEN` — "Major errors must be resolved before passing"

3. **Iteration tracking:**
   - When staff re-uploads a revised report (second `check-report` call for same project):
     - Fetch latest `report_checks` for project, increment `iteration`
     - Each resubmission creates a new `report_checks` row
     - Pipeline bar shows "Attempt {n}" on the Proofreading stage

4. **Add to `SMOKE_TEST.md`:**
   ```markdown
   ## V3 AI Report Proofreader

   ### Happy Path (Clean Report)
   - [ ] Upload valid .docx → AI check runs
   - [ ] Progress messages cycle through checking stages
   - [ ] No errors found → Pass button active → project advances
   - [ ] Downloaded file named {original}_Checked.docx

   ### Minor Errors Flow
   - [ ] Upload report with address mismatch → Minor error appears
   - [ ] Diff view shows original vs correction
   - [ ] Accept correction → Apply → download works
   - [ ] Reject correction → original preserved in download

   ### Major Errors Flow (Hard Block)
   - [ ] Upload report missing phone/email → Major error appears
   - [ ] Pass button disabled with tooltip
   - [ ] Download Re_ file → error block appears at top of document
   - [ ] Re-upload fixed report → fresh check runs (Attempt 2)

   ### Edge Cases
   - [ ] Upload non-.docx file → rejected with clear error
   - [ ] Upload .docx with no images → Literature Review image check flags correctly
   - [ ] Analysis table with correct arithmetic → no Major error
   - [ ] Analysis table with wrong average → Major error flagged
   - [ ] Recommendation matches building condition → no error
   - [ ] Recommendation does not match → Major error with correct template shown
   ```

5. **Add V3 to `src/app/(app)/projects/[id]/page.tsx`:**
   - Import and render `<UploadCheckPanel>` when user is ops_manager+ and project status is `report_done` or `proof_ready`

**Expected Output:**
- Pass action creates proof_reviews row correctly
- tRPC enforces Major error hard block server-side
- Iteration count increments on resubmission
- Smoke test checklist covers all V3 paths
- Full E2E flow works with a real NDT report .docx

**File Targets:**
- `src/server/routers/proofReview.ts` (updated)
- `src/app/(app)/projects/[id]/page.tsx` (updated)
- `SMOKE_TEST.md` (updated)

**Dependencies:** STEP 39

**→ After this step: /ship** — then run full SMOKE_TEST.md V3 section

---

# V3 BUILD COMPLETE

## V3 Delivery Summary

| Step | What Was Built |
|---|---|
| 34 | Dependencies, DB migration, new types |
| 35 | .docx parser — section extraction, image extraction, table extraction |
| 36 | Guideline checker — 8 check functions, Claude API integration |
| 37 | .docx correction writer — Minor error application, Re_ prefix, _Checked suffix |
| 38 | Three API routes — check, apply-corrections, download |
| 39 | V3 UI — upload panel, findings panel, minor corrections diff view |
| 40 | Integration, hard block enforcement, iteration tracking, smoke tests |

## Key Technical Decisions Recorded

| Decision | Rationale |
|---|---|
| Claude API for semantic checks | Address matching, recommendation context, visual section analysis — too nuanced for regex |
| Regex for contact info | Phone/email patterns are deterministic — no need for AI |
| tesseract.js for coordinate OCR | Google Maps screenshots need text extraction from image |
| mammoth for extraction + docx for writing | mammoth reads best; docx npm writes cleanest Word XML |
| Hard block enforced at tRPC layer | UI block alone is not enough — server must reject Pass if major errors exist |
| Corrections applied in-memory | No need to store corrected version — generated fresh on download |
