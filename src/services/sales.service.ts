import { prisma } from '../lib/prisma';
import { generateNextCode, createWithUniqueCode } from '../utils/code-generator';
import { salesStore, InMemoryCustomer, InMemorySalesLead, InMemoryQuotation, InMemorySalesOrder, InMemoryDispatch } from './sales-store';

async function tryDb<T = any>(dbFn: () => Promise<any>, fallbackFn: () => Promise<any> | any): Promise<any> {
  try {
    return await dbFn();
  } catch (err: any) {
    console.warn('[SalesService DB Fallback] Prisma operation failed, using resilient fallback store:', err?.message || err);
    return await fallbackFn();
  }
}

export class SalesService {
  // ==========================================
  // CUSTOMERS
  // ==========================================
  static async getCustomers(query?: { search?: string; status?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 100;
    const skip = (page - 1) * limit;

    return tryDb(
      async () => {
        const where: any = { isDeleted: false, deletedAt: null };
        if (query?.status) where.status = query.status;
        if (query?.search) {
          where.OR = [
            { name: { contains: query.search, mode: 'insensitive' } },
            { code: { contains: query.search, mode: 'insensitive' } },
            { contactPerson: { contains: query.search, mode: 'insensitive' } },
            { phone: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
          ];
        }

        const [customers, total] = await Promise.all([
          prisma.customer.findMany({
            where,
            include: {
              _count: {
                select: { leads: true, quotations: true, salesOrders: true, dispatches: true }
              }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          prisma.customer.count({ where }),
        ]);

        return { customers, total, page, limit };
      },
      () => {
        let filtered = salesStore.customers.filter(c => !c.isDeleted);
        if (query?.status && query.status !== 'All') {
          filtered = filtered.filter(c => c.status === query.status);
        }
        if (query?.search) {
          const s = query.search.toLowerCase();
          filtered = filtered.filter(c =>
            c.name.toLowerCase().includes(s) ||
            c.code.toLowerCase().includes(s) ||
            (c.contactPerson && c.contactPerson.toLowerCase().includes(s)) ||
            (c.phone && c.phone.includes(s)) ||
            (c.email && c.email.toLowerCase().includes(s))
          );
        }
        const total = filtered.length;
        const customers = filtered.slice(skip, skip + limit);
        return { customers, total, page, limit };
      }
    );
  }

  static async getCustomerById(id: string) {
    return tryDb(
      async () => {
        return prisma.customer.findUnique({
          where: { id },
          include: {
            leads: { where: { isDeleted: false }, orderBy: { createdAt: 'desc' } },
            quotations: { where: { isDeleted: false }, orderBy: { createdAt: 'desc' } },
            salesOrders: { where: { isDeleted: false }, orderBy: { createdAt: 'desc' }, include: { dispatches: true } },
            dispatches: { where: { isDeleted: false }, orderBy: { createdAt: 'desc' } },
          },
        });
      },
      () => {
        const cust = salesStore.customers.find(c => c.id === id && !c.isDeleted);
        if (!cust) return null;
        const leads = salesStore.leads.filter(l => (l.customerId === id || l.customerName === cust.name) && !l.isDeleted);
        const quotations = salesStore.quotations.filter(q => (q.customerId === id || q.customerName === cust.name) && !q.isDeleted);
        const salesOrders = salesStore.salesOrders.filter(so => (so.customerId === id || so.customerName === cust.name) && !so.isDeleted);
        const dispatches = salesStore.dispatches.filter(d => (d.customerId === id || d.customerName === cust.name) && !d.isDeleted);
        return { ...cust, leads, quotations, salesOrders, dispatches };
      }
    );
  }

  static async createCustomer(data: any) {
    return tryDb(
      async () => {
        return createWithUniqueCode('customer', 'CUST-', 'code', async (code) => {
          const customer = await prisma.customer.create({
            data: {
              name: data.name,
              code: data.code || code,
              contactPerson: data.contactPerson,
              phone: data.phone,
              email: data.email,
              address: data.address,
              status: data.status || 'Active',
              salesExecutive: data.salesExecutive,
            },
          });

          try {
            await prisma.auditLog.create({
              data: {
                action: 'CUSTOMER_CREATED',
                module: 'Sales',
                entity: 'Customer',
                entityId: customer.id,
                details: `Created customer ${customer.name} (${customer.code})`,
              },
            });
          } catch (_) {}

          return customer;
        });
      },
      () => {
        const codeNum = salesStore.customers.length + 1;
        const code = data.code || `CUST-${String(codeNum).padStart(4, '0')}`;
        const newCust: InMemoryCustomer = {
          id: `cust-${Date.now()}`,
          name: data.name,
          code,
          contactPerson: data.contactPerson,
          phone: data.phone,
          email: data.email,
          address: data.address,
          status: data.status || 'Active',
          salesExecutive: data.salesExecutive || 'Sales Executive',
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeleted: false,
          _count: { leads: 0, quotations: 0, salesOrders: 0, dispatches: 0 },
        };
        salesStore.customers.unshift(newCust);
        return newCust;
      }
    );
  }

  static async updateCustomer(id: string, data: any) {
    return tryDb(
      async () => {
        const customer = await prisma.customer.update({
          where: { id },
          data: {
            name: data.name,
            contactPerson: data.contactPerson,
            phone: data.phone,
            email: data.email,
            address: data.address,
            status: data.status,
            salesExecutive: data.salesExecutive,
          },
        });

        try {
          await prisma.auditLog.create({
            data: {
              action: 'CUSTOMER_UPDATED',
              module: 'Sales',
              entity: 'Customer',
              entityId: id,
              details: `Updated customer ${customer.name}`,
            },
          });
        } catch (_) {}

        return customer;
      },
      () => {
        const cust = salesStore.customers.find(c => c.id === id);
        if (!cust) throw new Error('Customer not found');
        if (data.name !== undefined) cust.name = data.name;
        if (data.contactPerson !== undefined) cust.contactPerson = data.contactPerson;
        if (data.phone !== undefined) cust.phone = data.phone;
        if (data.email !== undefined) cust.email = data.email;
        if (data.address !== undefined) cust.address = data.address;
        if (data.status !== undefined) cust.status = data.status;
        if (data.salesExecutive !== undefined) cust.salesExecutive = data.salesExecutive;
        cust.updatedAt = new Date();
        return cust;
      }
    );
  }

  static async deleteCustomer(id: string) {
    return tryDb(
      async () => {
        return prisma.$transaction(async (tx) => {
          const customer = await tx.customer.update({
            where: { id },
            data: {
              isDeleted: true,
              deletedAt: new Date(),
            },
          });

          try {
            await tx.auditLog.create({
              data: {
                action: 'CUSTOMER_DELETED',
                module: 'Sales',
                entity: 'Customer',
                entityId: id,
                details: `Deleted customer ${customer.name}`,
              },
            });
          } catch (_) {}

          return customer;
        });
      },
      () => {
        const cust = salesStore.customers.find(c => c.id === id);
        if (!cust) throw new Error('Customer not found');
        cust.isDeleted = true;
        cust.deletedAt = new Date();
        return cust;
      }
    );
  }

  // ==========================================
  // LEADS & PIPELINE
  // ==========================================
  static async getLeads(query?: { search?: string; status?: string; salesExecutive?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 100;
    const skip = (page - 1) * limit;

    return tryDb(
      async () => {
        const where: any = { isDeleted: false, deletedAt: null };
        if (query?.status && query.status !== 'All') where.status = query.status;
        if (query?.salesExecutive) where.assignedSalesExecutive = query.salesExecutive;
        if (query?.search) {
          where.OR = [
            { leadNumber: { contains: query.search, mode: 'insensitive' } },
            { customerName: { contains: query.search, mode: 'insensitive' } },
            { productRequirement: { contains: query.search, mode: 'insensitive' } },
            { contactPerson: { contains: query.search, mode: 'insensitive' } },
            { phone: { contains: query.search, mode: 'insensitive' } },
          ];
        }

        const [leads, total] = await Promise.all([
          prisma.salesLead.findMany({
            where,
            include: {
              customer: true,
              timeline: { orderBy: { timestamp: 'desc' } },
              quotations: { where: { isDeleted: false } },
              salesOrders: { where: { isDeleted: false } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          prisma.salesLead.count({ where }),
        ]);

        return { leads, total, page, limit };
      },
      () => {
        let filtered = salesStore.leads.filter(l => !l.isDeleted);
        if (query?.status && query.status !== 'All') {
          filtered = filtered.filter(l => l.status === query.status);
        }
        if (query?.salesExecutive) {
          filtered = filtered.filter(l => l.assignedSalesExecutive === query.salesExecutive);
        }
        if (query?.search) {
          const s = query.search.toLowerCase();
          filtered = filtered.filter(l =>
            l.leadNumber.toLowerCase().includes(s) ||
            l.customerName.toLowerCase().includes(s) ||
            l.productRequirement.toLowerCase().includes(s) ||
            (l.contactPerson && l.contactPerson.toLowerCase().includes(s)) ||
            (l.phone && l.phone.includes(s))
          );
        }
        const total = filtered.length;
        const leads = filtered.slice(skip, skip + limit).map(l => ({
          ...l,
          customer: salesStore.customers.find(c => c.id === l.customerId || c.name === l.customerName) || null,
          timeline: l.timeline || [],
          quotations: salesStore.quotations.filter(q => q.leadId === l.id && !q.isDeleted),
          salesOrders: salesStore.salesOrders.filter(so => so.leadId === l.id && !so.isDeleted),
        }));
        return { leads, total, page, limit };
      }
    );
  }

  static async getLeadById(id: string) {
    return tryDb(
      async () => {
        return prisma.salesLead.findUnique({
          where: { id },
          include: {
            customer: true,
            timeline: { orderBy: { timestamp: 'desc' } },
            quotations: { where: { isDeleted: false }, include: { revisions: true } },
            salesOrders: { where: { isDeleted: false }, include: { dispatches: true } },
            boms: { where: { isDeleted: false }, include: { costSheets: { where: { isDeleted: false } } } },
            costSheets: { where: { isDeleted: false } },
          },
        });
      },
      () => {
        const lead = salesStore.leads.find(l => l.id === id && !l.isDeleted);
        if (!lead) return null;
        return {
          ...lead,
          customer: salesStore.customers.find(c => c.id === lead.customerId || c.name === lead.customerName) || null,
          timeline: lead.timeline || [],
          quotations: salesStore.quotations.filter(q => q.leadId === lead.id && !q.isDeleted),
          salesOrders: salesStore.salesOrders.filter(so => so.leadId === lead.id && !so.isDeleted),
          boms: (salesStore as any).boms ? (salesStore as any).boms.filter((b: any) => b.leadId === lead.id && !b.isDeleted) : [],
          costSheets: (salesStore as any).costSheets ? (salesStore as any).costSheets.filter((cs: any) => cs.leadId === lead.id && !cs.isDeleted) : [],
        };
      }
    );
  }

  static async createLead(data: any) {
    return tryDb(
      async () => {
        return createWithUniqueCode('salesLead', 'LEAD-', 'leadNumber', async (leadNumber) => {
          return prisma.$transaction(async (tx) => {
            let customerId = data.customerId;
            if (!customerId && data.customerName) {
              const existingCust = await tx.customer.findFirst({
                where: { name: { equals: data.customerName.trim(), mode: 'insensitive' }, isDeleted: false },
              });
              if (existingCust) {
                customerId = existingCust.id;
              }
            }

            const lead = await tx.salesLead.create({
              data: {
                leadNumber,
                customerId: customerId || null,
                customerName: data.customerName,
                contactPerson: data.contactPerson,
                phone: data.phone,
                email: data.email,
                productRequirement: data.productRequirement,
                productDescription: data.productDescription,
                expectedQuantity: Number(data.expectedQuantity) || 0,
                requiredDeliveryDate: data.requiredDeliveryDate,
                specifications: typeof data.specifications === 'object' ? JSON.stringify(data.specifications) : data.specifications,
                sampleRequired: Boolean(data.sampleRequired),
                sampleDetails: data.sampleDetails,
                assignedSalesExecutive: data.assignedSalesExecutive || 'Sales Team',
                leadSource: data.leadSource || 'Direct Inquiry',
                followUpDate: data.followUpDate,
                status: data.status || 'Lead',
                remarks: data.remarks,
                attachments: data.attachments,
                timeline: {
                  create: {
                    action: 'Lead Created',
                    user: data.user || data.assignedSalesExecutive || 'Sales Executive',
                    remarks: `Lead initialized for ${data.customerName} (${data.productRequirement})`,
                  },
                },
              },
              include: { customer: true, timeline: true },
            });

            try {
              await tx.auditLog.create({
                data: {
                  action: 'SALES_LEAD_CREATED',
                  module: 'Sales',
                  entity: 'SalesLead',
                  entityId: lead.id,
                  details: `Created Sales Lead ${lead.leadNumber} for ${lead.customerName}`,
                },
              });
            } catch (_) {}

            return lead;
          });
        });
      },
      () => {
        const leadNum = salesStore.leads.length + 1;
        const leadNumber = `LEAD-${String(leadNum).padStart(4, '0')}`;
        let cust = salesStore.customers.find(c => c.name.toLowerCase() === data.customerName?.toLowerCase());
        if (!cust && data.customerName) {
          cust = {
            id: `cust-${Date.now()}`,
            name: data.customerName,
            code: `CUST-${String(salesStore.customers.length + 1).padStart(4, '0')}`,
            contactPerson: data.contactPerson,
            phone: data.phone,
            email: data.email,
            status: 'Active',
            createdAt: new Date(),
            updatedAt: new Date(),
            isDeleted: false,
          };
          salesStore.customers.push(cust);
        }

        const newLead: InMemorySalesLead = {
          id: `lead-${Date.now()}`,
          leadNumber,
          customerId: cust?.id || data.customerId || null,
          customerName: data.customerName,
          contactPerson: data.contactPerson,
          phone: data.phone,
          email: data.email,
          productRequirement: data.productRequirement,
          productDescription: data.productDescription,
          expectedQuantity: Number(data.expectedQuantity) || 0,
          requiredDeliveryDate: data.requiredDeliveryDate,
          specifications: typeof data.specifications === 'object' ? JSON.stringify(data.specifications) : data.specifications,
          sampleRequired: Boolean(data.sampleRequired),
          sampleDetails: data.sampleDetails,
          assignedSalesExecutive: data.assignedSalesExecutive || 'Sales Team',
          leadSource: data.leadSource || 'Direct Inquiry',
          followUpDate: data.followUpDate,
          status: data.status || 'New Inquiry',
          remarks: data.remarks,
          attachments: data.attachments,
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeleted: false,
          timeline: [
            {
              id: `tl-${Date.now()}`,
              action: 'Lead Created',
              user: data.user || data.assignedSalesExecutive || 'Sales Executive',
              remarks: `Lead initialized for ${data.customerName} (${data.productRequirement})`,
              timestamp: new Date(),
            },
          ],
        };
        salesStore.leads.unshift(newLead);
        return newLead;
      }
    );
  }

  static async updateLead(id: string, data: any) {
    return tryDb(
      async () => {
        return prisma.$transaction(async (tx) => {
          const prev = await tx.salesLead.findUnique({ where: { id } });
          if (!prev) throw new Error('Sales Lead not found');

          const lead = await tx.salesLead.update({
            where: { id },
            data: {
              customerName: data.customerName !== undefined ? data.customerName : prev.customerName,
              customerId: data.customerId !== undefined ? data.customerId : prev.customerId,
              contactPerson: data.contactPerson !== undefined ? data.contactPerson : prev.contactPerson,
              phone: data.phone !== undefined ? data.phone : prev.phone,
              email: data.email !== undefined ? data.email : prev.email,
              productRequirement: data.productRequirement !== undefined ? data.productRequirement : prev.productRequirement,
              productDescription: data.productDescription !== undefined ? data.productDescription : prev.productDescription,
              expectedQuantity: data.expectedQuantity !== undefined ? Number(data.expectedQuantity) : prev.expectedQuantity,
              requiredDeliveryDate: data.requiredDeliveryDate !== undefined ? data.requiredDeliveryDate : prev.requiredDeliveryDate,
              specifications: data.specifications !== undefined ? (typeof data.specifications === 'object' ? JSON.stringify(data.specifications) : data.specifications) : prev.specifications,
              sampleRequired: data.sampleRequired !== undefined ? Boolean(data.sampleRequired) : prev.sampleRequired,
              sampleDetails: data.sampleDetails !== undefined ? data.sampleDetails : prev.sampleDetails,
              assignedSalesExecutive: data.assignedSalesExecutive !== undefined ? data.assignedSalesExecutive : prev.assignedSalesExecutive,
              leadSource: data.leadSource !== undefined ? data.leadSource : prev.leadSource,
              followUpDate: data.followUpDate !== undefined ? data.followUpDate : prev.followUpDate,
              status: data.status !== undefined ? data.status : prev.status,
              remarks: data.remarks !== undefined ? data.remarks : prev.remarks,
              attachments: data.attachments !== undefined ? data.attachments : prev.attachments,
            },
            include: { customer: true, timeline: true },
          });

          if (data.status && data.status !== prev.status) {
            await tx.leadTimeline.create({
              data: {
                leadId: id,
                action: `Stage Changed to ${data.status}`,
                user: data.user || 'Sales Executive',
                remarks: data.remarks || `Stage updated from ${prev.status} to ${data.status}`,
              },
            });
          }

          try {
            await tx.auditLog.create({
              data: {
                action: 'SALES_LEAD_UPDATED',
                module: 'Sales',
                entity: 'SalesLead',
                entityId: id,
                details: `Updated Sales Lead ${lead.leadNumber}`,
              },
            });
          } catch (_) {}

          return lead;
        });
      },
      () => {
        const lead = salesStore.leads.find(l => l.id === id);
        if (!lead) throw new Error('Sales Lead not found');
        const prevStatus = lead.status;
        Object.assign(lead, {
          customerName: data.customerName !== undefined ? data.customerName : lead.customerName,
          customerId: data.customerId !== undefined ? data.customerId : lead.customerId,
          contactPerson: data.contactPerson !== undefined ? data.contactPerson : lead.contactPerson,
          phone: data.phone !== undefined ? data.phone : lead.phone,
          email: data.email !== undefined ? data.email : lead.email,
          productRequirement: data.productRequirement !== undefined ? data.productRequirement : lead.productRequirement,
          productDescription: data.productDescription !== undefined ? data.productDescription : lead.productDescription,
          expectedQuantity: data.expectedQuantity !== undefined ? Number(data.expectedQuantity) : lead.expectedQuantity,
          requiredDeliveryDate: data.requiredDeliveryDate !== undefined ? data.requiredDeliveryDate : lead.requiredDeliveryDate,
          specifications: data.specifications !== undefined ? (typeof data.specifications === 'object' ? JSON.stringify(data.specifications) : data.specifications) : lead.specifications,
          sampleRequired: data.sampleRequired !== undefined ? Boolean(data.sampleRequired) : lead.sampleRequired,
          sampleDetails: data.sampleDetails !== undefined ? data.sampleDetails : lead.sampleDetails,
          assignedSalesExecutive: data.assignedSalesExecutive !== undefined ? data.assignedSalesExecutive : lead.assignedSalesExecutive,
          leadSource: data.leadSource !== undefined ? data.leadSource : lead.leadSource,
          followUpDate: data.followUpDate !== undefined ? data.followUpDate : lead.followUpDate,
          status: data.status !== undefined ? data.status : lead.status,
          remarks: data.remarks !== undefined ? data.remarks : lead.remarks,
          attachments: data.attachments !== undefined ? data.attachments : lead.attachments,
          updatedAt: new Date(),
        });

        if (data.status && data.status !== prevStatus) {
          lead.timeline = lead.timeline || [];
          lead.timeline.unshift({
            id: `tl-${Date.now()}`,
            action: `Stage Changed to ${data.status}`,
            user: data.user || 'Sales Executive',
            remarks: data.remarks || `Stage updated from ${prevStatus} to ${data.status}`,
            timestamp: new Date(),
          });
        }
        return lead;
      }
    );
  }

  static async updateLeadStage(id: string, data: { status: string; remarks?: string; user?: string }) {
    return tryDb(
      async () => {
        return prisma.$transaction(async (tx) => {
          const prev = await tx.salesLead.findUnique({ where: { id } });
          if (!prev) throw new Error('Sales Lead not found');

          const lead = await tx.salesLead.update({
            where: { id },
            data: { status: data.status },
            include: { customer: true, timeline: true },
          });

          await tx.leadTimeline.create({
            data: {
              leadId: id,
              action: `Stage: ${data.status}`,
              user: data.user || 'Sales Executive',
              remarks: data.remarks || `Stage transition to ${data.status}`,
            },
          });

          return lead;
        });
      },
      () => {
        const lead = salesStore.leads.find(l => l.id === id);
        if (!lead) throw new Error('Sales Lead not found');
        lead.status = data.status;
        lead.updatedAt = new Date();
        lead.timeline = lead.timeline || [];
        lead.timeline.unshift({
          id: `tl-${Date.now()}`,
          action: `Stage: ${data.status}`,
          user: data.user || 'Sales Executive',
          remarks: data.remarks || `Stage transition to ${data.status}`,
          timestamp: new Date(),
        });
        return lead;
      }
    );
  }

  static async sendLeadToCosting(id: string, data: { remarks?: string; user?: string }) {
    return tryDb(
      async () => {
        return prisma.$transaction(async (tx) => {
          const costingCode = await generateNextCode('salesQuotation', 'QUO-', 'quotationNumber', 4, tx);

          const lead = await tx.salesLead.update({
            where: { id },
            data: {
              status: 'Costing',
              costingRequestId: costingCode,
            },
            include: { customer: true },
          });

          const quotation = await tx.salesQuotation.create({
            data: {
              quotationNumber: costingCode,
              leadId: lead.id,
              customerId: lead.customerId,
              customerName: lead.customerName,
              productName: lead.productRequirement,
              revision: 1,
              quotationDate: new Date().toISOString().split('T')[0],
              validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              amount: 0,
              salesExecutive: lead.assignedSalesExecutive,
              status: 'Pending Costing',
              costingSummary: `Costing initiated for ${lead.expectedQuantity} units of ${lead.productRequirement}`,
              remarks: data.remarks || 'Initiated via Lead pipeline',
            },
          });

          await tx.leadTimeline.create({
            data: {
              leadId: id,
              action: 'Sent to Costing Department',
              user: data.user || 'Sales Executive',
              remarks: `Generated Costing Reference ${costingCode}. ${data.remarks || ''}`,
            },
          });

          return { lead, quotation };
        });
      },
      () => {
        const lead = salesStore.leads.find(l => l.id === id);
        if (!lead) throw new Error('Sales Lead not found');
        const quoteNum = salesStore.quotations.length + 1;
        const costingCode = `QUO-${String(quoteNum).padStart(4, '0')}`;
        lead.status = 'Costing';
        lead.costingRequestId = costingCode;
        lead.updatedAt = new Date();

        const quotation: InMemoryQuotation = {
          id: `quo-${Date.now()}`,
          quotationNumber: costingCode,
          leadId: lead.id,
          customerId: lead.customerId,
          customerName: lead.customerName,
          productName: lead.productRequirement,
          revision: 1,
          quotationDate: new Date().toISOString().split('T')[0],
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          amount: 0,
          salesExecutive: lead.assignedSalesExecutive,
          status: 'Pending Costing',
          costingSummary: `Costing initiated for ${lead.expectedQuantity} units of ${lead.productRequirement}`,
          remarks: data.remarks || 'Initiated via Lead pipeline',
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeleted: false,
          revisions: [
            {
              id: `rev-${Date.now()}`,
              revisionNumber: 1,
              createdDate: new Date().toISOString().split('T')[0],
              createdBy: lead.assignedSalesExecutive || 'Sales Executive',
              reason: 'Costing Initialization',
              status: 'Pending Costing',
              amount: 0,
            },
          ],
        };
        salesStore.quotations.unshift(quotation);

        lead.timeline = lead.timeline || [];
        lead.timeline.unshift({
          id: `tl-${Date.now()}`,
          action: 'Sent to Costing Department',
          user: data.user || 'Sales Executive',
          remarks: `Generated Costing Reference ${costingCode}. ${data.remarks || ''}`,
          timestamp: new Date(),
        });

        return { lead, quotation };
      }
    );
  }

  static async captureCustomerPo(id: string, data: { customerPoNumber: string; customerPoDate?: string; customerPoAttachment?: string; remarks?: string; user?: string }) {
    return tryDb(
      async () => {
        return prisma.$transaction(async (tx) => {
          const lead = await tx.salesLead.update({
            where: { id },
            data: {
              status: 'Won',
              customerPoNumber: data.customerPoNumber,
              customerPoDate: data.customerPoDate || new Date().toISOString().split('T')[0],
              customerPoAttachment: data.customerPoAttachment,
            },
          });

          await tx.leadTimeline.create({
            data: {
              leadId: id,
              action: `Customer PO Captured: ${data.customerPoNumber}`,
              user: data.user || 'Sales Executive',
              remarks: data.remarks || `Customer PO registered. Order ready for conversion.`,
            },
          });

          return lead;
        });
      },
      () => {
        const lead = salesStore.leads.find(l => l.id === id);
        if (!lead) throw new Error('Sales Lead not found');
        lead.status = 'Won';
        lead.customerPoNumber = data.customerPoNumber;
        lead.customerPoDate = data.customerPoDate || new Date().toISOString().split('T')[0];
        lead.customerPoAttachment = data.customerPoAttachment;
        lead.updatedAt = new Date();

        lead.timeline = lead.timeline || [];
        lead.timeline.unshift({
          id: `tl-${Date.now()}`,
          action: `Customer PO Captured: ${data.customerPoNumber}`,
          user: data.user || 'Sales Executive',
          remarks: data.remarks || `Customer PO registered. Order ready for conversion.`,
          timestamp: new Date(),
        });

        return lead;
      }
    );
  }

  static async convertLeadToOrder(id: string, data: { deliveryDate?: string; warehouseId?: string; unitPrice?: number; user?: string }) {
    return tryDb(
      async () => {
        return prisma.$transaction(async (tx) => {
          const lead = await tx.salesLead.findUnique({
            where: { id },
            include: { quotations: { orderBy: { createdAt: 'desc' }, take: 1 } },
          });
          if (!lead) throw new Error('Sales Lead not found');

          const soNumber = await generateNextCode('salesOrderEntity', 'SO-', 'soNumber', 4, tx);
          const latestQuote = lead.quotations?.[0];
          const unitPrice = Number(data.unitPrice) || (latestQuote ? latestQuote.amount / (lead.expectedQuantity || 1) : 0);
          const quantity = lead.expectedQuantity || 1;
          const totalValue = quantity * unitPrice;
          const taxRate = 18;
          const taxAmount = (totalValue * taxRate) / 100;
          const grandTotal = totalValue + taxAmount;

          const salesOrder = await tx.salesOrderEntity.create({
            data: {
              soNumber,
              customerId: lead.customerId,
              customerName: lead.customerName,
              customerPoNumber: lead.customerPoNumber || `PO-${soNumber}`,
              poDate: lead.customerPoDate || new Date().toISOString().split('T')[0],
              leadId: lead.id,
              quotationId: latestQuote?.id || null,
              productName: lead.productRequirement,
              quantity,
              quantityDispatched: 0,
              quantityPending: quantity,
              unitPrice,
              totalValue,
              taxRate,
              taxAmount,
              grandTotal,
              orderDate: new Date().toISOString().split('T')[0],
              deliveryDate: data.deliveryDate || lead.requiredDeliveryDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              salesExecutive: lead.assignedSalesExecutive,
              warehouseId: data.warehouseId || null,
              status: 'Confirmed',
              productionStatus: 'Pending Planning',
              dispatchStatus: 'Pending',
            },
          });

          await tx.salesLead.update({
            where: { id },
            data: { status: 'Converted' },
          });

          await tx.leadTimeline.create({
            data: {
              leadId: id,
              action: `Converted to Sales Order: ${soNumber}`,
              user: data.user || 'Sales Executive',
              remarks: `Sales Order created with ${quantity} units, Grand Total ₹${grandTotal.toLocaleString('en-IN')}`,
            },
          });

          try {
            await tx.auditLog.create({
              data: {
                action: 'SALES_ORDER_CONVERTED_FROM_LEAD',
                module: 'Sales',
                entity: 'SalesOrderEntity',
                entityId: salesOrder.id,
                details: `Lead ${lead.leadNumber} converted into Sales Order ${salesOrder.soNumber}`,
              },
            });
          } catch (_) {}

          return salesOrder;
        });
      },
      () => {
        const lead = salesStore.leads.find(l => l.id === id);
        if (!lead) throw new Error('Sales Lead not found');
        const quote = salesStore.quotations.find(q => q.leadId === id);
        const orderNum = salesStore.salesOrders.length + 1;
        const soNumber = `SO-${String(orderNum).padStart(4, '0')}`;
        const unitPrice = Number(data.unitPrice) || (quote && quote.amount > 0 ? quote.amount / (lead.expectedQuantity || 1) : 18.0);
        const quantity = lead.expectedQuantity || 1000;
        const totalValue = quantity * unitPrice;
        const taxRate = 18;
        const taxAmount = (totalValue * taxRate) / 100;
        const grandTotal = totalValue + taxAmount;

        const newOrder: InMemorySalesOrder = {
          id: `so-${Date.now()}`,
          soNumber,
          customerId: lead.customerId,
          customerName: lead.customerName,
          customerPoNumber: lead.customerPoNumber || `PO-${soNumber}`,
          poDate: lead.customerPoDate || new Date().toISOString().split('T')[0],
          leadId: lead.id,
          quotationId: quote?.id || null,
          productName: lead.productRequirement,
          quantity,
          quantityDispatched: 0,
          quantityPending: quantity,
          unitPrice,
          totalValue,
          taxRate,
          taxAmount,
          grandTotal,
          orderDate: new Date().toISOString().split('T')[0],
          deliveryDate: data.deliveryDate || lead.requiredDeliveryDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          salesExecutive: lead.assignedSalesExecutive,
          warehouseId: data.warehouseId || null,
          status: 'Confirmed',
          productionStatus: 'Planning',
          dispatchStatus: 'Pending',
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeleted: false,
        };
        salesStore.salesOrders.unshift(newOrder);

        lead.status = 'Converted';
        lead.updatedAt = new Date();
        lead.timeline = lead.timeline || [];
        lead.timeline.unshift({
          id: `tl-${Date.now()}`,
          action: `Converted to Sales Order: ${soNumber}`,
          user: data.user || 'Sales Executive',
          remarks: `Sales Order created with ${quantity} units, Grand Total ₹${grandTotal.toLocaleString('en-IN')}`,
          timestamp: new Date(),
        });

        return newOrder;
      }
    );
  }

  static async deleteLead(id: string) {
    return tryDb(
      async () => {
        return prisma.$transaction(async (tx) => {
          const lead = await tx.salesLead.update({
            where: { id },
            data: { isDeleted: true, deletedAt: new Date() },
          });

          try {
            await tx.auditLog.create({
              data: {
                action: 'SALES_LEAD_DELETED',
                module: 'Sales',
                entity: 'SalesLead',
                entityId: id,
                details: `Deleted Sales Lead ${lead.leadNumber}`,
              },
            });
          } catch (_) {}

          return lead;
        });
      },
      () => {
        const lead = salesStore.leads.find(l => l.id === id);
        if (!lead) throw new Error('Sales Lead not found');
        lead.isDeleted = true;
        lead.deletedAt = new Date();
        return lead;
      }
    );
  }

  // ==========================================
  // QUOTATIONS
  // ==========================================
  static async getQuotations(query?: { search?: string; status?: string; leadId?: string; customerId?: string; page?: number; limit?: number }) {
    const page = query?.page || 1;
    const limit = query?.limit || 100;
    const skip = (page - 1) * limit;

    return tryDb(
      async () => {
        const where: any = { isDeleted: false, deletedAt: null };
        if (query?.status && query.status !== 'All') where.status = query.status;
        if (query?.leadId) where.leadId = query.leadId;
        if (query?.customerId) where.customerId = query.customerId;
        if (query?.search) {
          where.OR = [
            { quotationNumber: { contains: query.search, mode: 'insensitive' } },
            { customerName: { contains: query.search, mode: 'insensitive' } },
            { productName: { contains: query.search, mode: 'insensitive' } },
          ];
        }

        const [quotations, total] = await Promise.all([
          prisma.salesQuotation.findMany({
            where,
            include: {
              lead: true,
              customer: true,
              revisions: { orderBy: { revisionNumber: 'desc' } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          prisma.salesQuotation.count({ where }),
        ]);

        return { quotations, total, page, limit };
      },
      () => {
        let filtered = salesStore.quotations.filter(q => !q.isDeleted);
        if (query?.status && query.status !== 'All') {
          filtered = filtered.filter(q => q.status === query.status);
        }
        if (query?.leadId) {
          filtered = filtered.filter(q => q.leadId === query.leadId);
        }
        if (query?.customerId) {
          filtered = filtered.filter(q => q.customerId === query.customerId);
        }
        if (query?.search) {
          const s = query.search.toLowerCase();
          filtered = filtered.filter(q =>
            q.quotationNumber.toLowerCase().includes(s) ||
            q.customerName.toLowerCase().includes(s) ||
            q.productName.toLowerCase().includes(s)
          );
        }
        const total = filtered.length;
        const quotations = filtered.slice(skip, skip + limit).map(q => ({
          ...q,
          lead: salesStore.leads.find(l => l.id === q.leadId),
          customer: salesStore.customers.find(c => c.id === q.customerId || c.name === q.customerName),
          revisions: q.revisions || [],
        }));
        return { quotations, total, page, limit };
      }
    );
  }

  static async getQuotationById(id: string) {
    return tryDb(
      async () => {
        return prisma.salesQuotation.findUnique({
          where: { id },
          include: {
            lead: { include: { timeline: true } },
            customer: true,
            revisions: { orderBy: { revisionNumber: 'desc' } },
          },
        });
      },
      () => {
        const quote = salesStore.quotations.find(q => q.id === id && !q.isDeleted);
        if (!quote) return null;
        return {
          ...quote,
          lead: salesStore.leads.find(l => l.id === quote.leadId),
          customer: salesStore.customers.find(c => c.id === quote.customerId || c.name === quote.customerName),
          revisions: quote.revisions || [],
        };
      }
    );
  }

  static async createQuotation(data: any) {
    return tryDb(
      async () => {
        return createWithUniqueCode('salesQuotation', 'QUO-', 'quotationNumber', async (quotationNumber) => {
          const quotation = await prisma.salesQuotation.create({
            data: {
              quotationNumber,
              leadId: data.leadId || null,
              customerId: data.customerId || null,
              customerName: data.customerName,
              productId: data.productId || null,
              productName: data.productName,
              revision: 1,
              quotationDate: data.quotationDate || new Date().toISOString().split('T')[0],
              validUntil: data.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              amount: Number(data.amount) || 0,
              salesExecutive: data.salesExecutive,
              status: data.status || 'Pending Costing',
              costingSummary: data.costingSummary,
              remarks: data.remarks,
              revisions: {
                create: {
                  revisionNumber: 1,
                  createdDate: new Date().toISOString().split('T')[0],
                  createdBy: data.salesExecutive || 'Sales Executive',
                  reason: 'Initial Quotation Base',
                  status: data.status || 'Pending Costing',
                  amount: Number(data.amount) || 0,
                },
              },
            },
            include: { revisions: true, lead: true, customer: true },
          });

          try {
            await prisma.auditLog.create({
              data: {
                action: 'SALES_QUOTATION_CREATED',
                module: 'Sales',
                entity: 'SalesQuotation',
                entityId: quotation.id,
                details: `Created quotation ${quotation.quotationNumber} for ${quotation.customerName}`,
              },
            });
          } catch (_) {}

          return quotation;
        });
      },
      () => {
        const quoteNum = salesStore.quotations.length + 1;
        const quotationNumber = `QUO-${String(quoteNum).padStart(4, '0')}`;
        const amount = Number(data.amount) || 0;
        const newQuote: InMemoryQuotation = {
          id: `quo-${Date.now()}`,
          quotationNumber,
          leadId: data.leadId || null,
          customerId: data.customerId || null,
          customerName: data.customerName,
          productId: data.productId || null,
          productName: data.productName,
          revision: 1,
          quotationDate: data.quotationDate || new Date().toISOString().split('T')[0],
          validUntil: data.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          amount,
          salesExecutive: data.salesExecutive || 'Sales Executive',
          status: data.status || 'Pending Costing',
          costingSummary: data.costingSummary,
          remarks: data.remarks,
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeleted: false,
          revisions: [
            {
              id: `rev-${Date.now()}`,
              revisionNumber: 1,
              createdDate: new Date().toISOString().split('T')[0],
              createdBy: data.salesExecutive || 'Sales Executive',
              reason: 'Initial Quotation Base',
              status: data.status || 'Pending Costing',
              amount,
            },
          ],
        };
        salesStore.quotations.unshift(newQuote);
        return newQuote;
      }
    );
  }

  static async updateQuotation(id: string, data: any) {
    return tryDb(
      async () => {
        const quotation = await prisma.salesQuotation.update({
          where: { id },
          data: {
            customerName: data.customerName,
            productName: data.productName,
            quotationDate: data.quotationDate,
            validUntil: data.validUntil,
            amount: data.amount !== undefined ? Number(data.amount) : undefined,
            salesExecutive: data.salesExecutive,
            status: data.status,
            costingSummary: data.costingSummary,
            remarks: data.remarks,
          },
          include: { revisions: true, lead: true, customer: true },
        });

        return quotation;
      },
      () => {
        const quote = salesStore.quotations.find(q => q.id === id);
        if (!quote) throw new Error('Quotation not found');
        if (data.customerName !== undefined) quote.customerName = data.customerName;
        if (data.productName !== undefined) quote.productName = data.productName;
        if (data.quotationDate !== undefined) quote.quotationDate = data.quotationDate;
        if (data.validUntil !== undefined) quote.validUntil = data.validUntil;
        if (data.amount !== undefined) quote.amount = Number(data.amount);
        if (data.salesExecutive !== undefined) quote.salesExecutive = data.salesExecutive;
        if (data.status !== undefined) quote.status = data.status;
        if (data.costingSummary !== undefined) quote.costingSummary = data.costingSummary;
        if (data.remarks !== undefined) quote.remarks = data.remarks;
        quote.updatedAt = new Date();
        return quote;
      }
    );
  }

  static async createQuotationRevision(id: string, data: { amount: number; reason: string; createdBy?: string }) {
    return tryDb(
      async () => {
        return prisma.$transaction(async (tx) => {
          const quote = await tx.salesQuotation.findUnique({
            where: { id },
            include: { revisions: { orderBy: { revisionNumber: 'desc' }, take: 1 } },
          });
          if (!quote) throw new Error('Quotation not found');

          const nextRevNumber = (quote.revisions?.[0]?.revisionNumber || quote.revision || 1) + 1;

          const revision = await tx.quotationRevision.create({
            data: {
              quotationId: id,
              revisionNumber: nextRevNumber,
              createdDate: new Date().toISOString().split('T')[0],
              createdBy: data.createdBy || 'Sales Executive',
              reason: data.reason,
              status: 'Revised',
              amount: Number(data.amount),
            },
          });

          const updatedQuote = await tx.salesQuotation.update({
            where: { id },
            data: {
              revision: nextRevNumber,
              amount: Number(data.amount),
              status: 'Revised',
            },
            include: { revisions: true, lead: true, customer: true },
          });

          if (quote.leadId) {
            await tx.leadTimeline.create({
              data: {
                leadId: quote.leadId,
                action: `Quotation Revised (Rev ${nextRevNumber})`,
                user: data.createdBy || 'Sales Executive',
                remarks: `Revised amount to ₹${Number(data.amount).toLocaleString('en-IN')}. Reason: ${data.reason}`,
              },
            });
          }

          return { quotation: updatedQuote, revision };
        });
      },
      () => {
        const quote = salesStore.quotations.find(q => q.id === id);
        if (!quote) throw new Error('Quotation not found');
        quote.revisions = quote.revisions || [];
        const nextRevNumber = (quote.revisions.length > 0 ? Math.max(...quote.revisions.map((r: any) => r.revisionNumber)) : quote.revision || 1) + 1;
        const newRev = {
          id: `rev-${Date.now()}`,
          revisionNumber: nextRevNumber,
          createdDate: new Date().toISOString().split('T')[0],
          createdBy: data.createdBy || 'Sales Executive',
          reason: data.reason,
          status: 'Revised',
          amount: Number(data.amount),
        };
        quote.revisions.unshift(newRev);
        quote.revision = nextRevNumber;
        quote.amount = Number(data.amount);
        quote.status = 'Revised';
        quote.updatedAt = new Date();

        if (quote.leadId) {
          const lead = salesStore.leads.find(l => l.id === quote.leadId);
          if (lead) {
            lead.timeline = lead.timeline || [];
            lead.timeline.unshift({
              id: `tl-${Date.now()}`,
              action: `Quotation Revised (Rev ${nextRevNumber})`,
              user: data.createdBy || 'Sales Executive',
              remarks: `Revised amount to ₹${Number(data.amount).toLocaleString('en-IN')}. Reason: ${data.reason}`,
              timestamp: new Date(),
            });
          }
        }

        return { quotation: quote, revision: newRev };
      }
    );
  }

  static async updateQuotationStatus(id: string, data: { status: string; remarks?: string; user?: string }) {
    // If marking as Won or Converted, also ensure sales order conversion happens
    if (data.status === 'Won' || data.status === 'Converted') {
      try {
        await this.convertQuotationToSalesOrder(id, {
          remarks: data.remarks,
          user: data.user,
        });
      } catch (e) {
        console.warn('[updateQuotationStatus] auto-conversion note:', e);
      }
    }

    return tryDb(
      async () => {
        return prisma.$transaction(async (tx) => {
          const quote = await tx.salesQuotation.update({
            where: { id },
            data: { status: data.status, remarks: data.remarks },
            include: { lead: true, customer: true, revisions: true },
          });

          if (quote.leadId) {
            await tx.leadTimeline.create({
              data: {
                leadId: quote.leadId,
                action: `Quotation Status: ${data.status}`,
                user: data.user || 'Sales Executive',
                remarks: data.remarks || `Quotation ${quote.quotationNumber} updated to ${data.status}`,
              },
            });
          }

          return quote;
        });
      },
      () => {
        const quote = salesStore.quotations.find(q => q.id === id);
        if (!quote) throw new Error('Quotation not found');
        quote.status = data.status;
        if (data.remarks) quote.remarks = data.remarks;
        quote.updatedAt = new Date();

        if (quote.leadId) {
          const lead = salesStore.leads.find(l => l.id === quote.leadId);
          if (lead) {
            lead.timeline = lead.timeline || [];
            lead.timeline.unshift({
              id: `tl-${Date.now()}`,
              action: `Quotation Status: ${data.status}`,
              user: data.user || 'Sales Executive',
              remarks: data.remarks || `Quotation ${quote.quotationNumber} updated to ${data.status}`,
              timestamp: new Date(),
            });
          }
        }

        return quote;
      }
    );
  }

  static async convertQuotationToSalesOrder(
    quotationId: string,
    data?: {
      customerPoNumber?: string;
      poDate?: string;
      deliveryDate?: string;
      quantity?: number;
      unitPrice?: number;
      salesExecutive?: string;
      warehouseId?: string;
      shippingAddress?: string;
      billingAddress?: string;
      specialInstructions?: string;
      user?: string;
      remarks?: string;
    }
  ) {
    return tryDb(
      async () => {
        return prisma.$transaction(async (tx) => {
          const quotation = await tx.salesQuotation.findUnique({
            where: { id: quotationId },
            include: { lead: true, customer: true, revisions: { orderBy: { revisionNumber: 'desc' }, take: 1 } },
          });
          if (!quotation) throw new Error('Quotation not found');

          // Check if an order already exists for this quotation
          const existingOrder = await tx.salesOrderEntity.findFirst({
            where: {
              OR: [
                { quotationId: quotation.id },
                { customerPoNumber: data?.customerPoNumber || `PO-${quotation.quotationNumber}` }
              ],
              isDeleted: false
            },
            include: { customer: true, product: true, warehouse: true },
          });

          if (existingOrder) {
            await tx.salesQuotation.update({
              where: { id: quotationId },
              data: { status: 'Won' },
            });
            if (quotation.leadId) {
              await tx.salesLead.update({
                where: { id: quotation.leadId },
                data: { status: 'Converted' },
              }).catch(() => {});
            }
            return existingOrder;
          }

          const soNumber = await generateNextCode('salesOrderEntity', 'SO-', 'soNumber', 4, tx);
          const quantity = Number(data?.quantity) || quotation.lead?.expectedQuantity || 1000;
          const unitPrice = Number(data?.unitPrice) || (quotation.amount && quantity > 0 ? Number((quotation.amount / quantity).toFixed(2)) : 50);
          const totalValue = quantity * unitPrice;
          const taxRate = 18;
          const taxAmount = (totalValue * taxRate) / 100;
          const grandTotal = totalValue + taxAmount;
          const deliveryDate = data?.deliveryDate || quotation.lead?.requiredDeliveryDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

          const salesOrder = await tx.salesOrderEntity.create({
            data: {
              soNumber,
              customerId: quotation.customerId || quotation.lead?.customerId || null,
              customerName: quotation.customerName,
              customerPoNumber: data?.customerPoNumber || quotation.lead?.customerPoNumber || `PO-${quotation.quotationNumber}`,
              poDate: data?.poDate || quotation.lead?.customerPoDate || new Date().toISOString().split('T')[0],
              leadId: quotation.leadId || null,
              quotationId: quotation.id,
              productName: quotation.productName,
              quantity,
              quantityDispatched: 0,
              quantityPending: quantity,
              unitPrice,
              totalValue,
              taxRate,
              taxAmount,
              grandTotal,
              orderDate: new Date().toISOString().split('T')[0],
              deliveryDate,
              salesExecutive: data?.salesExecutive || quotation.salesExecutive || 'Sales Executive',
              warehouseId: data?.warehouseId || null,
              shippingAddress: data?.shippingAddress || quotation.customer?.address || null,
              billingAddress: data?.billingAddress || quotation.customer?.address || null,
              specialInstructions: data?.specialInstructions || data?.remarks || `Converted from Quotation ${quotation.quotationNumber}`,
              status: 'Confirmed',
              productionStatus: 'Pending Planning',
              dispatchStatus: 'Pending',
            },
            include: { customer: true, product: true, warehouse: true },
          });

          await tx.salesQuotation.update({
            where: { id: quotationId },
            data: { status: 'Won' },
          });

          if (quotation.leadId) {
            await tx.salesLead.update({
              where: { id: quotation.leadId },
              data: { status: 'Converted' },
            }).catch(() => {});

            await tx.leadTimeline.create({
              data: {
                leadId: quotation.leadId,
                action: `Converted to Sales Order: ${soNumber}`,
                user: data?.user || quotation.salesExecutive || 'Sales Executive',
                remarks: `Quotation ${quotation.quotationNumber} converted to Sales Order ${soNumber} (${quantity} units, Total ₹${grandTotal.toLocaleString('en-IN')})`,
              },
            }).catch(() => {});
          }

          try {
            await tx.auditLog.create({
              data: {
                action: 'SALES_ORDER_CONVERTED_FROM_QUOTATION',
                module: 'Sales',
                entity: 'SalesOrderEntity',
                entityId: salesOrder.id,
                details: `Quotation ${quotation.quotationNumber} converted into Sales Order ${salesOrder.soNumber}`,
              },
            });
          } catch (_) {}

          return salesOrder;
        });
      },
      () => {
        const quotation = salesStore.quotations.find(q => q.id === quotationId || q.quotationNumber === quotationId);
        if (!quotation) throw new Error('Quotation not found');

        const existingOrder = salesStore.salesOrders.find(
          so => (so.quotationId === quotation.id || (so.customerPoNumber && so.customerPoNumber === `PO-${quotation.quotationNumber}`)) && !so.isDeleted
        );
        if (existingOrder) {
          quotation.status = 'Won';
          quotation.updatedAt = new Date();
          return existingOrder;
        }

        const lead = quotation.leadId ? salesStore.leads.find(l => l.id === quotation.leadId) : null;
        const customer = quotation.customerId ? salesStore.customers.find(c => c.id === quotation.customerId) : null;

        const orderNum = salesStore.salesOrders.length + 1;
        const soNumber = `SO-${String(orderNum).padStart(4, '0')}`;
        const quantity = Number(data?.quantity) || lead?.expectedQuantity || 1000;
        const unitPrice = Number(data?.unitPrice) || (quotation.amount && quantity > 0 ? Number((quotation.amount / quantity).toFixed(2)) : 50);
        const totalValue = quantity * unitPrice;
        const taxRate = 18;
        const taxAmount = (totalValue * taxRate) / 100;
        const grandTotal = totalValue + taxAmount;
        const deliveryDate = data?.deliveryDate || lead?.requiredDeliveryDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const newOrder: InMemorySalesOrder = {
          id: `so-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          soNumber,
          customerId: quotation.customerId || lead?.customerId || null,
          customerName: quotation.customerName,
          customerPoNumber: data?.customerPoNumber || lead?.customerPoNumber || `PO-${quotation.quotationNumber}`,
          poDate: data?.poDate || lead?.customerPoDate || new Date().toISOString().split('T')[0],
          leadId: quotation.leadId || null,
          quotationId: quotation.id,
          productName: quotation.productName,
          quantity,
          quantityDispatched: 0,
          quantityPending: quantity,
          unitPrice,
          totalValue,
          taxRate,
          taxAmount,
          grandTotal,
          orderDate: new Date().toISOString().split('T')[0],
          deliveryDate,
          salesExecutive: data?.salesExecutive || quotation.salesExecutive || 'Sales Executive',
          warehouseId: data?.warehouseId || null,
          shippingAddress: data?.shippingAddress || customer?.address || undefined,
          billingAddress: data?.billingAddress || customer?.address || undefined,
          specialInstructions: data?.specialInstructions || data?.remarks || `Converted from Quotation ${quotation.quotationNumber}`,
          status: 'Confirmed',
          productionStatus: 'Planning',
          dispatchStatus: 'Pending',
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeleted: false,
        };

        salesStore.salesOrders.unshift(newOrder);

        quotation.status = 'Won';
        quotation.updatedAt = new Date();

        if (lead) {
          lead.status = 'Converted';
          lead.updatedAt = new Date();
          lead.timeline = lead.timeline || [];
          lead.timeline.unshift({
            id: `tl-${Date.now()}`,
            action: `Converted to Sales Order: ${soNumber}`,
            user: data?.user || quotation.salesExecutive || 'Sales Executive',
            remarks: `Quotation ${quotation.quotationNumber} converted to Sales Order ${soNumber} (${quantity} units, Total ₹${grandTotal.toLocaleString('en-IN')})`,
            timestamp: new Date(),
          });
        }

        return newOrder;
      }
    );
  }

  static async deleteQuotation(id: string) {
    return tryDb(
      async () => {
        return prisma.$transaction(async (tx) => {
          const quote = await tx.salesQuotation.update({
            where: { id },
            data: { isDeleted: true, deletedAt: new Date() },
          });

          try {
            await tx.auditLog.create({
              data: {
                action: 'SALES_QUOTATION_DELETED',
                module: 'Sales',
                entity: 'SalesQuotation',
                entityId: id,
                details: `Deleted Quotation ${quote.quotationNumber}`,
              },
            });
          } catch (_) {}

          return quote;
        });
      },
      () => {
        const quote = salesStore.quotations.find(q => q.id === id);
        if (!quote) throw new Error('Quotation not found');
        quote.isDeleted = true;
        quote.deletedAt = new Date();
        return quote;
      }
    );
  }

  // ==========================================
  // SALES ORDERS
  // ==========================================
  static async getOrders(query?: {
    search?: string;
    status?: string;
    productionStatus?: string;
    dispatchStatus?: string;
    customerId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query?.page || 1;
    const limit = query?.limit || 100;
    const skip = (page - 1) * limit;

    return tryDb(
      async () => {
        // Auto-synchronize Won/Converted quotations that might be missing their salesOrderEntity
        try {
          const wonQuotations = await prisma.salesQuotation.findMany({
            where: {
              status: { in: ['Won', 'Converted', 'Accepted'] },
              isDeleted: false,
            },
            include: { lead: true, customer: true },
          });

          for (const quote of wonQuotations) {
            const existing = await prisma.salesOrderEntity.findFirst({
              where: {
                OR: [
                  { quotationId: quote.id },
                  { customerPoNumber: `PO-${quote.quotationNumber}` }
                ],
                isDeleted: false,
              },
            });
            if (!existing) {
              const soNumber = await generateNextCode('salesOrderEntity', 'SO-', 'soNumber', 4);
              const quantity = quote.lead?.expectedQuantity || 1000;
              const unitPrice = quote.amount && quantity > 0 ? Number((quote.amount / quantity).toFixed(2)) : 50;
              const totalValue = quantity * unitPrice;
              const taxRate = 18;
              const taxAmount = (totalValue * taxRate) / 100;
              const grandTotal = totalValue + taxAmount;
              const deliveryDate = quote.lead?.requiredDeliveryDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

              await prisma.salesOrderEntity.create({
                data: {
                  soNumber,
                  customerId: quote.customerId || quote.lead?.customerId || null,
                  customerName: quote.customerName,
                  customerPoNumber: quote.lead?.customerPoNumber || `PO-${quote.quotationNumber}`,
                  poDate: quote.lead?.customerPoDate || new Date().toISOString().split('T')[0],
                  leadId: quote.leadId || null,
                  quotationId: quote.id,
                  productName: quote.productName,
                  quantity,
                  quantityDispatched: 0,
                  quantityPending: quantity,
                  unitPrice,
                  totalValue,
                  taxRate,
                  taxAmount,
                  grandTotal,
                  orderDate: new Date().toISOString().split('T')[0],
                  deliveryDate,
                  salesExecutive: quote.salesExecutive || 'Sales Executive',
                  status: 'Confirmed',
                  productionStatus: 'Pending Planning',
                  dispatchStatus: 'Pending',
                },
              });
            }
          }
        } catch (syncErr) {
          console.warn('[getOrders sync] Non-critical won-quotations auto-sync:', syncErr);
        }

        const where: any = { isDeleted: false, deletedAt: null };
        if (query?.status && query.status !== 'All') where.status = query.status;
        if (query?.productionStatus && query.productionStatus !== 'All') where.productionStatus = query.productionStatus;
        if (query?.dispatchStatus && query.dispatchStatus !== 'All') where.dispatchStatus = query.dispatchStatus;
        if (query?.customerId) where.customerId = query.customerId;
        if (query?.search) {
          where.OR = [
            { soNumber: { contains: query.search, mode: 'insensitive' } },
            { customerName: { contains: query.search, mode: 'insensitive' } },
            { customerPoNumber: { contains: query.search, mode: 'insensitive' } },
            { productName: { contains: query.search, mode: 'insensitive' } },
          ];
        }

        const [orders, total] = await Promise.all([
          prisma.salesOrderEntity.findMany({
            where,
            include: {
              customer: true,
              product: true,
              warehouse: true,
              lead: true,
              dispatches: { where: { isDeleted: false }, include: { items: true } },
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
          }),
          prisma.salesOrderEntity.count({ where }),
        ]);

        return { orders, total, page, limit };
      },
      () => {
        // Auto-sync in-memory Won quotations that don't have a Sales Order yet
        const wonQuotes = salesStore.quotations.filter(
          q => (q.status === 'Won' || q.status === 'Converted' || q.status === 'Accepted') && !q.isDeleted
        );
        for (const q of wonQuotes) {
          const hasOrder = salesStore.salesOrders.some(
            so => (so.quotationId === q.id || so.customerPoNumber === `PO-${q.quotationNumber}`) && !so.isDeleted
          );
          if (!hasOrder) {
            const lead = q.leadId ? salesStore.leads.find(l => l.id === q.leadId) : null;
            const orderNum = salesStore.salesOrders.length + 1;
            const soNumber = `SO-${String(orderNum).padStart(4, '0')}`;
            const quantity = lead?.expectedQuantity || 1000;
            const unitPrice = q.amount && quantity > 0 ? Number((q.amount / quantity).toFixed(2)) : 50;
            const totalValue = quantity * unitPrice;
            const taxRate = 18;
            const taxAmount = (totalValue * taxRate) / 100;
            const grandTotal = totalValue + taxAmount;
            const deliveryDate = lead?.requiredDeliveryDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            salesStore.salesOrders.unshift({
              id: `so-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              soNumber,
              customerId: q.customerId || lead?.customerId || null,
              customerName: q.customerName,
              customerPoNumber: lead?.customerPoNumber || `PO-${q.quotationNumber}`,
              poDate: lead?.customerPoDate || new Date().toISOString().split('T')[0],
              leadId: q.leadId || null,
              quotationId: q.id,
              productName: q.productName,
              quantity,
              quantityDispatched: 0,
              quantityPending: quantity,
              unitPrice,
              totalValue,
              taxRate,
              taxAmount,
              grandTotal,
              orderDate: new Date().toISOString().split('T')[0],
              deliveryDate,
              salesExecutive: q.salesExecutive || 'Sales Executive',
              status: 'Confirmed',
              productionStatus: 'Planning',
              dispatchStatus: 'Pending',
              createdAt: new Date(),
              updatedAt: new Date(),
              isDeleted: false,
            });
          }
        }

        let filtered = salesStore.salesOrders.filter(so => !so.isDeleted);
        if (query?.status && query.status !== 'All') {
          filtered = filtered.filter(so => so.status === query.status);
        }
        if (query?.productionStatus && query.productionStatus !== 'All') {
          filtered = filtered.filter(so => so.productionStatus === query.productionStatus);
        }
        if (query?.dispatchStatus && query.dispatchStatus !== 'All') {
          filtered = filtered.filter(so => so.dispatchStatus === query.dispatchStatus);
        }
        if (query?.customerId) {
          filtered = filtered.filter(so => so.customerId === query.customerId);
        }
        if (query?.search) {
          const s = query.search.toLowerCase();
          filtered = filtered.filter(so =>
            so.soNumber.toLowerCase().includes(s) ||
            so.customerName.toLowerCase().includes(s) ||
            (so.customerPoNumber && so.customerPoNumber.toLowerCase().includes(s)) ||
            so.productName.toLowerCase().includes(s)
          );
        }
        const total = filtered.length;
        const orders = filtered.slice(skip, skip + limit).map(so => ({
          ...so,
          customer: salesStore.customers.find(c => c.id === so.customerId || c.name === so.customerName),
          dispatches: salesStore.dispatches.filter(d => d.salesOrderId === so.id && !d.isDeleted),
        }));
        return { orders, total, page, limit };
      }
    );
  }

  static async getOrderById(id: string) {
    return tryDb(
      async () => {
        return prisma.salesOrderEntity.findUnique({
          where: { id },
          include: {
            customer: true,
            product: true,
            warehouse: true,
            lead: { include: { timeline: true } },
            dispatches: {
              where: { isDeleted: false },
              include: { items: true, warehouse: true },
              orderBy: { createdAt: 'desc' },
            },
          },
        });
      },
      () => {
        const order = salesStore.salesOrders.find(so => so.id === id && !so.isDeleted);
        if (!order) return null;
        return {
          ...order,
          customer: salesStore.customers.find(c => c.id === order.customerId || c.name === order.customerName),
          lead: salesStore.leads.find(l => l.id === order.leadId),
          dispatches: salesStore.dispatches.filter(d => d.salesOrderId === order.id && !d.isDeleted),
        };
      }
    );
  }

  static async createOrder(data: any) {
    return tryDb(
      async () => {
        return createWithUniqueCode('salesOrderEntity', 'SO-', 'soNumber', async (soNumber) => {
          const quantity = Number(data.quantity) || 0;
          const unitPrice = Number(data.unitPrice) || 0;
          const totalValue = data.totalValue !== undefined ? Number(data.totalValue) : quantity * unitPrice;
          const taxRate = Number(data.taxRate) || 18;
          const taxAmount = (totalValue * taxRate) / 100;
          const grandTotal = totalValue + taxAmount;

          const order = await prisma.salesOrderEntity.create({
            data: {
              soNumber,
              customerId: data.customerId || null,
              customerName: data.customerName,
              customerPoNumber: data.customerPoNumber,
              poDate: data.poDate,
              leadId: data.leadId || null,
              quotationId: data.quotationId || null,
              productId: data.productId || null,
              productName: data.productName,
              quantity,
              quantityDispatched: 0,
              quantityPending: quantity,
              unitPrice,
              totalValue,
              taxRate,
              taxAmount,
              grandTotal,
              orderDate: data.orderDate || new Date().toISOString().split('T')[0],
              deliveryDate: data.deliveryDate,
              salesExecutive: data.salesExecutive,
              status: data.status || 'Confirmed',
              productionStatus: data.productionStatus || 'Pending Planning',
              dispatchStatus: 'Pending',
              warehouseId: data.warehouseId || null,
              shippingAddress: data.shippingAddress,
              billingAddress: data.billingAddress,
              specialInstructions: data.specialInstructions,
              attachments: data.attachments,
            },
            include: { customer: true, product: true, warehouse: true },
          });

          try {
            await prisma.auditLog.create({
              data: {
                action: 'SALES_ORDER_CREATED',
                module: 'Sales',
                entity: 'SalesOrderEntity',
                entityId: order.id,
                details: `Created Sales Order ${order.soNumber} for ${order.customerName} (₹${grandTotal.toLocaleString('en-IN')})`,
              },
            });
          } catch (_) {}

          return order;
        });
      },
      () => {
        const orderNum = salesStore.salesOrders.length + 1;
        const soNumber = `SO-${String(orderNum).padStart(4, '0')}`;
        const quantity = Number(data.quantity) || 0;
        const unitPrice = Number(data.unitPrice) || 0;
        const totalValue = data.totalValue !== undefined ? Number(data.totalValue) : quantity * unitPrice;
        const taxRate = Number(data.taxRate) || 18;
        const taxAmount = (totalValue * taxRate) / 100;
        const grandTotal = totalValue + taxAmount;

        const newOrder: InMemorySalesOrder = {
          id: `so-${Date.now()}`,
          soNumber,
          customerId: data.customerId || null,
          customerName: data.customerName,
          customerPoNumber: data.customerPoNumber,
          poDate: data.poDate,
          leadId: data.leadId || null,
          quotationId: data.quotationId || null,
          productId: data.productId || null,
          productName: data.productName,
          quantity,
          quantityDispatched: 0,
          quantityPending: quantity,
          unitPrice,
          totalValue,
          taxRate,
          taxAmount,
          grandTotal,
          orderDate: data.orderDate || new Date().toISOString().split('T')[0],
          deliveryDate: data.deliveryDate,
          salesExecutive: data.salesExecutive,
          status: data.status || 'Confirmed',
          productionStatus: data.productionStatus || 'Planning',
          dispatchStatus: 'Pending',
          warehouseId: data.warehouseId || null,
          shippingAddress: data.shippingAddress,
          billingAddress: data.billingAddress,
          specialInstructions: data.specialInstructions,
          attachments: data.attachments,
          createdAt: new Date(),
          updatedAt: new Date(),
          isDeleted: false,
        };
        salesStore.salesOrders.unshift(newOrder);
        return newOrder;
      }
    );
  }

  static async updateOrder(id: string, data: any) {
    return tryDb(
      async () => {
        return prisma.$transaction(async (tx) => {
          const prev = await tx.salesOrderEntity.findUnique({ where: { id } });
          if (!prev) throw new Error('Sales Order not found');

          const quantity = data.quantity !== undefined ? Number(data.quantity) : prev.quantity;
          const unitPrice = data.unitPrice !== undefined ? Number(data.unitPrice) : prev.unitPrice;
          const totalValue = data.totalValue !== undefined ? Number(data.totalValue) : quantity * unitPrice;
          const taxRate = data.taxRate !== undefined ? Number(data.taxRate) : prev.taxRate;
          const taxAmount = (totalValue * taxRate) / 100;
          const grandTotal = totalValue + taxAmount;
          const quantityPending = Math.max(0, quantity - prev.quantityDispatched);

          const order = await tx.salesOrderEntity.update({
            where: { id },
            data: {
              customerName: data.customerName !== undefined ? data.customerName : prev.customerName,
              customerId: data.customerId !== undefined ? data.customerId : prev.customerId,
              customerPoNumber: data.customerPoNumber !== undefined ? data.customerPoNumber : prev.customerPoNumber,
              poDate: data.poDate !== undefined ? data.poDate : prev.poDate,
              productId: data.productId !== undefined ? data.productId : prev.productId,
              productName: data.productName !== undefined ? data.productName : prev.productName,
              quantity,
              quantityPending,
              unitPrice,
              totalValue,
              taxRate,
              taxAmount,
              grandTotal,
              deliveryDate: data.deliveryDate !== undefined ? data.deliveryDate : prev.deliveryDate,
              salesExecutive: data.salesExecutive !== undefined ? data.salesExecutive : prev.salesExecutive,
              status: data.status !== undefined ? data.status : prev.status,
              productionStatus: data.productionStatus !== undefined ? data.productionStatus : prev.productionStatus,
              dispatchStatus: data.dispatchStatus !== undefined ? data.dispatchStatus : prev.dispatchStatus,
              warehouseId: data.warehouseId !== undefined ? data.warehouseId : prev.warehouseId,
              shippingAddress: data.shippingAddress !== undefined ? data.shippingAddress : prev.shippingAddress,
              billingAddress: data.billingAddress !== undefined ? data.billingAddress : prev.billingAddress,
              specialInstructions: data.specialInstructions !== undefined ? data.specialInstructions : prev.specialInstructions,
              attachments: data.attachments !== undefined ? data.attachments : prev.attachments,
            },
            include: { customer: true, product: true, warehouse: true },
          });

          try {
            await tx.auditLog.create({
              data: {
                action: 'SALES_ORDER_UPDATED',
                module: 'Sales',
                entity: 'SalesOrderEntity',
                entityId: id,
                details: `Updated Sales Order ${order.soNumber}`,
              },
            });
          } catch (_) {}

          return order;
        });
      },
      () => {
        const order = salesStore.salesOrders.find(so => so.id === id);
        if (!order) throw new Error('Sales Order not found');
        const quantity = data.quantity !== undefined ? Number(data.quantity) : order.quantity;
        const unitPrice = data.unitPrice !== undefined ? Number(data.unitPrice) : order.unitPrice;
        const totalValue = data.totalValue !== undefined ? Number(data.totalValue) : quantity * unitPrice;
        const taxRate = data.taxRate !== undefined ? Number(data.taxRate) : order.taxRate;
        const taxAmount = (totalValue * taxRate) / 100;
        const grandTotal = totalValue + taxAmount;
        const quantityPending = Math.max(0, quantity - order.quantityDispatched);

        Object.assign(order, {
          customerName: data.customerName !== undefined ? data.customerName : order.customerName,
          customerId: data.customerId !== undefined ? data.customerId : order.customerId,
          customerPoNumber: data.customerPoNumber !== undefined ? data.customerPoNumber : order.customerPoNumber,
          poDate: data.poDate !== undefined ? data.poDate : order.poDate,
          productId: data.productId !== undefined ? data.productId : order.productId,
          productName: data.productName !== undefined ? data.productName : order.productName,
          quantity,
          quantityPending,
          unitPrice,
          totalValue,
          taxRate,
          taxAmount,
          grandTotal,
          deliveryDate: data.deliveryDate !== undefined ? data.deliveryDate : order.deliveryDate,
          salesExecutive: data.salesExecutive !== undefined ? data.salesExecutive : order.salesExecutive,
          status: data.status !== undefined ? data.status : order.status,
          productionStatus: data.productionStatus !== undefined ? data.productionStatus : order.productionStatus,
          dispatchStatus: data.dispatchStatus !== undefined ? data.dispatchStatus : order.dispatchStatus,
          warehouseId: data.warehouseId !== undefined ? data.warehouseId : order.warehouseId,
          shippingAddress: data.shippingAddress !== undefined ? data.shippingAddress : order.shippingAddress,
          billingAddress: data.billingAddress !== undefined ? data.billingAddress : order.billingAddress,
          specialInstructions: data.specialInstructions !== undefined ? data.specialInstructions : order.specialInstructions,
          attachments: data.attachments !== undefined ? data.attachments : order.attachments,
          updatedAt: new Date(),
        });

        return order;
      }
    );
  }

  static async releaseToProduction(id: string, data: { remarks?: string; user?: string }) {
    return tryDb(
      async () => {
        return prisma.$transaction(async (tx) => {
          const order = await tx.salesOrderEntity.update({
            where: { id },
            data: {
              status: 'In Production',
              productionStatus: 'Planning',
            },
            include: { customer: true, product: true },
          });

          try {
            await tx.auditLog.create({
              data: {
                action: 'SALES_ORDER_RELEASED_TO_PRODUCTION',
                module: 'Sales',
                entity: 'SalesOrderEntity',
                entityId: id,
                details: `Released Sales Order ${order.soNumber} to Production Planning. ${data.remarks || ''}`,
              },
            });
          } catch (_) {}

          return order;
        });
      },
      () => {
        const order = salesStore.salesOrders.find(so => so.id === id);
        if (!order) throw new Error('Sales Order not found');
        order.status = 'In Production';
        order.productionStatus = 'Planning';
        order.updatedAt = new Date();
        return order;
      }
    );
  }

  static async updateOrderStatus(id: string, data: { status?: string; productionStatus?: string; dispatchStatus?: string; remarks?: string; user?: string }) {
    return tryDb(
      async () => {
        return prisma.$transaction(async (tx) => {
          const order = await tx.salesOrderEntity.update({
            where: { id },
            data: {
              status: data.status,
              productionStatus: data.productionStatus,
              dispatchStatus: data.dispatchStatus,
            },
            include: { customer: true, product: true },
          });

          try {
            await tx.auditLog.create({
              data: {
                action: 'SALES_ORDER_STATUS_CHANGED',
                module: 'Sales',
                entity: 'SalesOrderEntity',
                entityId: id,
                details: `Updated Sales Order ${order.soNumber} status to ${data.status || order.status} (${data.remarks || ''})`,
              },
            });
          } catch (_) {}

          return order;
        });
      },
      () => {
        const order = salesStore.salesOrders.find(so => so.id === id);
        if (!order) throw new Error('Sales Order not found');
        if (data.status) order.status = data.status;
        if (data.productionStatus) order.productionStatus = data.productionStatus;
        if (data.dispatchStatus) order.dispatchStatus = data.dispatchStatus;
        order.updatedAt = new Date();
        return order;
      }
    );
  }

  static async getOrdersPendingDispatch() {
    return tryDb(
      async () => {
        return prisma.salesOrderEntity.findMany({
          where: {
            isDeleted: false,
            deletedAt: null,
            status: { in: ['Confirmed', 'Planning', 'In Production', 'Ready', 'Partially Dispatched'] },
            quantityPending: { gt: 0 },
          },
          include: { customer: true, product: true, warehouse: true },
          orderBy: { deliveryDate: 'asc' },
        });
      },
      () => {
        return salesStore.salesOrders
          .filter(so => !so.isDeleted && so.quantityPending > 0)
          .map(so => ({
            ...so,
            customer: salesStore.customers.find(c => c.id === so.customerId || c.name === so.customerName),
          }));
      }
    );
  }

  static async deleteOrder(id: string) {
    return tryDb(
      async () => {
        return prisma.$transaction(async (tx) => {
          const order = await tx.salesOrderEntity.update({
            where: { id },
            data: { isDeleted: true, deletedAt: new Date() },
          });

          try {
            await tx.auditLog.create({
              data: {
                action: 'SALES_ORDER_DELETED',
                module: 'Sales',
                entity: 'SalesOrderEntity',
                entityId: id,
                details: `Deleted Sales Order ${order.soNumber}`,
              },
            });
          } catch (_) {}

          return order;
        });
      },
      () => {
        const order = salesStore.salesOrders.find(so => so.id === id);
        if (!order) throw new Error('Sales Order not found');
        order.isDeleted = true;
        order.deletedAt = new Date();
        return order;
      }
    );
  }

  // ==========================================
  // SALES DASHBOARD & METRICS
  // ==========================================
  static async getDashboardMetrics() {
    return tryDb(
      async () => {
        const [
          totalLeads,
          wonLeads,
          costingPending,
          proposalsSent,
          totalQuotes,
          totalOrders,
          ordersByStatus,
          totalDispatches,
          dispatchesByStatus,
          leadsByStatus,
          recentLeads,
          recentOrders,
          recentDispatches,
          topCustomers,
        ] = await Promise.all([
          prisma.salesLead.count({ where: { isDeleted: false } }),
          prisma.salesLead.count({ where: { isDeleted: false, status: { in: ['Won', 'Converted'] } } }),
          prisma.salesLead.count({ where: { isDeleted: false, status: 'Costing' } }),
          prisma.salesLead.count({ where: { isDeleted: false, status: 'Quotation Sent' } }),
          prisma.salesQuotation.count({ where: { isDeleted: false, status: { notIn: ['Rejected', 'Accepted'] } } }),
          prisma.salesOrderEntity.count({ where: { isDeleted: false } }),
          prisma.salesOrderEntity.groupBy({
            by: ['status'],
            where: { isDeleted: false },
            _count: { id: true },
            _sum: { totalValue: true, grandTotal: true },
          }),
          prisma.dispatch.count({ where: { isDeleted: false } }),
          prisma.dispatch.groupBy({
            by: ['status'],
            where: { isDeleted: false },
            _count: { id: true },
            _sum: { totalQuantity: true, totalWeightKg: true },
          }),
          prisma.salesLead.groupBy({
            by: ['status'],
            where: { isDeleted: false },
            _count: { id: true },
            _sum: { expectedQuantity: true },
          }),
          prisma.salesLead.findMany({
            where: { isDeleted: false },
            orderBy: { createdAt: 'desc' },
            take: 5,
          }),
          prisma.salesOrderEntity.findMany({
            where: { isDeleted: false },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { customer: true, product: true },
          }),
          prisma.dispatch.findMany({
            where: { isDeleted: false },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { salesOrder: true, customer: true },
          }),
          prisma.salesOrderEntity.groupBy({
            by: ['customerName'],
            where: { isDeleted: false },
            _count: { id: true },
            _sum: { grandTotal: true },
            orderBy: { _sum: { grandTotal: 'desc' } },
            take: 5,
          }),
        ]);

        const totalRevenue = ordersByStatus.reduce((acc, curr) => acc + (curr._sum.grandTotal || 0), 0);
        const pendingDispatchCount = ordersByStatus
          .filter((s) => ['Confirmed', 'Planning', 'In Production', 'Ready', 'Partially Dispatched'].includes(s.status))
          .reduce((acc, curr) => acc + curr._count.id, 0);

        const stages = ['New Inquiry', 'Costing', 'Sample Sent', 'Quotation Sent', 'Negotiation', 'Won', 'Lost'];
        const pipelineMap = new Map(leadsByStatus.map((l) => [l.status, { count: l._count.id, value: l._sum.expectedQuantity || 0 }]));
        const pipeline = stages.map((st) => ({
          stage: st,
          count: pipelineMap.get(st)?.count || 0,
          value: pipelineMap.get(st)?.value || 0,
        }));

        return {
          kpis: {
            totalLeads,
            costingPending,
            proposalsSent: proposalsSent || totalQuotes,
            salesOrders: totalOrders,
          },
          totalLeads,
          wonLeads,
          conversionRate: totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0',
          activeQuotes: totalQuotes,
          totalOrders,
          totalRevenue,
          pendingDispatchCount,
          totalDispatches,
          pipeline,
          recentLeads,
          recentSalesOrders: recentOrders,
          recentOrders,
          recentDispatches,
          topCustomers,
          ordersByStatus,
          dispatchesByStatus,
        };
      },
      () => {
        const activeLeads = salesStore.leads.filter(l => !l.isDeleted);
        const activeOrders = salesStore.salesOrders.filter(so => !so.isDeleted);
        const activeQuotes = salesStore.quotations.filter(q => !q.isDeleted);
        const activeDispatches = salesStore.dispatches.filter(d => !d.isDeleted);

        const totalLeads = activeLeads.length;
        const wonLeads = activeLeads.filter(l => ['Won', 'Converted'].includes(l.status)).length;
        const costingPending = activeLeads.filter(l => l.status === 'Costing').length;
        const proposalsSent = activeLeads.filter(l => l.status === 'Quotation Sent').length;
        const totalQuotes = activeQuotes.length;
        const totalOrders = activeOrders.length;
        const totalDispatches = activeDispatches.length;

        const totalRevenue = activeOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
        const pendingDispatchCount = activeOrders.filter(o => ['Confirmed', 'Planning', 'In Production', 'Ready', 'Partially Dispatched'].includes(o.status) && o.quantityPending > 0).length;

        const stages = ['New Inquiry', 'Costing', 'Sample Sent', 'Quotation Sent', 'Negotiation', 'Won', 'Lost'];
        const pipeline = stages.map(st => {
          const matching = activeLeads.filter(l => l.status === st);
          return {
            stage: st,
            count: matching.length,
            value: matching.reduce((sum, l) => sum + (l.expectedQuantity || 0), 0),
          };
        });

        const customerRevenueMap: Record<string, { count: number; total: number }> = {};
        for (const o of activeOrders) {
          const name = o.customerName || 'Unknown';
          if (!customerRevenueMap[name]) customerRevenueMap[name] = { count: 0, total: 0 };
          customerRevenueMap[name].count += 1;
          customerRevenueMap[name].total += o.grandTotal || 0;
        }

        const topCustomers = Object.entries(customerRevenueMap)
          .map(([customerName, data]) => ({
            customerName,
            _count: { id: data.count },
            _sum: { grandTotal: data.total },
          }))
          .sort((a, b) => (b._sum.grandTotal || 0) - (a._sum.grandTotal || 0))
          .slice(0, 5);

        return {
          kpis: {
            totalLeads,
            costingPending,
            proposalsSent: proposalsSent || totalQuotes,
            salesOrders: totalOrders,
          },
          totalLeads,
          wonLeads,
          conversionRate: totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0',
          activeQuotes: totalQuotes,
          totalOrders,
          totalRevenue,
          pendingDispatchCount,
          totalDispatches,
          pipeline,
          recentLeads: activeLeads.slice(0, 5),
          recentSalesOrders: activeOrders.slice(0, 5),
          recentOrders: activeOrders.slice(0, 5),
          recentDispatches: activeDispatches.slice(0, 5),
          topCustomers,
          ordersByStatus: [],
          dispatchesByStatus: [],
        };
      }
    );
  }
}
