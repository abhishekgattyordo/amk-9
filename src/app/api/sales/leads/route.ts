import { NextRequest } from 'next/server';
import { SalesService } from '../../../../services/sales.service';
import { createLeadSchema } from '../../../../validations/sales.schema';
import { successResponse, errorResponse, paginatedResponse } from '../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'sales:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');
    if (id) {
      const lead = await SalesService.getLeadById(id);
      if (!lead) return errorResponse('Lead not found', 404);
      return successResponse(lead);
    }

    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const salesExecutive = searchParams.get('salesExecutive') || searchParams.get('executive') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const { leads, total } = await SalesService.getLeads({
      search,
      status,
      salesExecutive,
      page,
      limit,
    });

    return paginatedResponse(leads, total, page, limit);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'sales:create')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const body = await req.json();
    const validatedData = createLeadSchema.parse(body);

    const lead = await SalesService.createLead({
      ...validatedData,
      assignedSalesExecutive: validatedData.assignedSalesExecutive || user?.name || 'Sales Executive',
      user: user?.name || 'Sales Executive',
    });

    return successResponse(lead, 'Lead created successfully', 201);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
