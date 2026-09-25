import { z } from 'zod';

export const leadStatusEnum = z.enum([
  'Lead',
  'Details Taken / Sample Details',
  'Costing',
  'Proposal Sent',
  'Negotiation',
  'Won',
  'Converted',
  'Lost'
]);

export const createLeadSchema = z.object({
  customerId: z.string().optional().nullable(),
  customerName: z.string().min(1, 'Customer Name is required'),
  contactPerson: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')).nullable(),
  productRequirement: z.string().min(1, 'Product Requirement is required'),
  productDescription: z.string().optional().nullable(),
  expectedQuantity: z.number().positive('Expected quantity must be greater than 0'),
  requiredDeliveryDate: z.string().optional().nullable(),
  specifications: z.string().optional().nullable(),
  sampleRequired: z.boolean().optional().default(false),
  sampleDetails: z.string().optional().nullable(),
  assignedSalesExecutive: z.string().optional().nullable(),
  leadSource: z.string().optional().nullable(),
  followUpDate: z.string().optional().nullable(),
  status: leadStatusEnum.optional().default('Lead'),
  remarks: z.string().optional().nullable(),
  attachments: z.string().optional().nullable()
});

export const updateLeadSchema = createLeadSchema.partial();

export const leadStageUpdateSchema = z.object({
  status: leadStatusEnum,
  remarks: z.string().optional().nullable(),
  user: z.string().optional().nullable()
});

export const captureCustomerPoSchema = z.object({
  customerPoNumber: z.string().min(1, 'Customer PO number is required'),
  customerPoDate: z.string().optional().nullable(),
  customerPoAttachment: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  user: z.string().optional().nullable()
});

export const createQuotationSchema = z.object({
  leadId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  customerName: z.string().min(1, 'Customer Name is required'),
  productId: z.string().optional().nullable(),
  productName: z.string().min(1, 'Product Name is required'),
  quotationDate: z.string().min(1, 'Quotation Date is required'),
  validUntil: z.string().min(1, 'Validity date is required'),
  amount: z.number().nonnegative('Amount must be non-negative'),
  salesExecutive: z.string().optional().nullable(),
  status: z.enum([
    'Draft',
    'Pending Costing',
    'Pending Approval',
    'Approved',
    'Proposal Sent',
    'Sent',
    'Negotiation',
    'Accepted',
    'Won',
    'Converted',
    'Under Revision',
    'Revised',
    'Rejected',
    'Expired'
  ]).optional().default('Pending Costing'),
  costingSummary: z.string().optional().nullable(),
  remarks: z.string().optional().nullable()
});

export const convertQuotationSchema = z.object({
  customerPoNumber: z.string().optional().nullable(),
  poDate: z.string().optional().nullable(),
  deliveryDate: z.string().optional().nullable(),
  quantity: z.number().positive().optional().nullable(),
  unitPrice: z.number().nonnegative().optional().nullable(),
  warehouseId: z.string().optional().nullable(),
  salesExecutive: z.string().optional().nullable(),
  shippingAddress: z.string().optional().nullable(),
  billingAddress: z.string().optional().nullable(),
  specialInstructions: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  user: z.string().optional().nullable()
});

export const updateQuotationSchema = createQuotationSchema.partial();

export const createRevisionSchema = z.object({
  amount: z.number().positive('Revised amount must be greater than 0'),
  reason: z.string().min(1, 'Revision reason is required'),
  createdBy: z.string().optional().nullable()
});

export const createSalesOrderSchema = z.object({
  customerId: z.string().optional().nullable(),
  customerName: z.string().min(1, 'Customer Name is required'),
  customerPoNumber: z.string().optional().nullable(),
  poDate: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),
  quotationId: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
  productName: z.string().min(1, 'Product Name is required'),
  quantity: z.number().positive('Order quantity must be greater than 0'),
  unitPrice: z.number().nonnegative('Unit price must be non-negative'),
  totalValue: z.number().nonnegative().optional(),
  taxRate: z.number().nonnegative().optional().default(18),
  deliveryDate: z.string().min(1, 'Delivery date is required'),
  salesExecutive: z.string().optional().nullable(),
  warehouseId: z.string().optional().nullable(),
  shippingAddress: z.string().optional().nullable(),
  billingAddress: z.string().optional().nullable(),
  specialInstructions: z.string().optional().nullable(),
  status: z.enum([
    'Draft',
    'Confirmed',
    'Planning',
    'In Production',
    'Ready',
    'Partially Dispatched',
    'Dispatched',
    'Delivered',
    'Cancelled'
  ]).optional().default('Confirmed')
});

export const updateSalesOrderSchema = createSalesOrderSchema.partial();

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer Name is required'),
  code: z.string().optional().nullable(),
  contactPerson: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Invalid email').optional().or(z.literal('')).nullable(),
  address: z.string().optional().nullable(),
  salesExecutive: z.string().optional().nullable(),
  status: z.enum(['Active', 'Inactive']).optional().default('Active')
});

export const updateCustomerSchema = createCustomerSchema.partial();
