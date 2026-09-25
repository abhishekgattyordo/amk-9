import { NextRequest } from 'next/server';
import { ProductionService } from '../../../../../../services/production.service';
import { successResponse, errorResponse } from '../../../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:write') && !hasApiPermission(user, 'production:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { id } = await params;
    const body = await req.json();
    if (!body.status) return errorResponse('Status is required', 400);

    const updated = await ProductionService.updateProductionOrderStatus(id, body.status, body.remarks);
    return successResponse(updated, 'Production Order status updated successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update status', 400);
  }
}
