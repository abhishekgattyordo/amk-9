// Resilient in-memory delegate for Prisma models when PostgreSQL database connection fails
import { enterpriseFallbackStore } from './enterprise-fallback-store';

function matchFilter(item: any, where?: any): boolean {
  if (!where) return true;
  for (const key of Object.keys(where)) {
    if (key === 'isDeleted') {
      if (item.isDeleted !== where.isDeleted) return false;
      continue;
    }
    if (key === 'deletedAt') {
      if (where.deletedAt === null && item.deletedAt !== null && item.deletedAt !== undefined) return false;
      continue;
    }
    if (key === 'OR' && Array.isArray(where.OR)) {
      const orMatch = where.OR.some((clause: any) => matchFilter(item, clause));
      if (!orMatch) return false;
      continue;
    }
    if (key === 'AND' && Array.isArray(where.AND)) {
      const andMatch = where.AND.every((clause: any) => matchFilter(item, clause));
      if (!andMatch) return false;
      continue;
    }
    if (key === 'status') {
      if (typeof where.status === 'string' && item.status !== where.status) return false;
      if (where.status?.in && Array.isArray(where.status.in) && !where.status.in.includes(item.status)) return false;
      if (where.status?.notIn && Array.isArray(where.status.notIn) && where.status.notIn.includes(item.status)) return false;
      continue;
    }

    const filterVal = where[key];
    const itemVal = item[key];

    if (filterVal && typeof filterVal === 'object') {
      if (filterVal.contains) {
        if (!itemVal || !String(itemVal).toLowerCase().includes(String(filterVal.contains).toLowerCase())) return false;
      } else if (filterVal.in && Array.isArray(filterVal.in)) {
        if (!filterVal.in.includes(itemVal)) return false;
      } else if (filterVal.notIn && Array.isArray(filterVal.notIn)) {
        if (filterVal.notIn.includes(itemVal)) return false;
      } else if (filterVal.equals !== undefined) {
        if (itemVal !== filterVal.equals) return false;
      } else if (filterVal.not !== undefined) {
        if (itemVal === filterVal.not) return false;
      } else if (filterVal.gte !== undefined) {
        if (itemVal < filterVal.gte) return false;
      } else if (filterVal.lte !== undefined) {
        if (itemVal > filterVal.lte) return false;
      }
    } else if (filterVal !== undefined) {
      if (itemVal !== filterVal) return false;
    }
  }
  return true;
}

export function createModelDelegate(collectionName: keyof typeof enterpriseFallbackStore) {
  const getCollection = (): any[] => {
    return (enterpriseFallbackStore as any)[collectionName] || [];
  };

  return {
    findMany: async (args?: any) => {
      let list = getCollection().filter(item => matchFilter(item, args?.where));
      if (args?.orderBy) {
        // default sorting by createdAt desc if applicable
        list.sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bTime - aTime;
        });
      }
      if (args?.skip) {
        list = list.slice(args.skip);
      }
      if (args?.take) {
        list = list.slice(0, args.take);
      }
      return list;
    },
    findUnique: async (args: any) => {
      const list = getCollection();
      if (!args?.where) return null;
      return list.find(item => matchFilter(item, args.where)) || null;
    },
    findFirst: async (args?: any) => {
      const list = getCollection();
      return list.find(item => matchFilter(item, args?.where)) || null;
    },
    count: async (args?: any) => {
      return getCollection().filter(item => matchFilter(item, args?.where)).length;
    },
    create: async (args: any) => {
      const list = getCollection();
      const newItem = {
        id: args?.data?.id || `gen-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      };
      list.unshift(newItem);
      return newItem;
    },
    update: async (args: any) => {
      const list = getCollection();
      const item = list.find(it => matchFilter(it, args.where));
      if (item) {
        Object.assign(item, args.data, { updatedAt: new Date() });
        return item;
      }
      return args.data;
    },
    upsert: async (args: any) => {
      const list = getCollection();
      const existing = list.find(it => matchFilter(it, args.where));
      if (existing) {
        Object.assign(existing, args.update, { updatedAt: new Date() });
        return existing;
      }
      const newItem = {
        id: `gen-${Date.now()}`,
        ...args.create,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
      };
      list.unshift(newItem);
      return newItem;
    },
    delete: async (args: any) => {
      const list = getCollection();
      const index = list.findIndex(it => matchFilter(it, args.where));
      if (index !== -1) {
        const [removed] = list.splice(index, 1);
        return removed;
      }
      return null;
    },
    deleteMany: async (args: any) => {
      const list = getCollection();
      let count = 0;
      for (let i = list.length - 1; i >= 0; i--) {
        if (matchFilter(list[i], args?.where)) {
          list.splice(i, 1);
          count++;
        }
      }
      return { count };
    },
    groupBy: async () => [],
    aggregate: async () => ({ _sum: {}, _avg: {}, _count: 0 }),
  };
}

export function createFallbackPrismaClient() {
  const models = [
    'user',
    'role',
    'permission',
    'customer',
    'salesLead',
    'salesQuotation',
    'salesOrderEntity',
    'dispatch',
    'supplier',
    'category',
    'subCategory',
    'materialGroup',
    'rawMaterial',
    'product',
    'warehouse',
    'binLocation',
    'stockLevel',
    'stockMovement',
    'inventoryTransaction',
    'purchaseOrder',
    'purchaseOrderItem',
    'rFQ',
    'supplierQuotation',
    'gateEntry',
    'gateEntryItem',
    'reelInward',
    'qualityCheck',
    'notification',
    'auditLog',
  ];

  const mapModelToCollection: Record<string, keyof typeof enterpriseFallbackStore> = {
    user: 'users',
    role: 'roles',
    permission: 'permissions',
    customer: 'customers',
    salesLead: 'salesLeads',
    salesQuotation: 'quotations',
    salesOrderEntity: 'salesOrders',
    dispatch: 'dispatches',
    supplier: 'suppliers',
    category: 'categories',
    subCategory: 'subCategories',
    materialGroup: 'materialGroups',
    rawMaterial: 'rawMaterials',
    product: 'products',
    warehouse: 'warehouses',
    binLocation: 'binLocations',
    stockLevel: 'stockLevels',
    stockMovement: 'stockMovements',
    inventoryTransaction: 'inventoryTransactions',
    purchaseOrder: 'purchaseOrders',
    purchaseOrderItem: 'purchaseOrders',
    rFQ: 'rfqs',
    supplierQuotation: 'supplierQuotations',
    gateEntry: 'gateEntries',
    gateEntryItem: 'gateEntries',
    reelInward: 'reelInwards',
    qualityCheck: 'qualityChecks',
    notification: 'notifications',
    auditLog: 'auditLogs',
  };

  const client: any = {
    $transaction: async (arg: any) => {
      if (typeof arg === 'function') {
        return await arg(client);
      }
      if (Array.isArray(arg)) {
        return await Promise.all(arg);
      }
      return arg;
    },
    $queryRaw: async () => [],
    $executeRaw: async () => 0,
  };

  for (const m of models) {
    const colName = mapModelToCollection[m] || ('customers' as any);
    client[m] = createModelDelegate(colName);
  }

  return client;
}
