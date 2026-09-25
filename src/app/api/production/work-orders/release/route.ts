import { NextRequest } from 'next/server';
import { ProductionService } from '../../../../../services/production.service';
import { successResponse, errorResponse } from '../../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:write') && !hasApiPermission(user, 'production:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const body = await req.json();
    const { id } = body;
    if (!id) return errorResponse('Work Order ID is required', 400);

    const wo = await ProductionService.releaseWorkOrderToFloor(id, user?.name);
    return successResponse(wo, 'Work Order released to production floor successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to release Work Order', 400);
  }
}
