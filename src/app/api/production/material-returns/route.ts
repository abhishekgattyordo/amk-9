import { NextRequest } from 'next/server';
import { ProductionService } from '../../../../services/production.service';
import { successResponse, errorResponse } from '../../../../utils/api';
import { getAuthorizedUser, hasApiPermission } from '../../../../middleware/auth.middleware';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthorizedUser(req);
    if (!hasApiPermission(user, 'production:write') && !hasApiPermission(user, 'inventory:write')) {
      return errorResponse('Forbidden: Insufficient Permissions', 403);
    }

    const body = await req.json();
    if (!body.productionOrderId || !body.rawMaterialId || !body.quantityReturned || !body.destinationWarehouseId || !body.reason) {
      return errorResponse('Production order, raw material, quantity, destination warehouse, and reason are required', 400);
    }

    const result = await ProductionService.returnMaterialFromProduction({
      ...body,
      returnedBy: body.returnedBy || user?.name || 'Production Supervisor',
      receivedBy: body.receivedBy || 'Store Keeper',
    });

    return successResponse(result, 'Unused material returned and credited to warehouse successfully', 201);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to return material', 400);
  }
}
