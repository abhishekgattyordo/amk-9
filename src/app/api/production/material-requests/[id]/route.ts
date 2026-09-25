import { NextRequest } from 'next/server';
import { ProductionService } from '../../../../../services/production.service';
import { successResponse, errorResponse } from '../../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:view') && !hasApiPermission(user, 'inventory:view') && !hasApiPermission(user, 'production:read')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { id } = await params;
    const item = await ProductionService.getMaterialRequestById(id);
    if (!item) return errorResponse('Material request not found', 404);

    return successResponse(item);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch material request', 400);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:write') && !hasApiPermission(user, 'inventory:write') && !hasApiPermission(user, 'production:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { id } = await params;
    const body = await req.json();
    if (!body.status) return errorResponse('Status is required', 400);

    const updated = await ProductionService.updateMaterialRequestStatus(id, body.status, body.remarks);
    return successResponse(updated, 'Material request updated successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to update material request', 400);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:delete') && !hasApiPermission(user, 'production:write') && !hasApiPermission(user, 'inventory:write') && !hasApiPermission(user, 'production:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { id } = await params;
    await ProductionService.deleteMaterialRequest(id, user?.name);
    return successResponse({ id }, 'Material request deleted and moved to Recycle Bin');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to delete material request', 400);
  }
}
