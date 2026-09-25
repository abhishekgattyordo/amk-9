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
    const { workOrderId, warehouseId, quantity, remarks } = body;
    if (!workOrderId || !warehouseId || !quantity) {
      return errorResponse('Work Order ID, Warehouse ID, and quantity are required', 400);
    }

    const result = await ProductionService.approveAndReceiveFinishedGoods({
      workOrderId,
      warehouseId,
      quantity: Number(quantity),
      user: user?.name,
      remarks,
    });

    return successResponse(result, result.message);
  } catch (err: any) {
    return errorResponse(err.message || 'Failed to receive finished goods into inventory', 400);
  }
}
