import Anthropic from "@anthropic-ai/sdk";
import { ReportCheckResult, BaseCheckResult } from "@/types";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const JSON_INSTRUCTION = `You must respond with valid JSON matching this TypeScript interface exactly:
{
  "passed": boolean,
  "issues": string[], // List of specific violations found
  "suggestions": string[] // List of exact wording or data corrections
}`;

async function runCheck(
  systemPrompt: string,
  userPrompt: string
): Promise<BaseCheckResult> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20240620",
      max_tokens: 1024,
      system: systemPrompt + "\n\n" + JSON_INSTRUCTION,
      messages: [{ role: "user", content: userPrompt }],
      temperature: 0,
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '{}';
    
    // Extract JSON in case the model wraps it in markdown blocks
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : content;
    
    const parsed = JSON.parse(jsonStr) as BaseCheckResult;
    return parsed;
  } catch (error) {
    console.error("AI Check failed:", error);
    return { passed: false, issues: ["Failed to run AI check due to an internal error."], suggestions: [] };
  }
}

export async function evaluateReport(
  rawText: string,
  htmlContent: string,
  tables: string[],
  ocrText: { filename: string; text: string }[]
): Promise<ReportCheckResult> {
  const documentContext = `
DOCUMENT TEXT:
${rawText.substring(0, 50000)}

TABLES:
${tables.join("\n")}

IMAGE TEXT (OCR):
${ocrText.map(o => o.text).join("\n")}
`;

  // Parallel execution of all 8 checks
  const [
    boilerPlate,
    reboundHammer,
    rebarDepth,
    coreCompressive,
    upvTesting,
    carbonation,
    crackMeasurement,
    conclusion
  ] = await Promise.all([
    // 1. Boilerplate Check
    runCheck(
      "You are a structural engineering proofreader checking against LSMTL Guidelines. Ensure the report has the correct 'DDT Structure' boilerplate, header, date, and client details.",
      `Evaluate the following document context for boilerplate completeness.\n${documentContext}`
    ),
    // 2. Rebound Hammer Range
    runCheck(
      "You are a structural engineering proofreader checking against LSMTL Guidelines. Verify that Rebound Hammer test values are within reasonable expected ranges for structural concrete (e.g., 20-60). Identify any impossible or clearly erroneous values.",
      `Evaluate the rebound hammer data in the document context.\n${documentContext}`
    ),
    // 3. Rebar Depth
    runCheck(
      "You are a structural engineering proofreader checking against LSMTL Guidelines. Verify rebar cover/depth readings. Check that they align with typical standard covers (e.g. 25mm to 50mm) and flag anomalies.",
      `Evaluate the rebar depth data in the document context.\n${documentContext}`
    ),
    // 4. Core Compressive Strength check
    runCheck(
      "You are a structural engineering proofreader checking against LSMTL Guidelines. Verify core compressive strength results. Check core sizes, load to failure, and final MPa calculations for basic arithmetic errors and expected ranges (10MPa - 60MPa).",
      `Evaluate the core compressive strength data in the document context.\n${documentContext}`
    ),
    // 5. UPV testing
    runCheck(
      "You are a structural engineering proofreader checking against LSMTL Guidelines. Verify Ultrasonic Pulse Velocity (UPV) readings. Check that velocity classifications (e.g., Good, Doubtful) match standard empirical tables (e.g., > 4.5 km/s = Excellent).",
      `Evaluate the UPV testing data in the document context.\n${documentContext}`
    ),
    // 6. Carbonation
    runCheck(
      "You are a structural engineering proofreader checking against LSMTL Guidelines. Verify carbonation depth test results. Ensure the depth reported makes sense relative to the rebar cover to assess corrosion risk.",
      `Evaluate the carbonation data in the document context.\n${documentContext}`
    ),
    // 7. Crack Measurement
    runCheck(
      "You are a structural engineering proofreader checking against LSMTL Guidelines. Verify crack width measurements. Flag any structural cracks > 0.3mm that lack severe warning notes.",
      `Evaluate the crack measurement data in the document context.\n${documentContext}`
    ),
    // 8. Conclusion
    runCheck(
      "You are a structural engineering proofreader checking against LSMTL Guidelines. Ensure the final structural conclusion aligns logically with the data presented (e.g., if core strengths are low, the conclusion must not say the structure is perfectly safe without caveat).",
      `Evaluate the conclusion alignment in the document context.\n${documentContext}`
    )
  ]);

  return {
    boiler_plate: boilerPlate,
    rebound_hammer: reboundHammer,
    rebar_depth: rebarDepth,
    core_compressive: coreCompressive,
    upv_testing: upvTesting,
    carbonation: carbonation,
    crack_measurement: crackMeasurement,
    conclusion: conclusion,
  };
}
