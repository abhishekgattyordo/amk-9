import { z } from 'zod';

export const dispatchItemSchema = z.object({
  productId: z.string().optional().nullable(),
  productCode: z.string().optional().nullable(),
  productName: z.string().min(1, 'Product Name is required'),
  orderedQuantity: z.number().nonnegative(),
  dispatchedQuantity: z.number().positive('Dispatched quantity must be greater than 0'),
  unit: z.string().optional().default('Pcs'),
  bundlesCount: z.number().int().nonnegative().optional().default(0),
  unitsPerBundle: z.number().int().nonnegative().optional().default(0),
  boxWeightKg: z.number().nonnegative().optional().default(0),
  totalWeightKg: z.number().nonnegative().optional().default(0),
  rate: z.number().nonnegative().optional().default(0),
  amount: z.number().nonnegative().optional().default(0),
  warehouseId: z.string().optional().nullable(),
  binId: z.string().optional().nullable(),
  binCode: z.string().optional().nullable(),
  batchNumber: z.string().optional().nullable(),
  remarks: z.string().optional().nullable()
});

export const createDispatchSchema = z.object({
  salesOrderId: z.string().min(1, 'Sales Order ID is required'),
  soNumber: z.string().min(1, 'Sales Order Number is required'),
  workOrderId: z.string().optional().nullable(),
  woNumber: z.string().optional().nullable(),
  qualityCheckId: z.string().optional().nullable(),
  qcNumber: z.string().optional().nullable(),
  qcApprovedQuantity: z.number().nonnegative().optional().nullable(),
  customerId: z.string().optional().nullable(),
  customerName: z.string().min(1, 'Customer Name is required'),
  customerPoNumber: z.string().optional().nullable(),
  warehouseId: z.string().optional().nullable(),
  warehouseName: z.string().optional().nullable(),
  binId: z.string().optional().nullable(),
  batchNumber: z.string().optional().nullable(),
  dispatchDate: z.string().min(1, 'Dispatch Date is required'),
  dispatchTime: z.string().optional().nullable(),
  vehicleNumber: z.string().min(1, 'Vehicle Number is required'),
  driverName: z.string().optional().nullable(),
  driverPhone: z.string().optional().nullable(),
  transporterName: z.string().optional().nullable(),
  lrNumber: z.string().optional().nullable(),
  lrDate: z.string().optional().nullable(),
  ewayBillNumber: z.string().optional().nullable(),
  gatePassNumber: z.string().optional().nullable(),
  shippingAddress: z.string().optional().nullable(),
  deliveryTerm: z.string().optional().default('Ex-Factory'),
  paymentTerms: z.string().optional().nullable(),
  deliveryType: z.enum(['Full Delivery', 'Partial Delivery']).optional().default('Full Delivery'),
  partialAction: z.enum(['Close Order', 'Keep Order Open']).optional().nullable(),
  shortCloseReason: z.string().optional().nullable(),
  status: z.enum([
    'Ready for Dispatch',
    'Loaded',
    'Dispatched',
    'In Transit',
    'Delivered',
    'Cancelled'
  ]).optional().default('Dispatched'),
  totalQuantity: z.number().positive('Total quantity must be greater than 0'),
  totalBundles: z.number().int().nonnegative().optional().default(0),
  totalWeightKg: z.number().nonnegative().optional().default(0),
  dispatchedBy: z.string().optional().nullable(),
  verifiedBy: z.string().optional().nullable(),
  remarks: z.string().optional().nullable(),
  inventoryUpdated: z.boolean().optional().default(true),
  items: z.array(dispatchItemSchema).min(1, 'At least one dispatch item is required')
});

export const updateDispatchSchema = createDispatchSchema.partial();

export const updateDispatchStatusSchema = z.object({
  status: z.enum([
    'Ready for Dispatch',
    'Loaded',
    'Dispatched',
    'In Transit',
    'Delivered',
    'Cancelled'
  ]),
  remarks: z.string().optional().nullable(),
  user: z.string().optional().nullable()
});
