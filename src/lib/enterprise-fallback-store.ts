// Universal In-Memory Enterprise Fallback Store for AMK Packaging & Corrugation ERP
// Provides full in-memory data for all modules when PostgreSQL database is unreachable or denied.

export interface EnterpriseState {
  users: any[];
  roles: any[];
  permissions: any[];
  customers: any[];
  salesLeads: any[];
  quotations: any[];
  salesOrders: any[];
  dispatches: any[];
  suppliers: any[];
  categories: any[];
  subCategories: any[];
  materialGroups: any[];
  rawMaterials: any[];
  products: any[];
  warehouses: any[];
  binLocations: any[];
  stockLevels: any[];
  stockMovements: any[];
  inventoryTransactions: any[];
  purchaseOrders: any[];
  rfqs: any[];
  supplierQuotations: any[];
  gateEntries: any[];
  reelInwards: any[];
  qualityChecks: any[];
  notifications: any[];
  auditLogs: any[];
}

function initEnterpriseData(): EnterpriseState {
  const adminRoleId = 'role-admin';
  const invRoleId = 'role-inv';
  const purRoleId = 'role-pur';

  const roles = [
    {
      id: adminRoleId,
      name: 'Administrator',
      description: 'Full system access and configurations',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      permissions: [
        { id: 'p-1', name: 'all:read' },
        { id: 'p-2', name: 'all:write' },
        { id: 'p-3', name: 'all:delete' },
        { id: 'p-4', name: 'sales:view' },
        { id: 'p-5', name: 'sales:create' },
        { id: 'p-6', name: 'sales:edit' },
        { id: 'p-7', name: 'sales:delete' },
      ],
    },
    {
      id: invRoleId,
      name: 'Inventory Manager',
      description: 'Stock control, warehouse, and dispatch oversight',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      permissions: [
        { id: 'p-8', name: 'inventory:read' },
        { id: 'p-9', name: 'inventory:write' },
      ],
    },
    {
      id: purRoleId,
      name: 'Purchase Manager',
      description: 'Vendor management, RFQs, POs, and inward tracking',
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
      permissions: [
        { id: 'p-10', name: 'procurement:read' },
        { id: 'p-11', name: 'procurement:write' },
      ],
    },
  ];

  const users = [
    {
      id: 'usr-1',
      name: 'Rajesh Sharma',
      email: 'rajesh.sharma@amkerp.com',
      password: '$2a$10$YourHashedPasswordPlaceholderStringHere',
      department: 'Executive Office',
      roleId: adminRoleId,
      role: roles[0],
      isDeleted: false,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    {
      id: 'usr-2',
      name: 'Amit Patel',
      email: 'amit.patel@amkerp.com',
      password: '$2a$10$YourHashedPasswordPlaceholderStringHere',
      department: 'Supply Chain',
      roleId: invRoleId,
      role: roles[1],
      isDeleted: false,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    {
      id: 'usr-3',
      name: 'Sunita Menon',
      email: 'sunita.menon@amkerp.com',
      password: '$2a$10$YourHashedPasswordPlaceholderStringHere',
      department: 'Procurement',
      roleId: purRoleId,
      role: roles[2],
      isDeleted: false,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    {
      id: 'usr-4',
      name: 'AMK Admin',
      email: 'admin@amkerp.com',
      password: '$2a$10$YourHashedPasswordPlaceholderStringHere',
      department: 'Management',
      roleId: adminRoleId,
      role: roles[0],
      isDeleted: false,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
  ];

  const customers = [
    {
      id: 'cust-1',
      name: 'Nestlé India Ltd',
      code: 'CUST-0001',
      contactPerson: 'Mr. Rajesh Pillai',
      phone: '+91 98201 44556',
      email: 'r.pillai@nestle.in',
      address: 'Plot 100, Industrial Area, Sector 5, Haridwar, Uttarakhand - 249403',
      status: 'Active',
      salesExecutive: 'Rajesh Sharma',
      createdAt: new Date('2026-01-10T10:00:00Z'),
      updatedAt: new Date('2026-01-10T10:00:00Z'),
      isDeleted: false,
      _count: { leads: 1, quotations: 1, salesOrders: 1, dispatches: 1 },
    },
    {
      id: 'cust-2',
      name: 'Britannia Industries Ltd',
      code: 'CUST-0002',
      contactPerson: 'Ms. Priya Sharma',
      phone: '+91 98450 11223',
      email: 'priya.s@britannia.co.in',
      address: '5/1A Hungerford Street, Kolkata, West Bengal - 700017',
      status: 'Active',
      salesExecutive: 'Amit Patel',
      createdAt: new Date('2026-01-12T11:30:00Z'),
      updatedAt: new Date('2026-01-12T11:30:00Z'),
      isDeleted: false,
      _count: { leads: 1, quotations: 1, salesOrders: 1, dispatches: 1 },
    },
    {
      id: 'cust-3',
      name: 'ITC Limited - Foods Division',
      code: 'CUST-0003',
      contactPerson: 'Mr. Alok Mukherjee',
      phone: '+91 98310 99887',
      email: 'alok.mukherjee@itc.in',
      address: 'Virginia House, 37 J.L. Nehru Road, Kolkata - 700071',
      status: 'Active',
      salesExecutive: 'Sunita Menon',
      createdAt: new Date('2026-01-15T09:00:00Z'),
      updatedAt: new Date('2026-01-15T09:00:00Z'),
      isDeleted: false,
      _count: { leads: 1, quotations: 1, salesOrders: 1, dispatches: 1 },
    },
    {
      id: 'cust-4',
      name: 'Hindustan Unilever Ltd (HUL)',
      code: 'CUST-0004',
      contactPerson: 'Mr. Sameer Deshmukh',
      phone: '+91 98200 33441',
      email: 's.deshmukh@unilever.com',
      address: 'Unilever House, B.D. Sawant Marg, Chakala, Andheri (E), Mumbai - 400099',
      status: 'Active',
      salesExecutive: 'Rajesh Sharma',
      createdAt: new Date('2026-01-18T14:20:00Z'),
      updatedAt: new Date('2026-01-18T14:20:00Z'),
      isDeleted: false,
      _count: { leads: 1, quotations: 1, salesOrders: 1, dispatches: 0 },
    },
    {
      id: 'cust-5',
      name: 'Tata Consumer Products Ltd',
      code: 'CUST-0005',
      contactPerson: 'Ms. Ananya Roy',
      phone: '+91 99001 77665',
      email: 'ananya.roy@tataconsumer.com',
      address: '11/13 Botawala Building, Horniman Circle, Fort, Mumbai - 400001',
      status: 'Active',
      salesExecutive: 'Amit Patel',
      createdAt: new Date('2026-01-20T16:45:00Z'),
      updatedAt: new Date('2026-01-20T16:45:00Z'),
      isDeleted: false,
      _count: { leads: 1, quotations: 1, salesOrders: 0, dispatches: 0 },
    },
  ];

  const warehouses = [
    {
      id: 'wh-1',
      code: 'WH-MAIN',
      name: 'Main Plant Warehouse (Bhiwandi)',
      location: 'Bhiwandi, Maharashtra',
      type: 'Finished Goods & Raw Material',
      isDeleted: false,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    {
      id: 'wh-2',
      code: 'WH-PUNE',
      name: 'Chakan Regional Depot',
      location: 'Chakan MIDC Phase 2, Pune',
      type: 'Distribution Hub',
      isDeleted: false,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
  ];

  const categories = [
    {
      id: 'cat-1',
      code: 'CAT-KRAFT',
      name: 'Kraft Paper & Reels',
      type: 'Raw Material',
      description: 'Kraft paper reels used for corrugated board fluting and liners',
      isDeleted: false,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    {
      id: 'cat-2',
      code: 'CAT-ADH',
      name: 'Adhesives & Chemicals',
      type: 'Raw Material',
      description: 'Corn starch, caustic soda, borax, waterproofing resins',
      isDeleted: false,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    {
      id: 'cat-3',
      code: 'CAT-FG-RSC',
      name: 'RSC Shipping Cartons',
      type: 'Finished Product',
      description: 'Regular slotted corrugated containers for FMCG & industrial packing',
      isDeleted: false,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
  ];

  const subCategories = [
    { id: 'sub-1', code: 'SUB-KP-180', name: 'Kraft Liner 180 GSM', categoryId: 'cat-1', category: categories[0], isDeleted: false },
    { id: 'sub-2', code: 'SUB-KP-200', name: 'Kraft Liner 200 GSM', categoryId: 'cat-1', category: categories[0], isDeleted: false },
    { id: 'sub-3', code: 'SUB-CM-150', name: 'Corrugating Medium 150 GSM', categoryId: 'cat-1', category: categories[0], isDeleted: false },
    { id: 'sub-4', code: 'SUB-STARCH', name: 'Corn Starch Powder', categoryId: 'cat-2', category: categories[1], isDeleted: false },
  ];

  const suppliers = [
    {
      id: 'sup-1',
      supplierCode: 'SUP-0001',
      supplierName: 'ITC Paperboards & Specialty Papers',
      millName: 'Bhadrachalam Mill',
      category: 'Kraft Paper & Reels',
      contactPerson: 'Sanjay Verma',
      phone: '+91 98490 22334',
      email: 'sanjay.verma@itcpspd.com',
      address: 'Secunderabad, Telangana - 500003',
      gstin: '36AAACI0345G1ZP',
      status: 'Active',
      isDeleted: false,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    {
      id: 'sup-2',
      supplierCode: 'SUP-0002',
      supplierName: 'Century Pulp & Paper Ltd',
      millName: 'Lalkua Mill Unit 1',
      category: 'Kraft Paper & Reels',
      contactPerson: 'Rakesh Tripathi',
      phone: '+91 97190 55443',
      email: 'r.tripathi@centurypaper.com',
      address: 'Lalkua, Nainital, Uttarakhand - 263145',
      gstin: '05AAACB2234K1ZV',
      status: 'Active',
      isDeleted: false,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
  ];

  const rawMaterials = [
    {
      id: 'rm-1',
      code: 'RM-KP-180-NAT',
      name: 'Virgin Kraft Liner 180 GSM (BF 28)',
      category: 'Kraft Paper & Reels',
      subCategory: 'Kraft Liner 180 GSM',
      uom: 'KG',
      grade: 'Virgin Kraft Grade A',
      gsm: 180,
      burstFactor: 28,
      purchasePrice: 42.5,
      currentStock: 14500,
      minStock: 3000,
      maxStock: 25000,
      reorderLevel: 5000,
      supplierId: 'sup-1',
      supplierName: 'ITC Paperboards & Specialty Papers',
      warehouseId: 'wh-1',
      status: 'Active',
      isDeleted: false,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    {
      id: 'rm-2',
      code: 'RM-KP-200-NAT',
      name: 'Recycled Kraft Top Liner 200 GSM (BF 24)',
      category: 'Kraft Paper & Reels',
      subCategory: 'Kraft Liner 200 GSM',
      uom: 'KG',
      grade: 'Semi-Virgin Top Liner',
      gsm: 200,
      burstFactor: 24,
      purchasePrice: 38.0,
      currentStock: 18200,
      minStock: 4000,
      maxStock: 30000,
      reorderLevel: 6000,
      supplierId: 'sup-2',
      supplierName: 'Century Pulp & Paper Ltd',
      warehouseId: 'wh-1',
      status: 'Active',
      isDeleted: false,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
  ];

  const products = [
    {
      id: 'prd-1',
      code: 'PRD-MAGGI-70G-72P',
      name: '5-Ply RSC Printed Master Shipper - Maggi 70g (72 Pcs)',
      category: 'RSC Shipping Cartons',
      ply: 5,
      fluteType: 'B/C Double Wall Flute',
      lengthMm: 450,
      widthMm: 320,
      heightMm: 280,
      burstingStrength: 14.5,
      ect: 7.8,
      boxWeightKg: 0.65,
      unitPrice: 28.5,
      costPrice: 21.2,
      sellingPrice: 28.5,
      availableStock: 12000,
      status: 'Active',
      warehouseId: 'wh-1',
      isDeleted: false,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
    {
      id: 'prd-2',
      code: 'PRD-GB-COOKIE-48P',
      name: '3-Ply RSC Corrugated Shipper - Good Day 100g (48 Pcs)',
      category: 'RSC Shipping Cartons',
      ply: 3,
      fluteType: 'B Flute Narrow',
      lengthMm: 380,
      widthMm: 260,
      heightMm: 210,
      burstingStrength: 10.2,
      ect: 5.4,
      boxWeightKg: 0.42,
      unitPrice: 19.8,
      costPrice: 14.6,
      sellingPrice: 19.8,
      availableStock: 25000,
      status: 'Active',
      warehouseId: 'wh-1',
      isDeleted: false,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    },
  ];

  const salesLeads = [
    {
      id: 'lead-1',
      leadNumber: 'LD-2026-0001',
      customerId: 'cust-1',
      customerName: 'Nestlé India Ltd',
      contactPerson: 'Mr. Rajesh Pillai',
      phone: '+91 98201 44556',
      email: 'r.pillai@nestle.in',
      productRequirement: '5-Ply Master Carton for Maggi 70g Noodles (72 Pkts)',
      expectedQuantity: 50000,
      requiredDeliveryDate: '2026-09-15',
      specifications: '450 x 320 x 280 mm, 5-Ply B/C Flute, BS: 14.5 kg/cm², 2-Color Red/Yellow Flexo',
      status: 'Converted',
      leadSource: 'Key Account Referral',
      assignedSalesExecutive: 'Rajesh Sharma',
      isDeleted: false,
      createdAt: new Date('2026-01-10T10:00:00Z'),
      updatedAt: new Date('2026-01-10T10:00:00Z'),
    },
  ];

  const quotations = [
    {
      id: 'quot-1',
      quotationNumber: 'QT-2026-0001',
      version: 1,
      leadId: 'lead-1',
      leadNumber: 'LD-2026-0001',
      customerId: 'cust-1',
      customerName: 'Nestlé India Ltd',
      quotationDate: '2026-01-12',
      validUntil: '2026-09-30',
      totalAmount: 1425000,
      taxAmount: 256500,
      grandTotal: 1681500,
      status: 'Accepted',
      isDeleted: false,
      createdAt: new Date('2026-01-12T12:00:00Z'),
      updatedAt: new Date('2026-01-12T12:00:00Z'),
    },
  ];

  const salesOrders = [
    {
      id: 'so-1',
      soNumber: 'SO-2026-0001',
      customerId: 'cust-1',
      customerName: 'Nestlé India Ltd',
      customerPoNumber: 'PO-NST-2026-8891',
      poDate: '2026-01-14',
      leadId: 'lead-1',
      quotationId: 'quot-1',
      orderDate: '2026-01-14',
      targetDeliveryDate: '2026-09-10',
      productName: '5-Ply Master Carton for Maggi 70g Noodles (72 Pkts)',
      quantity: 50000,
      unitPrice: 28.5,
      totalAmount: 1425000,
      taxAmount: 256500,
      grandTotal: 1681500,
      quantityDispatched: 20000,
      quantityPending: 30000,
      status: 'Partially Dispatched',
      dispatchStatus: 'Partially Dispatched',
      productionStatus: 'In Production',
      isDeleted: false,
      createdAt: new Date('2026-01-14T14:00:00Z'),
      updatedAt: new Date('2026-01-14T14:00:00Z'),
    },
  ];

  const dispatches = [
    {
      id: 'dc-1',
      challanNumber: 'DC-2026-0001',
      dispatchDate: '2026-01-18',
      salesOrderId: 'so-1',
      soNumber: 'SO-2026-0001',
      customerId: 'cust-1',
      customerName: 'Nestlé India Ltd',
      vehicleNumber: 'MH-04-GP-8892',
      transporterName: 'VRL Logistics Ltd',
      driverName: 'Ramesh Yadav',
      driverPhone: '+91 97654 32110',
      lrNumber: 'VRL-MUM-89211',
      ewayBillNumber: '241982736410',
      totalQuantity: 20000,
      totalBundles: 800,
      totalWeightKg: 13000,
      status: 'Dispatched',
      gatePassNumber: 'GP-DC-2026-0001',
      isDeleted: false,
      createdAt: new Date('2026-01-18T10:30:00Z'),
      updatedAt: new Date('2026-01-18T10:30:00Z'),
      items: [
        {
          id: 'dci-1',
          productName: '5-Ply Master Carton for Maggi 70g Noodles (72 Pkts)',
          dispatchedQuantity: 20000,
          bundlesCount: 800,
          totalWeightKg: 13000,
          rate: 28.5,
          amount: 570000,
        },
      ],
    },
  ];

  const notifications = [
    {
      id: 'notif-1',
      title: 'Dispatch Delivered',
      message: 'Delivery Challan DC-2026-0001 has been dispatched to Nestlé India Haridwar plant.',
      type: 'success',
      read: false,
      createdAt: new Date('2026-01-18T11:00:00Z'),
    },
  ];

  return {
    users,
    roles,
    permissions: roles[0].permissions,
    customers,
    salesLeads,
    quotations,
    salesOrders,
    dispatches,
    suppliers,
    categories,
    subCategories,
    materialGroups: [],
    rawMaterials,
    products,
    warehouses,
    binLocations: [],
    stockLevels: [],
    stockMovements: [],
    inventoryTransactions: [],
    purchaseOrders: [],
    rfqs: [],
    supplierQuotations: [],
    gateEntries: [],
    reelInwards: [],
    qualityChecks: [],
    notifications,
    auditLogs: [],
  };
}

export const enterpriseFallbackStore = initEnterpriseData();
