import { NextRequest } from 'next/server';
import { ProductionService } from '../../../../services/production.service';
import { successResponse, errorResponse } from '../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:write') && !hasApiPermission(user, 'production:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const body = await req.json();
    const { operationId, ...data } = body;
    if (!operationId) return errorResponse('Operation ID is required', 400);

    const op = await ProductionService.updateOperationProgress(operationId, {
      ...data,
      operatorName: data.operatorName || user?.name,
    });

    return successResponse(op, 'Operation progress updated successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update operation', 400);
  }
}
