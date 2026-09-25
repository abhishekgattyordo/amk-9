// In-memory store fallback for Sales when PostgreSQL database is unavailable or during migration
// ZERO mock or fallback sample data - strictly contains user records only.

export interface InMemoryCustomer {
  id: string;
  name: string;
  code: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  status: string;
  salesExecutive?: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date | null;
  _count?: {
    leads: number;
    quotations: number;
    salesOrders: number;
    dispatches: number;
  };
}

export interface InMemorySalesLead {
  id: string;
  leadNumber: string;
  customerId?: string | null;
  customerName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  productRequirement: string;
  productDescription?: string;
  expectedQuantity: number;
  requiredDeliveryDate?: string;
  specifications?: string;
  sampleRequired?: boolean;
  sampleDetails?: string;
  assignedSalesExecutive?: string;
  leadSource?: string;
  followUpDate?: string;
  costingRequestId?: string;
  customerPoNumber?: string;
  customerPoDate?: string;
  customerPoAttachment?: string;
  status: string;
  remarks?: string;
  attachments?: any;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date | null;
  customer?: any;
  timeline?: any[];
  quotations?: any[];
  salesOrders?: any[];
}

export interface InMemoryQuotation {
  id: string;
  quotationNumber: string;
  leadId?: string | null;
  customerId?: string | null;
  customerName: string;
  productId?: string | null;
  productName: string;
  revision: number;
  quotationDate: string;
  validUntil?: string;
  amount: number;
  salesExecutive?: string;
  status: string;
  costingSummary?: string;
  remarks?: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date | null;
  lead?: any;
  customer?: any;
  revisions?: any[];
}

export interface InMemorySalesOrder {
  id: string;
  soNumber: string;
  customerId?: string | null;
  customerName: string;
  customerPoNumber?: string;
  poDate?: string;
  leadId?: string | null;
  quotationId?: string | null;
  productId?: string | null;
  productName: string;
  quantity: number;
  quantityDispatched: number;
  quantityPending: number;
  unitPrice: number;
  totalValue: number;
  taxRate: number;
  taxAmount: number;
  grandTotal: number;
  orderDate: string;
  deliveryDate?: string;
  salesExecutive?: string;
  status: string;
  productionStatus: string;
  dispatchStatus: string;
  warehouseId?: string | null;
  shippingAddress?: string;
  billingAddress?: string;
  specialInstructions?: string;
  attachments?: any;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date | null;
  customer?: any;
  product?: any;
  warehouse?: any;
  lead?: any;
  dispatches?: any[];
}

export interface InMemoryDispatch {
  id: string;
  challanNumber: string;
  dispatchDate: string;
  salesOrderId: string;
  soNumber?: string;
  customerId?: string | null;
  customerName?: string;
  vehicleNumber: string;
  transporterName?: string;
  driverName?: string;
  driverPhone?: string;
  lrNumber?: string;
  ewayBillNumber?: string;
  sealNumber?: string;
  totalQuantity: number;
  totalBundles?: number;
  totalWeightKg?: number;
  warehouseId?: string | null;
  status: string;
  gatePassNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt?: Date | null;
  items: any[];
  salesOrder?: any;
  customer?: any;
  warehouse?: any;
}

// Global Store State (Zero mock data - strictly user database records only)
class SalesInMemoryStore {
  customers: InMemoryCustomer[] = [];
  leads: InMemorySalesLead[] = [];
  quotations: InMemoryQuotation[] = [];
  salesOrders: InMemorySalesOrder[] = [];
  dispatches: InMemoryDispatch[] = [];
}

export const salesStore = new SalesInMemoryStore();
