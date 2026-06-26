import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, AlignmentType, BorderStyle,
  WidthType, Header, PageBreak, VerticalAlign, VerticalMergeType
} from 'docx';
import { RebarMeasurements, ExcelFloorData, ElementData } from '@/types';
import { ReportSections, FrontPageData, StaffMember } from '@/types/v4';
import {
  PURPOSE_OF_INVESTIGATION,
  LITERATURE_REVIEW_BODY,
  METHODOLOGY_SECTION,
  REBAR_ASSESSMENT_BODY
} from './constants';
import { formatReportDate } from "./report-engine";


// Helper to format average ECS number or other numbers
function fmtNum(n: number | undefined | null): string {
  if (n === undefined || n === null) return '0.00';
  return n.toFixed(2);
}

// Generate the filename of the report
export function generateDraftFilename(ndtCode: string): string {
  return `SKAAP_NDT_${ndtCode}_Draft.docx`;
}

// Helper to create table cells with margins, background color, and alignment
function cell(
  content: string | Paragraph[],
  options: { bold?: boolean; fill?: string; color?: string; align?: any; vMerge?: any } = {}
): TableCell {
  const { bold = false, fill, color, align = AlignmentType.LEFT, vMerge } = options;
  let paragraphs: Paragraph[];

  if (typeof content === 'string') {
    paragraphs = [
      new Paragraph({
        alignment: align,
        children: [
          new TextRun({
            text: content,
            font: "Arial",
            size: 20, // 10pt
            bold,
            color,
          })
        ]
      })
    ];
  } else {
    paragraphs = content;
  }

  return new TableCell({
    children: paragraphs,
    shading: fill ? { fill } : undefined,
    verticalMerge: vMerge,
    margins: {
      top: 120,
      bottom: 120,
      left: 150,
      right: 150,
    },
    verticalAlign: VerticalAlign.CENTER,
  });
}

// Helper to construct a paragraph with Arial font
function p(text: string | (TextRun | Paragraph)[], options: { bold?: boolean; align?: any; size?: number; spaceAfter?: number } = {}) {
  const { bold = false, align = AlignmentType.LEFT, size = 22, spaceAfter = 120 } = options;

  if (typeof text === 'string') {
    return new Paragraph({
      alignment: align,
      spacing: { after: spaceAfter },
      children: [
        new TextRun({
          text,
          font: "Arial",
          size,
          bold,
        })
      ]
    });
  }

  return new Paragraph({
    alignment: align,
    spacing: { after: spaceAfter },
    children: text as any
  });
}

// Headings
function h1(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 120 },
    children: [
      new TextRun({
        text,
        font: "Arial",
        size: 28, // 14pt
        bold: true,
      })
    ]
  });
}

function h2(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 180, after: 120 },
    children: [
      new TextRun({
        text,
        font: "Arial",
        size: 24, // 12pt
        bold: true,
      })
    ]
  });
}

export async function generateReportDocx(
  sections: ReportSections,
  project: { ndt_code: string; client_name: string; address: string; site_date: string; number_of_floors: number },
  staffNames: StaffMember[]
): Promise<Buffer> {
  const fp = sections.frontPage;

  // Front Page Elements
  const frontPageChildren: Paragraph[] = [
    // Reference in top right
    p(`REF: ${fp.ref}`, { align: AlignmentType.RIGHT, bold: true, size: 20 }),
    
    // Spacing
    ...Array(4).fill(0).map(() => p("")),

    // Main Title
    p("REPORT ON AN IN-SITU INTEGRITY TEST (NON-DESTRUCTIVE) OF COMPRESSIVE STRENGTH OF STRUCTURAL ELEMENTS", {
      align: AlignmentType.CENTER,
      bold: true,
      size: 32, // 16pt
    }),

    ...Array(2).fill(0).map(() => p("")),

    p("ON", { align: AlignmentType.CENTER, size: 24 }),

    ...Array(1).fill(0).map(() => p("")),

    p(fp.buildingState, { align: AlignmentType.CENTER, bold: true, size: 28 }),

    ...Array(2).fill(0).map(() => p("")),

    p("FOR", { align: AlignmentType.CENTER, size: 24 }),

    ...Array(1).fill(0).map(() => p("")),

    p(fp.clientName, { align: AlignmentType.CENTER, bold: true, size: 28 }),

    ...Array(2).fill(0).map(() => p("")),

    p("AT", { align: AlignmentType.CENTER, size: 24 }),

    ...Array(1).fill(0).map(() => p("")),

    p(fp.address, { align: AlignmentType.CENTER, bold: true, size: 24 }),

    ...Array(3).fill(0).map(() => p("")),
  ];

  // Client Email / Phone Table
  const contactTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          cell("CLIENT CONTACT DETAILS:", { bold: true, fill: "F1F5F9" }),
          cell(`Email: ${fp.email}\nPhone: ${fp.phone}`),
        ]
      })
    ]
  });

  frontPageChildren.push(new Paragraph({ children: [] }) as any); // Spacer
  frontPageChildren.push(contactTable as any);

  // Footer Company Metadata
  frontPageChildren.push(
    ...Array(4).fill(0).map(() => p("")),
    p("BY", { align: AlignmentType.CENTER, size: 20 }),
    p("SKAAP CONSULT", { align: AlignmentType.CENTER, bold: true, size: 26 }),
    p("SUITE 202, ALL SEASON'S PLACE, 74 ISHERI ROAD, BESIDE FRSC, OJODU BERGER, LAGOS STATE", { align: AlignmentType.CENTER, size: 18 }),
    p("LSMTL/2020/LAB-REG/D/003", { align: AlignmentType.CENTER, bold: true, size: 18 }),
    ...Array(2).fill(0).map(() => p("")),
    p(fp.date, { align: AlignmentType.CENTER, bold: true, size: 22 }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // Document Content Array
  const docChildren: any[] = [...frontPageChildren];

  // 1. Executive Summary
  docChildren.push(h1("EXECUTIVE SUMMARY"));
  const bullets = sections.executiveSummary.split('\n').filter(b => b.trim());
  bullets.forEach(bullet => {
    let cleanBullet = bullet.trim();
    if (cleanBullet.startsWith('-') || cleanBullet.startsWith('*') || /^\d+\./.test(cleanBullet)) {
      cleanBullet = cleanBullet.replace(/^[-*\d.]+\s*/, '');
    }
    docChildren.push(
      new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 120 },
        children: [
          new TextRun({
            text: cleanBullet,
            font: "Arial",
            size: 22,
          })
        ]
      })
    );
  });

  docChildren.push(new Paragraph({ children: [new PageBreak()] }));

  // 2. Introduction
  docChildren.push(h1("1.0. INTRODUCTION"));
  sections.introduction.split('\n').filter(pText => pText.trim()).forEach(pText => {
    docChildren.push(p(pText.trim()));
  });

  // 3. Purpose of Investigation
  docChildren.push(h1("2.0. PURPOSE OF INVESTIGATION"));
  PURPOSE_OF_INVESTIGATION.split('\n').filter(pText => pText.trim()).forEach(pText => {
    docChildren.push(p(pText.trim()));
  });

  docChildren.push(new Paragraph({ children: [new PageBreak()] }));

  // 4. Literature Review & Staff Table
  docChildren.push(h1("3.0. LITERATURE REVIEW"));
  LITERATURE_REVIEW_BODY.split('\n').filter(pText => pText.trim()).forEach(pText => {
    docChildren.push(p(pText.trim()));
  });

  docChildren.push(p(""));
  docChildren.push(p("Table 3.1: Personnel scheduled for the NDT site inspections:", { bold: true }));

  const staffTableRows = [
    new TableRow({
      children: [
        cell("S/N", { bold: true, fill: "1E293B", color: "FFFFFF" }),
        cell("Staff Name", { bold: true, fill: "1E293B", color: "FFFFFF" }),
        cell("Designation", { bold: true, fill: "1E293B", color: "FFFFFF" }),
        cell("Signature", { bold: true, fill: "1E293B", color: "FFFFFF" }),
      ]
    })
  ];

  staffNames.forEach((member, index) => {
    staffTableRows.push(
      new TableRow({
        children: [
          cell((index + 1).toString(), { align: AlignmentType.CENTER }),
          cell(member.full_name, { bold: true }),
          cell(member.role === 'ops_manager' || member.role === 'lab_owner' ? 'Operations Manager' : 'Field Engineer'),
          cell(""), // empty cell for manual signature
        ]
      })
    );
  });

  docChildren.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: staffTableRows
  }));

  docChildren.push(new Paragraph({ children: [new PageBreak()] }));

  // 5. Field Work
  const visitDateFormatted = formatReportDate(project.site_date);
  docChildren.push(h1("4.0. FIELD WORK"));
  const fieldWorkBody = `The field work was carried out on ${visitDateFormatted} and was completed on the same day. Visual test was carried out on the building to ascertain any possible structural defects (e.g. Cracks, differential settlement, spalling, honeycombs, hogging and Sagging). This is a vital aspect of non-destructive tests. The Standard Portable Ultrasonic Non-Destructive Digital Indicating Tester (Pundit) was employed for the estimation of compressive strength of the hardened concrete on the structural elements. Profoscope was used to locate the position of reinforcement bars (Rebar).

It is important to note that during the test some factors were taken into consideration, which may impact the result of the compressive strength of the structural members and Rebar. These are as follows:
- Surface conditions and moisture content of the existing concrete
- Path length, shape and size of the concrete member
- Temperature of concrete
- Concrete stress
- Effect of reinforcing bars

The scope of the work done are as follows:
1. Initial visual test was carried out on the building structure tested (i.e column, beam, slab, wall etc.)
2. Calibration of the Portable Ultrasonic Non-Destructive Digital Indicating Tester (PUNDIT) was done before commencing the test
3. Profoscope, Rebar locator was used to locate the reinforcement position, concrete cover measurement and Rebar size embedded in the structural members.
4. Indirect method was employed using 120mm spacing then, three (3) test points were randomly selected to get a good representation and result on each structural member, according to BS EN12504-4:2004, for testing concrete.`;

  fieldWorkBody.split('\n').filter(pText => pText.trim()).forEach(pText => {
    docChildren.push(p(pText.trim()));
  });

  // 6. Visual Test
  docChildren.push(h1("5.0. VISUAL TEST"));
  docChildren.push(p("From the visual inspection conducted on the building the following observations were noted and recorded as at the time of test."));
  docChildren.push(p("[⚠ REPORT BOT PLACEHOLDER — STAFF TO COMPLETE THIS SECTION]", { bold: true }));
  docChildren.push(p("Please add the visual inspection findings from the site visit before sending to Proofread Bot. Include:"));
  docChildren.push(p("- Building type and number of floors\n- Building usage/purpose\n- Structural defects observed (cracks, spalling, honeycombs, settlement, etc.)\n- Condition of structural members (columns, beams, slabs)\n- Any sagging, hogging, or settlement observed"));
  docChildren.push(p("Following the aforementioned, a Non-Destructive Test was conducted. The photograph in the appendix of this report shows the physical state of the building structure as at test time."));

  docChildren.push(new Paragraph({ children: [new PageBreak()] }));

  // 7. Methodology
  docChildren.push(h1("6.0. METHODOLOGY"));
  METHODOLOGY_SECTION.split('\n').filter(pText => pText.trim()).forEach(pText => {
    docChildren.push(p(pText.trim()));
  });

  // 8. Rebar Assessment & Rebar Table
  docChildren.push(h1("7.0. REBAR ASSESSMENT"));
  REBAR_ASSESSMENT_BODY.split('\n').filter(pText => pText.trim()).forEach(pText => {
    docChildren.push(p(pText.trim()));
  });

  docChildren.push(p(""));
  docChildren.push(p("Table 7.1: Summary of Rebar/Reinforcement Details:", { bold: true }));

  const rebar = sections.rebarTable;
  const rebarTableRows = [
    new TableRow({
      children: [
        cell("Structural Member", { bold: true, fill: "1E293B", color: "FFFFFF" }),
        cell("Main Bar (mm)", { bold: true, fill: "1E293B", color: "FFFFFF", align: AlignmentType.CENTER }),
        cell("Links (mm)", { bold: true, fill: "1E293B", color: "FFFFFF", align: AlignmentType.CENTER }),
        cell("Spacing (mm)", { bold: true, fill: "1E293B", color: "FFFFFF", align: AlignmentType.CENTER }),
        cell("Cover Depth (mm)", { bold: true, fill: "1E293B", color: "FFFFFF", align: AlignmentType.CENTER }),
      ]
    }),
    new TableRow({
      children: [
        cell("Column", { bold: true }),
        cell(rebar.column.mainBar.toString(), { align: AlignmentType.CENTER }),
        cell(rebar.column.links.toString(), { align: AlignmentType.CENTER }),
        cell(rebar.column.spacing.toString(), { align: AlignmentType.CENTER }),
        cell(rebar.column.coverDepth.toString(), { align: AlignmentType.CENTER }),
      ]
    }),
    new TableRow({
      children: [
        cell("Beam", { bold: true }),
        cell(rebar.beam.mainBar.toString(), { align: AlignmentType.CENTER }),
        cell(rebar.beam.links.toString(), { align: AlignmentType.CENTER }),
        cell(rebar.beam.spacing.toString(), { align: AlignmentType.CENTER }),
        cell(rebar.beam.coverDepth.toString(), { align: AlignmentType.CENTER }),
      ]
    }),
    new TableRow({
      children: [
        cell("Slab", { bold: true }),
        cell(rebar.slab.mainBar.toString(), { align: AlignmentType.CENTER }),
        cell(rebar.slab.links > 0 ? rebar.slab.links.toString() : "-", { align: AlignmentType.CENTER }),
        cell(rebar.slab.spacing.toString(), { align: AlignmentType.CENTER }),
        cell(rebar.slab.coverDepth.toString(), { align: AlignmentType.CENTER }),
      ]
    })
  ];

  docChildren.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rebarTableRows
  }));

  docChildren.push(new Paragraph({ children: [new PageBreak()] }));

  // 9. Analysis of Test Results
  docChildren.push(h1("8.0. ANALYSIS OF TEST RESULTS"));
  docChildren.push(p("The analysis of concrete strength results was processed floor by floor based on the scientific observations taken during testing."));

  let tableCounter = 1;
  const floors = sections.analysisContent.floorsData;

  for (const floor of floors) {
    docChildren.push(h2(floor.floorName.toUpperCase()));

    // A. Floor Summary Table
    docChildren.push(p(`Table 8.${tableCounter}: Summary of Test Points for ${floor.floorName}:`, { bold: true }));
    tableCounter++;

    const summaryTableRows = [
      new TableRow({
        children: [
          cell("Structural Member", { bold: true, fill: "1E293B", color: "FFFFFF" }),
          cell("Number of Elements", { bold: true, fill: "1E293B", color: "FFFFFF", align: AlignmentType.CENTER }),
          cell("Test Points Taken", { bold: true, fill: "1E293B", color: "FFFFFF", align: AlignmentType.CENTER }),
        ]
      }),
      new TableRow({
        children: [
          cell("Column"),
          cell(floor.columns.length.toString(), { align: AlignmentType.CENTER }),
          cell((floor.columns.length * 3).toString(), { align: AlignmentType.CENTER }),
        ]
      }),
      new TableRow({
        children: [
          cell("Beam"),
          cell(floor.beams.length.toString(), { align: AlignmentType.CENTER }),
          cell((floor.beams.length * 3).toString(), { align: AlignmentType.CENTER }),
        ]
      }),
      new TableRow({
        children: [
          cell("Slab"),
          cell(floor.slabs.length.toString(), { align: AlignmentType.CENTER }),
          cell((floor.slabs.length * 3).toString(), { align: AlignmentType.CENTER }),
        ]
      }),
      new TableRow({
        children: [
          cell("Shear Wall"),
          cell(floor.shearWalls.length.toString(), { align: AlignmentType.CENTER }),
          cell((floor.shearWalls.length * 3).toString(), { align: AlignmentType.CENTER }),
        ]
      })
    ];

    docChildren.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: summaryTableRows
    }));

    docChildren.push(p(""));

    // B. Floor Detailed UPV Table
    docChildren.push(p(`Table 8.${tableCounter}: UPV Compressive Strength Details for ${floor.floorName}:`, { bold: true }));
    tableCounter++;

    const detailTableRows = [
      new TableRow({
        children: [
          cell("Structural Element", { bold: true, fill: "1E293B", color: "FFFFFF" }),
          cell("Trials", { bold: true, fill: "1E293B", color: "FFFFFF", align: AlignmentType.CENTER }),
          cell("Transmission Time (µs)", { bold: true, fill: "1E293B", color: "FFFFFF", align: AlignmentType.CENTER }),
          cell("Path Length (mm)", { bold: true, fill: "1E293B", color: "FFFFFF", align: AlignmentType.CENTER }),
          cell("Velocity (Km/s)", { bold: true, fill: "1E293B", color: "FFFFFF", align: AlignmentType.CENTER }),
          cell("ECS (N/mm²)", { bold: true, fill: "1E293B", color: "FFFFFF", align: AlignmentType.CENTER }),
          cell("Average ECS (N/mm²)", { bold: true, fill: "1E293B", color: "FFFFFF", align: AlignmentType.CENTER }),
          cell("Remark", { bold: true, fill: "1E293B", color: "FFFFFF", align: AlignmentType.CENTER }),
        ]
      })
    ];

    const allFloorElems = [...floor.columns, ...floor.beams, ...floor.slabs, ...floor.shearWalls];

    allFloorElems.forEach((elem, elementIdx) => {
      // 3 trials: A, B, C
      const trialA = elem.trials.find(t => t.trial === 'A') || { transmissionTime: 0, pathLength: 0, velocity: 0, ecs: 0 };
      const trialB = elem.trials.find(t => t.trial === 'B') || { transmissionTime: 0, pathLength: 0, velocity: 0, ecs: 0 };
      const trialC = elem.trials.find(t => t.trial === 'C') || { transmissionTime: 0, pathLength: 0, velocity: 0, ecs: 0 };

      const rowShading = elementIdx % 2 === 0 ? undefined : "F8FAFC";
      const remarkColor = elem.remark === 'GOOD' ? "10B981" : "EF4444";

      // Row 1 (Trial A)
      detailTableRows.push(
        new TableRow({
          children: [
            cell(elem.elementId, { bold: true, fill: rowShading, vMerge: VerticalMergeType.RESTART }),
            cell("A", { align: AlignmentType.CENTER, fill: rowShading }),
            cell(trialA.transmissionTime.toString(), { align: AlignmentType.CENTER, fill: rowShading }),
            cell(trialA.pathLength.toString(), { align: AlignmentType.CENTER, fill: rowShading }),
            cell(fmtNum(trialA.velocity), { align: AlignmentType.CENTER, fill: rowShading }),
            cell(fmtNum(trialA.ecs), { align: AlignmentType.CENTER, fill: rowShading }),
            cell(fmtNum(elem.averageEcs), { bold: true, align: AlignmentType.CENTER, fill: rowShading, vMerge: VerticalMergeType.RESTART }),
            cell(elem.remark, { bold: true, color: remarkColor, align: AlignmentType.CENTER, fill: rowShading, vMerge: VerticalMergeType.RESTART }),
          ]
        })
      );

      // Row 2 (Trial B)
      detailTableRows.push(
        new TableRow({
          children: [
            cell("", { fill: rowShading, vMerge: VerticalMergeType.CONTINUE }),
            cell("B", { align: AlignmentType.CENTER, fill: rowShading }),
            cell(trialB.transmissionTime.toString(), { align: AlignmentType.CENTER, fill: rowShading }),
            cell(trialB.pathLength.toString(), { align: AlignmentType.CENTER, fill: rowShading }),
            cell(fmtNum(trialB.velocity), { align: AlignmentType.CENTER, fill: rowShading }),
            cell(fmtNum(trialB.ecs), { align: AlignmentType.CENTER, fill: rowShading }),
            cell("", { fill: rowShading, vMerge: VerticalMergeType.CONTINUE }),
            cell("", { fill: rowShading, vMerge: VerticalMergeType.CONTINUE }),
          ]
        })
      );

      // Row 3 (Trial C)
      detailTableRows.push(
        new TableRow({
          children: [
            cell("", { fill: rowShading, vMerge: VerticalMergeType.CONTINUE }),
            cell("C", { align: AlignmentType.CENTER, fill: rowShading }),
            cell(trialC.transmissionTime.toString(), { align: AlignmentType.CENTER, fill: rowShading }),
            cell(trialC.pathLength.toString(), { align: AlignmentType.CENTER, fill: rowShading }),
            cell(fmtNum(trialC.velocity), { align: AlignmentType.CENTER, fill: rowShading }),
            cell(fmtNum(trialC.ecs), { align: AlignmentType.CENTER, fill: rowShading }),
            cell("", { fill: rowShading, vMerge: VerticalMergeType.CONTINUE }),
            cell("", { fill: rowShading, vMerge: VerticalMergeType.CONTINUE }),
          ]
        })
      );
    });

    docChildren.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: detailTableRows
    }));

    docChildren.push(new Paragraph({ children: [new PageBreak()] }));
  }

  // 10. Recommendation
  docChildren.push(h1("9.0. RECOMMENDATION"));
  docChildren.push(p("Following the structural assessments and calculations conducted:"));
  docChildren.push(p(sections.recommendation));

  // 11. Conclusion
  docChildren.push(h1("10.0. CONCLUSION"));
  sections.conclusion.split('\n').filter(pText => pText.trim()).forEach(pText => {
    docChildren.push(p(pText.trim()));
  });

  docChildren.push(new Paragraph({ children: [new PageBreak()] }));

  // 12. Appendix Placeholders
  docChildren.push(h1("APPENDIX"));
  docChildren.push(h2("I. SKETCH OF THE BUILDING"));
  docChildren.push(p("[⚠ STAFF: Please add AutoCAD sketch of the building here]"));
  docChildren.push(p(""));
  
  docChildren.push(h2("II. PHOTOGRAPHS OF THE BUILDING"));
  docChildren.push(p("Page 7 — Location Map:"));
  docChildren.push(p("[⚠ STAFF: Please add Google Maps screenshot showing site coordinates here]"));
  docChildren.push(p(""));
  docChildren.push(p("[⚠ STAFF: Please add site photographs here]"));

  docChildren.push(new Paragraph({ children: [new PageBreak()] }));

  // 13. Signing officers block
  docChildren.push(p(""));
  docChildren.push(p("SIGNING OFFICERS AND FIELD TEAM:", { bold: true }));
  docChildren.push(p(""));

  const sigTableRows = [
    new TableRow({
      children: [
        cell("Engr. Olabanji A. Skaap\nManaging Director\n(SKAAP CONSULT)\n\n\n\n\n\n__________________________\nSignature", { bold: true }),
        cell(
          staffNames[0]
            ? `${staffNames[0].full_name}\n${staffNames[0].role === 'ops_manager' || staffNames[0].role === 'lab_owner' ? 'Operations Manager' : 'Field Engineer'}\n(Field Lead)\n\n\n\n\n\n__________________________\nSignature`
            : "\n\n\n\n\n\n\n__________________________\nSignature",
          { bold: true }
        ),
        cell(
          staffNames[1]
            ? `${staffNames[1].full_name}\nField Engineer\n\n\n\n\n\n\n__________________________\nSignature`
            : "\n\n\n\n\n\n\n__________________________\nSignature",
          { bold: true }
        ),
        cell(
          staffNames[2]
            ? `${staffNames[2].full_name}\nField Engineer\n\n\n\n\n\n\n__________________________\nSignature`
            : "\n\n\n\n\n\n\n__________________________\nSignature",
          { bold: true }
        ),
      ]
    })
  ];

  docChildren.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: sigTableRows
  }));

  // Create the Document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docChildren,
      }
    ]
  });

  return await Packer.toBuffer(doc);
}
