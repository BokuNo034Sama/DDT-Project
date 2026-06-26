import Anthropic from '@anthropic-ai/sdk';
import { ExcelFloorData, RebarMeasurements } from '@/types';
import { ReportBotInput, FrontPageData, AnalysisContent, ReportSections } from '@/types/v4';
import { SYSTEM_PROMPT } from './constants';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Helper to format date into "6th of March 2026"
export function formatReportDate(dateString: string): string {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return dateString;

  const day = d.getDate();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();

  let suffix = "th";
  if (day === 1 || day === 21 || day === 31) suffix = "st";
  else if (day === 2 || day === 22) suffix = "nd";
  else if (day === 3 || day === 23) suffix = "rd";

  return `${day}${suffix} of ${month} ${year}`;
}

export function generateFrontPage(data: ReportBotInput): FrontPageData {
  return {
    ref: `SKAAP/NDT/${data.ndtCode}`,
    buildingState: data.buildingState, // "AN EXISTING BUILDING" or "ONGOING CONSTRUCTION"
    clientName: data.clientName,
    address: data.address,
    email: data.clientEmail || '',
    phone: data.clientPhone || '',
    date: formatReportDate(data.siteDate),
  };
}

async function callClaude(prompt: string): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    });
    return response.content[0].type === 'text' ? response.content[0].text.trim() : '';
  } catch (error: any) {
    console.error("Claude call failed:", error);
    throw new Error(`Claude generation error: ${error.message}`);
  }
}

export async function generateExecutiveSummary(data: ReportBotInput): Promise<string> {
  const prompt = `You are writing the Executive Summary for an NDT structural integrity report.
Write exactly 3 bullet points following this EXACT format:

Bullet 1 (always identical):
"In situ Integrity Test (Non-Destructive) of compressive strength of structural members."

Bullet 2 (variable — fill in the data):
"[building state description] belonging to [CLIENT NAME] at [ADDRESS]. The Non-Destructive Integrity Test was carried out on the [date] with the intention to determine the residual compressive strength of concrete components of the structural members considered to be critical to stability, robustness and general safety of the entire building structure in its present state."

Bullet 3 (variable — based on overall result):
"The test analysis revealed that [all/the accessible] structural members tested on the building were of good strength indicating overall structural integrity. The visual inspection revealed [PLACEHOLDER — TO BE COMPLETED BY STAFF AFTER VISUAL INSPECTION]. [CLIENT NAME] was referred to a qualified structural engineer [RECOMMENDATION TEMPLATE]."

DATA:
Client Name: ${data.clientName}
Address: ${data.address}
Building State: ${data.buildingState}
Site Date: ${formatReportDate(data.siteDate)}
Overall Test Result: ${data.overallResult}
Recommendation Template: ${data.recommendationTemplate}

RULES:
- Building state description: if ongoing construction say "An ongoing construction"
  if existing building say "An existing building"
- Use exact recommendation wording from template provided
- Bullet 3 visual inspection part: write exactly:
  "[VISUAL INSPECTION SUMMARY — TO BE COMPLETED BY STAFF]"
- Respond with ONLY the 3 bullet points, no other text. No preamble or conversational text.`;

  return callClaude(prompt);
}

export async function generateIntroduction(data: ReportBotInput): Promise<string> {
  const prompt = `Write the INTRODUCTION section for an NDT structural integrity report.

TEMPLATE (follow this exactly, fill in the [VARIABLES]):
"Non-Destructive Test (NDT), as the name implies, means that the material under the test is not damaged during test. Direct measurement of the strength of concrete involves destructive stress and cannot be used for determining the quality of already cast concrete. It is for this reason that direct methods are not employed in determining the strength of in-situ concrete. As a result, indirect methods were used.

A Non-Destructive compressive strength test (Integrity Test) was conducted on [BUILDING DESCRIPTION: e.g. "an existing 4-floor building" or "an ongoing 3-floor construction"] located at [ADDRESS].

The map showing the exact location of the site is on page 7.

[DRAWING STATEMENT — choose one]:
  IF drawing provided: "Architectural and Structural drawing were provided, and a concrete design strength of [GRADE]N/MM2 was used for the analysis of the structural members. To aid the intending test a sketch was drawn."
  IF NOT provided: "Architectural drawing and Structural drawing were not provided, therefore, an assumed design strength of 25N/MM2 was used for the analysis of the structural members. To aid the intending test a sketch was drawn."

Additionally, the soil test report was not provided before and after the test."

DATA:
Building State: ${data.buildingState}
Number of Floors: ${data.numberOfFloors}
Address: ${data.address}
Drawing Provided: ${data.drawingProvided}
Concrete Grade: ${data.concreteGrade}

Respond with ONLY the introduction text, no headers, no labels. No preamble or conversational text.`;

  return callClaude(prompt);
}

export async function generateConclusion(data: ReportBotInput): Promise<string> {
  const poorElementsCount = data.excelData.reduce((acc, f) => {
    const all = [...f.columns, ...f.beams, ...f.slabs, ...f.shearWalls];
    return acc + all.filter(e => e.remark === 'POOR').length;
  }, 0);

  const prompt = `Write the CONCLUSION section for an NDT structural integrity report.

TEMPLATE (follow this exactly, fill in the [VARIABLES]):
"The visual and structural integrity test was conducted in accordance with BS EN 12504-4:2004, BS 1881: Part 201: 1986, BS 4408: Part 5: 1974. The outcome of the test results analyzed is represented through Bar charts on page ([PAGE_NUMBER]) of this report.

1. The bar chart shows the summary of all the test results, in percentage of strength for each structural member which revealed that [ALL/MAJORITY] the accessible structural elements tested have strength above the [assumed/stated] design strength of [GRADE]N/mm² and were rated good. [CORRECTIVE MEASURE STATEMENT if any poor results]

2. However, it is imperative to state clearly that non-adherence to the recommendation excludes us from any responsibility.

Note: The test assumed [GRADE]N/mm² as the strength of the structural members, however a substructure probe is required to ascertain the integrity of the building foundation."

DATA:
Concrete Grade: ${data.concreteGrade}
Drawing Provided: ${data.drawingProvided}
Overall Result: ${data.overallResult}
Poor Elements Found: ${poorElementsCount}

RULES for [CORRECTIVE MEASURE STATEMENT if any poor results]:
- If Poor Elements Found is 0, omit the statement.
- If Poor Elements Found > 0, include statement: "For elements rated poor, remedial measures such as retrofitting or structural strengthening are recommended under the supervision of a registered structural engineer."
- Choose [ALL] if Poor Elements Found is 0, choose [MAJORITY] if Poor Elements Found > 0.
- Assumed/stated design strength: if drawingProvided is true say "stated", if false say "assumed".

Respond with ONLY the conclusion text. No preamble or conversational text.`;

  return callClaude(prompt);
}

export function generateAnalysisContent(floors: ExcelFloorData[]): AnalysisContent {
  return {
    floorSummaries: [], // will be derived in docx writer / routes
    floorsData: floors,
  };
}

export function generateRecommendation(
  buildingState: string,
  visualInspectionNotes: string // will be "[PLACEHOLDER]" at draft stage
): string {
  if (buildingState === "ONGOING CONSTRUCTION" || buildingState.toUpperCase().includes("CONSTRUCTION")) {
    return "the client was referred to a qualified structural engineer and other building professionals for further evaluation to provide technical and structural recommendations, and to assess the building's suitability for continued use.";
  }
  if (visualInspectionNotes.includes("POOR") || visualInspectionNotes.includes("DEFECT") || visualInspectionNotes === "[PLACEHOLDER]") {
    // Default to Template A if defects might be present or at draft stage
    return "the client was referred to a qualified structural engineer for further evaluation to provide technical, structural and remedial recommendations, and to assess the building's suitability for continued use.";
  }
  // Otherwise default template
  return "the client was referred to a qualified structural engineer for further evaluation to provide technical and structural recommendations, and to assess the building's suitability for continued use.";
}

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
  ]);

  const analysisContent = generateAnalysisContent(input.excelData);
  const recommendation = generateRecommendation(input.buildingState, '[PLACEHOLDER]');

  return {
    frontPage,
    executiveSummary,
    introduction,
    rebarTable: input.rebarData,
    analysisContent,
    recommendation,
    conclusion,
  };
}
