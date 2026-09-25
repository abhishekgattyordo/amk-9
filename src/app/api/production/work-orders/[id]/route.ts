import { NextRequest } from 'next/server';
import { ProductionService } from '../../../../../services/production.service';
import { successResponse, errorResponse } from '../../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:view') && !hasApiPermission(user, 'production:read')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { id } = await params;
    const wo = await ProductionService.getWorkOrderById(id);
    if (!wo) return errorResponse('Work Order not found', 404);

    return successResponse(wo);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch Work Order', 400);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:write') && !hasApiPermission(user, 'production:edit') && !hasApiPermission(user, 'production:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { id } = await params;
    const body = await req.json();

    const wo = await ProductionService.updateWorkOrder(id, { ...body, user: user?.name });
    return successResponse(wo, 'Work Order updated successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update Work Order', 400);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:delete') && !hasApiPermission(user, 'production:write') && !hasApiPermission(user, 'production:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { id } = await params;
    const deleted = await ProductionService.deleteWorkOrder(id, user?.name || 'User');
    return successResponse(deleted, 'Work Order deleted and moved to Recycle Bin');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to delete Work Order', 400);
  }
}
