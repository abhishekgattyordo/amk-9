import { NextRequest } from 'next/server';
import { SalesService } from '../../../../../../services/sales.service';
import { createRevisionSchema } from '../../../../../../validations/sales.schema';
import { successResponse, errorResponse } from '../../../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'sales:edit')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { id } = await context.params;
    const body = await req.json();
    const validatedData = createRevisionSchema.parse(body);

    const result = await SalesService.createQuotationRevision(id, {
      ...validatedData,
      createdBy: validatedData.createdBy || user?.name || 'Sales Executive',
    });

    return successResponse(result, 'Quotation revision created successfully', 201);
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
