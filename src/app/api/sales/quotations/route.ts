import { NextRequest } from 'next/server';
import { SalesService } from '../../../../services/sales.service';
import { createQuotationSchema } from '../../../../validations/sales.schema';
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
      const quotation = await SalesService.getQuotationById(id);
      if (!quotation) return errorResponse('Quotation not found', 404);
      return successResponse(quotation);
    }

    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const leadId = searchParams.get('leadId') || undefined;
    const customerId = searchParams.get('customerId') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const { quotations, total } = await SalesService.getQuotations({
      search,
      status,
      leadId,
      customerId,
      page,
      limit,
    });

    return paginatedResponse(quotations, total, page, limit);
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
    const validatedData = createQuotationSchema.parse(body);

    const quotation = await SalesService.createQuotation({
      ...validatedData,
      salesExecutive: validatedData.salesExecutive || user?.name || 'Sales Executive',
    });

    return successResponse(quotation, 'Quotation created successfully', 201);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
