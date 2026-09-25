import { NextRequest } from 'next/server';
import { SalesService } from '../../../../../services/sales.service';
import { updateQuotationSchema } from '../../../../../validations/sales.schema';
import { successResponse, errorResponse } from '../../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'sales:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { id } = await context.params;
    const quotation = await SalesService.getQuotationById(id);
    if (!quotation) return errorResponse('Quotation not found', 404);

    return successResponse(quotation);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function PUT(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'sales:edit')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { id } = await context.params;
    const body = await req.json();
    const validatedData = updateQuotationSchema.parse(body);

    const updated = await SalesService.updateQuotation(id, validatedData);
    return successResponse(updated, 'Quotation updated successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'sales:delete')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { id } = await context.params;
    await SalesService.deleteQuotation(id);

    return successResponse({ id }, 'Quotation deleted successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
