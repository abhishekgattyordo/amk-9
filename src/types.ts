export type UserRole = 'Administrator' | 'Inventory Manager' | 'Purchase Manager' | 'Production Manager' | 'Sales Manager' | 'Accountant' | 'Warehouse Manager' | 'Viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department: string;
  permissions?: string[];
}

export type ModuleType = 'dashboard' | 'inventory_raw' | 'inventory_products' | 'inventory_categories' | 'inventory_suppliers' | 'inventory_warehouses' | 'inventory_transactions' | 'inventory_stock' | 'procurement' | 'procurement_dashboard' | 'procurement_rfq' | 'procurement_quotes' | 'procurement_po' | 'procurement_inward' | 'procurement_gate_entry' | 'procurement_reel_inward' | 'procurement_qc' | 'production' | 'production_dashboard' | 'production_planning' | 'production_work_orders' | 'production_orders' | 'production_indents' | 'production_floor' | 'production_floor_ops' | 'production_reports' | 'production_approvals' | 'production_fg' | 'production_machines' | 'production_scrap' | 'production_scrap_downtime' | 'production_qc' | 'production_bom' | 'costing' | 'costing_dashboard' | 'costing_bom' | 'costing_sheets' | 'costing_new' | 'costing_pending' | 'costing_approved' | 'costing_history' | 'sales' | 'sales_dashboard' | 'sales_leads' | 'sales_quotations' | 'sales_orders' | 'sales_customers' | 'sales_dispatch' | 'dispatch' | 'dispatch_dashboard' | 'dispatch_list' | 'dispatch_pending' | 'dispatch_completed' | 'dispatch_history' | 'dispatch_create' | 'dispatch_view' | 'qc' | 'qc_dashboard' | 'qc_inspections' | 'qc_pending' | 'qc_approved' | 'qc_rejected' | 'qc_ncr' | 'qc_history' | 'quality_control' | 'accounts' | 'reports' | 'reports_dashboard' | 'reports_sales' | 'reports_purchase' | 'reports_inventory' | 'reports_production' | 'reports_dispatch' | 'reports_financial' | 'settings' | 'admin_excel' | 'user_management' | 'recycle_bin';

export interface RawMaterial {
  id: string;
  code: string;
  name: string;
  category: string;
  subCategory: string;
  grade: string; // e.g. "BF-18", "Kraft-200"
  gsm: number;
  thickness: number; // in mm or microns
  uom: string; // e.g. "Reams", "Kg", "Rolls", "Sheets"
  hsnCode: string;
  supplierId?: string;
  supplier?: any;
  warehouseId?: string;
  warehouse?: any;
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderLevel: number;
  purchasePrice: number;
  status: 'Active' | 'Inactive' | 'Discontinued';
  description: string;
  lastUpdated: string;
  documentsCount: number;
  stocks?: RawMaterialStock[];
}

export interface RawMaterialStock {
  id: string;
  rawMaterialId: string;
  rawMaterial?: RawMaterial;
  supplierId: string;
  supplier?: Supplier;
  purchaseOrderId?: string | null;
  purchaseOrder?: any;
  batchLotNumber?: string | null;
  purchaseDate: string;
  purchaseTime?: string | null;
  originalQuantity: number;
  remainingQuantity: number;
  purchasePrice: number;
  warehouseId?: string | null;
  warehouse?: Warehouse;
  binId?: string | null;
  bin?: BinLocationItem;
  referenceNumber?: string | null;
  status: 'Available' | 'Low' | 'Depleted' | 'Reserved' | 'Quarantined';
  remarks?: string | null;
  createdBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  subCategory: string;
  boxType: 'RSC (Regular Slotted Carton)' | 'HSC' | 'Die-Cut' | 'Partition' | 'Sheet Board' | 'Corrugated Roll';
  dimensions: string; // e.g. "400 x 300 x 250 mm"
  gsm: number;
  unit: string; // "Pcs", "Boxes", "Bundles"
  uom: string;
  hsnCode: string;
  costPrice: number;
  sellingPrice: number;
  warehouse: string;
  availableStock: number;
  status: 'Active' | 'Inactive';
  imageUrl?: string;
  specifications: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  type: 'Raw Material' | 'Finished Product' | 'Material Group';
  code: string;
  parentCategory?: string;
  description: string;
  itemsCount: number;
  status: 'Active' | 'Inactive';
  createdAt?: string;
}

export interface SubcategoryItem {
  id: string;
  code: string;
  name: string;
  parentCategoryId: string;
  description: string;
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface Supplier {
  id: string;
  supplierName: string;
  supplierCode?: string;
  millName: string; // Mandatory mill name
  category: string;
  categories?: CategoryItem[];
  subCategories?: SubcategoryItem[];
  rawMaterials?: any[];
  contactPerson?: string;
  email?: string;
  phone?: string;
  paymentTerms?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  location: string;
  manager: string;
  type?: string;
  capacitySqFt: number;
  capacity?: number;
  currentUtilizationPercent: number;
  currentUtilization?: number;
  totalBins: number;
  activeItemsCount: number;
  status: 'Operational' | 'Maintenance' | 'Full';
  stockLevels?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export interface StoredStockItem {
  id?: string;
  itemId?: string;
  itemType: 'RAW_MATERIAL' | 'PRODUCT' | 'Raw Material' | 'Finished Product';
  code: string;
  name: string;
  category?: string;
  quantity: number;
  uom: string;
  updatedAt?: string;
}

export interface StoredReelItem {
  id?: string;
  reelNumber: string;
  material: string;
  weight: number;
  uom: string;
  gsm?: number;
  bf?: number;
  lotNumber?: string;
  qcStatus: string;
  inwardNumber?: string;
  qcNumber?: string;
  date?: string;
}

export interface BinLocationItem {
  id: string;
  code: string;
  name: string;
  warehouseId: string;
  warehouseName?: string;
  warehouseCode?: string;
  type: 'Storage' | 'Loading' | 'Staging' | 'Quality Check';
  status: 'Active' | 'Inactive';
  createdAt: string;
  currentStock?: number;
  storedItemsCount?: number;
  storedReelsCount?: number;
  stockLevels?: any[];
  items?: StoredStockItem[];
  reels?: StoredReelItem[];
}

export type TransactionType = 
  | 'Stock In'
  | 'Stock Out'
  | 'Warehouse Transfer'
  | 'Stock Adjustment'
  | 'Production Issue'
  | 'Sales Return'
  | 'QC Release';

export interface InventoryTransaction {
  id: string;
  transactionNumber: string;
  itemCode: string;
  itemName: string;
  itemType: 'Raw Material' | 'Finished Product';
  warehouse: string;
  quantity: number;
  previousStock: number;
  currentStock: number;
  transactionType: TransactionType;
  user: string;
  date: string;
  time: string;
  reason: string;
  remarks: string;
  referenceNumber?: string;
  referenceType?: string;
  destinationWarehouse?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'alert' | 'warning' | 'info' | 'success' | 'error';
  read: boolean;
  module?: string;
  priority?: 'Info' | 'Warning' | 'Success' | 'Error';
  recipientRole?: string;
  emailSent?: boolean;
  emailRecipient?: string;
  entityId?: string;
  entityType?: string;
}

export interface NotificationSettingRule {
  id: string;
  eventName: string;
  eventKey: 'rfq_created' | 'rfq_sent' | 'quote_received' | 'po_created' | 'po_approved' | 'po_rejected' | 'goods_received' | 'po_completed';
  module: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  recipients: string;
  priority: 'Info' | 'Warning' | 'Success' | 'Error';
}

export interface AuditLog {
  id: string;
  action: string;
  module?: string;
  entity: string;
  entityId: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  user?: string;
  userId?: string;
  details?: string;
  timestamp: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  module: string;
  user: string;
  timestamp: string;
  details: string;
}

export interface RFQItem {
  id: string;
  rfqNumber: string;
  rfqDate: string;
  deliveryDate: string;
  department: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Draft' | 'Sent to Supplier' | 'Response Received' | 'Evaluated' | 'Awarded' | 'Sent' | 'Submitted' | 'Cancelled' | 'Pending' | 'Open' | 'Closed' | 'In Progress' | 'Rejected' | string;
  description: string;
  remarks: string;
  materials: { materialCode: string; name: string; unit: string; quantity: number; expectedPrice?: number; requiredDate: string; description?: string; remarks?: string }[];
  suppliers: { supplierId: string; supplierName: string; contactPerson: string; email: string; phone: string }[];
  sentDate?: string;
  sentTime?: string;
  sentBy?: string;
  sentSuppliersCount?: number;
  deliveryStatus?: 'Delivered' | 'Pending' | 'Opened' | 'Failed';
  responseDeadline?: string;
  createdAt?: string;
}

export interface ProcurementPO {
  id: string;
  poNumber: string;
  rfqNumber?: string;
  supplierId: string;
  supplierName: string;
  date: string;
  deliveryDate: string;
  status: 'Draft' | 'Submitted' | 'Pending Approval' | 'Pending' | 'Approved' | 'Rejected' | 'Sent to Supplier' | 'Confirmed' | 'Partially Received' | 'Completed' | 'Cancelled';
  items: {
    materialCode: string;
    materialName: string;
    quantityOrdered: number;
    quantityReceived: number;
    unitPrice: number;
    total: number;
  }[];
  remarks: string;
}

export interface Customer {
  id: string;
  code?: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  status: 'Active' | 'Inactive';
  salesExecutive?: string;
  leads?: SalesLead[];
  quotations?: SalesQuotation[];
  salesOrders?: SalesOrder[];
  dispatches?: Dispatch[];
  _count?: {
    leads?: number;
    quotations?: number;
    salesOrders?: number;
    dispatches?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface SalesLead {
  id: string;
  leadNumber: string;
  customerId?: string;
  customer?: Customer;
  customerName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  productRequirement: string;
  productDescription?: string;
  expectedQuantity: number;
  requiredDeliveryDate?: string;
  specifications?: string;
  sampleRequired: boolean;
  sampleDetails?: string;
  assignedSalesExecutive?: string;
  leadSource?: string;
  followUpDate?: string;
  status: 'Lead' | 'Details Taken / Sample Details' | 'Costing' | 'Proposal Sent' | 'Negotiation' | 'Won' | 'Converted' | 'Lost';
  remarks?: string;
  attachments?: string;
  costingRequestId?: string;
  customerPoNumber?: string;
  customerPoDate?: string;
  customerPoAttachment?: string;
  timeline?: {
    id: string;
    leadId: string;
    action: string;
    user?: string;
    remarks?: string;
    timestamp: string;
  }[];
  quotations?: SalesQuotation[];
  salesOrders?: SalesOrder[];
  createdAt?: string;
  updatedAt?: string;
}

export interface QuotationRevision {
  id: string;
  quotationId: string;
  revisionNumber: number;
  createdDate: string;
  createdBy?: string;
  reason?: string;
  status: string;
  amount: number;
  createdAt?: string;
}

export interface SalesQuotation {
  id: string;
  quotationNumber: string;
  leadId?: string;
  lead?: SalesLead;
  customerId?: string;
  customer?: Customer;
  customerName: string;
  productId?: string;
  productName: string;
  revision: number;
  quotationDate: string;
  validUntil: string;
  amount: number;
  salesExecutive?: string;
  status: 'Pending Costing' | 'Pending Approval' | 'Approved' | 'Proposal Sent' | 'Negotiation' | 'Accepted' | 'Rejected' | 'Revised';
  costingSummary?: string;
  remarks?: string;
  revisions?: QuotationRevision[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SalesOrder {
  id: string;
  soNumber: string;
  customerId?: string;
  customer?: Customer;
  customerName: string;
  customerPoNumber?: string;
  poDate?: string;
  leadId?: string;
  lead?: SalesLead;
  quotationId?: string;
  productId?: string;
  product?: Product;
  productName: string;
  quantity: number;
  quantityDispatched: number;
  quantityPending: number;
  unitPrice: number;
  totalValue: number;
  taxRate?: number;
  taxAmount?: number;
  grandTotal?: number;
  orderDate: string;
  deliveryDate: string;
  salesExecutive?: string;
  status: 'Draft' | 'Confirmed' | 'Planning' | 'In Production' | 'Ready' | 'Partially Dispatched' | 'Dispatched' | 'Delivered' | 'Cancelled';
  productionStatus?: 'Pending Planning' | 'Planning' | 'In Production' | 'Produced' | 'QC Passed';
  dispatchStatus?: 'Pending' | 'Ready for Dispatch' | 'Partially Dispatched' | 'Dispatched' | 'Delivered';
  warehouseId?: string;
  warehouse?: Warehouse;
  shippingAddress?: string;
  billingAddress?: string;
  specialInstructions?: string;
  attachments?: string;
  dispatches?: Dispatch[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DispatchItem {
  id: string;
  dispatchId: string;
  productId?: string;
  product?: Product;
  productCode?: string;
  productName: string;
  orderedQuantity: number;
  dispatchedQuantity: number;
  unit: string;
  bundlesCount: number;
  unitsPerBundle: number;
  boxWeightKg?: number;
  totalWeightKg?: number;
  rate: number;
  amount: number;
  remarks?: string;
  createdAt?: string;
}

export interface Dispatch {
  id: string;
  challanNumber: string;
  dispatchDate: string;
  dispatchTime?: string;
  salesOrderId: string;
  salesOrder?: SalesOrder;
  soNumber: string;
  customerId?: string;
  customer?: Customer;
  customerName: string;
  customerPoNumber?: string;
  warehouseId?: string;
  warehouse?: Warehouse;
  warehouseName?: string;
  vehicleNumber: string;
  driverName?: string;
  driverPhone?: string;
  transporterName?: string;
  lrNumber?: string;
  lrDate?: string;
  ewayBillNumber?: string;
  gatePassNumber?: string;
  shippingAddress?: string;
  deliveryTerm?: string;
  paymentTerms?: string;
  status: 'Ready for Dispatch' | 'Loaded' | 'Dispatched' | 'In Transit' | 'Delivered' | 'Cancelled';
  totalQuantity: number;
  totalBundles: number;
  totalWeightKg: number;
  dispatchedBy?: string;
  verifiedBy?: string;
  remarks?: string;
  inventoryUpdated: boolean;
  items: DispatchItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SupplierQuoteItem {
  materialCode: string;
  materialName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  remarks?: string;
}

export interface SupplierQuote {
  id: string;
  quotationNumber?: string;
  quotationDate?: string;
  rfqId: string;
  rfqNumber: string;
  supplierId: string;
  supplierName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  deliveryDays: number;
  paymentTerms: string;
  validUntil: string;
  currency?: string;
  remarks: string;
  status: 'Pending' | 'Awarded' | 'Rejected';
  items?: SupplierQuoteItem[];
}

export interface BomItem {
  id: string;
  bomId: string;
  layer: string;
  materialId?: string;
  material?: RawMaterial;
  materialCode?: string;
  materialName: string;
  gsm?: number;
  quantityPerUnit: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  createdAt?: string;
}

export interface BillOfMaterial {
  id: string;
  bomNumber: string;
  name: string;
  productId: string;
  product?: Product;
  customerId?: string;
  customer?: Customer;
  customerName?: string;
  leadId?: string;
  lead?: SalesLead;
  quotationId?: string;
  quotation?: SalesQuotation;
  requiredQuantity?: number;
  version?: number;
  fluteType?: string;
  ply: number;
  deckleSizeMm?: number;
  cutSizeMm?: number;
  totalWeightGrams?: number;
  estimatedCost: number;
  status: 'Active' | 'Draft' | 'Inactive' | 'Archived';
  notes?: string;
  createdBy?: string;
  items?: BomItem[];
  costSheets?: CostSheetItem[];
  sections?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkOrderOperation {
  id: string;
  workOrderId: string;
  sequence: number;
  stageName: string;
  machineId?: string;
  machine?: Machine;
  machineName?: string;
  operatorName?: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Paused';
  inputQuantity: number;
  outputQuantity: number;
  scrapQuantity: number;
  startTime?: string;
  endTime?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkOrder {
  id: string;
  orderNumber: string;
  salesOrderId?: string;
  salesOrder?: SalesOrder;
  productId: string;
  product?: Product;
  bomId?: string;
  bom?: BillOfMaterial;
  orderedQuantity: number;
  producedQuantity: number;
  rejectedQuantity: number;
  startDate?: string;
  targetDate?: string;
  actualEndDate?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Draft' | 'Planned' | 'In Production' | 'Completed' | 'On Hold' | 'Cancelled';
  currentStage: string;
  warehouseId?: string;
  warehouse?: Warehouse;
  assignedLine?: string;
  supervisor?: string;
  remarks?: string;
  operations?: WorkOrderOperation[];
  qcInspections?: ProductionQC[];
  scrapLogs?: ScrapLog[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductionPlan {
  id: string;
  planNumber: string;
  planDate: string;
  shift: string;
  line: string;
  targetQuantity: number;
  scheduledHours: number;
  status: 'Scheduled' | 'Running' | 'Completed' | 'Delayed';
  supervisor?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Machine {
  id: string;
  code: string;
  name: string;
  type: string;
  line: string;
  capacityPerHour: number;
  unit: string;
  status: 'Available' | 'Running' | 'Maintenance' | 'Breakdown' | 'Idle';
  operator?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  downtimes?: DowntimeLog[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductionQC {
  id: string;
  qcNumber: string;
  workOrderId: string;
  workOrder?: WorkOrder;
  stage: string;
  inspectorName: string;
  sampleSize: number;
  burstingFactor?: number;
  burstingStrength?: number;
  moisturePercent?: number;
  boxCompressionTest?: number;
  caliperThicknessMm?: number;
  dimensionCheck?: string;
  printQuality?: string;
  status: 'Passed' | 'Rejected' | 'Conditional Pass';
  rejectedQty: number;
  remarks?: string;
  inspectionDate: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ScrapLog {
  id: string;
  scrapNumber: string;
  workOrderId?: string;
  workOrder?: WorkOrder;
  stage: string;
  materialType: string;
  weightKg: number;
  reason: string;
  recordedBy: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DowntimeLog {
  id: string;
  machineId: string;
  machine?: Machine;
  reasonCategory: string;
  durationMinutes: number;
  startTime: string;
  endTime?: string;
  resolvedBy?: string;
  actionTaken?: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductionMetrics {
  summary: {
    totalWorkOrders: number;
    inProductionWOs: number;
    plannedWOs: number;
    completedWOs: number;
    totalOrdered: number;
    totalProduced: number;
    todayScrapKg: number;
    qcPassRate: number;
    machineUtilizationRate: number;
    runningMachines: number;
    availableMachines: number;
    maintenanceMachines: number;
    totalMachines: number;
  };
  stageDistribution: Record<string, number>;
  recentWorkOrders: any[];
  activePlans: any[];
  machines: any[];
}

export interface QualityCheckItem {
  id?: string;
  reelNo?: string;
  slNo?: number;
  deckle?: number;
  gsm?: number;
  observationGsm?: number;
  bf?: number;
  observationBf?: number;
  netWeight?: number;
  actualWeight?: number;
  expectedWeight?: number;
  moisturePercent?: number;
  burstingFactor?: number;
  burstingStrength?: number;
  boxCompressionTest?: number;
  caliperThicknessMm?: number;
  dimensionCheck?: string;
  printQuality?: string;
  jointStrength?: string;
  dropTest?: string;
  barcodingCheck?: string;
  result?: string;
  status?: string;
  binId?: string;
  binCode?: string;
  remarks?: string;
}

export interface QualityCheck {
  id: string;
  qcNumber: string;
  qcType: 'Reel Inward QC' | 'Sample SO QC' | 'Production QC' | 'Final QC' | 'Gate Entry QC' | string;
  referenceType: string;
  referenceNumber?: string;
  gateEntryId?: string;
  gateEntry?: any;
  reelInwardId?: string;
  reelInward?: any;
  salesOrderId?: string;
  salesOrder?: any;
  workOrderId?: string;
  workOrder?: any;
  productId?: string;
  product?: Product;
  rawMaterialId?: string;
  rawMaterial?: RawMaterial;
  stage?: string;
  operationId?: string;
  inspector: string;
  status: 'Pending' | 'In Inspection' | 'Approved' | 'Rejected' | 'Partially Approved' | 'Cancelled' | string;
  result?: 'Approved' | 'Rejected' | 'Partially Approved' | 'Pending' | string;
  expectedQuantity: number;
  inspectedQuantity: number;
  passedQuantity: number;
  rejectedQuantity: number;
  balanceQuantity: number;
  wastageQuantity: number;
  rejectionReason?: string;
  rootCause?: string;
  correctiveAction?: string;
  parameters?: string | QualityCheckItem[] | any;
  remarks?: string;
  testedAt: string;
  inspectionDate?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface QCMetrics {
  totalInspections: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  partiallyApprovedCount: number;
  todayCount: number;
  sampleQcPending: number;
  reelQcPending: number;
  reelInwardPending?: number;
  productionQcPending: number;
  finalQcPending: number;
  passRate: number;
  byType: { type: string; count: number; approved: number; rejected: number; pending: number }[];
  byStatus: { status: string; count: number }[];
  recentInspections: QualityCheck[];
  pendingInspections: QualityCheck[];
  rejectedInspections: QualityCheck[];
}

export type CostSheetStatus = 'Draft' | 'Submitted' | 'Pending MD Approval' | 'Approved' | 'Rejected' | 'Revision Requested' | 'Converted to Quotation';
export type BoxType = 'Universal Box' | 'Customized Box' | 'Sheet Board' | 'Die-Cut' | 'Partition';

export interface CostSheetLayerItem {
  id?: string;
  costSheetId?: string;
  layerIndex: number;
  layerName: string;
  layerType: 'Liner' | 'Fluting';
  materialId?: string;
  material?: RawMaterial;
  paperGrade: string;
  gsm: number;
  bf: number;
  fluteType?: string;
  fluteFactor: number;
  weightGrams: number;
  ratePerKg: number;
  costPerBox: number;
  remarks?: string;
}

export interface CostSheetApprovalItem {
  id: string;
  costSheetId: string;
  action: 'Submitted' | 'Approved' | 'Rejected' | 'Revision Requested' | 'Commented' | string;
  status: 'Pending' | 'Approved' | 'Rejected' | string;
  userName: string;
  userRole?: string;
  remarks?: string;
  priceAtReview?: number;
  marginAtReview?: number;
  timestamp: string;
}

export interface CostSheetRevisionItem {
  id: string;
  costSheetId: string;
  revisionNumber: number;
  snapshotData: string;
  reason?: string;
  changedBy?: string;
  sellingPrice: number;
  profitMargin: number;
  createdAt: string;
}

export interface CostSheetItem {
  id: string;
  costSheetNumber: string;
  revision: number;
  title?: string;
  boxType: BoxType;
  calculationType: string;
  leadId?: string;
  lead?: any;
  bomId?: string;
  bom?: BillOfMaterial;
  customerId?: string;
  customer?: any;
  customerName?: string;
  productId?: string;
  product?: Product;
  productName?: string;
  targetQuantity: number;
  unit: string;
  dimensionUnit: 'mm' | 'inch';
  length: number;
  width: number;
  height: number;
  jointFlapMm: number;
  creaseAllowanceMm: number;
  deckleSizeMm: number;
  cuttingLengthMm: number;
  sheetAreaSqM: number;
  ply: 3 | 5 | 7 | number;
  fluteType?: string;
  fluteTakeUp: number;
  totalBoardGsm: number;
  burstingFactor: number;
  burstingStrength: number;
  boxCompressionTest: number;
  singleBoxWeightGrams: number;
  singleBoxWeightKg: number;
  paperCostPerBox: number;
  starchCostPerBox: number;
  printingCostPerBox: number;
  stitchingGlueCostPerBox: number;
  dieCostTotal: number;
  dieCostPerBox: number;
  plateStereoCostTotal: number;
  plateStereoCostPerBox: number;
  wastagePercent: number;
  wastageCostPerBox: number;
  conversionLaborCostPerBox: number;
  overheadCostPerBox: number;
  freightCostPerBox: number;
  otherCostPerBox: number;
  totalManufacturingCostPerBox: number;
  profitMarginPercent: number;
  profitAmountPerBox: number;
  sellingPricePerBox: number;
  totalOrderValue: number;
  taxRate: number;
  taxAmount: number;
  grandTotalValue: number;
  status: CostSheetStatus;
  preparedBy?: string;
  approvedBy?: string;
  approvedAt?: string;
  mdRemarks?: string;
  notes?: string;
  specifications?: string;
  layers: CostSheetLayerItem[];
  approvals?: CostSheetApprovalItem[];
  revisions?: CostSheetRevisionItem[];
  quotations?: any[];
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CostingMetrics {
  totalCostSheets: number;
  pendingApprovalCount: number;
  approvedCount: number;
  draftCount: number;
  rejectedCount: number;
  averageMargin: number;
  totalValueQuoted: number;
  recentCostSheets: CostSheetItem[];
  pendingApprovals: CostSheetItem[];
  byBoxType: { boxType: string; count: number; value: number }[];
  byStatus: { status: string; count: number }[];
}



