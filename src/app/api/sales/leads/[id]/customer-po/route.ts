import { NextRequest } from 'next/server';
import { SalesService } from '../../../../../../services/sales.service';
import { captureCustomerPoSchema } from '../../../../../../validations/sales.schema';
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
    const validatedData = captureCustomerPoSchema.parse(body);

    const updated = await SalesService.captureCustomerPo(id, {
      ...validatedData,
      user: user?.name || validatedData.user || 'Sales Executive',
    });

    return successResponse(updated, 'Customer Purchase Order recorded successfully');
  } catch (err: any) {
    return errorResponse(err, 400);
  }
}
