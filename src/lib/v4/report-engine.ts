import Anthropic from '@anthropic-ai/sdk';
import { ExcelFloorData } from '@/types';
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
      model: 'claude-sonnet-4-20250514',
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
  const prompt = `Write the Executive Summary for this NDT report as exactly 3 bullet points.

DATA:
Client Name: ${data.clientName}
Address: ${data.address}
Building State: ${data.buildingState} (An ongoing construction / An existing building)
Site Date: ${formatReportDate(data.siteDate)}
Number of Floors: ${data.numberOfFloors}
Overall Result: ${data.overallResult} ('all_good' or 'has_poor')

BULLET 1 (always fixed):
"In situ Integrity Test (Non- Destructive) of compressive strength of structural members."

BULLET 2 (fill in the data):
"${data.buildingState === "ONGOING CONSTRUCTION" ? "An ongoing construction" : "An existing building"} belonging to ${data.clientName} at ${data.address}. The Non-Destructive Integrity Test was carried out on the ${formatReportDate(data.siteDate)} with the intention to determine the residual compressive strength of concrete components of the structural members considered to be critical to stability, robustness and general safety of the entire building structure in its present state."

BULLET 3 (use EXACTLY this wording with client name filled in):
${data.overallResult === 'all_good' && data.buildingState === "ONGOING CONSTRUCTION" ? `
"The test analysis revealed that all the structural members tested on the building were of good strength and hence, ${data.clientName} was advised to engage a qualified structural engineer and other building professionals for further evaluation to provide technical, structural, and remedial recommendations, and to assess the building's suitability for continued use."
` : ''}${data.overallResult === 'all_good' && data.buildingState !== "ONGOING CONSTRUCTION" ? `
"The test analysis revealed that all the structural members tested on the building were of good strength and hence, ${data.clientName} was advised to engage a qualified structural engineer for further evaluation to provide technical and structural recommendations, and to assess the building's suitability for continued use."
` : ''}${data.overallResult === 'has_poor' ? `
"The test analysis revealed that some structural members tested on the building were rated poor and hence, ${data.clientName} was advised to engage a qualified structural engineer and other building professionals for further evaluation to provide technical, structural, and remedial recommendations, and to assess the building's suitability for continued use."
` : ''}

NOTE: Add a 4th item as a highlighted placeholder:
"[⚠ HIGHLIGHT: VISUAL INSPECTION SUMMARY — STAFF TO COMPLETE THIS SECTION BEFORE SENDING TO PROOFREAD BOT]"

Respond with ONLY the 3 bullets + the placeholder. No other text.`;

  return callClaude(prompt);
}

export async function generateIntroduction(data: ReportBotInput): Promise<string> {
  const prompt = `Write the INTRODUCTION section. Follow this template exactly:

"Non-Destructive Test (NDT), as the name implies, means that the material under the test is not damaged during test. Direct measurement of the strength of concrete involves destructive stress and cannot be used for determining the quality of already cast concrete. It is for this reason that direct methods are not employed in determining the strength of in-situ concrete. As a result, indirect methods were used.

A Non-Destructive compressive strength test (Integrity Test) was conducted on ${
    data.buildingState === "ONGOING CONSTRUCTION"
      ? `an ongoing ${data.numberOfFloors}-floor construction`
      : `an existing ${data.numberOfFloors}-floor building`
  } located at ${data.address}.

The map showing the exact location and weather condition of the site is on page 7.

${
  data.drawingProvided
    ? `Architectural and Structural drawing were provided, and a concrete design strength of ${data.concreteGrade}N/MM2 was used for the analysis of the structural members. To aid the intending test a sketch was drawn.`
    : `Architectural drawing and Structural drawing were not provided, therefore, an assumed strength of 25N/MM2 was used for the analysis of the structural members. To aid the intending test a sketch was drawn.`
}

Additionally, the soil test report was not provided before and after the test."

DATA:
Building State: ${data.buildingState}
Number of Floors: ${data.numberOfFloors}
Address: ${data.address}
Drawing Provided: ${data.drawingProvided}
Concrete Grade: ${data.concreteGrade}

Respond with ONLY the introduction text.`;

  return callClaude(prompt);
}

export async function generateConclusion(data: ReportBotInput): Promise<string> {
  // Estimate page range: start page is 9 + floors, end page is start page + floors - 1
  const startPage = 9 + data.numberOfFloors;
  const endPage = startPage + data.numberOfFloors - 1;
  const pageRange = data.numberOfFloors === 1 ? `${startPage}` : `${startPage}-${endPage}`;

  const prompt = `Write the CONCLUSION section:

"The visual and structural integrity test was conducted in accordance with BS EN 12504-4:2004, BS 1881: Part 201: 1986, BS 4408: Part 5: 1974. The outcome of the test results analyzed is represented through Bar charts on page (${pageRange}) of this report.

1. The bar chart shows the summary of all the test results, in percentage of strength for each structural member which revealed that ${
    data.overallResult === 'all_good' ? 'all' : 'the accessible'
  } the accessible structural elements tested have strength above the ${
    data.drawingProvided ? 'stated' : 'assumed'
  } design strength of ${data.concreteGrade}N/mm² and were rated good. ${
    data.overallResult === 'has_poor'
      ? "It is compulsory to carry out the corrective measure(s) as recommended above to guarantee the strength/stability of the poor structural members in order to avert any future collapse."
      : ""
  }

2. However, it is imperative to state clearly that non-adherence to the recommendation excludes us from any responsibility.

Note: The test ${
    data.drawingProvided ? 'used' : 'assumed'
  } ${data.concreteGrade}N/mm² as the strength of the structural members, however a substructure probe is required to ascertain the integrity of the building foundation."

DATA:
Concrete Grade: ${data.concreteGrade}
Drawing Provided: ${data.drawingProvided}
Overall Result: ${data.overallResult}
Page Range for bar charts: ${pageRange}

Respond with ONLY the conclusion text.`;

  return callClaude(prompt);
}

export function generateAnalysisContent(floors: ExcelFloorData[]): AnalysisContent {
  return {
    floorSummaries: [], // will be derived in docx writer / routes
    floorsData: floors,
  };
}

export function generateRecommendation(pageRange: string): string {
  return `Based on the outcome of the Visual and Non-Destructive Test carried out on the building which shows its status as described in the visual test and depicted in the bar charts page (${pageRange}) at the time of test, it is therefore advised that:

- A qualified structural engineer and other building professionals should be engaged to proffer technical and structural recommendations for the building to be structurally stable and to assess the building's suitability for continued use.`;
}

export async function runReportBot(input: ReportBotInput): Promise<ReportSections> {
  const startPage = 9 + input.numberOfFloors;
  const endPage = startPage + input.numberOfFloors - 1;
  const pageRange = input.numberOfFloors === 1 ? `${startPage}` : `${startPage}-${endPage}`;

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
  const recommendation = generateRecommendation(pageRange);

  return {
    frontPage,
    executiveSummary,
    introduction,
    rebarTable: input.rebarData,
    analysisContent,
    recommendation,
    conclusion,
    equipmentChecks: input.equipmentChecks,
  };
}
