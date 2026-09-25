/**
 * Unified Master Data Excel/CSV Import Normalizer and Mapping Utility
 * Handles header normalization, flexible column aliasing, currency/numeric cleaning,
 * and pre-validation diagnostics.
 */

export interface HeaderMapping {
  original: string;
  field: string;
  label: string;
  isMatched: boolean;
}

export interface HeaderDetectionResult {
  detectedHeaders: string[];
  mappings: HeaderMapping[];
  unmappedHeaders: string[];
  hasNameColumn: boolean;
  hasCodeColumn: boolean;
}

/**
 * Strips whitespace, underscores, dashes, slashes, parentheses, dots, colons, brackets, # symbols
 * and converts to lowercase for resilient header matching.
 */
export function cleanHeaderKey(key: string | any): string {
  if (key === undefined || key === null) return '';
  return String(key)
    .trim()
    .toLowerCase()
    .replace(/[\s_\-\/\(\)\.\:\[\]\#\\,]+/g, '');
}

/**
 * Safely parses numeric inputs (handles currency symbols like ₹, $, commas, string numerals)
 */
export function parseNumericValue(val: any, fallback = 0): number {
  if (val === undefined || val === null || val === '') return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;

  const cleaned = String(val)
    .replace(/[₹$,\s]/g, '')
    .replace(/[^0-9.-]/g, '');

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? fallback : parsed;
}

// ---------------------------------------------------------------------------
// 1. RAW MATERIALS FIELD DEFINITIONS & ALIASES
// ---------------------------------------------------------------------------

export const RAW_MATERIAL_ALIASES: Record<string, string[]> = {
  name: [
    'name',
    'materialname',
    'rawmaterialname',
    'itemname',
    'rmname',
    'inkcolour',
    'inkcolor',
    'inkcolours',
    'inkcolors',
    'colour',
    'color',
    'colours',
    'colors',
    'inkshade',
    'inkshades',
    'shade',
    'shades',
    'shadecolour',
    'shadecolor',
    'ink',
    'inkname',
    'inks',
    'nameofink',
    'inkitem',
    'chemical',
    'chemicalname',
    'dye',
    'varnish',
    'material',
    'rawmaterial',
    'item',
    'itemdescription',
    'materialdescription',
    'descriptionofgoods',
    'goodsdescription',
    'particulars',
    'title',
    'itemtitle',
    'materialtitle',
    'nameofmaterial',
    'nameofitem',
    'materialitem',
    'itemmaterial',
    'goods',
    'papername',
    'papertype',
    'productname',
    'product'
  ],
  code: [
    'code',
    'materialcode',
    'itemcode',
    'rmcode',
    'rawmaterialcode',
    'matcode',
    'productcode',
    'partnumber',
    'partno',
    'partnum',
    'sku',
    'slno',
    'sno',
    'srno',
    'sl',
    'serialno',
    'serialnumber',
    'slnumber',
    'srnumber',
    'serial',
    'itemno',
    'materialno',
    'rmid',
    'itemid',
    'materialid',
    'identcode',
    'matnr'
  ],
  category: [
    'category',
    'categoryname',
    'materialcategory',
    'itemcategory',
    'cat',
    'group',
    'materialgroup',
    'maincategory',
    'productcategory',
    'inkcategory',
    'materialtype',
    'type'
  ],
  subCategory: [
    'subcategory',
    'subcat',
    'subcategories',
    'subcategoryname',
    'materialsubcategory',
    'subgroup',
    'subitemcategory',
    'childcategory'
  ],
  uom: [
    'uom',
    'unit',
    'unitofmeasure',
    'unitsofmeasure',
    'unitofmeasurement',
    'measurementunit',
    'measureunit',
    'measuringunit',
    'units',
    'uomcode',
    'baseuom',
    'kg',
    'kgs',
    'pkg',
    'packing',
    'packaging',
    'measure'
  ],
  purchasePrice: [
    'purchaseprice',
    'price',
    'rate',
    'purchaserate',
    'unitprice',
    'unitrate',
    'costprice',
    'cost',
    'buyingprice',
    'purchasingprice',
    'standardcost',
    'mrp',
    'rateperunit',
    'priceperunit',
    'purchasecost',
    'basicrate',
    'ratekg',
    'rateperkg'
  ],
  description: [
    'description',
    'desc',
    'remarks',
    'remark',
    'details',
    'specification',
    'specifications',
    'notes',
    'comment',
    'comments',
    'materialdetails',
    'itemdetails'
  ],
  grade: [
    'grade',
    'papergrade',
    'materialgrade',
    'bf',
    'burstfactor',
    'quality',
    'paperquality',
    'gradecode'
  ],
  gsm: [
    'gsm',
    'grammage',
    'basisweight',
    'weight',
    'grammagegsm',
    'gsmweight'
  ],
  thickness: [
    'thickness',
    'caliper',
    'size',
    'micron',
    'microns',
    'width',
    'gauge',
    'pt',
    'deckle',
    'decklesize',
    'reelwidth'
  ],
  hsnCode: [
    'hsncode',
    'hsn',
    'hsnsac',
    'hsnsaccode',
    'sac',
    'tariffcode',
    'hsntariff',
    'chapter'
  ],
  minStock: [
    'minstock',
    'minimumstock',
    'minstockalert',
    'minlevel',
    'minqty',
    'safetystock',
    'minimumlevel',
    'min',
    'minimumquantity'
  ],
  maxStock: [
    'maxstock',
    'maximumstock',
    'maxlevel',
    'maxqty',
    'maximumlevel',
    'max',
    'maximumquantity'
  ],
  reorderLevel: [
    'reorderlevel',
    'reorderpoint',
    'reorderqty',
    'reorderquantity',
    'reorder',
    'rop',
    'reorderinglevel',
    'orderpoint'
  ],
  supplierName: [
    'supplier',
    'suppliername',
    'mill',
    'millname',
    'vendor',
    'vendorname',
    'manufacturer',
    'suppliermill',
    'party',
    'partyname',
    'papermill'
  ],
  warehouseName: [
    'warehouse',
    'warehousename',
    'location',
    'storagelocation',
    'storage',
    'plant',
    'godown',
    'warehousecode',
    'site',
    'store',
    'stocklocation'
  ],
  status: [
    'status',
    'itemstatus',
    'state',
    'isactive',
    'activestatus',
    'recordstatus'
  ]
};

export const RAW_MATERIAL_FIELD_LABELS: Record<string, string> = {
  name: 'Material Name (Required)',
  code: 'Material Code',
  category: 'Category',
  subCategory: 'Subcategory',
  uom: 'UOM / Unit',
  purchasePrice: 'Purchase Price',
  grade: 'Grade / BF',
  gsm: 'GSM',
  thickness: 'Thickness / Size',
  hsnCode: 'HSN Code',
  minStock: 'Min Stock',
  maxStock: 'Max Stock',
  reorderLevel: 'Reorder Level',
  supplierName: 'Supplier / Mill',
  warehouseName: 'Warehouse / Storage',
  description: 'Description / Remarks',
  status: 'Status'
};

/**
 * Identifies which application field a raw Excel header maps to
 */
export function mapHeaderToRawMaterialField(header: string): { field: string; label: string } | null {
  const clean = cleanHeaderKey(header);
  if (!clean) return null;

  for (const [field, aliases] of Object.entries(RAW_MATERIAL_ALIASES)) {
    if (aliases.includes(clean)) {
      return { field, label: RAW_MATERIAL_FIELD_LABELS[field] || field };
    }
  }

  // Substring or prefix fallback
  for (const [field, aliases] of Object.entries(RAW_MATERIAL_ALIASES)) {
    if (aliases.some(alias => clean.startsWith(alias) || clean.endsWith(alias))) {
      return { field, label: RAW_MATERIAL_FIELD_LABELS[field] || field };
    }
  }

  return null;
}

/**
 * Analyzes an array of Excel headers and produces a full detection report
 */
export function detectRawMaterialHeaders(headers: string[]): HeaderDetectionResult {
  const mappings: HeaderMapping[] = [];
  const unmappedHeaders: string[] = [];
  const matchedFields = new Set<string>();

  for (const header of headers) {
    const trimmed = String(header).trim();
    if (!trimmed) continue;

    const matched = mapHeaderToRawMaterialField(trimmed);
    if (matched) {
      mappings.push({
        original: trimmed,
        field: matched.field,
        label: matched.label,
        isMatched: true
      });
      matchedFields.add(matched.field);
    } else {
      unmappedHeaders.push(trimmed);
      mappings.push({
        original: trimmed,
        field: 'unmapped',
        label: 'Ignored / Custom Info',
        isMatched: false
      });
    }
  }

  return {
    detectedHeaders: headers,
    mappings,
    unmappedHeaders,
    hasNameColumn: matchedFields.has('name'),
    hasCodeColumn: matchedFields.has('code')
  };
}

/**
 * Normalizes a single raw row object from Excel/CSV into the canonical Raw Material model.
 * Maps every known alias regardless of casing, spacing, or punctuation.
 */
export function normalizeRawMaterialRow(row: Record<string, any>, rowIndex = 0): {
  code: string;
  name: string;
  category: string;
  subCategory: string;
  grade: string;
  gsm: number;
  thickness: number;
  uom: string;
  hsnCode: string;
  purchasePrice: number;
  minStock: number;
  maxStock: number;
  reorderLevel: number;
  supplierName: string;
  warehouseName: string;
  description: string;
  status: string;
  raw: Record<string, any>;
} {
  const norm: Record<string, any> = {};

  // Build clean lookup map for this row
  for (const [rawKey, rawVal] of Object.entries(row)) {
    if (rawVal === undefined || rawVal === null) continue;
    const cleanKey = cleanHeaderKey(rawKey);
    const cleanVal = typeof rawVal === 'string' ? rawVal.trim() : rawVal;
    if (cleanVal === '') continue;

    for (const [field, aliases] of Object.entries(RAW_MATERIAL_ALIASES)) {
      if (aliases.includes(cleanKey) && norm[field] === undefined) {
        norm[field] = cleanVal;
        break;
      }
    }
  }

  // Fallback substring checks for any remaining unset fields
  for (const [rawKey, rawVal] of Object.entries(row)) {
    if (rawVal === undefined || rawVal === null) continue;
    const cleanKey = cleanHeaderKey(rawKey);
    const cleanVal = typeof rawVal === 'string' ? rawVal.trim() : rawVal;
    if (cleanVal === '') continue;

    for (const [field, aliases] of Object.entries(RAW_MATERIAL_ALIASES)) {
      if (norm[field] === undefined && aliases.some(a => cleanKey.includes(a))) {
        norm[field] = cleanVal;
        break;
      }
    }
  }

  // Extract Name (Highest Priority)
  let name = norm.name ? String(norm.name).trim() : '';
  // Fallback: if name is empty but description exists and looks like a name, or single text column
  if (!name && norm.description && !Object.keys(norm).some(k => k === 'name')) {
    name = String(norm.description).trim();
  }

  // Detect if this is printing ink / chemical / additive
  const nameLower = name.toLowerCase();
  const rawKeysLower = Object.keys(row).map(k => k.toLowerCase()).join(' ');
  const isInkRelated = 
    rawKeysLower.includes('ink') || 
    rawKeysLower.includes('colour') || 
    rawKeysLower.includes('color') ||
    rawKeysLower.includes('shade') ||
    nameLower.includes('ink') ||
    nameLower.includes('blue') ||
    nameLower.includes('red') ||
    nameLower.includes('green') ||
    nameLower.includes('black') ||
    nameLower.includes('yellow') ||
    nameLower.includes('cyan') ||
    nameLower.includes('magenta') ||
    nameLower.includes('orange') ||
    nameLower.includes('pink') ||
    nameLower.includes('brown') ||
    nameLower.includes('white') ||
    nameLower.includes('violet') ||
    nameLower.includes('purple') ||
    nameLower.includes('stabilizer') ||
    nameLower.includes('retarder') ||
    nameLower.includes('deformer') ||
    nameLower.includes('cleaner') ||
    nameLower.includes('wax compound') ||
    nameLower.startsWith('p ') ||
    nameLower.startsWith('p.') ||
    nameLower.startsWith('pms');

  // Extract Code (Generate if missing or if only a serial number like "1", "2")
  let code = norm.code ? String(norm.code).trim() : '';
  if (!code || /^\d+$/.test(code)) {
    if (isInkRelated) {
      code = `INK-${String(rowIndex + 1).padStart(3, '0')}`;
    } else {
      code = `RM-${1000 + rowIndex + 1}`;
    }
  }

  // Extract Category & Subcategory
  let category = norm.category ? String(norm.category).trim() : '';
  if (!category) {
    category = isInkRelated ? 'Printing Inks' : 'Paper Rolls';
  }

  let subCategory = norm.subCategory ? String(norm.subCategory).trim() : '';
  if (!subCategory && isInkRelated) {
    if (nameLower.includes('stabilizer') || nameLower.includes('retarder') || nameLower.includes('deformer') || nameLower.includes('cleaner') || nameLower.includes('wax')) {
      subCategory = 'Additives & Chemicals';
    } else if (nameLower.includes('pms') || nameLower.startsWith('p ') || nameLower.startsWith('p.') || nameLower.includes('pantone')) {
      subCategory = 'Pantone Ink';
    } else if (nameLower.includes('process') || nameLower.includes('cyan') || nameLower.includes('magenta')) {
      subCategory = 'Process Ink';
    } else {
      subCategory = 'Water Based Ink';
    }
  }

  // Extract Specifications
  const grade = norm.grade ? String(norm.grade).trim() : (isInkRelated ? 'Standard' : 'BF-18');
  const gsm = parseNumericValue(norm.gsm, isInkRelated ? 0 : 180);
  const thickness = parseNumericValue(norm.thickness, isInkRelated ? 0 : 240);
  
  // Format UOM cleanly (e.g. KG -> Kg)
  let uom = norm.uom ? String(norm.uom).trim() : (isInkRelated ? 'Kg' : 'Kg');
  if (/^kg|kgs|kilogram|kilograms$/i.test(uom)) {
    uom = 'Kg';
  } else if (/^nos|no|pcs|pieces|piece$/i.test(uom)) {
    uom = 'Nos';
  } else if (/^ton|tons|mt|tonne|tonnes$/i.test(uom)) {
    uom = 'Tons';
  } else if (/^mtr|meter|meters|m$/i.test(uom)) {
    uom = 'Mtr';
  }

  const hsnCode = norm.hsnCode 
    ? String(norm.hsnCode).trim() 
    : (isInkRelated ? '32151100' : '48041100');

  // Extract Pricing & Stock Thresholds
  const purchasePrice = parseNumericValue(norm.purchasePrice, isInkRelated ? 280 : 0);
  const minStock = parseNumericValue(norm.minStock, isInkRelated ? 20 : 1000);
  const maxStock = parseNumericValue(norm.maxStock, isInkRelated ? 100 : 20000);
  const reorderLevel = parseNumericValue(norm.reorderLevel, isInkRelated ? 40 : 2000);

  // Extract Relations & Metadata
  const supplierName = norm.supplierName ? String(norm.supplierName).trim() : '';
  const warehouseName = norm.warehouseName ? String(norm.warehouseName).trim() : '';
  const description = norm.description ? String(norm.description).trim() : '';
  const rawStatus = norm.status ? String(norm.status).trim() : 'Active';
  const status = ['inactive', 'disabled', 'archive', 'draft'].includes(rawStatus.toLowerCase()) ? 'Inactive' : 'Active';

  return {
    code,
    name,
    category,
    subCategory,
    grade,
    gsm,
    thickness,
    uom,
    hsnCode,
    purchasePrice,
    minStock,
    maxStock,
    reorderLevel,
    supplierName,
    warehouseName,
    description,
    status,
    raw: row
  };
}
