import { NextRequest } from 'next/server';
import { ProductionService } from '../../../../services/production.service';
import { successResponse, errorResponse } from '../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:view') && !hasApiPermission(user, 'inventory:read')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const { searchParams } = req.nextUrl;
    const productionOrderId = searchParams.get('productionOrderId') || undefined;
    const materialRequestId = searchParams.get('materialRequestId') || undefined;
    const status = searchParams.get('status') || undefined;

    const allocations = await ProductionService.getMaterialAllocations({
      productionOrderId,
      materialRequestId,
      status,
    });

    return successResponse(allocations);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to fetch material allocations', 400);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'inventory:write') && !hasApiPermission(user, 'production:write')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const body = await req.json();
    if (!body.rawMaterialId || !body.quantity || !body.sourceWarehouseId || !body.destinationWarehouseId) {
      return errorResponse('Raw material, quantity, source warehouse, and destination warehouse are required', 400);
    }

    const result = await ProductionService.allocateMaterial({
      ...body,
      allocatedBy: body.allocatedBy || user?.name || 'Store Keeper',
    });

    return successResponse(result, 'Material allocated and transferred to Godown 2 successfully', 201);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to allocate material', 400);
  }
}
