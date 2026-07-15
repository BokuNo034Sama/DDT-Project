import * as XLSX from 'xlsx';
import { ExcelFloorData, ElementData } from '@/types';
import { FloorSummary } from '@/types/v4';

const FLOOR_NAMES: Record<string, string> = {
  'Gf': 'Ground Floor',
  'GF': 'Ground Floor',
  'FF': 'First Floor',
  'SF': 'Second Floor',
  'TF': 'Third Floor',
  'FoF': 'Fourth Floor',
  'FiF': 'Fifth Floor',
  '6F': 'Sixth Floor',
  'RF': 'Roof Floor',
};

const FLOOR_ORDER: Record<string, number> = {
  'GF': 0,
  'GF_': 0,
  'GF1': 0,
  'FF': 1,
  'SF': 2,
  'TF': 3,
  'FOF': 4,
  'FIF': 5,
  '6F': 6,
  'RF': 7,
};

function getElementType(id: string): 'column' | 'beam' | 'slab' | 'shearWall' {
  const cleanId = id.trim().toUpperCase();
  if (cleanId.startsWith('SH')) return 'shearWall';
  if (cleanId.startsWith('C')) return 'column';
  if (cleanId.startsWith('B')) return 'beam';
  if (cleanId.startsWith('S')) return 'slab';
  return 'column';
}

function parseGroup(
  rows: any[][],
  elemIdIdx: number,
  trialIdx: number,
  transIdx: number,
  pathIdx: number,
  velIdx: number,
  ecsIdx: number,
  avgEcsIdx: number,
  remIdx: number
): ElementData[] {
  const elements: ElementData[] = [];
  let currentElement: Partial<ElementData> | null = null;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const rawElemId = row[elemIdIdx];
    const trialName = row[trialIdx]?.toString().trim().toUpperCase();

    if (rawElemId && rawElemId.toString().trim()) {
      // If we already have a current element, save it
      if (currentElement && currentElement.elementId && currentElement.trials?.length) {
        elements.push(currentElement as ElementData);
      }
      currentElement = {
        elementId: rawElemId.toString().trim(),
        trials: [],
        averageEcs: 0,
        remark: 'POOR',
      };
    }

    if (!currentElement) continue;

    if (trialName === 'A' || trialName === 'B' || trialName === 'C') {
      const transmissionTime = parseFloat(row[transIdx]) || 0;
      const pathLength = parseFloat(row[pathIdx]) || 0;
      const velocity = parseFloat(row[velIdx]) || 0;
      const ecs = parseFloat(row[ecsIdx]) || 0;

      currentElement.trials?.push({
        trial: trialName as 'A' | 'B' | 'C',
        transmissionTime,
        pathLength,
        velocity,
        ecs,
      });

      if (trialName === 'A') {
        currentElement.averageEcs = parseFloat(row[avgEcsIdx]) || 0;
        currentElement.remark = row[remIdx]?.toString().trim().toUpperCase() === 'GOOD' ? 'GOOD' : 'POOR';
      }
    }
  }

  // Push final element
  if (currentElement && currentElement.elementId && currentElement.trials?.length) {
    elements.push(currentElement as ElementData);
  }

  return elements;
}

export async function parseExcelAnalysis(buffer: Buffer): Promise<ExcelFloorData[]> {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const floors: ExcelFloorData[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheetKey = sheetName.trim();
    const floorName = FLOOR_NAMES[sheetKey] || FLOOR_NAMES[sheetKey.toUpperCase()] || `${sheetKey} Floor`;
    const ws = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });

    if (rows.length < 2) continue;

    // Parse Left Group (Columns 0-7)
    const leftElements = parseGroup(rows, 0, 1, 2, 3, 4, 5, 6, 7);

    // Parse Right Group (Columns 9-16)
    const rightElements = parseGroup(rows, 9, 10, 11, 12, 13, 14, 15, 16);

    const allElements = [...leftElements, ...rightElements];

    const columns: ElementData[] = [];
    const beams: ElementData[] = [];
    const slabs: ElementData[] = [];
    const shearWalls: ElementData[] = [];

    for (const elem of allElements) {
      const type = getElementType(elem.elementId);
      if (type === 'column') columns.push(elem);
      else if (type === 'beam') beams.push(elem);
      else if (type === 'slab') slabs.push(elem);
      else if (type === 'shearWall') shearWalls.push(elem);
    }

    floors.push({
      floorName,
      sheetKey,
      columns,
      beams,
      slabs,
      shearWalls,
    });
  }

  // Sort floors based on FLOOR_ORDER index
  floors.sort((a, b) => {
    const keyA = a.sheetKey.toUpperCase();
    const keyB = b.sheetKey.toUpperCase();
    const orderA = FLOOR_ORDER[keyA] !== undefined ? FLOOR_ORDER[keyA] : 99;
    const orderB = FLOOR_ORDER[keyB] !== undefined ? FLOOR_ORDER[keyB] : 99;
    return orderA - orderB;
  });

  return floors;
}

export function generateFloorSummary(floor: ExcelFloorData): FloorSummary {
  return {
    floorName: floor.floorName,
    columns: { count: floor.columns.length, pointsTaken: floor.columns.length * 3 },
    beams: { count: floor.beams.length, pointsTaken: floor.beams.length * 3 },
    slabs: { count: floor.slabs.length, pointsTaken: floor.slabs.length * 3 },
    shearWalls: { count: floor.shearWalls.length, pointsTaken: floor.shearWalls.length * 3 },
  };
}

export function getOverallResult(floors: ExcelFloorData[]): 'all_good' | 'has_poor' {
  for (const floor of floors) {
    const all = [...floor.columns, ...floor.beams, ...floor.slabs, ...floor.shearWalls];
    for (const elem of all) {
      if (elem.remark === 'POOR') {
        return 'has_poor';
      }
    }
  }
  return 'all_good';
}

export interface MemberSummary {
  good: number;
  poor: number;
  total: number;
  pctGood: number;
  pctPoor: number;
}

export interface ResultsSummary {
  columns: MemberSummary;
  beams: MemberSummary;
  slabs: MemberSummary;
  shearWalls: MemberSummary;
  total: MemberSummary;
}

export function generateResultsSummary(floors: ExcelFloorData[]): ResultsSummary {
  const summary: ResultsSummary = {
    columns: { good: 0, poor: 0, total: 0, pctGood: 0, pctPoor: 0 },
    beams: { good: 0, poor: 0, total: 0, pctGood: 0, pctPoor: 0 },
    slabs: { good: 0, poor: 0, total: 0, pctGood: 0, pctPoor: 0 },
    shearWalls: { good: 0, poor: 0, total: 0, pctGood: 0, pctPoor: 0 },
    total: { good: 0, poor: 0, total: 0, pctGood: 0, pctPoor: 0 },
  };

  const processList = (elements: ElementData[], member: MemberSummary) => {
    for (const elem of elements) {
      member.total++;
      if (elem.remark === 'GOOD') {
        member.good++;
      } else {
        member.poor++;
      }
    }
  };

  for (const floor of floors) {
    processList(floor.columns, summary.columns);
    processList(floor.beams, summary.beams);
    processList(floor.slabs, summary.slabs);
    processList(floor.shearWalls, summary.shearWalls);
  }

  // Calculate totals
  summary.total.good = summary.columns.good + summary.beams.good + summary.slabs.good + summary.shearWalls.good;
  summary.total.poor = summary.columns.poor + summary.beams.poor + summary.slabs.poor + summary.shearWalls.poor;
  summary.total.total = summary.columns.total + summary.beams.total + summary.slabs.total + summary.shearWalls.total;

  const calcPct = (member: MemberSummary) => {
    if (member.total > 0) {
      member.pctGood = (member.good / member.total) * 100;
      member.pctPoor = (member.poor / member.total) * 100;
    }
  };

  calcPct(summary.columns);
  calcPct(summary.beams);
  calcPct(summary.slabs);
  calcPct(summary.shearWalls);
  calcPct(summary.total);

  return summary;
}
