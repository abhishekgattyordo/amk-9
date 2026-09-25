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
    const order = await ProductionService.getProductionOrderById(id);
    if (!order) return errorResponse('Production order not found', 404);

    return successResponse(order);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch production order', 400);
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

    const order = await ProductionService.updateProductionOrderStatus(id, body.status, body.remarks);
    return successResponse(order, 'Production order updated successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update production order', 400);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:delete') && !hasApiPermission(user, 'production:write') && !hasApiPermission(user, 'production:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { id } = await params;
    await ProductionService.deleteProductionOrder(id, user?.name);
    return successResponse({ id }, 'Production order deleted and moved to Recycle Bin');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to delete production order', 400);
  }
}
