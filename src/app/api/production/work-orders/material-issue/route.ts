import { NextRequest } from 'next/server';
import { ProductionService } from '../../../../../services/production.service';
import { successResponse, errorResponse } from '../../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:write') && !hasApiPermission(user, 'inventory:write') && !hasApiPermission(user, 'production:view')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const body = await req.json();
    const { workOrderId, materialId, warehouseId, quantity, reelNumber, batchNumber, notes } = body;

    if (!workOrderId || !materialId || !warehouseId || !quantity || quantity <= 0) {
      return errorResponse('Work Order, Material, Warehouse, and positive Quantity are required', 400);
    }

    const result = await ProductionService.issueMaterialForWorkOrder({
      workOrderId,
      materialId,
      warehouseId,
      quantity: Number(quantity),
      reelNumber,
      batchNumber,
      notes,
      user: user?.name || 'Store Keeper',
    });

    return successResponse(result, 'Material issued successfully');
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to issue material', 400);
  }
}
