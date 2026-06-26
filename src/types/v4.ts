import { RebarMeasurements, ExcelFloorData } from "./index";

export interface ReportBotInput {
  projectId: string;
  ndtCode: string;
  buildingState: "AN EXISTING BUILDING" | "ONGOING CONSTRUCTION";
  clientName: string;
  address: string;
  clientEmail: string | null;
  clientPhone: string | null;
  siteDate: string;
  numberOfFloors: number;
  drawingProvided: boolean;
  concreteGrade: string;
  rebarData: RebarMeasurements;
  excelData: ExcelFloorData[];
  overallResult: "all_good" | "majority_good" | "mixed";
  recommendationTemplate: string;
}

export interface FrontPageData {
  ref: string;
  buildingState: string;
  clientName: string;
  address: string;
  email: string;
  phone: string;
  date: string;
}

export interface FloorSummary {
  floorName: string;
  columns: { count: number; pointsTaken: number };
  beams: { count: number; pointsTaken: number };
  slabs: { count: number; pointsTaken: number };
  shearWalls: { count: number; pointsTaken: number };
}

export interface AnalysisContent {
  floorSummaries: FloorSummary[];
  floorsData: ExcelFloorData[];
}

export interface ReportSections {
  frontPage: FrontPageData;
  executiveSummary: string;
  introduction: string;
  rebarTable: RebarMeasurements;
  analysisContent: AnalysisContent;
  recommendation: string;
  conclusion: string;
}

export interface StaffMember {
  id: string;
  full_name: string;
  role: string;
}
